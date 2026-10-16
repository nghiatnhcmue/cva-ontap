import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.resolve(dbDir, 'app.db');
  dbInstance = new Database(dbPath);

  // Tinh chỉnh tối ưu hóa SQLite cho 200 - 300 người dùng đồng thời (High Concurrency)
  dbInstance.pragma('journal_mode = WAL'); // Write-Ahead Logging: Nhiều người đọc cùng lúc trong khi 1 người ghi
  dbInstance.pragma('synchronous = NORMAL'); // Giảm Disk I/O waits trong WAL mode mà vẫn đảm bảo an toàn
  dbInstance.pragma('busy_timeout = 5000'); // Tránh lỗi "database is locked" khi nhiều học sinh nộp bài cùng giây
  dbInstance.pragma('cache_size = -64000'); // Cấp phát 64MB bộ nhớ đệm RAM cho SQLite index và pages
  dbInstance.pragma('mmap_size = 268435456'); // 256MB memory-mapped I/O đọc dữ liệu siêu tốc không qua copy buffer
  dbInstance.pragma('temp_store = MEMORY'); // Lưu các bảng tạm thời và kết quả SORT trong RAM
  dbInstance.pragma('foreign_keys = ON');

  initDatabase(dbInstance);

  return dbInstance;
}

function initDatabase(db: Database.Database) {
  // 1. Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      user_code TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'TEACHER', 'STUDENT')),
      grade_id TEXT,
      class_id TEXT,
      assigned_subjects TEXT DEFAULT '[]',
      xp_points INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 1,
      last_active_date TEXT DEFAULT CURRENT_TIMESTAMP,
      badges_json TEXT DEFAULT '[]',
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      avatar_url TEXT,
      phone TEXT,
      dob TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
    CREATE INDEX IF NOT EXISTS idx_users_class ON Users(class_id);
    CREATE INDEX IF NOT EXISTS idx_users_grade ON Users(grade_id);
    CREATE INDEX IF NOT EXISTS idx_users_role_class ON Users(role, class_id);
    CREATE INDEX IF NOT EXISTS idx_users_role_grade ON Users(role, grade_id);
  `);

  // Migration an toàn cho Users nếu thiếu cột
  try { db.exec(`ALTER TABLE Users ADD COLUMN badges_json TEXT DEFAULT '[]'`); } catch {}
  try { db.exec(`ALTER TABLE Users ADD COLUMN last_active_date TEXT DEFAULT CURRENT_TIMESTAMP`); } catch {}

  // 2. Subjects
  db.exec(`
    CREATE TABLE IF NOT EXISTS Subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      icon TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Chapters
  db.exec(`
    CREATE TABLE IF NOT EXISTS Chapters (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(subject_id) REFERENCES Subjects(id) ON DELETE CASCADE
    );
  `);

  // 4. Knowledge_Nodes (Bài học lý thuyết hỗ trợ Markdown, LaTeX, Code, Media)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Knowledge_Nodes (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      content_markdown TEXT NOT NULL,
      media_links_json TEXT DEFAULT '[]',
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chapter_id) REFERENCES Chapters(id) ON DELETE CASCADE
    );
  `);
  try { db.exec(`ALTER TABLE Knowledge_Nodes ADD COLUMN media_links_json TEXT DEFAULT '[]'`); } catch {}

  // 5. Questions (Ngân hàng câu hỏi chuẩn cấu trúc mới)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      chapter_id TEXT,
      lesson_id TEXT,
      q_type TEXT NOT NULL CHECK(q_type IN ('MCQ', 'TF', 'SA')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('NB', 'TH', 'VD', 'VDC')),
      stem TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      explanation TEXT,
      lock_shuffle INTEGER DEFAULT 0,
      points REAL DEFAULT 1.0,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_q_filter ON Questions(subject_id, grade_id, chapter_id, q_type);
    CREATE INDEX IF NOT EXISTS idx_q_lesson ON Questions(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_q_created ON Questions(created_at);
  `);

  // 6. Practice_Sets
  db.exec(`
    CREATE TABLE IF NOT EXISTS Practice_Sets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      duration_minutes INTEGER DEFAULT 45,
      is_exam INTEGER DEFAULT 0,
      is_ranked_exam INTEGER DEFAULT 1,
      max_attempts INTEGER DEFAULT 3,
      anti_cheat_enabled INTEGER DEFAULT 1,
      matrix_rules_json TEXT,
      question_ids_json TEXT NOT NULL,
      target_classes TEXT DEFAULT 'ALL',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try { db.exec(`ALTER TABLE Practice_Sets ADD COLUMN is_ranked_exam INTEGER DEFAULT 1`); } catch {}
  try { db.exec(`ALTER TABLE Practice_Sets ADD COLUMN max_attempts INTEGER DEFAULT 3`); } catch {}
  try { db.exec(`ALTER TABLE Practice_Sets ADD COLUMN anti_cheat_enabled INTEGER DEFAULT 1`); } catch {}
  try { db.exec(`ALTER TABLE Practice_Sets ADD COLUMN matrix_rules_json TEXT`); } catch {}

  // 7. Exam_Blueprints (Ma trận đề)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Exam_Blueprints (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      config_json TEXT NOT NULL,
      matrix_rules_json TEXT,
      duration_minutes INTEGER DEFAULT 45,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try { db.exec(`ALTER TABLE Exam_Blueprints ADD COLUMN matrix_rules_json TEXT`); } catch {}

  // 8. Submissions (Lịch sử nộp bài có giám sát chuyển tab anti-cheat)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Submissions (
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
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      answers_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sub_leaderboard ON Submissions(grade_id, class_id, score, duration_sec);
    CREATE INDEX IF NOT EXISTS idx_sub_user ON Submissions(user_email);
    CREATE INDEX IF NOT EXISTS idx_sub_set ON Submissions(set_id);
    CREATE INDEX IF NOT EXISTS idx_sub_class ON Submissions(class_id);
    CREATE INDEX IF NOT EXISTS idx_sub_grade ON Submissions(grade_id);
    CREATE INDEX IF NOT EXISTS idx_sub_user_set ON Submissions(user_email, set_id);
  `);
  try { db.exec(`ALTER TABLE Submissions ADD COLUMN tab_switch_count INTEGER DEFAULT 0`); } catch {}

  // 9. User_Question_History (Trạng thái và số lần làm sai)
  db.exec(`
    CREATE TABLE IF NOT EXISTS User_Question_History (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      question_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('MASTERED', 'WRONG', 'ATTEMPTED')),
      wrong_count INTEGER DEFAULT 0,
      is_bookmarked INTEGER DEFAULT 0,
      last_answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_practiced TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_email, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_uqh_user ON User_Question_History(user_email, status);
  `);
  try { db.exec(`ALTER TABLE User_Question_History ADD COLUMN wrong_count INTEGER DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE User_Question_History ADD COLUMN last_practiced TEXT`); } catch {}
}

export default getDatabase;
