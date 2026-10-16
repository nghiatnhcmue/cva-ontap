/**
 * HẰNG SỐ BẢO MẬT TÊN MIỀN DUY NHẤT
 * Hệ thống CHỈ cho phép các email có đuôi @ttgdtxcva.edu.vn đăng nhập và sử dụng.
 */
export const ALLOWED_DOMAIN = 'ttgdtxcva.edu.vn';

export const DOMAIN_ERROR_MESSAGE = 'Hệ thống chỉ dành riêng cho tài khoản email @ttgdtxcva.edu.vn của nhà trường.';

/**
 * Kiểm tra xem email có thuộc tên miền nhà trường hay không
 */
export function isAllowedDomain(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Chuẩn hóa email học sinh/giáo viên:
 * - Nếu là mã học sinh hoặc tên tài khoản không có @ (ví dụ "26001"), tự động ghép @ttgdtxcva.edu.vn
 * - Nếu đã có @ttgdtxcva.edu.vn thì giữ nguyên
 * - Nếu dùng tên miền lạ (@gmail.com, ...) trả về chuỗi rỗng để từ chối
 */
export function normalizeSchoolEmail(input: string): string {
  if (!input) return '';
  const clean = String(input).trim().toLowerCase();

  if (clean.includes('@')) {
    return isAllowedDomain(clean) ? clean : '';
  }

  // Nếu chỉ có mã số hoặc username không dấu, tự động sinh email trường
  const sanitizedUser = clean.replace(/[^a-z0-9._-]/g, '');
  if (sanitizedUser.length > 0) {
    return `${sanitizedUser}@${ALLOWED_DOMAIN}`;
  }

  return '';
}

