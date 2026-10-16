-- ==============================================================================
-- SCHEMA POSTGRESQL / SUPABASE CHO HỆ THỐNG KHẢO THÍ TRỰC TUYẾN CHU VĂN AN
-- Tên miền trường khóa cứng: @ttgdtxcva.edu.vn
-- ==============================================================================

-- 1. BẢNG USERS (Học sinh, Giáo viên, Quản trị viên)
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_code TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'TEACHER', 'STUDENT')),
  grade_id TEXT,
  class_id TEXT,
  assigned_subjects JSONB DEFAULT '[]'::jsonb,
  xp_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  last_active_date TIMESTAMPTZ DEFAULT NOW(),
  badges_json JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
  avatar_url TEXT,
  phone TEXT,
  dob TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Khóa cứng bảo mật: Chỉ cho phép email trường @ttgdtxcva.edu.vn
ALTER TABLE public.users ADD CONSTRAINT check_school_domain CHECK (email LIKE '%@ttgdtxcva.edu.vn');

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);
CREATE INDEX IF NOT EXISTS idx_users_grade ON public.users(grade_id);

-- 2. BẢNG SUBJECTS (Môn học)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT
);

-- 3. BẢNG CHAPTERS (Chương học)
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  summary TEXT
);

-- 4. BẢNG KNOWLEDGE_NODES (Bài học & Lý thuyết)
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  media_links_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG QUESTIONS (Ngân hàng câu hỏi 3 dạng chuẩn)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade_id INTEGER NOT NULL,
  chapter_id TEXT REFERENCES public.chapters(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES public.knowledge_nodes(id) ON DELETE SET NULL,
  q_type TEXT NOT NULL CHECK(q_type IN ('MCQ', 'TF', 'SA')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('NB', 'TH', 'VD', 'VDC')),
  stem TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  explanation TEXT,
  lock_shuffle INTEGER DEFAULT 0,
  points REAL DEFAULT 1.0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_q_filter ON public.questions(subject_id, grade_id, q_type);

-- 6. BẢNG PRACTICE_SETS (Bộ đề kiểm tra cố định)
CREATE TABLE IF NOT EXISTS public.practice_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade_id INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  is_exam INTEGER DEFAULT 0,
  is_ranked_exam INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  anti_cheat_enabled INTEGER DEFAULT 1,
  matrix_rules_json JSONB,
  question_ids_json JSONB NOT NULL,
  target_classes TEXT DEFAULT 'ALL',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG SUBMISSIONS (Lịch sử nộp bài có giám sát chuyển tab Anti-Cheat)
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  set_id TEXT,
  mode TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  grade_id INTEGER NOT NULL,
  subject_id TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  is_first_attempt INTEGER DEFAULT 1,
  duration_sec INTEGER NOT NULL,
  tab_switch_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  answers_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_leaderboard ON public.submissions(grade_id, class_id, score, duration_sec);
CREATE INDEX IF NOT EXISTS idx_sub_user ON public.submissions(user_email);

-- 8. BẢNG USER_QUESTION_HISTORY (Trạng thái và số lần làm sai)
CREATE TABLE IF NOT EXISTS public.user_question_history (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('MASTERED', 'WRONG', 'ATTEMPTED')),
  wrong_count INTEGER DEFAULT 0,
  is_bookmarked INTEGER DEFAULT 0,
  last_answered_at TIMESTAMPTZ DEFAULT NOW(),
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, question_id)
);

CREATE INDEX IF NOT EXISTS idx_uqh_user ON public.user_question_history(user_email, status);

