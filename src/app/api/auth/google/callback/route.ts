export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OAUTH_CONFIG, verifyGoogleDomain, setAuthCookie } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { DOMAIN_ERROR_MESSAGE, ALLOWED_DOMAIN } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || 'Đăng nhập Google bị hủy')}`);
  }

  try {
    // 1. Đổi code lấy Google Access Token
    const tokenRes = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Không thể lấy token xác thực từ Google');
    }

    // 2. Lấy thông tin tài khoản Google
    const userRes = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    const email = String(googleUser.email || '').trim().toLowerCase();
    const hd = String(googleUser.hd || '').trim().toLowerCase();

    // 3. Khóa cứng bảo mật: bắt buộc email và hd phải thuộc @ttgdtxcva.edu.vn
    const check = verifyGoogleDomain(email, hd);
    if (!check.valid) {
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(DOMAIN_ERROR_MESSAGE)}`);
    }

    // 4. Tìm hoặc tự động tạo tài khoản trong DB
    const db = getDatabase();
    let user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email) as any;

    if (!user) {
      const userCode = email.split('@')[0];
      const gradeId = userCode.startsWith('25') ? '11' : '10';
      const defaultClass = gradeId === '11' ? '11A1' : '10TN';

      db.prepare(`
        INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, xp_points, streak_days, status, avatar_url)
        VALUES (?, ?, ?, 'STUDENT', ?, ?, 0, 1, 'ACTIVE', ?)
      `).run(email, userCode, googleUser.name || userCode, gradeId, defaultClass, googleUser.picture || null);

      user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email) as any;
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent('Tài khoản đã bị vô hiệu hóa')}`);
    }

    setAuthCookie(user);

    return NextResponse.redirect(`${origin}/?login_success=1`);
  } catch (err: any) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(err.message || 'Lỗi xác thực Google')}`);
  }
}
