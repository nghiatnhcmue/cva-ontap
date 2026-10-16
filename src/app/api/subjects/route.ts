export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serverCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const gradeQuery = searchParams.get('grade');

    let gradeFilter = gradeQuery;
    if (!gradeFilter && user && user.role === 'STUDENT') {
      gradeFilter = user.grade_id;
    }

    // Dùng in-memory cache cho cấu trúc tĩnh của môn học (TTL 120s)
    const cacheKey = `static_subjects_base_${gradeFilter || 'all'}`;
    const baseSubjects = await serverCache.getOrSet(cacheKey, 120, () => {
      let subs: any[];
      if (gradeFilter) {
        subs = db.prepare('SELECT * FROM Subjects WHERE grade_id = ? ORDER BY id ASC').all(parseInt(gradeFilter, 10));
      } else {
        subs = db.prepare('SELECT * FROM Subjects ORDER BY grade_id ASC, id ASC').all();
      }

      return subs.map((sub) => {
        const chapterCount = (db.prepare('SELECT COUNT(*) as count FROM Chapters WHERE subject_id = ?').get(sub.id) as any)?.count || 0;
        const lessonCount = (db.prepare('SELECT COUNT(*) as count FROM Knowledge_Nodes WHERE subject_id = ?').get(sub.id) as any)?.count || 0;
        const questionCount = (db.prepare('SELECT COUNT(*) as count FROM Questions WHERE subject_id = ?').get(sub.id) as any)?.count || 0;

        return {
          ...sub,
          chapter_count: chapterCount,
          lesson_count: lessonCount,
          question_count: questionCount,
        };
      });
    });

    // Nếu có user, gắn thêm thông tin mastery của học sinh
    const result = baseSubjects.map((sub: any) => {
      let masteredCount = 0;
      if (user) {
        const mastered = db.prepare(`
          SELECT COUNT(DISTINCT uqh.question_id) as count 
          FROM User_Question_History uqh
          JOIN Questions q ON uqh.question_id = q.id
          WHERE uqh.user_email = ? AND q.subject_id = ? AND uqh.status = 'MASTERED'
        `).get(user.email, sub.id) as any;
        masteredCount = mastered ? mastered.count : 0;
      }

      const totalQ = sub.question_count || 0;
      const masteryPct = totalQ > 0 ? Math.round((masteredCount / totalQ) * 100) : 0;

      return {
        ...sub,
        mastered_count: masteredCount,
        mastery_percentage: masteryPct,
      };
    });

    return NextResponse.json({ subjects: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

