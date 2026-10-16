'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Layers,
  Flame,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  Shuffle,
  Compass,
  Trophy,
} from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, subRes, leadRes] = await Promise.all([
          fetch('/api/auth').then((r) => r.json()),
          fetch('/api/subjects').then((r) => r.json()),
          fetch('/api/leaderboard?level=school').then((r) => r.json()),
        ]);

        setCurrentUser(authRes.user || null);
        setSubjects(subRes.subjects || []);
        setLeaderboardData(leadRes);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const reviewModes = [
    {
      title: 'Flash-Quiz (Luyện Từng Câu)',
      desc: 'Làm từng câu hỏi, kiểm tra kết quả và xem lời giải chi tiết tức thì. Lọc câu làm sai hoặc câu đã đánh dấu.',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
      badge: 'Phản hồi ngay',
      href: '/practice?mode=FLASH_QUIZ',
    },
    {
      title: 'Ôn Theo Bài Học',
      desc: 'Hệ thống hóa kiến thức trọng tâm với tóm tắt lý thuyết sinh động và luyện ngay bộ câu hỏi tương ứng.',
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Lý thuyết + Bài tập',
      href: '/subjects',
    },
    {
      title: 'Ôn Theo Chương',
      desc: 'Tổng hợp và quét sâu các dạng câu hỏi từ Nhận biết, Thông hiểu đến Vận dụng cao trong từng chương.',
      icon: Layers,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Toàn diện chương',
      href: '/subjects',
    },
    {
      title: 'Marathon Chinh Phục',
      desc: 'Chế độ luyện tập bền bỉ xuyên suốt toàn bộ ngân hàng câu hỏi môn học, tích lũy điểm % Làm chủ tri thức.',
      icon: Compass,
      color: 'from-purple-600 to-pink-600',
      badge: 'Đo lường % Mastery',
      href: '/practice?mode=MARATHON',
    },
    {
      title: 'Trộn Đề Thi Random 3 Tầng',
      desc: 'Tự động tạo đề thi chuẩn cấu trúc Bộ GD&ĐT với thuật toán Fisher-Yates Shuffle 3 tầng ngẫu nhiên tuyệt đối.',
      icon: Shuffle,
      color: 'from-rose-500 to-red-600',
      badge: 'Chuẩn Bộ GD&ĐT',
      href: '/practice?mode=MOCK_EXAM',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-4 border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>cva-ontap • Nền tảng Ôn tập & Khảo thí Trực tuyến GDPT 2018</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Chào mừng {currentUser ? currentUser.full_name : 'bạn'} đến với cva-ontap!
          </h1>
          <p className="mt-3 text-base text-blue-100 max-w-2xl leading-relaxed">
            Hệ thống ngân hàng câu hỏi chuẩn cấu trúc mới dành riêng cho Trung Tâm Chu Văn An: Trắc nghiệm 4 lựa chọn (MCQ), Đúng/Sai chùm 4 ý (TF), và Trả lời ngắn (SA) tích hợp thuật toán Fisher-Yates 3 tầng.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/practice?mode=MOCK_EXAM"
              className="inline-flex items-center px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 mr-2 fill-slate-900" />
              Vào Phòng Thi Ngay
            </Link>
            <Link
              href="/subjects"
              className="inline-flex items-center px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur transition-all border border-white/20"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Xem Cây Kiến Thức
            </Link>
          </div>
        </div>

        {/* User stats widget in Hero if logged in */}
        {currentUser && (
          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-200 block">Lớp / Khối</span>
              <span className="text-lg font-bold text-white">
                {currentUser.class_id || `Khối ${currentUser.grade_id}`}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-200 block">Điểm Chuyên Cần</span>
              <span className="text-lg font-bold text-amber-300 flex items-center">
                <Award className="w-4 h-4 mr-1 text-amber-300" />
                {currentUser.xp_points || 0} XP
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-200 block">Chuỗi Ngày Học</span>
              <span className="text-lg font-bold text-orange-400 flex items-center">
                <Flame className="w-4 h-4 mr-1 fill-orange-400 text-orange-400" />
                {currentUser.streak_days || 1} ngày
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-200 block">Vai Trò Hệ Thống</span>
              <span className="text-lg font-bold text-emerald-300">
                {currentUser.role === 'ADMIN' ? 'Quản Trị' : currentUser.role === 'TEACHER' ? 'Giáo Viên' : 'Học Sinh'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 1: 5 Chế độ ôn tập */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-blue-600" />
              5 Chế Độ Ôn Tập Đột Phá
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lựa chọn phương thức học phù hợp với mục tiêu và thời gian của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviewModes.map((mode, idx) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.title}
                href={mode.href}
                className="group relative bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mode.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Bắt đầu trải nghiệm</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Section 2: Danh mục Môn học & Tiến độ Mastery */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
              Môn Học & Cây Tri Thức
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phân cấp theo Khối 10 và Khối 11 với tỷ lệ làm chủ ngân hàng câu hỏi
            </p>
          </div>
          <Link href="/subjects" className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline flex items-center">
            Xem tất cả bài học <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                    Khối {sub.grade_id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {sub.chapter_count} Chương
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description}</p>
              </div>

              <div className="mt-6">
                {/* Thanh tiến độ Mastery */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">Làm chủ câu hỏi</span>
                    <span className="text-blue-600 font-bold">{sub.mastery_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(sub.mastery_percentage, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Đã nắm vững {sub.mastered_count}/{sub.question_count} câu hỏi
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/subjects/${sub.id}`}
                    className="flex-1 py-2 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Xem Lý Thuyết
                  </Link>
                  <Link
                    href={`/practice?mode=FLASH_QUIZ&subject_id=${sub.id}`}
                    className="flex-1 py-2 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    Luyện Tập
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Podium Bảng Vinh Danh thu nhỏ */}
      {leaderboardData?.podium && leaderboardData.podium.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4" />
                <span>Bảng Vàng Danh Dự Toàn Trường</span>
              </div>
              <h2 className="text-2xl font-bold">Top 3 Gương Mặt Tiêu Biểu</h2>
            </div>
            <Link
              href="/leaderboard"
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            >
              Xem Chi Tiết 4 Cấp Độ Xếp Hạng <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboardData.podium.map((p: any, idx: number) => {
              const medalColors = [
                'from-amber-400 to-yellow-500 text-slate-900', // Vàng
                'from-slate-200 to-slate-400 text-slate-900',   // Bạc
                'from-amber-600 to-orange-700 text-white',      // Đồng
              ];
              const borderColors = ['border-amber-400/50', 'border-slate-300/40', 'border-amber-600/40'];

              return (
                <div
                  key={p.email}
                  className={`bg-white/5 backdrop-blur rounded-2xl p-5 border ${borderColors[idx]} flex items-center space-x-4`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${medalColors[idx]} flex items-center justify-center font-extrabold text-lg shadow-lg flex-shrink-0`}
                  >
                    #{p.rank}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white truncate">{p.full_name}</span>
                    </div>
                    <div className="text-xs text-blue-200 mt-0.5">
                      Lớp {p.class_id} • Điểm cao nhất: <span className="font-bold text-amber-300">{p.best_score}đ</span>
                    </div>
                    {p.titles && p.titles.length > 0 && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {p.titles[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

