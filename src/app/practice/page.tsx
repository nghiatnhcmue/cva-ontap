'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Zap,
  Clock,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Save,
  Filter,
  Sparkles,
  Layers,
  FileText,
  Loader2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';

function PracticeExamContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'FLASH_QUIZ';
  const subjectId = searchParams.get('subject_id') || '';
  const chapterId = searchParams.get('chapter_id') || '';
  const lessonId = searchParams.get('lesson_id') || '';
  const setId = searchParams.get('set_id') || '';
  const initialFilter = searchParams.get('filter') || 'ALL';

  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Lưu trữ câu trả lời của học sinh
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  // Auto-save feedback
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Anti-cheat guard
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showCheatWarning, setShowCheatWarning] = useState<boolean>(false);

  // Flash-quiz instant evaluation states
  const [flashResults, setFlashResults] = useState<Record<string, any>>({});
  const [checkingSingle, setCheckingSingle] = useState(false);

  // Bộ lọc câu hỏi cho Flash-Quiz
  const [qTypeFilter, setQTypeFilter] = useState<'ALL' | 'MCQ' | 'TF' | 'SA'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'NB' | 'TH' | 'VD' | 'VDC'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WRONG' | 'BOOKMARKED'>(initialFilter as any);

  // Bộ đếm thời gian
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const startTimeRef = useRef<number>(Date.now());

  // Trạng thái nộp bài và kết quả
  const [submitting, setSubmitting] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cache key cho Auto-Save
  const cacheKey = `cva_exam_autosave_${mode}_${setId || subjectId || 'general'}`;

  // Tải session câu hỏi
  const loadSession = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('mode', mode);
      if (subjectId) query.set('subject_id', subjectId);
      if (chapterId) query.set('chapter_id', chapterId);
      if (lessonId) query.set('lesson_id', lessonId);
      if (setId) query.set('set_id', setId);
      if (qTypeFilter !== 'ALL') query.set('q_type', qTypeFilter);
      if (statusFilter !== 'ALL') query.set('filter', statusFilter);

      const res = await fetch(`/api/practice/session?${query.toString()}`);
      const data = await res.json();

      let loadedQuestions = data.questions || [];
      if (difficultyFilter !== 'ALL') {
        loadedQuestions = loadedQuestions.filter((q: any) => q.difficulty === difficultyFilter);
      }

      setSessionData(data);
      setQuestions(loadedQuestions);
      setCurrentIndex(0);

      // Kiểm tra xem có bản Auto-Save trong localStorage không (chỉ áp dụng cho thi thử hoặc đề kiểm tra)
      if (mode === 'MOCK_EXAM' || mode === 'ASSIGNED_SET') {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.answers && Object.keys(parsed.answers).length > 0) {
              setAnswers(parsed.answers);
              if (parsed.secondsRemaining && parsed.secondsRemaining > 10) {
                setSecondsRemaining(parsed.secondsRemaining);
              }
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }
          }
        } catch {}
      }

      // Thiết lập đồng hồ
      const totalSec = (data.duration_minutes || 45) * 60;
      if (!localStorage.getItem(cacheKey)) {
        setSecondsRemaining(totalSec);
      }
      startTimeRef.current = Date.now();
      setIsTimerRunning(mode === 'MOCK_EXAM' || mode === 'ASSIGNED_SET');

      // Khởi tạo bookmarks từ dữ liệu
      const initBookmarks: Record<string, boolean> = {};
      loadedQuestions.forEach((q: any) => {
        if (q.is_bookmarked) initBookmarks[q.id] = true;
      });
      setBookmarked(initBookmarks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [mode, subjectId, chapterId, lessonId, setId, qTypeFilter, difficultyFilter, statusFilter]);

  // PHÂN HỆ 5.1: AUTO-SAVE CỤC BỘ ĐỊNH KỲ MỖI 5 GIÂY (5-SECOND LOCALSTORAGE BACKUP)
  useEffect(() => {
    if (loading || submissionResult || (mode !== 'MOCK_EXAM' && mode !== 'ASSIGNED_SET')) return;

    const performLocalBackup = () => {
      if (Object.keys(answers).length > 0) {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              answers,
              secondsRemaining,
              timestamp: Date.now(),
            })
          );
          setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
        } catch {}
      }
    };

    // Backup ngay khi có thay đổi đáp án
    performLocalBackup();

    // Chu kỳ tự động backup định kỳ mỗi 3 giây phòng ngừa mạng trường chập chờn
    const autoSaveTimer = setInterval(performLocalBackup, 3000);
    return () => clearInterval(autoSaveTimer);
  }, [answers, secondsRemaining, loading, submissionResult, cacheKey, mode]);

  // PHÂN HỆ 5.2: GIÁM SÁT CHUYỂN TAB (ANTI-CHEAT GUARD)
  useEffect(() => {
    if (!isTimerRunning || submissionResult) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setShowCheatWarning(true);
          return newCount;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount((prev) => {
        const newCount = prev + 1;
        setShowCheatWarning(true);
        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isTimerRunning, submissionResult]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!isTimerRunning || submissionResult) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, submissionResult]);

  // Format giây thành mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Chọn đáp án MCQ
  const handleSelectMCQ = (questionId: string, optionKey: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  // Chọn mệnh đề TF
  const handleSelectTF = (questionId: string, propId: string, value: boolean) => {
    if (submissionResult) return;
    setAnswers((prev) => {
      const currentTF = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...currentTF,
          [propId.toLowerCase()]: value,
        },
      };
    });
  };

  // Nhập đáp án SA
  const handleInputSA = (questionId: string, val: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (questionId: string) => {
    const nextState = !bookmarked[questionId];
    setBookmarked((prev) => ({ ...prev, [questionId]: nextState }));

    try {
      await fetch('/api/practice/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, is_bookmarked: nextState }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Kiểm tra tức thì 1 câu trong Flash-Quiz (Anti-Spam / Rate Limiting)
  const handleCheckSingle = async (questionId: string) => {
    if (checkingSingle) return; // Chặn click liên tục
    setCheckingSingle(true);
    try {
      const res = await fetch('/api/practice/check-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          student_answer: answers[questionId],
        }),
      });
      const data = await res.json();
      setFlashResults((prev) => ({ ...prev, [questionId]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSingle(false);
    }
  };

  // Nộp bài thi có Anti-Spam / Rate Limiting (Double-Click Protection) & Exponential Backoff Retry
  const handleSubmitExam = async () => {
    if (submitting) return; // Chặn học sinh click liên tiếp nhiều lần
    setSubmitting(true);
    setShowConfirmSubmit(false);
    setIsTimerRunning(false);
    setRetryMessage(null);
    setSubmitErrorMessage(null);

    const durationSec = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const maxRetries = 3;
    let delayMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          setRetryMessage(`Mạng trường đang có độ trễ cao, hệ thống đang tự động nộp lại ngầm (Lần ${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2; // Giãn cách luỹ tiến: 1s -> 2s -> 4s
        }

        const res = await fetch('/api/practice/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            set_id: setId || null,
            mode,
            subject_id: subjectId || 'tin-hoc-10',
            duration_sec: durationSec,
            tab_switch_count: tabSwitchCount,
            answers,
            question_ids: questions.map((q) => q.id),
          }),
        });

        // Nếu máy chủ quá tải (HTTP 502/503/504), thử lại ngầm
        if (!res.ok && res.status >= 500 && attempt < maxRetries) {
          continue;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi nộp bài');

        // Xóa cache auto-save khi đã nộp bài thành công
        try {
          localStorage.removeItem(cacheKey);
        } catch {}

        setSubmissionResult(data);
        setRetryMessage(null);
        break;
      } catch (err: any) {
        if (attempt === maxRetries) {
          setSubmitErrorMessage(
            err.message || 'Mạng bị gián đoạn. Bài làm của bạn vẫn được lưu an toàn tuyệt đối trong bộ nhớ máy! Vui lòng bấm Thử nộp lại bên dưới.'
          );
        }
      }
    }

    setSubmitting(false);
  };

  const currentQ = questions[currentIndex];

  // Thống kê số câu đã làm
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    if (a === undefined || a === null || a === '') return false;
    if (q.q_type === 'TF') {
      return Object.keys(a).length > 0;
    }
    return true;
  }).length;

  // Phân chia danh sách câu hỏi thành 3 phần (Phần I: MCQ, Phần II: TF, Phần III: SA)
  const part1MCQ = questions.map((q, idx) => ({ ...q, originalIdx: idx })).filter((q) => q.q_type === 'MCQ');
  const part2TF = questions.map((q, idx) => ({ ...q, originalIdx: idx })).filter((q) => q.q_type === 'TF');
  const part3SA = questions.map((q, idx) => ({ ...q, originalIdx: idx })).filter((q) => q.q_type === 'SA');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <h2 className="text-base font-bold text-slate-800">Đang chuẩn bị đề thi & trộn câu hỏi...</h2>
        <p className="text-xs text-slate-500 mt-1">Áp dụng thuật toán Fisher-Yates Shuffle 3 tầng chuẩn GDPT 2018</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy câu hỏi phù hợp</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Bộ lọc hiện tại không có câu hỏi nào thỏa mãn (ví dụ: chưa có câu hỏi làm sai hoặc chưa có câu hỏi đánh dấu theo mức độ đã chọn).
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setQTypeFilter('ALL');
              setDifficultyFilter('ALL');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
          >
            Bỏ Lọc & Xem Tất Cả
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN MÀN HÌNH XEM KẾT QUẢ SAU KHI NỘP
  // ==========================================
  if (submissionResult) {
    const isHigh = submissionResult.score >= 8.0;
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8 animate-in fade-in duration-300">
        {/* Banner kết quả */}
        <div
          className={`rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden ${
            isHigh
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700'
              : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800'
          }`}
        >
          <div className="inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Kết Quả Khảo Thí Chính Thức</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold">
            {isHigh ? 'Xuất Sắc! Chúc Mừng Bạn!' : 'Hoàn Thành Bài Kiểm Tra!'}
          </h1>
          <p className="text-sm text-blue-100 mt-2 max-w-lg mx-auto">
            {submissionResult.is_first_attempt
              ? '🌟 Lần làm đầu tiên: Điểm số đã được ghi nhận vào Bảng Xếp Hạng Năng Lực (Rank Score).'
              : '🔄 Lần làm lại: Điểm số ghi nhận điểm Chuyên Cần (XP) và củng cố kiến thức.'}
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
              <span className="text-xs text-blue-200 block">Tổng Điểm</span>
              <span className="text-3xl font-extrabold text-amber-300">
                {submissionResult.score}
              </span>
              <span className="text-xs text-white/80"> / {submissionResult.max_score} đ</span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
              <span className="text-xs text-blue-200 block">Tỷ Lệ Đúng</span>
              <span className="text-3xl font-extrabold text-white">
                {submissionResult.percentage}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
              <span className="text-xs text-blue-200 block">Thời Gian Làm</span>
              <span className="text-2xl font-extrabold text-white flex items-center justify-center mt-1">
                <Clock className="w-4 h-4 mr-1 text-blue-200" />
                {Math.floor(submissionResult.duration_sec / 60)}p {submissionResult.duration_sec % 60}s
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
              <span className="text-xs text-blue-200 block">Cảnh Báo Chuyển Tab</span>
              <span
                className={`text-2xl font-extrabold flex items-center justify-center mt-1 ${
                  submissionResult.tab_switch_count === 0 ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {submissionResult.tab_switch_count === 0 ? '0 (Trung thực)' : `${submissionResult.tab_switch_count} lần`}
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmissionResult(null);
                setAnswers({});
                setTabSwitchCount(0);
                loadSession();
              }}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-all flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm Lại Đề Này</span>
            </button>
            <Link
              href="/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>Xem Bảng Vinh Danh</span>
            </Link>
          </div>
        </div>

        {/* Lời giải chi tiết từng câu kèm MathRenderer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
            Chi Tiết Bài Làm & Lời Giải Chuẩn ($LaTeX$ & Code)
          </h2>

          <div className="space-y-6">
            {submissionResult.results?.map((res: any, idx: number) => {
              const q = questions.find((item) => item.id === res.question_id) || questions[idx];
              return (
                <div
                  key={res.question_id || idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    res.is_correct
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Câu {idx + 1} ({res.q_type})
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        res.is_correct
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {res.is_correct ? `+${res.score_earned}đ (Đúng hoàn toàn)` : `+${res.score_earned}đ / ${res.max_score}đ`}
                    </span>
                  </div>

                  <MathRenderer content={q?.stem || ''} className="text-sm font-semibold text-slate-900 mt-2" />

                  {/* Hiển thị chi tiết theo dạng */}
                  {res.q_type === 'MCQ' && (
                    <div className="mt-3 text-xs space-y-1">
                      <div className="text-slate-600">
                        Đáp án của bạn: <span className="font-bold">{res.user_answer || 'Chưa chọn'}</span>
                      </div>
                      <div className="text-emerald-700 font-bold">
                        Đáp án đúng: {res.correct_answer_summary}
                      </div>
                    </div>
                  )}

                  {res.q_type === 'TF' && res.detail && (
                    <div className="mt-3 space-y-1.5 text-xs">
                      <span className="font-semibold text-slate-700 block">Kết quả từng mệnh đề:</span>
                      {Object.entries(res.detail.props || {}).map(([key, val]: any) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="font-bold uppercase w-5 text-blue-700">{key})</span>
                          <span>{val.expected ? 'Đúng' : 'Sai'}</span>
                          <span className="text-slate-400">| Bạn chọn: {val.actual === null ? 'Trống' : val.actual ? 'Đúng' : 'Sai'}</span>
                          {val.is_correct ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {res.q_type === 'SA' && (
                    <div className="mt-3 text-xs space-y-1">
                      <div className="text-slate-600">
                        Đáp án của bạn: <span className="font-bold">{res.user_answer || 'Chưa nhập'}</span>
                      </div>
                      <div className="text-emerald-700 font-bold">
                        Đáp án được chấp nhận: {(res.correct_answer_summary || []).join(' HOẶC ')}
                      </div>
                    </div>
                  )}

                  {/* Lời giải chi tiết với KaTeX */}
                  {res.explanation && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 bg-white/80 p-3.5 rounded-xl">
                      <span className="font-bold text-blue-700 block mb-1">📖 Lời giải chi tiết:</span>
                      <MathRenderer content={res.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN PHÒNG THI & LUYỆN TẬP ĐANG DIỄN RA
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-6">
      {/* Top Bar: Title, Auto-save status, Anti-cheat alert, Timer */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {sessionData?.title || 'Phòng Luyện Thi'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Chế độ: <strong className="text-slate-800">{mode}</strong>
            </span>
          </div>

          {/* Auto-save notification indicator (Cục bộ mỗi 3s) */}
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1 font-semibold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động lưu cục bộ (3s/lần): {lastSavedTime || 'Đang bảo vệ'}</span>
          </div>
        </div>

        {/* Tab switch warning badge */}
        {tabSwitchCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Vi phạm chuyển tab: {tabSwitchCount} lần</span>
          </div>
        )}

        {/* Đồng hồ đếm ngược (MOCK_EXAM hoặc ASSIGNED_SET) */}
        {(mode === 'MOCK_EXAM' || mode === 'ASSIGNED_SET') && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-base font-extrabold font-mono text-amber-700">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        )}

        {/* Nút nộp bài */}
        <button
          onClick={() => setShowConfirmSubmit(true)}
          disabled={submitting}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Nộp Bài Thi</span>
        </button>
      </div>

      {/* Bộ Lọc Thông Minh cho Flash-Quiz */}
      {mode === 'FLASH_QUIZ' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-500 font-bold">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
          >
            <option value="ALL">Tất cả câu hỏi</option>
            <option value="WRONG">Câu hay làm sai (Sửa sai)</option>
            <option value="BOOKMARKED">Câu đã đánh dấu (Ôn lại)</option>
          </select>

          <select
            value={qTypeFilter}
            onChange={(e) => setQTypeFilter(e.target.value as any)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
          >
            <option value="ALL">Mọi dạng câu</option>
            <option value="MCQ">Trắc nghiệm 4 lựa chọn (MCQ)</option>
            <option value="TF">Đúng/Sai (TF)</option>
            <option value="SA">Trả lời ngắn (SA)</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
          >
            <option value="ALL">Mọi độ khó</option>
            <option value="NB">Nhận biết (NB)</option>
            <option value="TH">Thông hiểu (TH)</option>
            <option value="VD">Vận dụng (VD)</option>
            <option value="VDC">Vận dụng cao (VDC)</option>
          </select>
        </div>
      )}

      {/* Main Examination Grid: Left (Question Area) & Right (Question Palette Navigation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Question Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 min-h-[480px] flex flex-col justify-between">
            <div>
              {/* Question Meta Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-blue-700">
                    Câu {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {currentQ.q_type === 'MCQ'
                      ? 'Trắc nghiệm 4 lựa chọn'
                      : currentQ.q_type === 'TF'
                      ? 'Đúng/Sai (4 mệnh đề)'
                      : 'Trả lời ngắn'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                    {currentQ.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleBookmark(currentQ.id)}
                  className={`p-2 rounded-xl border transition-colors flex items-center space-x-1 text-xs font-semibold ${
                    bookmarked[currentQ.id]
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                  title="Đánh dấu xem lại"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked[currentQ.id] ? 'fill-amber-500' : ''}`} />
                  <span className="hidden sm:inline">
                    {bookmarked[currentQ.id] ? 'Đã đánh dấu' : 'Đánh dấu'}
                  </span>
                </button>
              </div>

              {/* Stem (Nội dung câu hỏi render với KaTeX & Code syntax) */}
              <div className="mt-4">
                <MathRenderer content={currentQ.stem} className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed" />
              </div>

              {/* DẠNG 1: MCQ (Trắc nghiệm 4 lựa chọn) */}
              {currentQ.q_type === 'MCQ' && (
                <div className="mt-6 space-y-3">
                  {(currentQ.payload?.options || []).map((opt: any) => {
                    const isSelected = answers[currentQ.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectMCQ(currentQ.id, opt.key)}
                        className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center space-x-3 group ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div className="flex-1">
                          <MathRenderer content={opt.text} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 2: TF (Chùm 4 mệnh đề a, b, c, d) */}
              {currentQ.q_type === 'TF' && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-slate-500 font-medium">
                    👉 Chọn <strong>Đúng</strong> hoặc <strong>Sai</strong> cho từng mệnh đề sau:
                  </p>
                  {(currentQ.payload?.propositions || []).map((prop: any) => {
                    const currentVal = answers[currentQ.id]?.[prop.id.toLowerCase()];
                    return (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start space-x-2 text-xs sm:text-sm text-slate-800 flex-1">
                          <span className="font-extrabold uppercase text-blue-700 min-w-5">
                            {prop.id})
                          </span>
                          <div className="flex-1">
                            <MathRenderer content={prop.statement} />
                          </div>
                        </div>

                        <div className="flex space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => handleSelectTF(currentQ.id, prop.id, true)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                              currentVal === true
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Đúng</span>
                          </button>
                          <button
                            onClick={() => handleSelectTF(currentQ.id, prop.id, false)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                              currentVal === false
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Sai</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 3: SA (Trả lời ngắn) */}
              {currentQ.q_type === 'SA' && (
                <div className="mt-6 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Nhập câu trả lời của bạn:
                  </label>
                  <input
                    type="text"
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleInputSA(currentQ.id, e.target.value)}
                    placeholder="Nhập số hoặc từ khóa (ví dụ: 1.5 hoặc 1,5 hoặc 29)..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Hệ thống tự động chấp nhận cả dấu chấm (.) và dấu phẩy (,) cho số thập phân.
                  </p>
                </div>
              )}

              {/* Flash-quiz Instant Check & Explanation */}
              {mode === 'FLASH_QUIZ' && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {!flashResults[currentQ.id] ? (
                    <button
                      onClick={() => handleCheckSingle(currentQ.id)}
                      disabled={checkingSingle}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>{checkingSingle ? 'Đang chấm...' : 'Kiểm Tra Đáp Án Ngay'}</span>
                    </button>
                  ) : (
                    <div
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        flashResults[currentQ.id].result?.is_correct
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-900'
                      }`}
                    >
                      <div className="font-bold flex items-center space-x-1.5">
                        {flashResults[currentQ.id].result?.is_correct ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Chính xác tuyệt đối! +10 XP</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>Chưa chính xác! Điểm đạt: {flashResults[currentQ.id].result?.score_earned}đ</span>
                          </>
                        )}
                      </div>
                      {flashResults[currentQ.id].explanation && (
                        <div className="pt-2 border-t border-slate-200/50 text-slate-700">
                          <strong>Lời giải:</strong>
                          <MathRenderer content={flashResults[currentQ.id].explanation} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Nav Prev/Next Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>

              <span className="text-xs font-semibold text-slate-400">
                {currentIndex + 1} / {questions.length}
              </span>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center space-x-1 shadow-sm"
              >
                <span>Câu Kế Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Phân rõ Phần I, II, III (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Bảng Câu Hỏi</h3>
              <span className="text-xs font-bold text-blue-600">
                Đã làm: {answeredCount} / {questions.length}
              </span>
            </div>

            {/* Chú thích màu sắc */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 block" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 block" />
                <span>Đã đánh dấu</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded border-2 border-blue-600 block" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Phân 3 phần rõ ràng trong Question Palette */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto p-1">
              {/* Phần I: MCQ */}
              {part1MCQ.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Phần I: Trắc nghiệm 4 lựa chọn ({part1MCQ.length} câu)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {part1MCQ.map((q) => {
                      const idx = q.originalIdx;
                      const isCurrent = currentIndex === idx;
                      const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== '';
                      const isMarked = bookmarked[q.id];

                      let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                      if (hasAnswer) btnClass = 'bg-blue-600 text-white font-bold shadow-sm';
                      if (isMarked) btnClass = 'bg-amber-400 text-slate-900 font-bold';
                      if (isCurrent) btnClass += ' ring-2 ring-offset-2 ring-blue-600';

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-9 rounded-xl text-xs font-bold transition-all relative ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phần II: TF */}
              {part2TF.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Phần II: Đúng / Sai chùm 4 ý ({part2TF.length} câu)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {part2TF.map((q) => {
                      const idx = q.originalIdx;
                      const isCurrent = currentIndex === idx;
                      const hasAnswer = answers[q.id] && Object.keys(answers[q.id]).length > 0;
                      const isMarked = bookmarked[q.id];

                      let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                      if (hasAnswer) btnClass = 'bg-blue-600 text-white font-bold shadow-sm';
                      if (isMarked) btnClass = 'bg-amber-400 text-slate-900 font-bold';
                      if (isCurrent) btnClass += ' ring-2 ring-offset-2 ring-blue-600';

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-9 rounded-xl text-xs font-bold transition-all relative ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phần III: SA */}
              {part3SA.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Phần III: Trả lời ngắn ({part3SA.length} câu)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {part3SA.map((q) => {
                      const idx = q.originalIdx;
                      const isCurrent = currentIndex === idx;
                      const hasAnswer = answers[q.id] !== undefined && String(answers[q.id]).trim() !== '';
                      const isMarked = bookmarked[q.id];

                      let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                      if (hasAnswer) btnClass = 'bg-blue-600 text-white font-bold shadow-sm';
                      if (isMarked) btnClass = 'bg-amber-400 text-slate-900 font-bold';
                      if (isCurrent) btnClass += ' ring-2 ring-offset-2 ring-blue-600';

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-9 rounded-xl text-xs font-bold transition-all relative ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Nút nộp bài */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Hoàn Thành & Nộp Bài</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CẢNH BÁO GIAN LẬN CHUYỂN TAB (ANTI-CHEAT) */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-red-500 space-y-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-red-600">CẢNH BÁO CHUYỂN TAB!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài (Lần vi phạm thứ <strong>{tabSwitchCount}</strong>).
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 text-left space-y-1">
              <strong>Quy chế phòng thi:</strong>
              <div>• Toàn bộ số lần rời tab đều được ghi vào kết quả nộp bài của bạn.</div>
              <div>• Giáo viên bộ môn sẽ kiểm tra đối chiếu khi chấm điểm xếp hạng.</div>
            </div>

            <button
              onClick={() => setShowCheatWarning(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
            >
              Tôi Đã Hiểu & Quay Lại Làm Bài Ngay
            </button>
          </div>
        </div>
      )}

      {/* Modal xác nhận nộp bài */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Xác Nhận Nộp Bài Thi</h3>
            <p className="text-xs text-slate-500">
              Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số <strong>{questions.length}</strong> câu hỏi.
              {answeredCount < questions.length && (
                <span className="block mt-1 text-amber-600 font-semibold">
                  ⚠️ Vẫn còn {questions.length - answeredCount} câu hỏi bạn chưa chọn đáp án!
                </span>
              )}
            </p>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Tiếp Tục Làm
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-all ${
                  submitting ? 'bg-slate-400 cursor-not-allowed opacity-80' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    <span>Đang nộp bài & tính điểm...</span>
                  </>
                ) : (
                  <span>Đồng Ý Nộp Bài</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo Retry Exponential Backoff khi mạng trường gián đoạn */}
      {retryMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce border-2 border-white">
          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          <span>{retryMessage}</span>
        </div>
      )}

      {/* Modal Lỗi nộp bài nhưng bảo toàn dữ liệu (Offline-Resilient Error Modal) */}
      {submitErrorMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-amber-500 space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto">
              <WifiOff className="w-7 h-7 text-amber-700" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Mạng Kết Nối Bị Gián Đoạn</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {submitErrorMessage}
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-[11px] text-emerald-800 space-y-1">
              <strong className="font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tiến độ bài làm vẫn an toàn 100%:</span>
              </strong>
              <div>• Toàn bộ {questions.length} câu hỏi và đáp án của bạn đã được sao lưu cục bộ.</div>
              <div>• Không tải lại trang để tránh mất thời gian.</div>
            </div>
            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Đang thử nộp lại...' : 'Thử Nộp Lại Ngay Bây Giờ'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticeExamPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Đang khởi tạo phòng khảo thí...</p>
        </div>
      }
    >
      <PracticeExamContent />
    </Suspense>
  );
}
