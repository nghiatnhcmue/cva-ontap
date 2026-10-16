export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Cần đăng nhập để đánh dấu câu hỏi' }, { status: 401 });
    }

    const body = await request.json();
    const { question_id, is_bookmarked } = body;

    if (!question_id) {
      return NextResponse.json({ error: 'Thiếu question_id' }, { status: 400 });
    }

    const db = getDatabase();
    const newFlag = is_bookmarked ? 1 : 0;

    db.prepare(`
      INSERT INTO User_Question_History (user_email, question_id, status, is_bookmarked, last_answered_at)
      VALUES (?, ?, 'ATTEMPTED', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_email, question_id) DO UPDATE SET
        is_bookmarked = excluded.is_bookmarked
    `).run(user.email, question_id, newFlag);

    return NextResponse.json({ success: true, is_bookmarked: newFlag === 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

