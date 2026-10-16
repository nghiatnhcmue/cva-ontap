export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serverCache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id;
    const db = getDatabase();
    const user = await getCurrentUser();

    // Cache cấu trúc tĩnh của cây kiến thức môn học trong 120s
    const cacheKey = `static_subject_tree_${subjectId}`;
    const baseTree = await serverCache.getOrSet(cacheKey, 120, () => {
      const subject = db.prepare('SELECT * FROM Subjects WHERE id = ?').get(subjectId) as any;
      if (!subject) return null;

      const chapters = db.prepare('SELECT * FROM Chapters WHERE subject_id = ? ORDER BY order_num ASC, id ASC').all(subjectId) as any[];

      const chaptersWithLessons = chapters.map((ch) => {
        const lessons = db.prepare('SELECT id, title, summary, order_num FROM Knowledge_Nodes WHERE chapter_id = ? ORDER BY order_num ASC').all(ch.id) as any[];
        const questionCount = (db.prepare('SELECT COUNT(*) as count FROM Questions WHERE chapter_id = ?').get(ch.id) as any)?.count || 0;

        return {
          ...ch,
          lessons,
          total_questions: questionCount,
        };
      });

      const practiceSets = db.prepare('SELECT id, title, duration_minutes, is_exam, target_classes FROM Practice_Sets WHERE subject_id = ? ORDER BY created_at DESC').all(subjectId) as any[];

      return {
        subject,
        chapters: chaptersWithLessons,
        practice_sets: practiceSets,
      };
    });

    if (!baseTree) {
      return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 });
    }

    // Gắn thêm tiến độ học sinh nếu đã đăng nhập
    const chaptersWithUserMastery = baseTree.chapters.map((ch: any) => {
      let masteredInChapter = 0;
      if (user) {
        const mastered = db.prepare(`
          SELECT COUNT(DISTINCT uqh.question_id) as count 
          FROM User_Question_History uqh
          JOIN Questions q ON uqh.question_id = q.id
          WHERE uqh.user_email = ? AND q.chapter_id = ? AND uqh.status = 'MASTERED'
        `).get(user.email, ch.id) as any;
        masteredInChapter = mastered ? mastered.count : 0;
      }

      return {
        ...ch,
        mastered_questions: masteredInChapter,
      };
    });

    return NextResponse.json({
      subject: baseTree.subject,
      chapters: chaptersWithUserMastery,
      practice_sets: baseTree.practice_sets,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

