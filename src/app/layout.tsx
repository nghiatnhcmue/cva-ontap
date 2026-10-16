import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'cva-ontap - Hệ Thống Ôn Tập & Khảo Thí Trực Tuyến Chu Văn An',
  description: 'cva-ontap - Hệ thống Quản lý Tri thức, Ôn tập đa chế độ và Khảo thí trực tuyến chuẩn GDPT 2018',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="flex-1 pb-16">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800">cva-ontap</span> &copy; 2026 Trung Tâm GDNN-GDTX Chu Văn An
            </div>
            <div className="flex items-center space-x-4 text-[11px] text-slate-400">
              <span>Định dạng chuẩn GDPT 2018 (MCQ, TF 4 ý, SA)</span>
              <span>•</span>
              <span>Phiên bản 1.0.0 Production</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

