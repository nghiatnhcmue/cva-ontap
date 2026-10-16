export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { gradeSubmission, QuestionData } from '@/lib/scoring';
import { serverCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      set_id,
      mode = 'MOCK_EXAM',
      subject_id = 'tin-hoc-10',
      grade_id = 10,
      duration_sec = 0,
      tab_switch_count = 0,
      answers = {},
      question_ids = [],
    } = body;

    if (!question_ids || question_ids.length === 0) {
      return NextResponse.json({ error: 'Không có câu hỏi nào để nộp' }, { status: 400 });
    }

    const db = getDatabase();

    // Lấy câu hỏi từ database
    const placeholders = question_ids.map(() => '?').join(',');
    const questions = db.prepare(`SELECT * FROM Questions WHERE id IN (${placeholders})`).all(...question_ids) as QuestionData[];

    // Sắp xếp lại danh sách câu hỏi theo đúng thứ tự mảng question_ids
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = question_ids.map((id: string) => questionMap.get(id)).filter(Boolean) as QuestionData[];

    // Thực hiện chấm điểm bằng scoring engine
    const evaluation = gradeSubmission(orderedQuestions, answers);

    const submissionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const userEmail = user ? user.email : 'guest@ttgdtxcva.edu.vn';
    const userName = user ? user.full_name : 'Khách vãng lai';
    const classId = user ? user.class_id : '10TN';
    const studentGrade = user ? parseInt(user.grade_id, 10) : grade_id;

    // Xác định is_first_attempt: Kiểm tra xem user đã từng nộp bài cho bộ đề này chưa
    let isFirstAttempt = 1;
    if (user && set_id) {
      const prior = db.prepare('SELECT id FROM Submissions WHERE user_email = ? AND set_id = ?').get(user.email, set_id);
      if (prior) {
        isFirstAttempt = 0;
      }
    }

    // Lưu vào bảng Submissions kèm tab_switch_count giám sát gian lận
    db.prepare(`
      INSERT INTO Submissions (
        id, set_id, mode, user_email, user_name, class_id, grade_id, subject_id,
        score, max_score, is_first_attempt, duration_sec, tab_switch_count, answers_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId,
      set_id || null,
      mode,
      userEmail,
      userName,
      classId,
      studentGrade,
      subject_id,
      evaluation.totalScore,
      evaluation.maxScore,
      isFirstAttempt,
      duration_sec,
      tab_switch_count,
      JSON.stringify({
        answers,
        results: evaluation.results,
        stats: {
          mcq: evaluation.mcqStats,
          tf: evaluation.tfStats,
          sa: evaluation.saStats,
        },
        tab_switch_count,
      })
    );

    // Cập nhật User_Question_History (trạng thái, wrong_count, last_practiced)
    if (user) {
      const historyStmt = db.prepare(`
        INSERT INTO User_Question_History (user_email, question_id, status, wrong_count, last_practiced, last_answered_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_email, question_id) DO UPDATE SET
          status = excluded.status,
          wrong_count = wrong_count + (CASE WHEN excluded.status = 'WRONG' THEN 1 ELSE 0 END),
          last_practiced = CURRENT_TIMESTAMP,
          last_answered_at = CURRENT_TIMESTAMP
      `);

      for (const res of evaluation.results) {
        const status = res.is_correct ? 'MASTERED' : 'WRONG';
        const initialWrong = status === 'WRONG' ? 1 : 0;
        historyStmt.run(user.email, res.question_id, status, initialWrong);
      }

      // Điểm XP chuyên cần:
      // +50 XP khi hoàn thành bài nộp
      // Thưởng thêm nếu không vi phạm chuyển tab (tab_switch_count == 0): +20 XP trung thực
      const integrityBonus = tab_switch_count === 0 ? 20 : 0;
      const scoreBonus = Math.round((evaluation.percentage / 100) * 100);
      const totalXpToAdd = 50 + scoreBonus + integrityBonus;

      db.prepare('UPDATE Users SET xp_points = xp_points + ? WHERE email = ?').run(totalXpToAdd, user.email);
    }

    // Invalidate leaderboard cache sau khi nộp bài
    serverCache.invalidate('leaderboard');

    return NextResponse.json({
      submission_id: submissionId,
      score: evaluation.totalScore,
      max_score: evaluation.maxScore,
      percentage: evaluation.percentage,
      is_first_attempt: isFirstAttempt === 1,
      duration_sec,
      tab_switch_count,
      stats: {
        mcq: evaluation.mcqStats,
        tf: evaluation.tfStats,
        sa: evaluation.saStats,
      },
      results: evaluation.results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
