export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { setAuthCookie, clearAuthCookie, getCurrentUser, verifyGoogleDomain } from '@/lib/auth';
import { ALLOWED_DOMAIN, DOMAIN_ERROR_MESSAGE, isAllowedDomain, normalizeSchoolEmail } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user, allowed_domain: ALLOWED_DOMAIN });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, google_user } = body;

    if (action === 'logout') {
      clearAuthCookie();
      return NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
    }

    // XỬ LÝ ĐĂNG NHẬP GOOGLE OAUTH
    if (action === 'google_login' || google_user) {
      const gEmail = String(google_user?.email || email || '').trim().toLowerCase();
      const gHd = String(google_user?.hd || '').trim().toLowerCase();

      // Kiểm tra bắt buộc: email.endsWith("@ttgdtxcva.edu.vn") VÀ hd === "ttgdtxcva.edu.vn"
      const domainCheck = verifyGoogleDomain(gEmail, gHd);
      if (!domainCheck.valid) {
        return NextResponse.json(
          { error: DOMAIN_ERROR_MESSAGE },
          { status: 403 }
        );
      }

      const db = getDatabase();
      let user = db.prepare('SELECT * FROM Users WHERE email = ?').get(gEmail) as any;

      if (!user) {
        // Nếu học sinh dùng email trường hợp lệ lần đầu nhưng chưa có trong DB, tự động kích hoạt tài khoản
        const userCode = gEmail.split('@')[0];
        const gradeMatch = userCode.match(/^(\d{2})/);
        // Nếu bắt đầu bằng 26 (K10), 25 (K11)
        const gradeId = gradeMatch?.[1] === '25' ? '11' : '10';
        const defaultClass = gradeId === '11' ? '11A1' : '10TN';

        db.prepare(`
          INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, xp_points, streak_days, status)
          VALUES (?, ?, ?, 'STUDENT', ?, ?, 0, 1, 'ACTIVE')
        `).run(gEmail, userCode, google_user?.name || userCode, gradeId, defaultClass);

        user = db.prepare('SELECT * FROM Users WHERE email = ?').get(gEmail) as any;
      }

      if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Tài khoản này đang bị tạm khóa.' }, { status: 403 });
      }

      setAuthCookie(user);

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          assigned_subjects: JSON.parse(user.assigned_subjects || '[]'),
        },
      });
    }

    // XỬ LÝ ĐĂNG NHẬP THÔNG THƯỜNG / DEV AUTH MODE
    if (action === 'login') {
      let rawEmail = String(email || '').trim().toLowerCase();
      if (!rawEmail) {
        return NextResponse.json({ error: 'Vui lòng cung cấp địa chỉ email nhà trường' }, { status: 400 });
      }

      // Tự động chuẩn hóa nếu người dùng chỉ nhập mã số học sinh (ví dụ "26001")
      let cleanEmail = rawEmail;
      if (!cleanEmail.includes('@')) {
        cleanEmail = normalizeSchoolEmail(cleanEmail);
      }

      // KHÓA CỨNG: Bắt buộc đuôi @ttgdtxcva.edu.vn, chặn hoàn toàn @gmail.com hoặc domain lạ
      if (!isAllowedDomain(cleanEmail)) {
        return NextResponse.json(
          { error: DOMAIN_ERROR_MESSAGE },
          { status: 403 }
        );
      }

      const db = getDatabase();
      const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(cleanEmail) as any;

      if (!user) {
        return NextResponse.json(
          {
            error: `Không tìm thấy tài khoản với email "${cleanEmail}" trong hệ thống trường. Vui lòng kiểm tra lại mã học sinh hoặc liên hệ quản trị viên.`,
          },
          { status: 404 }
        );
      }

      if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Tài khoản này đang bị tạm khóa.' }, { status: 403 });
      }

      setAuthCookie(user);

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          assigned_subjects: JSON.parse(user.assigned_subjects || '[]'),
        },
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
