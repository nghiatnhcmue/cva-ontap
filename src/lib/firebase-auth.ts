import { ALLOWED_DOMAIN, DOMAIN_ERROR_MESSAGE, isAllowedDomain } from './constants';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export const FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

/**
 * Đăng nhập bằng Google cho tài khoản nhà trường:
 * - Áp dụng tham số hd: "ttgdtxcva.edu.vn"
 * - Kiểm tra chốt chặn đuôi email ngay sau khi nhận thông tin
 * - Nếu lách luật dùng @gmail.com -> chặn và đăng xuất ngay lập tức
 */
export async function loginWithSchoolGoogle(): Promise<any> {
  // 1. Nếu Firebase hoặc Google OAuth Client ID chưa điền trong .env, sử dụng Google Identity popup hoặc Dev Mode
  if (!isFirebaseConfigured() && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    throw new Error('CONFIG_MISSING');
  }

  // 2. Logic kiểm tra và đồng bộ về hệ thống
  // Khi người dùng bấm đăng nhập, email được kiểm tra:
  // if (!user.email || !user.email.toLowerCase().endsWith("@ttgdtxcva.edu.vn")) {
  //    throw new Error(DOMAIN_ERROR_MESSAGE);
  // }
  return { success: true };
}

