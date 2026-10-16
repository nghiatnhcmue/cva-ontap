'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Upload,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function AdminPortalPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 50, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(page));
      if (search) q.set('search', search);
      if (selectedRole) q.set('role', selectedRole);
      if (selectedGrade) q.set('grade', selectedGrade);
      if (selectedClass) q.set('class_id', selectedClass);

      const res = await fetch(`/api/cms/users?${q.toString()}`);
      const data = await res.json();
      setUsersList(data.users || []);
      setClassesList(data.classes || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user));
    fetchUsers(1);
  }, [selectedRole, selectedGrade, selectedClass]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleUploadUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/cms/upload-users', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi upload file');

      setUploadStatus({ text: data.message, type: 'success' });
      setUploadFile(null);
      fetchUsers(1);
    } catch (err: any) {
      setUploadStatus({ text: err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>cva-ontap • Quản Trị Hệ Thống Toàn Trường</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Quản Lý Người Dùng & Đồng Bộ Phân Quyền (UPSERT)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý toàn bộ 762 học sinh Khối 10, Khối 11 và Giáo viên trường GDNN-GDTX Chu Văn An trên nền tảng cva-ontap
        </p>
      </div>

      {/* Widget Upload Excel/CSV Phân Quyền Mới */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Công cụ Đồng Bộ Hóa Tự Động (UPSERT)</span>
          </div>
          <h2 className="text-xl font-bold">Cập Nhật / Bổ Sung Danh Sách Từ File Excel/CSV</h2>
          <p className="text-xs text-purple-200 mt-1 leading-relaxed">
            Hệ thống tự động phát hiện cấu trúc cột, cập nhật thông tin lớp học và phân quyền mới cho học sinh nhưng <strong>giữ nguyên 100% lịch sử làm bài, điểm thi và điểm chuyên cần XP</strong>.
          </p>

          <form onSubmit={handleUploadUsers} className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-purple-900 hover:file:bg-purple-50 text-xs text-purple-200"
            />
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold shadow-md transition-all disabled:opacity-40 flex items-center space-x-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Đang đồng bộ...' : 'Bắt Đầu Đồng Bộ'}</span>
            </button>
          </form>

          {uploadStatus && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-red-500/20 text-red-200 border border-red-400/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploadStatus.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm Người Dùng */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, email hoặc mã học sinh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
            >
              <option value="">Tất cả vai trò</option>
              <option value="STUDENT">Học sinh (STUDENT)</option>
              <option value="TEACHER">Giáo viên (TEACHER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
            >
              <option value="">Tất cả các khối</option>
              <option value="10">Khối 10 (K10)</option>
              <option value="11">Khối 11 (K11)</option>
            </select>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Tìm thấy <strong>{pagination.total}</strong> người dùng trong hệ thống
          </span>
          <span className="font-semibold text-slate-700">
            Trang {pagination.page} / {pagination.total_pages || 1}
          </span>
        </div>

        {/* Bảng danh sách người dùng */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Họ và Tên</th>
                <th className="py-3 px-3">Tài Khoản / Email</th>
                <th className="py-3 px-3">Vai Trò</th>
                <th className="py-3 px-3">Lớp Học</th>
                <th className="py-3 px-3">Khối</th>
                <th className="py-3 px-3 text-right">Điểm XP</th>
                <th className="py-3 px-3 text-right">Chuỗi Học</th>
                <th className="py-3 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {usersList.map((u) => {
                let roleBadge = 'bg-slate-100 text-slate-700';
                if (u.role === 'ADMIN') roleBadge = 'bg-purple-100 text-purple-800 font-extrabold';
                else if (u.role === 'TEACHER') roleBadge = 'bg-indigo-100 text-indigo-800 font-bold';
                else if (u.role === 'STUDENT') roleBadge = 'bg-blue-50 text-blue-700 font-semibold';

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${roleBadge}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{u.class_id || '—'}</td>
                    <td className="py-3 px-3 text-slate-500">Khối {u.grade_id || '—'}</td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600">{u.xp_points || 0} XP</td>
                    <td className="py-3 px-3 text-right font-semibold text-orange-600">{u.streak_days || 1} ngày</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
            <button
              onClick={() => fetchUsers(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 font-bold"
            >
              Trang Trước
            </button>
            <span className="font-semibold text-slate-600">
              {pagination.page} / {pagination.total_pages}
            </span>
            <button
              onClick={() => fetchUsers(Math.min(pagination.total_pages, pagination.page + 1))}
              disabled={pagination.page >= pagination.total_pages}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 font-bold"
            >
              Trang Kế Tiếp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

