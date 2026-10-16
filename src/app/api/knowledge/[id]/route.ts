export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const db = getDatabase();
    const user = await getCurrentUser();

    const lesson = db.prepare(`
      SELECT kn.*, c.title as chapter_title, s.name as subject_name
      FROM Knowledge_Nodes kn
      JOIN Chapters c ON kn.chapter_id = c.id
      JOIN Subjects s ON kn.subject_id = s.id
      WHERE kn.id = ?
    `).get(lessonId) as any;

    if (!lesson) {
      return NextResponse.json({ error: 'Không tìm thấy bài học lý thuyết' }, { status: 404 });
    }

    // Lấy các câu hỏi thuộc bài học này
    const questions = db.prepare(`
      SELECT id, subject_id, grade_id, chapter_id, lesson_id, q_type, difficulty, stem, payload_json, explanation, lock_shuffle, points
      FROM Questions
      WHERE lesson_id = ?
      ORDER BY id ASC
    `).all(lessonId) as any[];

    // Lấy trạng thái đã làm của user nếu có
    let userHistory: Record<string, any> = {};
    if (user && questions.length > 0) {
      const qIds = questions.map((q) => `'${q.id}'`).join(',');
      const rows = db.prepare(`SELECT question_id, status, is_bookmarked FROM User_Question_History WHERE user_email = ? AND question_id IN (${qIds})`).all(user.email) as any[];
      for (const r of rows) {
        userHistory[r.question_id] = r;
      }
    }

    return NextResponse.json({
      lesson,
      questions,
      user_history: userHistory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

