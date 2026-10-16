'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Zap,
  BookOpen,
  Filter,
  Sparkles,
  Search,
  BarChart3,
  AlertTriangle,
  Users,
  Eye,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';

export default function TeacherStudioPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<{
    topWrong: any[];
    scoreDist: any[];
    overallDist: any;
    untested: any[];
  }>({
    topWrong: [],
    scoreDist: [],
    overallDist: null,
    untested: [],
  });
  const [loading, setLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<'create' | 'import' | 'analytics' | 'export' | 'list'>('analytics');

  // Form tạo câu hỏi đơn
  const [formSubject, setFormSubject] = useState('tin-hoc-10');
  const [formGrade, setFormGrade] = useState('10');
  const [formQType, setFormQType] = useState<'MCQ' | 'TF' | 'SA'>('MCQ');
  const [formDifficulty, setFormDifficulty] = useState('NB');
  const [formStem, setFormStem] = useState('');
  const [formExplanation, setFormExplanation] = useState('');

  // Payload MCQ
  const [mcqA, setMcqA] = useState('');
  const [mcqB, setMcqB] = useState('');
  const [mcqC, setMcqC] = useState('');
  const [mcqD, setMcqD] = useState('');
  const [mcqCorrect, setMcqCorrect] = useState('A');

  // Payload TF (4 mệnh đề)
  const [tfPropA, setTfPropA] = useState('');
  const [tfValA, setTfValA] = useState(true);
  const [tfPropB, setTfPropB] = useState('');
  const [tfValB, setTfValB] = useState(false);
  const [tfPropC, setTfPropC] = useState('');
  const [tfValC, setTfValC] = useState(true);
  const [tfPropD, setTfPropD] = useState('');
  const [tfValD, setTfValD] = useState(false);

  // Payload SA
  const [saAnswers, setSaAnswers] = useState('');

  // Quick import text
  const [importText, setImportText] = useState(`[MCQ]
Câu 1: Thiết bị nào sau đây là thiết bị xuất dữ liệu?
A. Chuột
B. Bàn phím
C. Màn hình
D. Máy quét scanner
Đáp án: C
Giải thích: Màn hình là thiết bị hiển thị và xuất thông tin cho người dùng.

[TF]
Câu 2: Xét tính Đúng/Sai của các mệnh đề sau về cấu trúc máy tính:
a) RAM là bộ nhớ truy cập ngẫu nhiên và dữ liệu bị mất khi ngắt điện. [Đ]
b) ROM là bộ nhớ chỉ đọc và lưu trữ các chương trình khởi động BIOS. [Đ]
c) CPU càng nhiều nhân thì tốc độ máy tính luôn chậm hơn CPU đơn nhân. [S]
d) Ổ đĩa SSD có tốc độ truy xuất dữ liệu vượt trội hơn so với ổ cứng HDD cơ học. [Đ]
Giải thích: SSD truy xuất nhanh hơn HDD và RAM là bộ nhớ khả biến (volatile).

[SA]
Câu 3: Kết quả của phép toán nhị phân 1010 + 0011 trong hệ thập phân bằng bao nhiêu?
Đáp án: 13
Giải thích: 1010 (nhị phân) = 10, 0011 (nhị phân) = 3; 10 + 3 = 13.`);

  // Live preview state for import
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Analytics filter state
  const [analyticsClassFilter, setAnalyticsClassFilter] = useState('ALL');

  // Pagination & Search state cho Ngân hàng câu hỏi
  const [qPage, setQPage] = useState(1);
  const [qLimit] = useState(10);
  const [qTotal, setQTotal] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qSearch, setQSearch] = useState('');
  const [qSubjectFilter, setQSubjectFilter] = useState('');
  const [qTypeFilter, setQTypeFilter] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPagedQuestions = async (
    page = qPage,
    search = qSearch,
    subj = qSubjectFilter,
    type = qTypeFilter
  ) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(qLimit));
      if (search) params.set('search', search);
      if (subj) params.set('subject_id', subj);
      if (type) params.set('q_type', type);

      const res = await fetch(`/api/cms/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.pagination) {
        setQTotal(data.pagination.total);
        setQPage(data.pagination.page);
        setQTotalPages(data.pagination.total_pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const [authRes, qRes, statsRes] = await Promise.all([
        fetch('/api/auth').then((r) => r.json()),
        fetch('/api/cms/questions?page=1&limit=10').then((r) => r.json()),
        fetch('/api/cms/stats').then((r) => r.json()),
      ]);

      setCurrentUser(authRes.user);
      setQuestions(qRes.questions || []);
      if (qRes.pagination) {
        setQTotal(qRes.pagination.total);
        setQPage(qRes.pagination.page);
        setQTotalPages(qRes.pagination.total_pages);
      }
      setStats(statsRes.stats);
      setAnalytics({
        topWrong: statsRes.top_wrong_questions || [],
        scoreDist: statsRes.score_distribution || [],
        overallDist: statsRes.overall_distribution || null,
        untested: statsRes.untested_students || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchPagedQuestions(qPage, qSearch, qSubjectFilter, qTypeFilter);
    }
  }, [qPage, qSubjectFilter, qTypeFilter, activeTab]);

  // Xử lý tạo câu hỏi mới
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    let payload: any = {};
    if (formQType === 'MCQ') {
      payload = {
        options: [
          { key: 'A', text: mcqA },
          { key: 'B', text: mcqB },
          { key: 'C', text: mcqC },
          { key: 'D', text: mcqD },
        ],
        correct_answer: mcqCorrect,
      };
    } else if (formQType === 'TF') {
      payload = {
        propositions: [
          { id: 'a', statement: tfPropA, is_true: tfValA },
          { id: 'b', statement: tfPropB, is_true: tfValB },
          { id: 'c', statement: tfPropC, is_true: tfValC },
          { id: 'd', statement: tfPropD, is_true: tfValD },
        ],
      };
    } else if (formQType === 'SA') {
      payload = {
        accepted_answers: saAnswers.split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
      };
    }

    try {
      const res = await fetch('/api/cms/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: formSubject,
          grade_id: parseInt(formGrade, 10),
          q_type: formQType,
          difficulty: formDifficulty,
          stem: formStem,
          payload,
          explanation: formExplanation,
          points: formQType === 'TF' ? 1.0 : 0.25,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo câu hỏi');

      setMessage({ text: 'Tạo câu hỏi thành công!', type: 'success' });
      setFormStem('');
      setFormExplanation('');
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Xử lý xem trước (Live Preview) import câu hỏi
  const handlePreviewImport = async () => {
    setMessage(null);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/cms/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: importText,
          subject_id: formSubject,
          grade_id: parseInt(formGrade, 10),
          preview_only: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi phân tích cú pháp');

      setPreviewQuestions(data.questions || []);
      setMessage({
        text: `Đã phân tích thành công ${data.count} câu hỏi! Vui lòng xem trước trước khi lưu.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Xử lý xác nhận lưu sau khi xem trước hoặc lưu trực tiếp
  const handleQuickImport = async () => {
    setMessage(null);
    try {
      const res = await fetch('/api/cms/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: importText,
          subject_id: formSubject,
          grade_id: parseInt(formGrade, 10),
          preview_only: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi import');

      setMessage({ text: data.message, type: 'success' });
      setPreviewQuestions([]);
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Xử lý xóa câu hỏi
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      await fetch(`/api/cms/questions?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
        <p className="text-xs text-slate-500">Đang tải Teacher Studio...</p>
      </div>
    );
  }

  // Filtered score distribution for analytics
  const filteredDist =
    analyticsClassFilter === 'ALL'
      ? analytics.scoreDist
      : analytics.scoreDist.filter((d) => d.class_id === analyticsClassFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Teacher CMS Studio & Quản Lý Khảo Thí</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            cva-ontap • Teacher Studio & Quản Lý Khảo Thí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Trung tâm GDNN - GDTX Chu Văn An • Hệ thống đánh giá năng lực & khảo thí trực tuyến chuẩn
          </p>
        </div>

        {currentUser && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs self-start shadow-sm flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
              {currentUser.full_name?.charAt(0) || 'G'}
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Giáo viên phụ trách:</span>
              <strong className="text-slate-900 font-bold">{currentUser.full_name}</strong>
              <span className="block text-[10px] text-indigo-600 font-semibold">{currentUser.email}</span>
            </div>
          </div>
        )}
      </div>

      {/* Thống kê nhanh */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block">Tổng Câu Hỏi Ngân Hàng</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
              {stats.total_questions}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">MCQ, TF chùm 4 ý, SA</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block">Học Sinh Khối 10 & 11</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {stats.total_students} HS
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              K10: {stats.students_k10} • K11: {stats.students_k11}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block">Tổng Lượt Nộp Bài</span>
            <span className="text-2xl font-extrabold text-purple-600 mt-1 block">
              {stats.total_submissions}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Điểm TB: {stats.avg_score}/10đ
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block">HS Chưa Tham Gia Khảo Thí</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {stats.untested_count ?? 0} HS
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Cần nhắc nhở ôn luyện</span>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Thống Kê & Phân Tích Học Tập</span>
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'import'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Import Nhanh & Xem Trước</span>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo Câu Hỏi Mới</span>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'export'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ngân Hàng Câu Hỏi ({questions.length})</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: THỐNG KÊ & PHÂN TÍCH HỌC TẬP (LEARNING ANALYTICS) */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* PHỔ ĐIỂM THEO LỚP & TOÀN TRƯỜNG */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Biểu Đồ Phổ Điểm Khảo Thí</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Phổ Điểm Khảo Thí & Đánh Giá Chất Lượng
                </h2>
                <p className="text-xs text-slate-500">
                  Phân bố điểm số 4 mức: Giỏi/Xuất sắc (&ge; 8.0) • Khá (6.5 - 7.9) • Trung bình (5.0 - 6.4) • Cần cố gắng (&lt; 5.0)
                </p>
              </div>

              {/* Bộ lọc lớp */}
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-slate-600">Lớp:</span>
                <select
                  value={analyticsClassFilter}
                  onChange={(e) => setAnalyticsClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="ALL">Tất cả các lớp ({analytics.scoreDist.length} lớp)</option>
                  {analytics.scoreDist.map((d) => (
                    <option key={d.class_id} value={d.class_id}>
                      Lớp {d.class_id} (Khối {d.grade_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Bars for classes */}
            <div className="space-y-4">
              {filteredDist.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Chưa có dữ liệu khảo thí cho lớp này.
                </div>
              ) : (
                filteredDist.map((item) => {
                  const total = item.total_tests || 1;
                  const pctGioi = Math.round((item.count_8_to_10 / total) * 100);
                  const pctKha = Math.round((item.count_65_to_8 / total) * 100);
                  const pctTB = Math.round((item.count_5_to_65 / total) * 100);
                  const pctYeu = Math.round((item.count_under_5 / total) * 100);

                  return (
                    <div key={item.class_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Lớp {item.class_id}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            Khối {item.grade_id}
                          </span>
                          <span className="text-slate-400">
                            • {item.total_tests} bài làm
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 font-semibold">
                          <span className="text-emerald-700 font-bold">
                            Điểm TB: {item.avg_score} đ
                          </span>
                          <span className="text-blue-600">
                            Cao nhất: {item.max_score} đ
                          </span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="w-full h-4 bg-slate-200 rounded-full flex overflow-hidden shadow-inner">
                        <div
                          style={{ width: `${pctGioi}%` }}
                          title={`Giỏi (>=8đ): ${item.count_8_to_10} (${pctGioi}%)`}
                          className="bg-emerald-500 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {pctGioi > 8 && `${pctGioi}%`}
                        </div>
                        <div
                          style={{ width: `${pctKha}%` }}
                          title={`Khá (6.5-7.9đ): ${item.count_65_to_8} (${pctKha}%)`}
                          className="bg-blue-500 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {pctKha > 8 && `${pctKha}%`}
                        </div>
                        <div
                          style={{ width: `${pctTB}%` }}
                          title={`Trung bình (5-6.4đ): ${item.count_5_to_65} (${pctTB}%)`}
                          className="bg-amber-500 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {pctTB > 8 && `${pctTB}%`}
                        </div>
                        <div
                          style={{ width: `${pctYeu}%` }}
                          title={`Cần cố gắng (<5đ): ${item.count_under_5} (${pctYeu}%)`}
                          className="bg-rose-500 transition-all flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {pctYeu > 8 && `${pctYeu}%`}
                        </div>
                      </div>

                      {/* Legend details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center space-x-1.5 text-emerald-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Giỏi: <strong>{item.count_8_to_10}</strong> ({pctGioi}%)</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-blue-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                          <span>Khá: <strong>{item.count_65_to_8}</strong> ({pctKha}%)</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-amber-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                          <span>Trung bình: <strong>{item.count_5_to_65}</strong> ({pctTB}%)</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-rose-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                          <span>&lt; 5.0đ: <strong>{item.count_under_5}</strong> ({pctYeu}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TOP NHỮNG CÂU HỎI HỌC SINH SAI NHIỀU NHẤT */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cảnh Báo Lỗ Hổng Kiến Thức</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Top Những Câu Hỏi Học Sinh Sai Nhiều Nhất
              </h2>
              <p className="text-xs text-slate-500">
                Dữ liệu tổng hợp từ bảng <code>User_Question_History</code> giúp giáo viên nắm bắt các đơn vị kiến thức cần bổ trợ trên lớp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.topWrong.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl col-span-2">
                  Chưa ghi nhận câu hỏi có tỷ lệ sai cao.
                </div>
              ) : (
                analytics.topWrong.map((q, idx) => {
                  const wrongRate =
                    q.total_attempts > 0 ? Math.round((q.total_wrongs / q.total_attempts) * 100) : 0;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/40 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {q.q_type}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {q.subject_name || q.subject_id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            {q.difficulty}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-rose-600 block">
                            {q.total_wrongs} lần làm sai
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Tỷ lệ sai: {wrongRate}%
                          </span>
                        </div>
                      </div>

                      {/* Stem */}
                      <div className="text-xs font-semibold text-slate-800 bg-white p-3 rounded-xl border border-rose-100">
                        <MathRenderer content={q.stem} />
                      </div>

                      {/* Sư phạm gợi ý ôn tập */}
                      <div className="p-3 bg-rose-100/60 rounded-xl text-[11px] text-rose-900 border border-rose-200 space-y-1">
                        <strong className="flex items-center space-x-1 font-bold text-rose-950">
                          <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Gợi ý sư phạm khắc phục trên lớp:</span>
                        </strong>
                        <p className="text-rose-800">
                          {q.q_type === 'TF'
                            ? 'Dạng câu hỏi Đúng/Sai chùm ý: Học sinh hay phân vân giữa các mệnh đề phủ định. Cần cho làm bài tập phân tích từng mệnh đề độc lập.'
                            : q.q_type === 'SA'
                            ? 'Dạng câu hỏi Điền số/Trả lời ngắn: Học sinh hay mắc lỗi tính toán bước cuối hoặc quy đổi đơn vị. Cần rèn luyện kỹ năng biến đổi công thức.'
                            : 'Dạng trắc nghiệm 4 lựa chọn: Có nhiều phương án nhiễu tương đồng. Cần hướng dẫn học sinh phương pháp loại trừ và chứng minh trực tiếp.'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DANH SÁCH HỌC SINH CHƯA THAM GIA KHẢO THÍ */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span>Danh Sách Học Sinh Chưa Tham Gia Bài Thi ({stats?.untested_count ?? 0} HS)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các học sinh chưa có bất kỳ bài nộp nào trong hệ thống khảo thí. Giáo viên chủ nhiệm cần nhắc nhở.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Mã HS</th>
                    <th className="py-3 px-3">Họ và Tên</th>
                    <th className="py-3 px-3">Khối</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3">Email Trường (@ttgdtxcva.edu.vn)</th>
                    <th className="py-3 px-3 text-center">Tình Trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.untested.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{s.user_code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{s.full_name}</td>
                      <td className="py-3 px-3 text-slate-600">Khối {s.grade_id}</td>
                      <td className="py-3 px-3 font-semibold text-blue-700">Lớp {s.class_id}</td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{s.email}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chưa nộp bài
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: IMPORT NHANH HÀNG LOẠT VỚI LIVE PREVIEW */}
      {/* ========================================================= */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Quick-Import Parser & Live Preview</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Nhập Câu Hỏi Nhanh Bằng Văn Bản & Xem Trước Trực Quan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ 3 định dạng: <code>[MCQ]</code> (Trắc nghiệm 4 lựa chọn), <code>[TF]</code> (Đúng/Sai chùm ý), <code>[SA]</code> (Trả lời ngắn). Bạn có thể xem trước chính xác câu hỏi trước khi lưu vào ngân hàng.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn Học Gắn Liền</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="tin-hoc-10">Tin học 10</option>
                <option value="toan-10">Toán học 10</option>
                <option value="tin-hoc-11">Tin học 11</option>
                <option value="toan-11">Toán học 11</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối Lớp</label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung văn bản câu hỏi (hỗ trợ công thức KaTeX $...$ và khối mã):
            </label>
            <textarea
              rows={12}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePreviewImport}
              disabled={previewLoading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 border border-slate-300"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{previewLoading ? 'Đang Phân Tích...' : 'Xem Trước Phân Tích (Live Preview)'}</span>
            </button>

            <button
              onClick={handleQuickImport}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Xác Nhận Lưu Vào Ngân Hàng</span>
            </button>
          </div>

          {/* KHUNG XEM TRƯỚC TRỰC QUAN (LIVE PREVIEW) */}
          {previewQuestions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Kết Quả Phân Tích Xem Trước ({previewQuestions.length} câu hỏi)</span>
                </h3>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Cú pháp hợp lệ 100%
                </span>
              </div>

              <div className="space-y-4">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-600 text-white">
                        Câu {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {q.q_type}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {q.points} điểm
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900">
                      <MathRenderer content={q.stem} />
                    </div>

                    {/* Dạng MCQ */}
                    {q.q_type === 'MCQ' && q.payload?.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.payload.options.map((opt: any) => {
                          const isCorrect = opt.key === q.payload.correct_answer;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                  ĐÚNG
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dạng TF */}
                    {q.q_type === 'TF' && q.payload?.propositions && (
                      <div className="space-y-1.5 pt-2">
                        {q.payload.propositions.map((prop: any) => (
                          <div
                            key={prop.id}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-700 uppercase">{prop.id})</span>
                              <span className="text-slate-800">{prop.statement}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                prop.is_true ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {prop.is_true ? 'ĐÚNG' : 'SAI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dạng SA */}
                    {q.q_type === 'SA' && q.payload?.accepted_answers && (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center space-x-2">
                        <span className="font-bold text-slate-700">Đáp án chấp nhận:</span>
                        <div className="flex flex-wrap gap-1">
                          {q.payload.accepted_answers.map((ans: string, aIdx: number) => (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold"
                            >
                              {ans}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                        <strong className="text-slate-700">Giải thích: </strong>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TẠO CÂU HỎI MỚI (MANUAL BUILDER) */}
      {/* ========================================================= */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateQuestion} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Soạn Thảo Câu Hỏi Chuẩn Bộ GD&ĐT</h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn Học</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="tin-hoc-10">Tin học 10</option>
                <option value="toan-10">Toán học 10</option>
                <option value="tin-hoc-11">Tin học 11</option>
                <option value="toan-11">Toán học 11</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối Lớp</label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dạng Câu Hỏi</label>
              <select
                value={formQType}
                onChange={(e) => setFormQType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-blue-700"
              >
                <option value="MCQ">Trắc nghiệm 4 lựa chọn (MCQ)</option>
                <option value="TF">Đúng/Sai chùm 4 ý (TF)</option>
                <option value="SA">Trả lời ngắn (Short Answer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Độ Khó</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="NB">Nhận biết (NB)</option>
                <option value="TH">Thông hiểu (TH)</option>
                <option value="VD">Vận dụng (VD)</option>
                <option value="VDC">Vận dụng cao (VDC)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi (Stem)</label>
            <textarea
              rows={3}
              required
              value={formStem}
              onChange={(e) => setFormStem(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cấu hình Payload theo dạng */}
          {formQType === 'MCQ' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">4 Phương Án Lựa Chọn</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Lựa chọn A..."
                  value={mcqA}
                  onChange={(e) => setMcqA(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Lựa chọn B..."
                  value={mcqB}
                  onChange={(e) => setMcqB(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Lựa chọn C..."
                  value={mcqC}
                  onChange={(e) => setMcqC(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Lựa chọn D..."
                  value={mcqD}
                  onChange={(e) => setMcqD(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs font-bold text-slate-700">Đáp án đúng:</span>
                {['A', 'B', 'C', 'D'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMcqCorrect(k)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      mcqCorrect === k ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formQType === 'TF' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">
                4 Mệnh Đề a), b), c), d) (Chấm điểm lũy tiến 0.1 - 0.25 - 0.5 - 1.0đ)
              </span>
              {[
                { key: 'a', text: tfPropA, setText: setTfPropA, val: tfValA, setVal: setTfValA },
                { key: 'b', text: tfPropB, setText: setTfPropB, val: tfValB, setVal: setTfValB },
                { key: 'c', text: tfPropC, setText: setTfPropC, val: tfValC, setVal: setTfValC },
                { key: 'd', text: tfPropD, setText: setTfPropD, val: tfValD, setVal: setTfValD },
              ].map((item) => (
                <div key={item.key} className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase w-6">{item.key})</span>
                  <input
                    type="text"
                    placeholder={`Nội dung mệnh đề ${item.key}...`}
                    value={item.text}
                    onChange={(e) => item.setText(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      item.val ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.val ? 'ĐÚNG' : 'SAI'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {formQType === 'SA' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Các đáp án được chấp nhận (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                placeholder="ví dụ: 1.5, 3/2, 1,5"
                value={saAnswers}
                onChange={(e) => setSaAnswers(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải chi tiết</label>
            <textarea
              rows={2}
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              placeholder="Giải thích từng bước giúp học sinh hiểu sâu..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Lưu Câu Hỏi Vào Ngân Hàng
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 4: XUẤT BÁO CÁO ĐIỂM RA EXCEL */}
      {/* ========================================================= */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Xuất Báo Cáo Kết Quả Thi Ra File Excel</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tải về bảng điểm chi tiết của học sinh theo Lớp, Khối hoặc Toàn trường dưới định dạng chuẩn <code>.xlsx</code>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Khối</label>
              <select
                id="exportGrade"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="">Tất cả các khối</option>
                <option value="10">Khối 10 (K10)</option>
                <option value="11">Khối 11 (K11)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lọc Theo Lớp</label>
              <input
                id="exportClass"
                type="text"
                placeholder="ví dụ: 10TN, 11A1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
          </div>

          <button
            onClick={() => {
              const g = (document.getElementById('exportGrade') as HTMLSelectElement)?.value;
              const c = (document.getElementById('exportClass') as HTMLInputElement)?.value;
              let url = '/api/cms/export-scores?';
              if (g) url += `grade_id=${g}&`;
              if (c) url += `class_id=${c}&`;
              window.open(url, '_blank');
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Xuống File Báo Cáo Excel (.xlsx)</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: DANH SÁCH CÂU HỎI TRONG NGÂN HÀNG (PAGINATED) */}
      {/* ========================================================= */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ngân Hàng Câu Hỏi Khảo Thí</h2>
              <span className="text-xs text-slate-500 font-semibold">
                Tổng cộng: {qTotal} câu hỏi • Hiển thị {questions.length} câu/trang
              </span>
            </div>

            {/* Pagination Controls Top */}
            <div className="flex items-center space-x-2 self-start sm:self-auto text-xs">
              <button
                disabled={qPage <= 1}
                onClick={() => setQPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Trang trước
              </button>
              <span className="font-bold text-slate-700 px-2">
                Trang {qPage} / {qTotalPages}
              </span>
              <button
                disabled={qPage >= qTotalPages}
                onClick={() => setQPage((p) => Math.min(qTotalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Trang sau
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung câu hỏi..."
                value={qSearch}
                onChange={(e) => {
                  setQSearch(e.target.value);
                  setQPage(1);
                  fetchPagedQuestions(1, e.target.value, qSubjectFilter, qTypeFilter);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <select
              value={qSubjectFilter}
              onChange={(e) => {
                setQSubjectFilter(e.target.value);
                setQPage(1);
              }}
              className="p-2 bg-white border border-slate-200 rounded-xl font-semibold"
            >
              <option value="">Tất cả môn học</option>
              <option value="tin-hoc-10">Tin học 10</option>
              <option value="toan-10">Toán học 10</option>
              <option value="tin-hoc-11">Tin học 11</option>
              <option value="toan-11">Toán học 11</option>
            </select>

            <select
              value={qTypeFilter}
              onChange={(e) => {
                setQTypeFilter(e.target.value);
                setQPage(1);
              }}
              className="p-2 bg-white border border-slate-200 rounded-xl font-semibold"
            >
              <option value="">Tất cả dạng câu hỏi</option>
              <option value="MCQ">Trắc nghiệm 4 lựa chọn (MCQ)</option>
              <option value="TF">Đúng/Sai chùm 4 ý (TF)</option>
              <option value="SA">Trả lời ngắn (SA)</option>
            </select>
          </div>

          {/* Question List */}
          <div className="divide-y divide-slate-100">
            {questions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {q.q_type}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Khối {q.grade_id} • {q.subject_id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      <MathRenderer content={q.stem} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Pagination */}
          {qTotalPages > 1 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">
                Hiển thị trang {qPage} / {qTotalPages} ({qTotal} câu hỏi)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={qPage <= 1}
                  onClick={() => setQPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Trang trước
                </button>
                <button
                  disabled={qPage >= qTotalPages}
                  onClick={() => setQPage((p) => Math.min(qTotalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
