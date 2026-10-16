'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Award,
  Zap,
  Flame,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  Layers,
  Sparkles,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import QuickLoginModal from './QuickLoginModal';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setCurrentUser(data.user || null);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setCurrentUser(null);
      setDropdownOpen(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navLinks = [
    { href: '/', label: 'Tổng Quan', shortLabel: 'Tổng quan', icon: Layers },
    { href: '/subjects', label: 'Cây Kiến Thức', shortLabel: 'Kiến thức', icon: BookOpen },
    { href: '/practice', label: 'Phòng Luyện Thi', shortLabel: 'Luyện thi', icon: Zap },
    { href: '/leaderboard', label: 'Bảng Vinh Danh', shortLabel: 'Vinh danh', icon: Award },
  ];

  if (currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN') {
    navLinks.push({ href: '/teacher', label: 'Teacher Studio', shortLabel: 'Giáo viên', icon: Settings });
  }

  if (currentUser?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin Portal', shortLabel: 'Quản trị', icon: Shield });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
            
            {/* Logo Section */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                      cva-ontap
                    </span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200/60 uppercase tracking-wider whitespace-nowrap hidden sm:inline-block">
                      Chu Văn An
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap hidden sm:block leading-none mt-0.5">
                    Ôn tập & Khảo thí
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="hidden xl:inline whitespace-nowrap">{link.label}</span>
                    <span className="xl:hidden inline whitespace-nowrap">{link.shortLabel}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right User Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {currentUser ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  
                  {/* Streak & XP Badges */}
                  <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800 shrink-0 shadow-xs">
                    <span className="flex items-center text-amber-600 whitespace-nowrap" title="Chuỗi ngày chuyên cần">
                      <Flame className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500 shrink-0" />
                      {currentUser.streak_days || 1} ngày
                    </span>
                    <span className="text-amber-300">|</span>
                    <span className="flex items-center text-indigo-700 whitespace-nowrap" title="Điểm kinh nghiệm XP">
                      <Award className="w-3.5 h-3.5 mr-1 text-indigo-600 shrink-0" />
                      {currentUser.xp_points || 0} XP
                    </span>
                  </div>

                  {/* User Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {currentUser.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="text-left hidden lg:block max-w-[130px] xl:max-w-[160px]">
                        <div className="text-xs font-bold text-slate-800 leading-tight truncate whitespace-nowrap" title={currentUser.full_name}>
                          {currentUser.full_name}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 truncate whitespace-nowrap">
                          {currentUser.role === 'ADMIN'
                            ? 'Admin Quản Trị'
                            : currentUser.role === 'TEACHER'
                            ? 'Giáo Viên'
                            : `Lớp ${currentUser.class_id || '10TN'}`}
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                          <p className="text-[11px] text-slate-500 font-medium">Đang đăng nhập:</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-100 text-blue-800">
                              {currentUser.role}
                            </span>
                            {currentUser.class_id && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-700">
                                Lớp {currentUser.class_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setShowLoginModal(true);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center space-x-2 font-semibold transition-colors"
                          >
                            <UserIcon className="w-4 h-4 shrink-0" />
                            <span>Chuyển tài khoản khác</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-semibold transition-colors"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all whitespace-nowrap"
                >
                  <UserIcon className="w-4 h-4 mr-1.5 shrink-0" />
                  Đăng Nhập
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
            {currentUser && (
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.full_name}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-700">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{currentUser.streak_days || 1} ngày</span>
                </div>
              </div>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Quick Login Modal */}
      {showLoginModal && (
        <QuickLoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowLoginModal(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
