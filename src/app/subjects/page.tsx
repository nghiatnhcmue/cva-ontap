'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | '10' | '11'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    if (selectedGrade === 'ALL') return true;
    return String(s.grade_id) === selectedGrade;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chương Trình GDPT 2018</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Cây Kiến Thức & Bài Học Lý Thuyết
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Khám phá lý thuyết tóm tắt, cấu trúc chương và bài tập thực hành theo từng phân môn
          </p>
        </div>

        {/* Grade filter buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setSelectedGrade('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === 'ALL'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả Khối
          </button>
          <button
            onClick={() => setSelectedGrade('10')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === '10'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khối 10
          </button>
          <button
            onClick={() => setSelectedGrade('11')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === '11'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khối 11
          </button>
        </div>
      </div>

      {/* Grid môn học */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSubjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  Khối {sub.grade_id}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {sub.question_count} câu hỏi trong ngân hàng
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{sub.name}</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{sub.description}</p>

              {/* Thống kê chương và bài học */}
              <div className="mt-5 grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>{sub.chapter_count} Chương chuyên đề</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>{sub.lesson_count} Bài học lý thuyết</span>
                </div>
              </div>

              {/* Progress mastery */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Mức độ làm chủ câu hỏi</span>
                  <span className="text-blue-600">{sub.mastery_percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(sub.mastery_percentage, 4)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex gap-3">
              <Link
                href={`/subjects/${sub.id}`}
                className="flex-1 py-3 text-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
              >
                <span>Vào Khám Phá Bài Học</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/practice?mode=MARATHON&subject_id=${sub.id}`}
                className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                title="Marathon toàn bộ câu hỏi môn này"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Marathon</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

