import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(dbDir, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('⚡ Đang khởi tạo các bảng trong Database SQLite...');

// 1. Tạo bảng
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    user_code TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    grade_id TEXT,
    class_id TEXT,
    assigned_subjects TEXT DEFAULT '[]',
    xp_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    avatar_url TEXT,
    phone TEXT,
    dob TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_num INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES Subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Knowledge_Nodes (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content_markdown TEXT NOT NULL,
    order_num INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chapter_id) REFERENCES Chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    chapter_id TEXT,
    lesson_id TEXT,
    q_type TEXT NOT NULL CHECK(q_type IN ('MCQ', 'TF', 'SA')),
    difficulty TEXT NOT NULL CHECK(difficulty IN ('NB', 'TH', 'VD', 'VDC')),
    stem TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    explanation TEXT,
    lock_shuffle INTEGER DEFAULT 0,
    points REAL DEFAULT 1.0,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Practice_Sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    is_exam INTEGER DEFAULT 0,
    question_ids_json TEXT NOT NULL,
    target_classes TEXT DEFAULT 'ALL',
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Exam_Blueprints (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    config_json TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Submissions (
    id TEXT PRIMARY KEY,
    set_id TEXT,
    mode TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    grade_id INTEGER NOT NULL,
    subject_id TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    is_first_attempt INTEGER DEFAULT 1,
    duration_sec INTEGER NOT NULL,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    answers_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS User_Question_History (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    question_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('MASTERED', 'WRONG', 'ATTEMPTED')),
    is_bookmarked INTEGER DEFAULT 0,
    last_answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, question_id)
  );
`);

console.log('✅ Đã tạo cấu trúc các bảng.');

// 2. Tạo tài khoản Admin và Giáo viên mẫu
const adminEmail = 'admin@ttgdtxcva.edu.vn';
const teacher1Email = 'phathach@ttgdtxcva.edu.vn';
const teacher2Email = 'mailan.toan@ttgdtxcva.edu.vn';

const upsertUser = db.prepare(`
  INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, assigned_subjects, xp_points, streak_days, status, phone)
  VALUES (@email, @user_code, @full_name, @role, @grade_id, @class_id, @assigned_subjects, @xp_points, @streak_days, 'ACTIVE', @phone)
  ON CONFLICT(email) DO UPDATE SET
    full_name = excluded.full_name,
    role = excluded.role,
    grade_id = excluded.grade_id,
    class_id = excluded.class_id,
    assigned_subjects = excluded.assigned_subjects
