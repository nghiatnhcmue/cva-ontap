import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import { ALLOWED_DOMAIN, isAllowedDomain, normalizeSchoolEmail } from './constants';

export interface ParsedUser {
  email: string;
  user_code: string;
  full_name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  grade_id: string;
  class_id: string;
  assigned_subjects?: string[];
  phone?: string;
  dob?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ParseResult {
  users: ParsedUser[];
  rejected: { rawEmail: string; reason: string; rowNumber: number }[];
  totalRows: number;
}

/**
 * Trích xuất khối lớp từ tên lớp (ví dụ: '10A1' -> '10', '10TN' -> '10', '11A3' -> '11')
 */
export function extractGradeFromClass(className: string, fallbackGrade = '10'): string {
  if (!className) return fallbackGrade;
  const match = className.trim().match(/^(\d+)/);
  if (match) return match[1];
  return fallbackGrade;
}

/**
 * Đọc file Excel hoặc CSV từ Buffer hoặc đường dẫn file
 * KHÓA CỨNG: Chỉ chấp nhận email có đuôi @ttgdtxcva.edu.vn.
 * Nếu chỉ có mã học sinh, tự động chuẩn hóa thành <mã>@ttgdtxcva.edu.vn.
 */
export function parseUserFile(input: Buffer | string, originalFilename = ''): ParseResult {
  let workbook: XLSX.WorkBook;

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`File không tồn tại: ${input}`);
    }
    const buf = fs.readFileSync(input);
    workbook = XLSX.read(buf, { type: 'buffer', cellDates: true });
    originalFilename = originalFilename || path.basename(input);
  } else {
    workbook = XLSX.read(input, { type: 'buffer', cellDates: true });
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return { users: [], rejected: [], totalRows: 0 };

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length === 0) return { users: [], rejected: [], totalRows: 0 };

  const filenameLower = originalFilename.toLowerCase();
  const defaultGrade = filenameLower.includes('k11') || filenameLower.includes('11') ? '11' : '10';

  // 1. Tìm dòng tiêu đề (Header row)
  let headerRowIndex = -1;
  let isK11Format = false;
  let isK10Format = false;

  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const rowStr = rawRows[i].map((c) => String(c || '').toLowerCase().trim()).join(' ');

    if (rowStr.includes('user principal name') || rowStr.includes('display name')) {
      headerRowIndex = i;
      isK11Format = true;
      break;
    }

    if ((rowStr.includes('tài khoản') || rowStr.includes('mã định danh')) && (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('lớp'))) {
      headerRowIndex = i;
      isK10Format = true;
      break;
    }

    if (rowStr.includes('email') && (rowStr.includes('họ và tên') || rowStr.includes('lớp'))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());
  const headerMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerMap[h.toLowerCase()] = idx;
  });

  const parsedUsers: ParsedUser[] = [];
  const rejected: { rawEmail: string; reason: string; rowNumber: number }[] = [];
  const startRow = isK10Format ? headerRowIndex + 2 : headerRowIndex + 1;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let rawEmail = '';
    let userCode = '';
    let fullName = '';
    let classId = '';
    let gradeId = defaultGrade;
    let phone = '';
    let dob = '';
    let role: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT';

    if (isK11Format) {
      const upnIdx = headerMap['user principal name'] ?? 0;
      const dispIdx = headerMap['display name'] ?? 1;
      const deptIdx = headerMap['department'] ?? 4;
      const titleIdx = headerMap['title'] ?? 5;
      const phoneIdx = headerMap['mobile phone'] ?? 10;
      const nsIdx = 12;
      const tsIdx = 13;
      const namIdx = 14;

      rawEmail = String(row[upnIdx] || '').trim();
      fullName = String(row[dispIdx] || '').trim();
      classId = String(row[deptIdx] || '').trim();
      phone = String(row[phoneIdx] || '').trim();

      const title = String(row[titleIdx] || '').toLowerCase();
      if (title.includes('giáo viên') || title.includes('teacher')) role = 'TEACHER';
      else if (title.includes('admin') || title.includes('quản trị')) role = 'ADMIN';

      if (row[nsIdx] && row[tsIdx] && row[namIdx]) {
        dob = `${String(row[nsIdx]).padStart(2, '0')}/${String(row[tsIdx]).padStart(2, '0')}/${String(row[namIdx])}`;
      }
    } else if (isK10Format) {
      const acc = String(row[1] || '').trim();
      const ho = String(row[4] || '').trim();
      const ten = String(row[5] || '').trim();
      classId = String(row[6] || '').trim();
      const mailCol = String(row[13] || '').trim();
      phone = String(row[14] || '').trim();

      rawEmail = mailCol || acc;
      userCode = acc.includes('@') ? acc.split('@')[0] : acc;
      fullName = ho && ten ? `${ho} ${ten}` : ho || ten;

      if (row[8] && row[9] && row[10]) {
        dob = `${String(row[8]).padStart(2, '0')}/${String(row[9]).padStart(2, '0')}/${String(row[10])}`;
      }
    } else {
      for (const [key, idx] of Object.entries(headerMap)) {
        const val = String(row[idx] || '').trim();
        if (key.includes('email') || key.includes('tài khoản') || key.includes('upn')) {
          if (!rawEmail) rawEmail = val;
        } else if (key.includes('họ và tên') || key.includes('display name') || key.includes('họ tên')) {
          fullName = val;
        } else if (key === 'lớp' || key === 'class' || key.includes('department')) {
          classId = val;
        } else if (key.includes('điện thoại') || key.includes('phone')) {
          phone = val;
        } else if (key.includes('vai trò') || key.includes('role')) {
          const v = val.toUpperCase();
          if (v.includes('ADMIN')) role = 'ADMIN';
          else if (v.includes('TEACHER') || v.includes('GIÁO VIÊN')) role = 'TEACHER';
        }
      }

      if (!fullName) {
        const hoIdx = headers.findIndex((h) => h.toLowerCase() === 'họ');
        const tenIdx = headers.findIndex((h) => h.toLowerCase() === 'tên');
        if (hoIdx >= 0 && tenIdx >= 0) {
          fullName = `${String(row[hoIdx] || '').trim()} ${String(row[tenIdx] || '').trim()}`.trim();
        }
      }
    }

    if (!rawEmail && !fullName && !classId) continue;

    // Chuẩn hóa email: Nếu chỉ có mã số hoặc không có @, tự sinh email @ttgdtxcva.edu.vn
    let finalEmail = normalizeSchoolEmail(rawEmail);

    if (!finalEmail && userCode) {
      finalEmail = normalizeSchoolEmail(userCode);
    }

    // Nếu email vẫn không có hoặc không thuộc domain ttgdtxcva.edu.vn
    if (!finalEmail || !isAllowedDomain(finalEmail)) {
      rejected.push({
        rawEmail: rawEmail || '(trống)',
        reason: `Tên miền không hợp lệ (Bắt buộc phải là @${ALLOWED_DOMAIN})`,
        rowNumber: r + 1,
      });
      continue;
    }

    if (!userCode) {
      userCode = finalEmail.split('@')[0];
    }

    if (classId) {
      gradeId = extractGradeFromClass(classId, defaultGrade);
    }

    parsedUsers.push({
      email: finalEmail,
      user_code: userCode,
      full_name: fullName || userCode,
      role,
      grade_id: gradeId,
      class_id: classId || (gradeId === '11' ? '11A1' : '10A1'),
      phone,
      dob,
      status: 'ACTIVE',
    });
  }

  return { users: parsedUsers, rejected, totalRows: rawRows.length - startRow };
}

