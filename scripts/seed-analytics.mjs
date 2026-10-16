import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');
const db = new Database(dbPath);

console.log('--- SEEDING ENHANCED LEARNING ANALYTICS DATA ---');

// Lấy danh sách học sinh từ các lớp khác nhau (10TN, 10A1, 10A2, 11A1, 11A2)
const students = db.prepare(`
  SELECT id, email, full_name, class_id, grade_id 
  FROM Users 
  WHERE role = 'STUDENT' AND class_id IN ('10TN', '10A1', '10A2', '11A1', '11A2')
  LIMIT 40
`).all();

const questions = db.prepare(`SELECT id, subject_id, grade_id, stem FROM Questions LIMIT 15`).all();

const insertSub = db.prepare(`
  INSERT OR IGNORE INTO Submissions (
    id, set_id, mode, user_email, user_name, class_id, grade_id, subject_id,
    score, max_score, is_first_attempt, duration_sec, tab_switch_count, submitted_at, answers_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertHistory = db.prepare(`
  INSERT INTO User_Question_History (user_email, question_id, status, wrong_count, last_practiced, last_answered_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(user_email, question_id) DO UPDATE SET
    status = excluded.status,
    wrong_count = wrong_count + excluded.wrong_count,
    last_practiced = CURRENT_TIMESTAMP
`);

const sampleScores = [9.5, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 8.25, 7.75, 6.75];

const runTx = db.transaction(() => {
  let subIdx = 100;
  for (const s of students) {
    subIdx++;
    const score = sampleScores[subIdx % sampleScores.length];
    const duration = 1200 + (subIdx * 37) % 800;
    const tabSwitch = subIdx % 7 === 0 ? 1 : 0;
    const subId = `sub_seed_${subIdx}`;
    const subj = s.grade_id === 10 ? 'tin-hoc-10' : 'tin-hoc-11';

    insertSub.run(
      subId,
      'set_sample',
      'MOCK_EXAM',
      s.email,
      s.full_name,
      s.class_id,
      s.grade_id,
      subj,
      score,
      10.0,
      1,
      duration,
      tabSwitch,
      new Date(Date.now() - subIdx * 3600000).toISOString().replace('T', ' ').substring(0, 19),
      '{}'
    );

    // Seed câu hỏi đúng/sai
    for (const q of questions) {
      const isWrong = (subIdx + q.id.charCodeAt(q.id.length - 1)) % 3 === 0;
      insertHistory.run(
        s.email,
        q.id,
        isWrong ? 'WRONG' : 'MASTERED',
        isWrong ? 1 : 0
      );
    }
  }
});

runTx();
console.log('Seeded learning analytics submissions and question history successfully!');

