'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Crown,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Users,
  ShieldAlert,
  ChevronDown,
  ArrowUp,
  UserCheck,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function LeaderboardPage() {
  const [level, setLevel] = useState<'grade' | 'class' | 'school' | 'class_battle'>('grade');
  const [selectedGrade, setSelectedGrade] = useState<'10' | '11'>('10');
  const [selectedClass, setSelectedClass] = useState<string>('10TN');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State Giấy Khen Vinh Danh (Certificate Modal)
  const [selectedCertUser, setSelectedCertUser] = useState<any | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('level', level);
      query.set('grade_id', selectedGrade);
      query.set('class_id', selectedClass);

      const res = await fetch(`/api/leaderboard?${query.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [level, selectedGrade, selectedClass]);

  const k10Classes = ['10TN', '10A1', '10A2', '10A3', '10A4', '10A5', '10A6', '10A7', '10A8', '10A9', '10A10', '10A11', '10A12'];
  const k11Classes = ['11A1', '11A2', '11A3', '11A4', '11A5'];
  const activeClassList = selectedGrade === '10' ? k10Classes : k11Classes;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Sảnh Vinh Danh Khảo Thí & Chuyên Cần</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bảng Vàng Danh Dự & Xếp Hạng Đa Cấp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xét thứ hạng công bằng theo Tie-breaker chuẩn: Điểm Năng Lực (Lần 1) → Thời gian làm bài → Lượt làm
          </p>
        </div>

        {/* 4 Scope Switchers */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1 self-start">
          <button
            onClick={() => setLevel('grade')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              level === 'grade' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toàn Khối
          </button>
          <button
            onClick={() => setLevel('class')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              level === 'class' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cấp Lớp
          </button>
          <button
            onClick={() => setLevel('school')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              level === 'school' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toàn Trường
          </button>
          <button
            onClick={() => setLevel('class_battle')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              level === 'class_battle' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đua Top Tập Thể
          </button>
        </div>
      </div>

      {/* Grade and Class selectors */}
      {level !== 'school' && level !== 'class_battle' && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500">Khối lớp:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedGrade('10');
                setSelectedClass('10TN');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === '10' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Khối 10 (561 HS)
            </button>
            <button
              onClick={() => {
                setSelectedGrade('11');
                setSelectedClass('11A1');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === '11' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Khối 11 (201 HS)
            </button>
          </div>

          {level === 'class' && (
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-xs font-bold text-slate-500">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {activeClassList.map((c) => (
                  <option key={c} value={c}>
                    Lớp {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Đang tính toán thứ hạng và áp dụng Tie-breaker...</p>
        </div>
      ) : level === 'class_battle' ? (
        // ==========================================
        // GIAO DIỆN ĐUA TOP TẬP THỂ LỚP (CLASS VS CLASS)
        // ==========================================
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Bảng Xếp Hạng Tập Thể Các Lớp (Khối 10 & 11)
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Tiêu chí: Điểm trung bình lớp + Tỷ lệ % học sinh tham gia
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Hạng</th>
                  <th className="py-3 px-4">Lớp Học</th>
                  <th className="py-3 px-4">Khối</th>
                  <th className="py-3 px-4 text-center">Tỷ Lệ Tham Gia</th>
                  <th className="py-3 px-4 text-right">Điểm Trung Bình</th>
                  <th className="py-3 px-4 text-right">Điểm Cao Nhất</th>
                  <th className="py-3 px-4 text-right">Tổng XP Lớp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data?.class_rankings?.map((c: any) => {
                  let badge = 'bg-slate-100 text-slate-700';
                  if (c.rank === 1) badge = 'bg-amber-100 text-amber-800 font-extrabold';
                  else if (c.rank === 2) badge = 'bg-slate-200 text-slate-800 font-bold';
                  else if (c.rank === 3) badge = 'bg-orange-100 text-orange-800 font-bold';

                  return (
                    <tr key={c.class_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs ${badge}`}>
                          #{c.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        Lớp {c.class_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">Khối {c.grade_id}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <span className="font-bold text-blue-600">{c.participation_rate}%</span>
                          <span className="text-[10px] text-slate-400">
                            ({c.participating_students}/{c.total_students} HS)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-600 text-sm">
                        {c.avg_score} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        {c.max_score} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                        {c.total_xp} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ==========================================
        // GIAO DIỆN BẢNG XẾP HẠNG CÁ NHÂN (PODIUM + TABLE)
        // ==========================================
        <div className="space-y-8">
          {/* PODIUM TOP 3 (Bục Vinh Danh Vàng - Bạc - Đồng 3D) */}
          {data?.podium && data.podium.length >= 3 && (
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center justify-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Sảnh Danh Dự Tinh Hoa</span>
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Bục Vinh Quang Top 3</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Bấm nút &ldquo;Giấy Khen&rdquo; trên từng vị trí để xem và in Chứng nhận vinh danh chính thức
                </p>
              </div>

              {/* Bục 3 vị trí: Rank 2 (Trái) - Rank 1 (Giữa, Cao nhất) - Rank 3 (Phải) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-6">
                {/* RANK 2: Huy Chương Bạc */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 font-extrabold text-lg flex items-center justify-center border-4 border-slate-400 shadow-lg relative">
                    2
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white mt-2 truncate max-w-full">
                    {data.podium[1]?.full_name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-200">
                    Lớp {data.podium[1]?.class_id}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-200 mt-1">
                    {data.podium[1]?.best_score} đ
                  </span>
                  {data.podium[1]?.titles?.[0] && (
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 mt-1 truncate max-w-full">
                      {data.podium[1].titles[0]}
                    </span>
                  )}

                  {/* Nút Giấy Khen Rank 2 */}
                  <button
                    onClick={() => setSelectedCertUser({ ...data.podium[1], rank: 2 })}
                    className="mt-2 px-2.5 py-1 bg-slate-200/20 hover:bg-slate-200/30 text-slate-200 border border-slate-400/30 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all"
                  >
                    <Award className="w-3 h-3 text-slate-300" />
                    <span>Giấy Khen</span>
                  </button>

                  {/* Bục Bạc */}
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl mt-3 flex items-center justify-center font-black text-xl text-slate-400 border-t border-slate-500">
                    SILVER
                  </div>
                </div>

                {/* RANK 1: Huy Chương Vàng (Giữa, Cao nhất) */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Crown className="w-6 h-6 text-amber-400 absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce" />
                    <div className="w-18 sm:w-20 h-18 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-900 font-black text-2xl flex items-center justify-center border-4 border-amber-300 shadow-xl shadow-amber-500/30">
                      1
                    </div>
                  </div>
                  <span className="font-extrabold text-sm sm:text-base text-amber-300 mt-2 truncate max-w-full">
                    {data.podium[0]?.full_name}
                  </span>
                  <span className="text-xs text-blue-200">
                    Lớp {data.podium[0]?.class_id}
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-1">
                    {data.podium[0]?.best_score} đ
                  </span>
                  {data.podium[0]?.titles?.[0] && (
                    <span className="text-[10px] bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded-full text-amber-300 font-bold mt-1">
                      {data.podium[0].titles[0]}
                    </span>
                  )}

                  {/* Nút Giấy Khen Rank 1 */}
                  <button
                    onClick={() => setSelectedCertUser({ ...data.podium[0], rank: 1 })}
                    className="mt-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 rounded-lg text-[10px] font-black flex items-center space-x-1 shadow-md shadow-amber-500/40 transition-all scale-105"
                  >
                    <Award className="w-3.5 h-3.5 text-slate-950" />
                    <span>Chứng Nhận Quán Quân</span>
                  </button>

                  {/* Bục Vàng */}
                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-600/70 to-amber-500/80 rounded-t-2xl mt-3 flex items-center justify-center font-black text-2xl text-amber-200 border-t-2 border-amber-300 shadow-lg">
                    GOLD
                  </div>
                </div>

                {/* RANK 3: Huy Chương Đồng */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-extrabold text-lg flex items-center justify-center border-4 border-amber-600 shadow-lg relative">
                    3
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white mt-2 truncate max-w-full">
                    {data.podium[2]?.full_name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-200">
                    Lớp {data.podium[2]?.class_id}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400 mt-1">
                    {data.podium[2]?.best_score} đ
                  </span>
                  {data.podium[2]?.titles?.[0] && (
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-amber-300 mt-1 truncate max-w-full">
                      {data.podium[2].titles[0]}
                    </span>
                  )}

                  {/* Nút Giấy Khen Rank 3 */}
                  <button
                    onClick={() => setSelectedCertUser({ ...data.podium[2], rank: 3 })}
                    className="mt-2 px-2.5 py-1 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-600/40 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all"
                  >
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Giấy Khen</span>
                  </button>

                  {/* Bục Đồng */}
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-orange-950 to-amber-900/80 rounded-t-2xl mt-3 flex items-center justify-center font-black text-xl text-amber-500 border-t border-amber-700">
                    BRONZE
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BẢNG CHI TIẾT THỨ HẠNG TẤT CẢ HỌC SINH */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Danh Sách Xếp Hạng ({data?.total_participants || 0} học sinh)
              </h3>
              <span className="text-xs text-slate-400">
                Tie-breaker: Điểm cao → Giây làm bài thấp → XP cao
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-3">Họ và Tên</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3">Danh Hiệu Tự Động</th>
                    <th className="py-3 px-3 text-right">Điểm Năng Lực</th>
                    <th className="py-3 px-3 text-right">Thời Gian</th>
                    <th className="py-3 px-3 text-right">Điểm Chuyên Cần</th>
                    <th className="py-3 px-3 text-center">Chứng Nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data?.rankings?.map((r: any) => {
                    let rankBadge = 'bg-slate-100 text-slate-700';
                    if (r.rank === 1) rankBadge = 'bg-amber-400 text-slate-900 font-extrabold';
                    else if (r.rank === 2) rankBadge = 'bg-slate-300 text-slate-900 font-bold';
                    else if (r.rank === 3) rankBadge = 'bg-amber-700 text-white font-bold';

                    return (
                      <tr key={r.email} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${rankBadge}`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm">{r.full_name}</div>
                          <div className="text-[11px] text-slate-400">{r.email}</div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">
                          {r.class_id}
                        </td>
                        <td className="py-3.5 px-3">
                          {r.titles && r.titles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.titles.map((t: string) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-amber-600 text-sm">
                          {r.best_score} đ
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-500 font-mono">
                          {r.duration_sec > 0 ? `${Math.floor(r.duration_sec / 60)}p ${r.duration_sec % 60}s` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-indigo-600">
                          {r.xp_points} XP
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedCertUser(r)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all"
                            title="Xem và in Giấy khen"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Giấy Khen</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MY STICKY RANK BAR Ở ĐÁY MÀN HÌNH */}
      {data?.my_rank && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-700 text-white py-3 px-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-900 flex items-center justify-center font-extrabold text-sm shadow-md">
                #{data.my_rank.rank}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Thứ hạng của bạn: <strong>{data.my_rank.full_name}</strong></span>
                  <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                    Lớp {data.my_rank.class_id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Điểm năng lực: <strong className="text-amber-300">{data.my_rank.best_score}đ</strong> • Chuyên cần: <strong className="text-indigo-300">{data.my_rank.xp_points} XP</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedCertUser(data.my_rank)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>Giấy Khen Của Tôi</span>
              </button>

              <Link
                href="/practice?mode=MOCK_EXAM"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Thi Để Leo Rank</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL GIẤY KHEN VINH DANH DANH DỰ (CERTIFICATE OF ACHIEVEMENT) */}
      {/* ======================================================== */}
      {selectedCertUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            {/* Top action bar (no-print) */}
            <div className="flex items-center justify-between pb-3 text-white no-print">
              <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Award className="w-4 h-4" />
                <span>Chứng Nhận Thành Tích Khảo Thí Chính Thức</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Tải PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCertUser(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BẢNG GIẤY KHEN TRANG TRỌNG (CONTAINER IN ĐƯỢC) */}
            <div
              id="certificate-print-area"
              className="bg-[#fcfaf5] text-slate-900 rounded-3xl p-8 sm:p-12 border-8 border-amber-600/30 shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: '0 0 50px rgba(217, 119, 6, 0.15)',
              }}
            >
              {/* Golden Inner Double Border */}
              <div className="absolute inset-3 border-2 border-amber-600/50 pointer-events-none rounded-2xl" />
              <div className="absolute inset-4 border border-dashed border-amber-500/30 pointer-events-none rounded-xl" />

              {/* Watermark Logo / Shield in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Award className="w-96 h-96 text-amber-700" />
              </div>

              {/* Certificate Header */}
              <div className="text-center relative z-10 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-[10px] font-semibold text-slate-500 tracking-wider">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-24 h-0.5 bg-amber-500/40 mx-auto my-1" />
                <p className="text-xs font-black uppercase text-slate-800 pt-1">
                  TRUNG TÂM GIÁO DỤC NGHỀ NGHIỆP - GIÁO DỤC THƯỜNG XUYÊN CHU VĂN AN
                </p>
                <p className="text-[10px] font-semibold text-indigo-700">
                  HỘI ĐỒNG KHẢO THÍ & ĐÁNH GIÁ NĂNG LỰC HỌC TẬP TRỰC TUYẾN
                </p>
              </div>

              {/* Main Certificate Banner */}
              <div className="text-center my-6 relative z-10">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase block mb-1">
                  CERTIFICATE OF ACADEMIC ACHIEVEMENT
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 uppercase tracking-wide">
                  GIẤY KHEN DANH DỰ
                </h1>
                <p className="text-xs font-bold text-slate-500 mt-1 italic">
                  Trân trọng vinh danh và khen thưởng học sinh
                </p>
              </div>

              {/* Student Name */}
              <div className="text-center relative z-10 my-4 py-2 border-b-2 border-amber-500/40 max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                  {selectedCertUser.full_name}
                </h2>
                <div className="flex items-center justify-center space-x-3 text-xs text-slate-600 mt-1.5 font-semibold">
                  <span>Lớp: <strong className="text-indigo-700">{selectedCertUser.class_id}</strong></span>
                  <span>•</span>
                  <span>Khối: <strong className="text-indigo-700">{selectedCertUser.grade_id || (selectedCertUser.class_id?.startsWith('11') ? '11' : '10')}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-slate-500">{selectedCertUser.email}</span>
                </div>
              </div>

              {/* Achievement Summary */}
              <div className="relative z-10 text-center max-w-xl mx-auto my-6 space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed">
                  Đã đạt thành tích xuất sắc trong kỳ <strong>Khảo thí & Đánh giá Năng lực Trực tuyến</strong> năm học 2026 - 2027 với thứ hạng danh dự:
                </p>

                <div className="inline-flex items-center justify-center space-x-4 bg-amber-50 border border-amber-200/80 px-6 py-3 rounded-2xl shadow-sm">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Thứ Hạng</span>
                    <span className="text-xl font-black text-amber-700">
                      HẠNG #{selectedCertUser.rank || 'TOP'}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-amber-200" />
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Điểm Năng Lực</span>
                    <span className="text-xl font-black text-emerald-600">
                      {selectedCertUser.best_score} / 10.0 đ
                    </span>
                  </div>
                  <div className="w-px h-8 bg-amber-200" />
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Chuyên Cần</span>
                    <span className="text-xl font-black text-indigo-600">
                      {selectedCertUser.xp_points} XP
                    </span>
                  </div>
                </div>

                {selectedCertUser.titles && selectedCertUser.titles.length > 0 && (
                  <p className="text-xs text-amber-800 font-bold">
                    Danh hiệu phong tặng: &ldquo;{selectedCertUser.titles.join(' • ')}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer Stamp & Signatures */}
              <div className="relative z-10 pt-6 mt-6 border-t border-amber-200/60 flex items-end justify-between text-xs">
                {/* Left: Stamp */}
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-full border-4 border-rose-600 text-rose-600 flex flex-col items-center justify-center font-black text-[8px] leading-tight text-center p-1 uppercase rotate-[-8deg] shadow-sm">
                    <span>TTGDNN-GDTX</span>
                    <span className="text-[9px] font-black my-0.5">CHU VĂN AN</span>
                    <span className="text-[7px]">ĐÃ XÁC THỰC</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <p className="font-semibold text-slate-700">Xác thực điện tử hệ thống</p>
                    <p>Mã chứng nhận: <strong className="font-mono text-slate-800">CVA-CERT-{Date.now().toString().slice(-6)}</strong></p>
                  </div>
                </div>

                {/* Right: Date & Signature */}
                <div className="text-center space-y-1">
                  <p className="text-[11px] text-slate-500 italic">
                    TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                  <p className="text-xs font-bold text-slate-800 uppercase">
                    HỘI ĐỒNG KHẢO THÍ TRỰC TUYẾN
                  </p>
                  <div className="h-10 flex items-center justify-center italic text-indigo-700 font-serif text-sm">
                    [Đã ký duyệt điện tử]
                  </div>
                  <p className="text-xs font-black text-slate-900">
                    GIÁM ĐỐC TRUNG TÂM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print-area,
          #certificate-print-area * {
            visibility: visible;
          }
          #certificate-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 30px;
            background: #fcfaf5 !important;
            border: 8px solid #d97706 !important;
            box-shadow: none !important;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