`);

upsertUser.run({
  email: adminEmail,
  user_code: 'ADMIN01',
  full_name: 'Quản Trị Viên Hệ Thống',
  role: 'ADMIN',
  grade_id: '10,11',
  class_id: 'ALL',
  assigned_subjects: JSON.stringify(['tin-hoc-10', 'toan-10', 'tin-hoc-11', 'toan-11']),
  xp_points: 9999,
  streak_days: 30,
  phone: '0901234567',
});

upsertUser.run({
  email: teacher1Email,
  user_code: 'GV_TIN',
  full_name: 'Thầy Đào Phá Thạch',
  role: 'TEACHER',
  grade_id: '10,11',
  class_id: '10TN,10A1,10A2,11A1,11A2',
  assigned_subjects: JSON.stringify(['tin-hoc-10', 'tin-hoc-11']),
  xp_points: 2500,
  streak_days: 15,
  phone: '0903332012',
});

upsertUser.run({
  email: teacher2Email,
  user_code: 'GV_TOAN',
  full_name: 'Cô Nguyễn Thị Mai Lan',
  role: 'TEACHER',
  grade_id: '10,11',
  class_id: '10TN,10A1,11A1,11A2',
  assigned_subjects: JSON.stringify(['toan-10', 'toan-11']),
  xp_points: 1800,
  streak_days: 10,
  phone: '0912345678',
});

console.log('✅ Đã tạo tài khoản Admin và Giáo viên mẫu.');

const ALLOWED_DOMAIN = 'ttgdtxcva.edu.vn';
function normalizeSchoolEmail(input) {
  if (!input) return '';
  const clean = String(input).trim().toLowerCase();
  if (clean.includes('@')) {
    return clean.endsWith('@' + ALLOWED_DOMAIN) ? clean : '';
  }
  const user = clean.replace(/[^a-z0-9._-]/g, '');
  return user ? `${user}@${ALLOWED_DOMAIN}` : '';
}

// 3. Đọc dữ liệu từ user/K10-26-27_HS.xlsx
const k10Path = path.resolve(process.cwd(), 'user/K10-26-27_HS.xlsx');
let k10Inserted = 0;
if (fs.existsSync(k10Path)) {
  const buf = fs.readFileSync(k10Path);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const insertStudent = db.prepare(`
    INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, xp_points, streak_days, status, phone, dob)
    VALUES (?, ?, ?, 'STUDENT', '10', ?, ?, ?, 'ACTIVE', ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name,
      class_id = excluded.class_id,
      phone = excluded.phone,
      dob = excluded.dob
  `);

  const runK10 = db.transaction(() => {
    // Dữ liệu bắt đầu từ row index 12
    for (let i = 12; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const acc = String(row[1] || '').trim();
      const mailCol = String(row[13] || '').trim();
      const email = normalizeSchoolEmail(mailCol) || normalizeSchoolEmail(acc);
      if (!email) continue;

      const ho = String(row[4] || '').trim();
      const ten = String(row[5] || '').trim();
      const fullName = ho && ten ? `${ho} ${ten}` : ho || ten || email.split('@')[0];
      const classId = String(row[6] || '10TN').trim();
      const phone = String(row[14] || '').trim();

      let dob = '';
      if (row[8] && row[9] && row[10]) {
        dob = `${String(row[8]).padStart(2, '0')}/${String(row[9]).padStart(2, '0')}/${String(row[10])}`;
      }

      const userCode = email.split('@')[0];
      // Random XP ban đầu nhẹ cho sinh động (0 - 450)
      const initialXP = Math.floor(Math.random() * 45) * 10;
      const streak = Math.floor(Math.random() * 5) + 1;

      insertStudent.run(email, userCode, fullName, classId, initialXP, streak, phone || null, dob || null);
      k10Inserted++;
    }
  });

  runK10();
  console.log(`✅ Đã nạp thành công ${k10Inserted} học sinh Khối 10 từ user/K10-26-27_HS.xlsx.`);
}

// 4. Đọc dữ liệu từ user/K11_26-27_HS.csv
const k11Path = path.resolve(process.cwd(), 'user/K11_26-27_HS.csv');
let k11Inserted = 0;
if (fs.existsSync(k11Path)) {
  const buf = fs.readFileSync(k11Path);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const insertStudent = db.prepare(`
    INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, xp_points, streak_days, status, phone, dob)
    VALUES (?, ?, ?, 'STUDENT', '11', ?, ?, ?, 'ACTIVE', ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name,
      class_id = excluded.class_id,
      phone = excluded.phone,
      dob = excluded.dob
  `);

  const runK11 = db.transaction(() => {
    // Dữ liệu bắt đầu từ row index 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const email = normalizeSchoolEmail(row[0]);
      if (!email) continue;

      const fullName = String(row[1] || '').trim() || email.split('@')[0];
      const classId = String(row[4] || '11A1').trim();
      const phone = String(row[10] || '').trim();

      let dob = '';
      if (row[12] && row[13] && row[14]) {
        dob = `${String(row[12]).padStart(2, '0')}/${String(row[13]).padStart(2, '0')}/${String(row[14])}`;
      }

      const userCode = email.split('@')[0];
      const initialXP = Math.floor(Math.random() * 50) * 10;
      const streak = Math.floor(Math.random() * 6) + 1;

      insertStudent.run(email, userCode, fullName, classId, initialXP, streak, phone || null, dob || null);
      k11Inserted++;
    }
  });

  runK11();
  console.log(`✅ Đã nạp thành công ${k11Inserted} học sinh Khối 11 từ user/K11_26-27_HS.csv.`);
}

// 5. Nạp Môn học, Chương, Bài học lý thuyết
console.log('⚡ Đang khởi tạo Môn học, Chương và Bài học lý thuyết...');

const insertSubject = db.prepare(`
  INSERT INTO Subjects (id, name, grade_id, icon, description)
  VALUES (@id, @name, @grade_id, @icon, @description)
  ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description
`);

const insertChapter = db.prepare(`
  INSERT INTO Chapters (id, subject_id, grade_id, title, order_num)
  VALUES (@id, @subject_id, @grade_id, @title, @order_num)
  ON CONFLICT(id) DO UPDATE SET title = excluded.title, order_num = excluded.order_num
`);

const insertLesson = db.prepare(`
  INSERT INTO Knowledge_Nodes (id, chapter_id, subject_id, grade_id, title, summary, content_markdown, order_num)
  VALUES (@id, @chapter_id, @subject_id, @grade_id, @title, @summary, @content_markdown, @order_num)
  ON CONFLICT(id) DO UPDATE SET title = excluded.title, content_markdown = excluded.content_markdown
`);

const subjects = [
  { id: 'tin-hoc-10', name: 'Tin học 10', grade_id: 10, icon: 'Laptop', description: 'Chương trình Tin học 10 chuẩn GDPT 2018 & Định hướng ICDL' },
  { id: 'toan-10', name: 'Toán học 10', grade_id: 10, icon: 'Calculator', description: 'Đại số, Lượng giác & Hình học giải tích Khối 10' },
  { id: 'tin-hoc-11', name: 'Tin học 11', grade_id: 11, icon: 'Database', description: 'Hệ quản trị CSDL, Lập trình ứng dụng & Mạng máy tính' },
  { id: 'toan-11', name: 'Toán học 11', grade_id: 11, icon: 'TrendingUp', description: 'Đại số giải tích, Cấp số cộng, Lượng giác & Xác suất' },
];

for (const s of subjects) {
  insertSubject.run(s);
}

// Các chương & bài học
const chapters = [
  // Tin học 10
  { id: 'tin10-ch1', subject_id: 'tin-hoc-10', grade_id: 10, title: 'Chương 1: Máy tính và Xã hội tri thức', order_num: 1 },
  { id: 'tin10-ch2', subject_id: 'tin-hoc-10', grade_id: 10, title: 'Chương 2: Mạng máy tính và Internet', order_num: 2 },
  // Toán 10
  { id: 'toan10-ch1', subject_id: 'toan-10', grade_id: 10, title: 'Chương 1: Mệnh đề và Tập hợp', order_num: 1 },
  { id: 'toan10-ch2', subject_id: 'toan-10', grade_id: 10, title: 'Chương 2: Bất phương trình bậc nhất hai ẩn', order_num: 2 },
  // Tin học 11
  { id: 'tin11-ch1', subject_id: 'tin-hoc-11', grade_id: 11, title: 'Chương 1: Hệ điều hành và Phần mềm ứng dụng', order_num: 1 },
  { id: 'tin11-ch2', subject_id: 'tin-hoc-11', grade_id: 11, title: 'Chương 2: Cơ sở dữ liệu và Hệ quản trị CSDL', order_num: 2 },
  // Toán 11
  { id: 'toan11-ch1', subject_id: 'toan-11', grade_id: 11, title: 'Chương 1: Hàm số lượng giác & Phương trình', order_num: 1 },
  { id: 'toan11-ch2', subject_id: 'toan-11', grade_id: 11, title: 'Chương 2: Dãy số, Cấp số cộng và Cấp số nhân', order_num: 2 },
];

for (const ch of chapters) {
  insertChapter.run(ch);
}

const lessons = [
  {
    id: 'tin10-b1',
    chapter_id: 'tin10-ch1',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    title: 'Bài 1: Thông tin và Xử lý thông tin',
    summary: 'Khái niệm thông tin, dữ liệu, các đơn vị đo lường thông tin và quá trình số hóa.',
    content_markdown: `### 1. Thông tin và dữ liệu
- **Dữ liệu (Data)**: Là các số liệu, ký hiệu, hình ảnh, âm thanh... được thu thập chưa qua xử lý.
- **Thông tin (Information)**: Là ý nghĩa được rút ra từ dữ liệu sau quá trình xử lý, giúp con người hiểu biết và đưa ra quyết định.
- **Đơn vị đo lường thông tin**:
  - $1 \\text{ Byte} = 8 \\text{ bits}$
  - $1 \\text{ KB} = 1024 \\text{ Bytes}$
  - $1 \\text{ MB} = 1024 \\text{ KB}$
  - $1 \\text{ GB} = 1024 \\text{ MB}$

### 2. Thiết bị số và vai trò trong xã hội hiện đại
Thiết bị số hỗ trợ nhập, lưu trữ, xử lý và truyền tải thông tin với tốc độ cực nhanh và độ tin cậy cao.`,
    order_num: 1,
  },
  {
    id: 'tin10-b2',
    chapter_id: 'tin10-ch2',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    title: 'Bài 2: Mạng máy tính và Điện toán đám mây',
    summary: 'Kiến trúc mạng LAN/WAN, giao thức TCP/IP và dịch vụ điện toán đám mây.',
    content_markdown: `### 1. Mạng máy tính
Mạng máy tính là tập hợp các máy tính và thiết bị được kết nối với nhau theo một phương thức nào đó thông qua các phương tiện truyền dẫn nhằm chia sẻ tài nguyên và dữ liệu.

### 2. Điện toán đám mây (Cloud Computing)
- Dịch vụ lưu trữ trực tuyến: Google Drive, OneDrive, Dropbox.
- Ưu điểm: Truy cập dữ liệu mọi lúc mọi nơi, sao lưu dữ liệu tự động, chia sẻ tài nguyên linh hoạt.`,
    order_num: 2,
  },
  {
    id: 'toan10-b1',
    chapter_id: 'toan10-ch1',
    subject_id: 'toan-10',
    grade_id: 10,
    title: 'Bài 1: Mệnh đề toán học',
    summary: 'Khái niệm mệnh đề, mệnh đề phủ định, mệnh đề kéo theo và mệnh đề tương đương.',
    content_markdown: `### 1. Khái niệm Mệnh đề
Mệnh đề toán học là một câu khẳng định có tính đúng hoặc sai, không thể vừa đúng vừa sai.

### 2. Các phép toán trên mệnh đề
- Mệnh đề phủ định của $P$, ký hiệu $\\overline{P}$.
- Mệnh đề kéo theo: $P \\Rightarrow Q$ (chỉ sai khi $P$ đúng mà $Q$ sai).
- Mệnh đề tương đương: $P \\Leftrightarrow Q$ (đúng khi cả $P$ và $Q$ cùng đúng hoặc cùng sai).`,
    order_num: 1,
  },
  {
    id: 'tin11-b1',
    chapter_id: 'tin11-ch2',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    title: 'Bài 1: Khái niệm Hệ Cơ Sở Dữ Liệu',
    summary: 'Cơ sở dữ liệu (CSDL), Hệ quản trị CSDL (DBMS) và các mô hình dữ liệu quan hệ.',
    content_markdown: `### 1. Cơ sở dữ liệu (Database)
CSDL là một tập hợp các dữ liệu có liên quan với nhau, được lưu trữ một cách có cấu trúc trên các thiết bị lưu trữ số.

### 2. Hệ quản trị CSDL (DBMS)
Phần mềm cung cấp môi trường để tạo lập, lưu trữ, truy vấn và duy trì CSDL. Ví dụ: MySQL, PostgreSQL, SQLite, MS SQL Server.`,
    order_num: 1,
  },
];

for (const les of lessons) {
  insertLesson.run(les);
}

// 6. Nạp Ngân hàng câu hỏi mẫu (tối thiểu 20 câu hỏi chất lượng đủ 3 dạng: MCQ, TF 4 ý, SA)
console.log('⚡ Đang khởi tạo Ngân hàng câu hỏi chuẩn cấu trúc mới (MCQ, TF 4 ý, SA)...');

const insertQuestion = db.prepare(`
  INSERT INTO Questions (id, subject_id, grade_id, chapter_id, lesson_id, q_type, difficulty, stem, payload_json, explanation, lock_shuffle, points, created_by)
  VALUES (@id, @subject_id, @grade_id, @chapter_id, @lesson_id, @q_type, @difficulty, @stem, @payload_json, @explanation, @lock_shuffle, @points, @created_by)
  ON CONFLICT(id) DO UPDATE SET
    stem = excluded.stem,
    payload_json = excluded.payload_json,
    explanation = excluded.explanation,
    points = excluded.points
`);

const questions = [
  // ==================== TIN HỌC 10 ====================
  // Câu 1: MCQ Tin 10 - NB
  {
    id: 'q-tin10-01',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'MCQ',
    difficulty: 'NB',
    stem: 'Đơn vị cơ bản nhỏ nhất dùng để đo lượng thông tin trong máy tính là gì?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Byte' },
        { key: 'B', text: 'Bit' },
        { key: 'C', text: 'Kilobyte' },
        { key: 'D', text: 'Hertz' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Bit (viết tắt của Binary Digit) là đơn vị nhỏ nhất để đo lượng thông tin trong máy tính, nhận một trong hai giá trị 0 hoặc 1.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 2: MCQ Tin 10 - TH
  {
    id: 'q-tin10-02',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Một tệp tài liệu văn bản có kích thước 2 MB. Hỏi tệp này tương đương với bao nhiêu Kilobyte (KB)?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: '1024 KB' },
        { key: 'B', text: '2000 KB' },
        { key: 'C', text: '2048 KB' },
        { key: 'D', text: '4096 KB' },
      ],
      correct_answer: 'C',
    }),
    explanation: 'Ta có quy đổi: 1 MB = 1024 KB. Do đó 2 MB = 2 * 1024 KB = 2048 KB.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 3: TF Tin 10 - Chùm 4 mệnh đề
  {
    id: 'q-tin10-03',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch2',
    lesson_id: 'tin10-b2',
    q_type: 'TF',
    difficulty: 'TH',
    stem: 'Khi tìm hiểu về mạng máy tính và Internet, xét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Mạng LAN (Local Area Network) là mạng kết nối máy tính trong phạm vi hẹp như một phòng học hay tòa nhà.', is_true: true },
        { id: 'b', statement: 'Mạng Internet thuộc quyền sở hữu độc quyền của tập đoàn Microsoft.', is_true: false },
        { id: 'c', statement: 'Mỗi máy tính khi kết nối trực tiếp vào mạng Internet đều cần có một địa chỉ IP để định danh.', is_true: true },
        { id: 'd', statement: 'Giao thức HTTP là giao thức truyền thông an toàn hơn HTTPS nhờ cơ chế mã hóa SSL/TLS.', is_true: false },
      ],
    }),
    explanation: 'Mệnh đề a) Đúng vì LAN là mạng cục bộ. b) Sai vì Internet là mạng toàn cầu không thuộc sở hữu của bất kỳ tổ chức duy nhất nào. c) Đúng vì IP dùng để định danh thiết bị. d) Sai vì HTTPS mới là giao thức bảo mật có mã hóa SSL/TLS.',
    lock_shuffle: 0,
    points: 1.0,
    created_by: teacher1Email,
  },
  // Câu 4: SA Tin 10 - Trả lời ngắn
  {
    id: 'q-tin10-04',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Trong biểu diễn dữ liệu nhị phân, số nguyên dương 13 trong hệ thập phân khi chuyển đổi sang hệ nhị phân (hệ cơ số 2) có giá trị là gì?',
    payload_json: JSON.stringify({
      accepted_answers: ['1101', '01101', '00001101'],
      case_sensitive: false,
    }),
    explanation: 'Chia 13 cho 2 liên tiếp: 13 / 2 = 6 dư 1; 6 / 2 = 3 dư 0; 3 / 2 = 1 dư 1; 1 / 2 = 0 dư 1. Ghi các số dư từ dưới lên: 1101.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 5: MCQ Tin 10 - VD
  {
    id: 'q-tin10-05',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch2',
    lesson_id: 'tin10-b2',
    q_type: 'MCQ',
    difficulty: 'VD',
    stem: 'Hành động nào sau đây đảm bảo an toàn thông tin cá nhân nhất khi sử dụng mạng xã hội?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Đặt cùng một mật khẩu đơn giản cho tất cả tài khoản trực tuyến' },
        { key: 'B', text: 'Bật xác thực 2 bước (2FA) và không nhấp vào đường link lạ' },
        { key: 'C', text: 'Công khai số CMND/CCCD và ngày tháng năm sinh trên trang cá nhân' },
        { key: 'D', text: 'Tự động lưu mật khẩu tài khoản ngân hàng trên máy tính công cộng' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Bật xác thực 2 yếu tố (2FA) và cảnh giác với các liên kết lạ giúp ngăn chặn đánh cắp tài khoản hiệu quả nhất.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 6: SA Tin 10 - Trả lời ngắn số học
  {
    id: 'q-tin10-06',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'SA',
    difficulty: 'NB',
    stem: 'Một Byte gồm có bao nhiêu bit?',
    payload_json: JSON.stringify({
      accepted_answers: ['8', '8 bit', 'tam bit'],
      case_sensitive: false,
    }),
    explanation: '1 Byte luôn bằng đúng 8 bits.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },

  // ==================== TOÁN HỌC 10 ====================
  // Câu 7: MCQ Toán 10 - NB
  {
    id: 'q-toan10-01',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch1',
    lesson_id: 'toan10-b1',
    q_type: 'MCQ',
    difficulty: 'NB',
    stem: 'Câu nào sau đây là một mệnh đề toán học?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Hôm nay trời đẹp quá!' },
        { key: 'B', text: 'Số 17 là số nguyên tố.' },
        { key: 'C', text: 'Bạn đã làm bài tập về nhà chưa?' },
        { key: 'D', text: 'Hãy giữ trật tự trong lớp học!' },
      ],
      correct_answer: 'B',
    }),
    explanation: '"Số 17 là số nguyên tố" là một câu khẳng định có tính đúng sai rõ ràng (và là khẳng định đúng), do đó nó là mệnh đề toán học.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
  // Câu 8: TF Toán 10 - Chùm 4 mệnh đề
  {
    id: 'q-toan10-02',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch1',
    lesson_id: 'toan10-b1',
    q_type: 'TF',
    difficulty: 'TH',
    stem: 'Cho hai tập hợp $A = \\{1; 2; 3; 4\\}$ và $B = \\{3; 4; 5; 6\\}$. Xét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Giao của hai tập hợp là $A \\cap B = \\{3; 4\\}$.', is_true: true },
        { id: 'b', statement: 'Hợp của hai tập hợp là $A \\cup B = \\{1; 2; 3; 4; 5; 6\\}$.', is_true: true },
        { id: 'c', statement: 'Hiệu của hai tập hợp là $A \\setminus B = \\{5; 6\\}$.', is_true: false },
        { id: 'd', statement: 'Số phần tử của tập hợp hợp thỏa mãn $n(A \\cup B) = 7$.', is_true: false },
      ],
    }),
    explanation: 'a) Đúng vì phần tử chung là 3, 4. b) Đúng vì gom đủ các phần tử. c) Sai vì A \\ B = {1, 2}. d) Sai vì n(A U B) = 6 phần tử.',
    lock_shuffle: 0,
    points: 1.0,
    created_by: teacher2Email,
  },
  // Câu 9: SA Toán 10 - Trả lời ngắn số học (chấp nhận cả dấu chấm và phẩy)
  {
    id: 'q-toan10-03',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Giá trị nhỏ nhất của hàm số $y = x^2 - 4x + 5$ trên tập số thực $\\mathbb{R}$ bằng bao nhiêu?',
    payload_json: JSON.stringify({
      accepted_answers: ['1', '1.0', '1,0'],
      case_sensitive: false,
    }),
    explanation: 'Biến đổi hàm số về dạng chính phương: y = (x - 2)^2 + 1 >= 1 với mọi x. Dấu bằng xảy ra khi x = 2. Vậy GTNN bằng 1.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
  // Câu 10: MCQ Toán 10 - VDC
  {
    id: 'q-toan10-04',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch2',
    q_type: 'MCQ',
    difficulty: 'VDC',
    stem: 'Miền nghiệm của bất phương trình $2x + y - 4 \\le 0$ chứa điểm nào sau đây?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Điểm M(1; 1)' },
        { key: 'B', text: 'Điểm N(3; 2)' },
        { key: 'C', text: 'Điểm P(2; 3)' },
        { key: 'D', text: 'Điểm Q(0; 5)' },
      ],
      correct_answer: 'A',
    }),
    explanation: 'Thay tọa độ điểm M(1; 1) vào: 2(1) + 1 - 4 = -1 <= 0 (thỏa mãn). Các điểm khác đều cho giá trị dương > 0.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },

  // ==================== TIN HỌC 11 ====================
  // Câu 11: MCQ Tin 11 - NB
  {
    id: 'q-tin11-01',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'MCQ',
    difficulty: 'NB',
    stem: 'Khóa chính (Primary Key) trong một bảng dữ liệu quan hệ có đặc điểm gì?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Có thể nhận giá trị trùng lặp giữa các bản ghi' },
        { key: 'B', text: 'Dùng để xác định duy nhất mỗi bản ghi và không được rỗng (NOT NULL)' },
        { key: 'C', text: 'Bắt buộc phải là kiểu dữ liệu văn bản ký tự' },
        { key: 'D', text: 'Chỉ được phép tạo trên bảng có nhiều hơn 100 dòng' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Khóa chính có vai trò phân biệt duy nhất từng hàng dữ liệu trong bảng và không bao giờ được phép mang giá trị rỗng (NULL).',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 12: TF Tin 11 - Chùm 4 mệnh đề
  {
    id: 'q-tin11-02',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'TF',
    difficulty: 'TH',
    stem: 'Về ngôn ngữ truy vấn cơ sở dữ liệu có cấu trúc SQL, xét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Mệnh đề SELECT được sử dụng để truy xuất các cột dữ liệu cần lấy từ bảng.', is_true: true },
        { id: 'b', statement: 'Mệnh đề WHERE dùng để chỉ định điều kiện lọc các bản ghi.', is_true: true },
        { id: 'c', statement: 'Lệnh DELETE FROM dùng để xóa vĩnh viễn cấu trúc bảng khỏi CSDL.', is_true: false },
        { id: 'd', statement: 'Mệnh đề ORDER BY mặc định sắp xếp các bản ghi theo thứ tự giảm dần (DESC).', is_true: false },
      ],
    }),
    explanation: 'a) Đúng. b) Đúng. c) Sai vì DELETE chỉ xóa dữ liệu hàng, muốn xóa cấu trúc bảng phải dùng DROP TABLE. d) Sai vì ORDER BY mặc định sắp xếp tăng dần (ASC).',
    lock_shuffle: 0,
    points: 1.0,
    created_by: teacher1Email,
  },
  // Câu 13: SA Tin 11 - Trả lời ngắn
  {
    id: 'q-tin11-03',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'SA',
    difficulty: 'TH',
    stem: 'Từ khóa SQL nào dùng để loại bỏ các hàng dữ liệu trùng lặp trong kết quả của câu lệnh SELECT?',
    payload_json: JSON.stringify({
      accepted_answers: ['DISTINCT', 'SELECT DISTINCT'],
      case_sensitive: false,
    }),
    explanation: 'Từ khóa DISTINCT (ví dụ: SELECT DISTINCT lop FROM HocSinh) loại bỏ toàn bộ các bản ghi trùng lặp.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 14: MCQ Tin 11 - TH
  {
    id: 'q-tin11-04',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Hệ điều hành nào sau đây là hệ điều hành mã nguồn mở?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Microsoft Windows 11' },
        { key: 'B', text: 'Apple macOS Sonoma' },
        { key: 'C', text: 'Ubuntu Linux' },
        { key: 'D', text: 'Apple iOS' },
      ],
      correct_answer: 'C',
    }),
    explanation: 'Linux (và bản phân phối Ubuntu) là hệ điều hành mã nguồn mở, cho phép cộng đồng xem và sửa đổi mã nguồn tự do.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },
  // Câu 15: SA Tin 11 - Trả lời ngắn
  {
    id: 'q-tin11-05',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Viết tên câu lệnh SQL dùng để thêm một hàng dữ liệu mới vào bảng (gồm 2 từ tiếng Anh, ví dụ: "SELECT FROM"):',
    payload_json: JSON.stringify({
      accepted_answers: ['INSERT INTO', 'insert into'],
      case_sensitive: false,
    }),
    explanation: 'Câu lệnh "INSERT INTO TableName VALUES (...)" dùng để chèn bản ghi mới.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher1Email,
  },

  // ==================== TOÁN HỌC 11 ====================
  // Câu 16: MCQ Toán 11 - NB
  {
    id: 'q-toan11-01',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch1',
    q_type: 'MCQ',
    difficulty: 'NB',
    stem: 'Tập giá trị của hàm số lượng giác $y = \\sin(x)$ là đoạn nào sau đây?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: '$[0; 1]$' },
        { key: 'B', text: '$[-1; 1]$' },
        { key: 'C', text: '$(-\\infty; +\\infty)$' },
        { key: 'D', text: '$[-1; 0]$' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Với mọi số thực x, luôn có -1 <= sin(x) <= 1, do đó tập giá trị là đoạn [-1; 1].',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
  // Câu 17: TF Toán 11 - Chùm 4 mệnh đề
  {
    id: 'q-toan11-02',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch2',
    q_type: 'TF',
    difficulty: 'TH',
    stem: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 4$. Xét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Số hạng thứ hai của cấp số cộng là $u_2 = 7$.', is_true: true },
        { id: 'b', statement: 'Công thức số hạng tổng quát là $u_n = 4n - 1$.', is_true: true },
        { id: 'c', statement: 'Số hạng thứ năm của cấp số cộng là $u_5 = 20$.', is_true: false },
        { id: 'd', statement: 'Tổng 10 số hạng đầu tiên của cấp số cộng là $S_{10} = 210$.', is_true: true },
      ],
    }),
    explanation: 'a) u2 = 3 + 4 = 7 (Đúng). b) un = 3 + (n-1)*4 = 4n - 1 (Đúng). c) u5 = 4*5 - 1 = 19 (Sai). d) S10 = 10*(2*3 + 9*4)/2 = 10*(6 + 36)/2 = 210 (Đúng).',
    lock_shuffle: 0,
    points: 1.0,
    created_by: teacher2Email,
  },
  // Câu 18: SA Toán 11 - Trả lời ngắn số học thập phân (hỗ trợ 1.5 và 1,5)
  {
    id: 'q-toan11-03',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Cho cấp số nhân lùi vô hạn có $u_1 = 1$ và công bội $q = 0.5$ (tức $1/2$). Tổng của cấp số nhân lùi vô hạn này bằng bao nhiêu?',
    payload_json: JSON.stringify({
      accepted_answers: ['2', '2.0', '2,0'],
      case_sensitive: false,
    }),
    explanation: 'Tổng cấp số nhân lùi vô hạn S = u1 / (1 - q) = 1 / (1 - 0.5) = 1 / 0.5 = 2.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
  // Câu 19: MCQ Toán 11 - TH
  {
    id: 'q-toan11-04',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Chu kỳ tuần hoàn của hàm số $y = \\cos(2x)$ bằng bao nhiêu?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: '$2\\pi$' },
        { key: 'B', text: '$\\pi$' },
        { key: 'C', text: '$\\pi / 2$' },
        { key: 'D', text: '$4\\pi$' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Hàm số cos(ax) có chu kỳ T = 2pi / |a| = 2pi / 2 = pi.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
  // Câu 20: SA Toán 11 - Số học
  {
    id: 'q-toan11-05',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Tìm số hạng thứ 4 của cấp số nhân có số hạng đầu $u_1 = 2$ và công bội $q = 3$:',
    payload_json: JSON.stringify({
      accepted_answers: ['54'],
      case_sensitive: false,
    }),
    explanation: 'u4 = u1 * q^3 = 2 * (3^3) = 2 * 27 = 54.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: teacher2Email,
  },
];

for (const q of questions) {
  insertQuestion.run({
    id: q.id,
    subject_id: q.subject_id,
    grade_id: q.grade_id,
    chapter_id: q.chapter_id || null,
    lesson_id: q.lesson_id || null,
    q_type: q.q_type,
    difficulty: q.difficulty,
    stem: q.stem,
    payload_json: q.payload_json,
    explanation: q.explanation || null,
    lock_shuffle: q.lock_shuffle || 0,
    points: q.points !== undefined ? q.points : 1.0,
    created_by: q.created_by || null,
  });
}
console.log(`✅ Đã nạp thành công ${questions.length} câu hỏi chuẩn cấu trúc mới.`);

// 7. Tạo Đề ôn tập mẫu (Practice_Sets)
console.log('⚡ Đang khởi tạo các Bộ Đề ôn tập mẫu...');
const insertSet = db.prepare(`
  INSERT INTO Practice_Sets (id, title, subject_id, grade_id, duration_minutes, is_exam, question_ids_json, target_classes, created_by)
  VALUES (@id, @title, @subject_id, @grade_id, @duration_minutes, @is_exam, @question_ids_json, @target_classes, @created_by)
  ON CONFLICT(id) DO UPDATE SET title = excluded.title, question_ids_json = excluded.question_ids_json
`);

const practiceSets = [
  {
    id: 'set-tin10-gk1',
    title: 'Khảo thí Giữa Kì 1 - Tin học 10 (Chuẩn Định Dạng Mới)',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    duration_minutes: 45,
    is_exam: 1,
    question_ids_json: JSON.stringify(['q-tin10-01', 'q-tin10-02', 'q-tin10-05', 'q-tin10-03', 'q-tin10-04', 'q-tin10-06']),
    target_classes: 'ALL',
    created_by: teacher1Email,
  },
  {
    id: 'set-toan10-gk1',
    title: 'Đề Ôn Tập Khảo Thí Môn Toán 10 - Học Kì 1',
    subject_id: 'toan-10',
    grade_id: 10,
    duration_minutes: 45,
    is_exam: 1,
    question_ids_json: JSON.stringify(['q-toan10-01', 'q-toan10-04', 'q-toan10-02', 'q-toan10-03']),
    target_classes: 'ALL',
    created_by: teacher2Email,
  },
  {
    id: 'set-tin11-gk1',
    title: 'Khảo thí Giữa Kì 1 - Tin học 11 (Cơ Sở Dữ Liệu & Hệ Điều Hành)',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    duration_minutes: 45,
    is_exam: 1,
    question_ids_json: JSON.stringify(['q-tin11-01', 'q-tin11-04', 'q-tin11-02', 'q-tin11-03', 'q-tin11-05']),
    target_classes: 'ALL',
    created_by: teacher1Email,
  },
  {
    id: 'set-toan11-gk1',
    title: 'Đề Khảo Thí Năng Lực Toán 11 - Lượng Giác & Cấp Số',
    subject_id: 'toan-11',
    grade_id: 11,
    duration_minutes: 45,
    is_exam: 1,
    question_ids_json: JSON.stringify(['q-toan11-01', 'q-toan11-04', 'q-toan11-02', 'q-toan11-03', 'q-toan11-05']),
    target_classes: 'ALL',
    created_by: teacher2Email,
  },
];

for (const ps of practiceSets) {
  insertSet.run(ps);
}
console.log('✅ Đã tạo các Đề ôn tập mẫu.');

// 8. Giả lập một số lượt nộp bài (Submissions) của học sinh Khối 10 & 11 để Bảng Vinh Danh có Top 1, 2, 3 sinh động
console.log('⚡ Đang tạo dữ liệu nộp bài giả lập cho Bảng Vinh Danh (Leaderboard & Podium)...');

const insertSubmission = db.prepare(`
  INSERT INTO Submissions (id, set_id, mode, user_email, user_name, class_id, grade_id, subject_id, score, max_score, is_first_attempt, duration_sec, submitted_at, answers_json)
  VALUES (@id, @set_id, @mode, @user_email, @user_name, @class_id, @grade_id, @subject_id, @score, @max_score, @is_first_attempt, @duration_sec, @submitted_at, @answers_json)
  ON CONFLICT(id) DO NOTHING
`);

const insertHistory = db.prepare(`
  INSERT INTO User_Question_History (user_email, question_id, status, is_bookmarked, last_answered_at)
  VALUES (@user_email, @question_id, @status, @is_bookmarked, CURRENT_TIMESTAMP)
  ON CONFLICT(user_email, question_id) DO UPDATE SET status = excluded.status
`);

// Lấy danh sách một số học sinh tiêu biểu từ DB để làm submissions
const sampleStudentsK10 = db.prepare("SELECT email, full_name, class_id FROM Users WHERE grade_id = '10' AND role = 'STUDENT' LIMIT 12").all();
const sampleStudentsK11 = db.prepare("SELECT email, full_name, class_id FROM Users WHERE grade_id = '11' AND role = 'STUDENT' LIMIT 12").all();

const mockSubmissions = [
  // Khối 10 Top performers
  {
    student: sampleStudentsK10[0] || { email: '26001@ttgdtxcva.edu.vn', full_name: 'TRẦN HOÀNG ANH', class_id: '10TN' },
    score: 9.75,
    max_score: 10.0,
    duration_sec: 1240, // 20p40s
    set_id: 'set-tin10-gk1',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    xpBonus: 280,
  },
  {
    student: sampleStudentsK10[1] || { email: '26002@ttgdtxcva.edu.vn', full_name: 'PHAN GIA BẢO', class_id: '10TN' },
    score: 9.5,
    max_score: 10.0,
    duration_sec: 1410,
    set_id: 'set-tin10-gk1',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    xpBonus: 240,
  },
  {
    student: sampleStudentsK10[2] || { email: '26004@ttgdtxcva.edu.vn', full_name: 'HUỲNH NGỌC PHƯƠNG DUNG', class_id: '10A1' },
    score: 9.25,
    max_score: 10.0,
    duration_sec: 1530,
    set_id: 'set-tin10-gk1',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    xpBonus: 210,
  },
  {
    student: sampleStudentsK10[3] || { email: '26003@ttgdtxcva.edu.vn', full_name: 'TRẦN ĐÌNH HẢI ĐĂNG', class_id: '10A1' },
    score: 8.75,
    max_score: 10.0,
    duration_sec: 1620,
    set_id: 'set-tin10-gk1',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    xpBonus: 180,
  },
  {
    student: sampleStudentsK10[4] || { email: '26005@ttgdtxcva.edu.vn', full_name: 'DƯƠNG THỊ HUỆ HIẾU', class_id: '10A2' },
    score: 8.5,
    max_score: 10.0,
    duration_sec: 1700,
    set_id: 'set-toan10-gk1',
    subject_id: 'toan-10',
    grade_id: 10,
    xpBonus: 160,
  },

  // Khối 11 Top performers
  {
    student: sampleStudentsK11[0] || { email: '25001@ttgdtxcva.edu.vn', full_name: 'ĐỖ TRỊNH MINH ANH', class_id: '11A1' },
    score: 10.0,
    max_score: 10.0,
    duration_sec: 1120, // Nhanh và tuyệt đối
    set_id: 'set-tin11-gk1',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    xpBonus: 350,
  },
  {
    student: sampleStudentsK11[1] || { email: '25002@ttgdtxcva.edu.vn', full_name: 'TRƯƠNG QUỲNH ANH', class_id: '11A1' },
    score: 9.75,
    max_score: 10.0,
    duration_sec: 1350,
    set_id: 'set-tin11-gk1',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    xpBonus: 290,
  },
  {
    student: sampleStudentsK11[2] || { email: '25003@ttgdtxcva.edu.vn', full_name: 'HUỲNH THỊ CẨM BÌNH', class_id: '11A2' },
    score: 9.25,
    max_score: 10.0,
    duration_sec: 1480,
    set_id: 'set-toan11-gk1',
    subject_id: 'toan-11',
    grade_id: 11,
    xpBonus: 230,
  },
  {
    student: sampleStudentsK11[3] || { email: '25005@ttgdtxcva.edu.vn', full_name: 'PHẠM ANH DUY', class_id: '11A3' },
    score: 8.5,
    max_score: 10.0,
    duration_sec: 1650,
    set_id: 'set-tin11-gk1',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    xpBonus: 170,
  },
];

const updateXp = db.prepare('UPDATE Users SET xp_points = xp_points + ? WHERE email = ?');

for (let i = 0; i < mockSubmissions.length; i++) {
  const m = mockSubmissions[i];
  const subId = `sub-mock-${i + 1}`;
  insertSubmission.run({
    id: subId,
    set_id: m.set_id,
    mode: 'MOCK_EXAM',
    user_email: m.student.email,
    user_name: m.student.full_name,
    class_id: m.student.class_id,
    grade_id: m.grade_id,
    subject_id: m.subject_id,
    score: m.score,
    max_score: m.max_score,
    is_first_attempt: 1,
    duration_sec: m.duration_sec,
    submitted_at: new Date(Date.now() - (i + 1) * 3600000 * 2).toISOString(),
    answers_json: JSON.stringify({ score: m.score, generated: true }),
  });

  updateXp.run(m.xpBonus, m.student.email);

  // Tạo thêm question history
  insertHistory.run({
    user_email: m.student.email,
    question_id: m.grade_id === 10 ? 'q-tin10-01' : 'q-tin11-01',
    status: 'MASTERED',
    is_bookmarked: 0,
  });
}

console.log('✅ Đã tạo các lượt nộp bài mẫu và cộng điểm chuyên cần (XP) thành công.');
console.log('🎉 TOÀN BỘ QUÁ TRÌNH SEED DỮ LIỆU ĐÃ HOÀN TẤT XUẤT SẮC!');
db.close();
