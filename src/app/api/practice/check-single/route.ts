export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { gradeSingleQuestion, QuestionData } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { question_id, student_answer } = body;

    if (!question_id) {
      return NextResponse.json({ error: 'Thiếu question_id' }, { status: 400 });
    }

    const db = getDatabase();
    const q = db.prepare('SELECT * FROM Questions WHERE id = ?').get(question_id) as QuestionData | undefined;

    if (!q) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    const result = gradeSingleQuestion(q, student_answer);

    // Cập nhật User_Question_History và XP nếu đã đăng nhập
    if (user) {
      const newStatus = result.is_correct ? 'MASTERED' : 'WRONG';
      db.prepare(`
        INSERT INTO User_Question_History (user_email, question_id, status, last_answered_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_email, question_id) DO UPDATE SET
          status = excluded.status,
          last_answered_at = CURRENT_TIMESTAMP
      `).run(user.email, question_id, newStatus);

      // Thưởng XP: +10 XP nếu đúng, +3 XP nỗ lực nếu sai
      const xpAdd = result.is_correct ? 10 : 3;
      db.prepare('UPDATE Users SET xp_points = xp_points + ? WHERE email = ?').run(xpAdd, user.email);
    }

    return NextResponse.json({
      result,
      explanation: q.explanation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

