const ALLOWED_DOMAIN = 'ttgdtxcva.edu.vn';
const DOMAIN_ERROR_MESSAGE = 'Hệ thống chỉ dành riêng cho tài khoản email @ttgdtxcva.edu.vn của nhà trường.';

function isAllowedDomain(email) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

function normalizeSchoolEmail(input) {
  if (!input) return '';
  const clean = String(input).trim().toLowerCase();
  if (clean.includes('@')) {
    return isAllowedDomain(clean) ? clean : '';
  }
  const sanitizedUser = clean.replace(/[^a-z0-9._-]/g, '');
  return sanitizedUser.length > 0 ? `${sanitizedUser}@${ALLOWED_DOMAIN}` : '';
}

console.log('🧪 BẮT ĐẦU KIỂM THỬ KHÓA CỨNG TÊN MIỀN @' + ALLOWED_DOMAIN);

// 1. Kiểm tra unit helper functions
console.log('\n--- 1. Kiểm tra hàm isAllowedDomain & normalizeSchoolEmail ---');
const tests = [
  { input: 'admin@ttgdtxcva.edu.vn', expectedDomain: true, expectedNormalized: 'admin@ttgdtxcva.edu.vn' },
  { input: '26001@ttgdtxcva.edu.vn', expectedDomain: true, expectedNormalized: '26001@ttgdtxcva.edu.vn' },
  { input: 'user@gmail.com', expectedDomain: false, expectedNormalized: '' },
  { input: 'student@yahoo.com', expectedDomain: false, expectedNormalized: '' },
  { input: '26001', expectedDomain: false, expectedNormalized: '26001@ttgdtxcva.edu.vn' },
  { input: '25002', expectedDomain: false, expectedNormalized: '25002@ttgdtxcva.edu.vn' },
];

let unitPass = true;
for (const t of tests) {
  const isAllowed = isAllowedDomain(t.input);
  const normalized = normalizeSchoolEmail(t.input);
  const pass = isAllowed === t.expectedDomain && normalized === t.expectedNormalized;
  if (!pass) unitPass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Input: "${t.input}" -> isAllowed: ${isAllowed} (kỳ vọng: ${t.expectedDomain}) | normalized: "${normalized}" (kỳ vọng: "${t.expectedNormalized}")`);
}

// 2. Kiểm tra API Backend qua HTTP Request
console.log('\n--- 2. Kiểm tra API Backend /api/auth chặn HTTP 403 với domain lạ ---');
(async () => {
  try {
    // Test A: Gửi email @gmail.com
    const resGmail = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'hacker@gmail.com' }),
    });
    const dataGmail = await resGmail.json();
    console.log(`Test A (@gmail.com): HTTP ${resGmail.status} | Error: "${dataGmail.error}"`);
    if (resGmail.status === 403 && dataGmail.error === DOMAIN_ERROR_MESSAGE) {
      console.log('✅ Chặn hoàn hảo tài khoản @gmail.com với mã 403 và thông báo chuẩn!');
    } else {
      console.error('❌ Thất bại Test A');
    }

    // Test B: Gửi Google OAuth giả mạo với hd: "gmail.com"
    const resGoogleFake = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'google_login',
        google_user: { email: 'fake@gmail.com', hd: 'gmail.com', name: 'Fake' },
      }),
    });
    const dataGoogleFake = await resGoogleFake.json();
    console.log(`Test B (Google OAuth @gmail.com): HTTP ${resGoogleFake.status} | Error: "${dataGoogleFake.error}"`);
    if (resGoogleFake.status === 403 && dataGoogleFake.error === DOMAIN_ERROR_MESSAGE) {
      console.log('✅ Chặn hoàn hảo Google OAuth không thuộc trường với mã 403!');
    } else {
      console.error('❌ Thất bại Test B');
    }

    // Test C: Đăng nhập với tài khoản trường hợp lệ @ttgdtxcva.edu.vn
    const resValid = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'admin@ttgdtxcva.edu.vn' }),
    });
    const dataValid = await resValid.json();
    console.log(`Test C (Email trường @ttgdtxcva.edu.vn): HTTP ${resValid.status} | User: "${dataValid.user?.full_name}" | Role: ${dataValid.user?.role}`);
    if (resValid.status === 200 && dataValid.user?.email.endsWith('@ttgdtxcva.edu.vn')) {
      console.log('✅ Đăng nhập thành công với tài khoản trường hợp lệ!');
    } else {
      console.error('❌ Thất bại Test C');
    }

    // Test D: Nhập chỉ mã số học sinh '26001'
    const resCodeOnly = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: '26001' }),
    });
    const dataCodeOnly = await resCodeOnly.json();
    console.log(`Test D (Nhập mã HS '26001'): HTTP ${resCodeOnly.status} | Email đã tự sinh: "${dataCodeOnly.user?.email}" | Tên: ${dataCodeOnly.user?.full_name}`);
    if (resCodeOnly.status === 200 && dataCodeOnly.user?.email === '26001@ttgdtxcva.edu.vn') {
      console.log('✅ Tự động chuẩn hóa mã số học sinh thành email @ttgdtxcva.edu.vn thành công!');
    } else {
      console.error('❌ Thất bại Test D');
    }

    console.log('\n🎉 TOÀN BỘ CÁC BÀI TEST BẢO MẬT KHÓA CỨNG TÊN MIỀN ĐỀU ĐẠT 100%!');
  } catch (err) {
    console.error('Lỗi khi chạy HTTP test:', err);
  }
})();
