import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getDatabase } from './db';
import { ALLOWED_DOMAIN, DOMAIN_ERROR_MESSAGE, isAllowedDomain } from './constants';

const JWT_SECRET = process.env.JWT_SECRET || 'cva_default_secret_key_app_on_tap_2026';
const COOKIE_NAME = 'cva_auth_session';

export interface AuthUser {
  id: number;
  email: string;
  user_code: string;
  full_name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  grade_id: string;
  class_id: string;
  assigned_subjects: string[];
  xp_points: number;
  streak_days: number;
  status: 'ACTIVE' | 'INACTIVE';
  avatar_url?: string;
  phone?: string;
  dob?: string;
}

/**
 * Cấu hình Google OAuth 2.0 bắt buộc khóa cứng tên miền hd: "ttgdtxcva.edu.vn"
 */
export const GOOGLE_OAUTH_CONFIG = {
  get clientId() {
    return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  },
  get clientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },
  hd: ALLOWED_DOMAIN, // Khóa cứng tên miền trường cho Google Auth UI
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
};

/**
 * Tạo URL ủy quyền Google OAuth 2.0 kèm tham số hd (hosted domain)
 */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    hd: GOOGLE_OAUTH_CONFIG.hd, // Google chỉ cho phép chọn tài khoản thuộc trường
  });

  if (state) {
    params.set('state', state);
  }

  return `${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Kiểm tra xác thực Google OAuth Profile: Bắt buộc cả email và hd phải thuộc ttgdtxcva.edu.vn
 */
export function verifyGoogleDomain(email: string, hd?: string): { valid: boolean; error?: string } {
  const cleanEmail = String(email || '').trim().toLowerCase();

  // 1. Kiểm tra đuôi email
  if (!isAllowedDomain(cleanEmail)) {
    return {
      valid: false,
      error: DOMAIN_ERROR_MESSAGE,
    };
  }

  // 2. Kiểm tra thuộc tính hd từ Google token nếu có
  if (hd && hd.toLowerCase() !== ALLOWED_DOMAIN) {
    return {
      valid: false,
      error: DOMAIN_ERROR_MESSAGE,
    };
  }

  return { valid: true };
}

/**
 * Tạo token JWT dạng HMAC-SHA256 nhẹ, không phụ thuộc thư viện ngoài
 */
export function signToken(payload: any, expiresInDays = 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Xác thực token JWT
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token hết hạn
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Lấy thông tin user hiện tại từ cookie request (khóa cứng @ttgdtxcva.edu.vn)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.email) return null;

    // Kiểm tra bảo mật domain một lần nữa
    if (!isAllowedDomain(payload.email)) {
      return null;
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(payload.email) as any;
    if (!user || user.status !== 'ACTIVE') return null;

    return {
      ...user,
      assigned_subjects: JSON.parse(user.assigned_subjects || '[]'),
    };
  } catch (err) {
    console.error('Lỗi getCurrentUser:', err);
    return null;
  }
}

/**
 * Set cookie phiên đăng nhập
 */
export function setAuthCookie(user: any) {
  if (!isAllowedDomain(user.email)) {
    throw new Error(DOMAIN_ERROR_MESSAGE);
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  });

  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return token;
}

/**
 * Xóa cookie phiên
 */
export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}
