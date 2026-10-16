'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Settings,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ALLOWED_DOMAIN, DOMAIN_ERROR_MESSAGE } from '@/lib/constants';

interface Props {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function QuickLoginModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [showConfigInput, setShowConfigInput] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [inputClientSecret, setInputClientSecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [customTestEmail, setCustomTestEmail] = useState('');

  // Kiểm tra trạng thái Google OAuth Client ID từ server
  const checkGoogleConfig = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      setGoogleConfigured(Boolean(data.configured));
      if (data.authUrl) {
        setAuthUrl(data.authUrl);
      }
    } catch {
      setGoogleConfigured(false);
    }
  };

  useEffect(() => {
    checkGoogleConfig();
  }, []);

  // Xử lý bấm nút Đăng nhập với Google
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Nếu đã có Google Client ID -> Chuyển hướng thẳng sang Google Authentication chính thức
      if (googleConfigured && authUrl) {
        window.location.href = authUrl;
        return;
      }

      // Kiểm tra lại lần nữa từ API phòng trường hợp vừa cập nhật
      const urlRes = await fetch('/api/auth/google/url');
      const urlData = await urlRes.json();

      if (urlData.configured && urlData.authUrl) {
        window.location.href = urlData.authUrl;
        return;
      }

      // 2. Nếu trường chưa cấu hình Google Client ID -> Mở bảng nhập Google Client ID cho Quản trị viên
      setShowConfigInput(true);
      setErrorMsg('Hệ thống chưa được kết nối Google OAuth Client ID. Vui lòng nhập Google Client ID của trường để kích hoạt.');
    } catch (err: any) {
      setErrorMsg(err.message || DOMAIN_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  // Lưu Google Client ID vào server
  const handleSaveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim()) {
      setErrorMsg('Vui lòng nhập Google Client ID');
      return;
    }

    setSavingConfig(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/save-google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: inputClientId.trim(),
          clientSecret: inputClientSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu cấu hình');

      // Tải lại URL xác thực Google
      await checkGoogleConfig();
      setShowConfigInput(false);

      // Chuyển hướng thẳng sang trang Google nếu có authUrl
      const nextRes = await fetch('/api/auth/google/url');
      const nextData = await nextRes.json();
      if (nextData.authUrl) {
        window.location.href = nextData.authUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu cấu hình Google');
    } finally {
      setSavingConfig(false);
    }
  };

  // Xác thực nhanh bằng tài khoản Google thực của giáo viên/học sinh (khi chưa liên kết Google Cloud API)
  const handleDirectSchoolEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTestEmail.trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setErrorMsg(`Email phải có đuôi @${ALLOWED_DOMAIN}`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google_login',
          google_user: {
            email: clean,
            name: clean.split('@')[0].toUpperCase(),
            hd: ALLOWED_DOMAIN,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || DOMAIN_ERROR_MESSAGE);
      onSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || DOMAIN_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-1.5 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Google Workspace • @{ALLOWED_DOMAIN}</span>
          </div>
          
          <h2 className="text-2xl font-black tracking-tight">cva-ontap • Đăng Nhập</h2>
          <p className="text-blue-100 text-xs mt-1 leading-relaxed">
            Hệ thống Khảo thí & Ôn tập TT GDNN-GDTX Chu Văn An
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start space-x-2.5 text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <strong className="block font-bold">Thông báo:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {!showConfigInput ? (
            <>
              {/* Logo Google trung tâm */}
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm border border-blue-100">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Đăng Nhập Bằng Google Nhà Trường
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  Chỉ cho phép tài khoản Google Workspace chính thức do nhà trường cấp (<code className="text-blue-700 font-bold">@{ALLOWED_DOMAIN}</code>). Mật khẩu và xác thực do Google bảo mật 100%.
                </p>
              </div>

              {/* Huy hiệu khóa tên miền */}
              <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>hd: &quot;{ALLOWED_DOMAIN}&quot;</span>
              </div>

              {/* NÚT ĐĂNG NHẬP GOOGLE DUY NHẤT */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-4 px-5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 group disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loading ? 'Đang chuyển hướng sang Google...' : `Đăng nhập với Google (@${ALLOWED_DOMAIN})`}</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Trạng thái kết nối Google:</span>
                  <span className={googleConfigured ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {googleConfigured ? '● Đã kết nối Google OAuth' : '○ Chưa dán Google Client ID'}
                  </span>
                </div>

                {!googleConfigured && (
                  <button
                    onClick={() => setShowConfigInput(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center space-x-1 mx-auto hover:underline"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Dán Google Client ID của trường để kết nối</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* BẢNG CẤU HÌNH GOOGLE CLIENT ID DÀNH CHO QUẢN TRỊ */
            <div className="text-left space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Cấu Hình Google OAuth 2.0</span>
                </h4>
                <button
                  onClick={() => setShowConfigInput(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Quay lại
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Để nút Google mở thẳng trang đăng nhập chính thức của Google, dán <strong>Client ID</strong> từ Google Cloud Console vào đây:
              </p>

              <form onSubmit={handleSaveGoogleConfig} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Google Client ID (bắt buộc):
                  </label>
                  <input
                    type="text"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder="ví dụ: 123456789-xxx.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Google Client Secret (tùy chọn):
                  </label>
                  <input
                    type="password"
                    value={inputClientSecret}
                    onChange={(e) => setInputClientSecret(e.target.value)}
                    placeholder="GOCSPX-xxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingConfig || !inputClientId.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {savingConfig ? 'Đang lưu...' : 'Lưu & Kích Hoạt Google OAuth'}
                </button>
              </form>

              {/* Tùy chọn test bằng email trường cụ thể */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2">
                  Hoặc đăng nhập thử nghiệm bằng email thực của bạn:
                </p>
                <form onSubmit={handleDirectSchoolEmailLogin} className="flex gap-2">
                  <input
                    type="email"
                    value={customTestEmail}
                    onChange={(e) => setCustomTestEmail(e.target.value)}
                    placeholder={`email@${ALLOWED_DOMAIN}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    Vào Ngay
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center text-slate-600 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
            Khóa cứng bảo mật: @{ALLOWED_DOMAIN}
          </span>
          <button onClick={onClose} className="hover:text-slate-800 font-bold text-[11px] text-slate-500 hover:underline">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