/**
 * Upsert danh sách Users vào SQLite database (Khóa cứng @ttgdtxcva.edu.vn)
 */
export function upsertUsersToDatabase(
  db: Database.Database,
  users: ParsedUser[]
): { inserted: number; updated: number; total: number; rejectedCount: number } {
  let inserted = 0;
  let updated = 0;
  let rejectedCount = 0;

  const selectStmt = db.prepare('SELECT id, xp_points, streak_days, role FROM Users WHERE email = ?');
  const insertStmt = db.prepare(`
    INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, assigned_subjects, xp_points, streak_days, status, phone, dob)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE Users 
    SET full_name = ?, user_code = ?, grade_id = ?, class_id = ?, phone = ?, dob = ?, updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
  `);

  const runTransaction = db.transaction((userList: ParsedUser[]) => {
    for (const u of userList) {
      // Khóa cứng kiểm tra tên miền lần cuối trước khi ghi DB
      if (!isAllowedDomain(u.email)) {
        rejectedCount++;
        continue;
      }

      const existing = selectStmt.get(u.email) as { id: number; xp_points: number; streak_days: number; role: string } | undefined;
      if (existing) {
        updateStmt.run(u.full_name, u.user_code, u.grade_id, u.class_id, u.phone || null, u.dob || null, u.email);
        updated++;
      } else {
        insertStmt.run(
          u.email,
          u.user_code,
          u.full_name,
          u.role,
          u.grade_id,
          u.class_id,
          JSON.stringify(u.assigned_subjects || []),
          0,
          1,
          'ACTIVE',
          u.phone || null,
          u.dob || null
        );
        inserted++;
      }
    }
  });

  runTransaction(users);

  return { inserted, updated, total: users.length - rejectedCount, rejectedCount };
}
