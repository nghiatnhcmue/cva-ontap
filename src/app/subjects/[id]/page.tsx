'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BookOpen,
  Layers,
  ArrowLeft,
  Zap,
  CheckCircle,
  FileText,
  Clock,
  Play,
  Award,
} from 'lucide-react';

export default function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [practiceSets, setPracticeSets] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubject() {
      try {
        const res = await fetch(`/api/subjects/${subjectId}`);
        const data = await res.json();
        setSubject(data.subject);
        setChapters(data.chapters || []);
        setPracticeSets(data.practice_sets || []);

        // Mặc định chọn bài học đầu tiên của chương đầu tiên
        if (data.chapters?.[0]?.lessons?.[0]) {
          loadLesson(data.chapters[0].lessons[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubject();
  }, [subjectId]);

  const loadLesson = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/knowledge/${lessonId}`);
      const data = await res.json();
      setSelectedLesson(data.lesson);
      setLessonContent(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
        <p className="text-xs text-slate-500">Đang tải cây kiến thức môn học...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-slate-600">Không tìm thấy môn học.</p>
        <Link href="/subjects" className="text-blue-600 text-xs font-bold underline mt-2 inline-block">
          Quay lại danh sách môn học
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top breadcrumb & Subject header */}
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Danh sách môn học</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mb-2">
              <span>Khối {subject.grade_id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{subject.name}</h1>
            <p className="text-xs text-slate-500 mt-1">{subject.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/practice?mode=FLASH_QUIZ&subject_id=${subject.id}`}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Zap className="w-4 h-4 mr-1.5 fill-blue-600" />
              Luyện Từng Câu (Flash-Quiz)
            </Link>
            <Link
              href={`/practice?mode=MOCK_EXAM&subject_id=${subject.id}`}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <Play className="w-4 h-4 mr-1.5 fill-white" />
              Tạo Đề Thi Thử
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-column layout: Left (Tree Structure) & Right (Lesson Content & Questions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Chapters and Lessons List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-600" />
              Cấu Trúc Chương & Bài Học
            </h2>

            <div className="space-y-4">
              {chapters.map((ch, idx) => (
                <div key={ch.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {ch.title}
                    </h3>
                    <Link
                      href={`/practice?mode=CHAPTER&chapter_id=${ch.id}`}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center"
                      title="Luyện toàn bộ câu hỏi chương này"
                    >
                      <Zap className="w-3 h-3 mr-0.5 fill-blue-600" />
                      Ôn chương
                    </Link>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {ch.lessons?.map((les: any) => {
                      const isSelected = selectedLesson?.id === les.id;
                      return (
                        <button
                          key={les.id}
                          onClick={() => loadLesson(les.id)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-md'
                              : 'bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Bài {les.order_num}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Practice sets widget */}
          {practiceSets.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                Bộ Đề Khảo Thí Chính Thức
              </h2>
              <div className="space-y-2.5">
                {practiceSets.map((ps) => (
                  <Link
                    key={ps.id}
                    href={`/practice?mode=ASSIGNED_SET&set_id=${ps.id}`}
                    className="block p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        {ps.title}
                      </span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                        {ps.duration_minutes} phút
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Áp dụng: {ps.target_classes === 'ALL' ? 'Toàn bộ các lớp' : ps.target_classes}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Lesson Content & Practice (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedLesson ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {selectedLesson.chapter_title}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{selectedLesson.title}</h2>
                {selectedLesson.summary && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    💡 <strong>Trọng tâm:</strong> {selectedLesson.summary}
                  </p>
                )}
              </div>

              {/* Markdown Content */}
              <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {selectedLesson.content_markdown}
              </div>

              {/* Lesson Practice Action Bar */}
              <div className="mt-8 pt-6 border-t border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Zap className="w-4 h-4 mr-1.5 text-blue-600 fill-blue-600" />
                    Luyện Tập Ngay Bài Học Này
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gồm {lessonContent?.questions?.length || 0} câu hỏi gắn trực tiếp với bài học
                  </p>
                </div>

                <Link
                  href={`/practice?mode=LESSON&lesson_id=${selectedLesson.id}`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center"
                >
                  <span>Làm Bài Kiểm Tra</span>
                  <Play className="w-3.5 h-3.5 ml-1.5 fill-white" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
              Vui lòng chọn một bài học lý thuyết từ danh sách bên trái để đọc nội dung.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

