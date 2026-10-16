export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền truy cập CMS' }, { status: 403 });
    }

    const db = getDatabase();

    const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'STUDENT'").get() as any).count;
    const studentsK10 = (db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'STUDENT' AND grade_id = '10'").get() as any).count;
    const studentsK11 = (db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'STUDENT' AND grade_id = '11'").get() as any).count;
    const totalTeachers = (db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'TEACHER'").get() as any).count;

    const totalQuestions = (db.prepare("SELECT COUNT(*) as count FROM Questions").get() as any).count;
    const questionsByType = db.prepare("SELECT q_type, COUNT(*) as count FROM Questions GROUP BY q_type").all() as any[];

    const totalSubmissions = (db.prepare("SELECT COUNT(*) as count FROM Submissions").get() as any).count;
    const avgScoreRow = db.prepare("SELECT AVG(score) as avg, MAX(score) as max FROM Submissions").get() as any;

    const recentSubmissions = db.prepare(`
      SELECT s.id, s.user_name, s.user_email, s.class_id, s.score, s.max_score, s.duration_sec, s.submitted_at, s.subject_id
      FROM Submissions s
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `).all();

    // Phân hệ 7: Top câu hỏi sai nhiều nhất (Learning Analytics)
    const topWrongQuestions = db.prepare(`
      SELECT 
        q.id,
        q.stem,
        q.q_type,
        q.difficulty,
        q.subject_id,
        s.name as subject_name,
        COALESCE(SUM(uqh.wrong_count), 0) as total_wrongs,
        COUNT(uqh.id) as total_attempts
      FROM Questions q
      LEFT JOIN Subjects s ON q.subject_id = s.id
      LEFT JOIN User_Question_History uqh ON q.id = uqh.question_id
      GROUP BY q.id
      ORDER BY total_wrongs DESC, total_attempts DESC
      LIMIT 6
    `).all();

    // Phổ điểm theo lớp (Score distribution)
    const scoreDistribution = db.prepare(`
      SELECT 
        class_id,
        grade_id,
        COUNT(*) as total_tests,
        ROUND(AVG(score), 2) as avg_score,
        MAX(score) as max_score,
        SUM(CASE WHEN score < 5.0 THEN 1 ELSE 0 END) as count_under_5,
        SUM(CASE WHEN score >= 5.0 AND score < 6.5 THEN 1 ELSE 0 END) as count_5_to_65,
        SUM(CASE WHEN score >= 6.5 AND score < 8.0 THEN 1 ELSE 0 END) as count_65_to_8,
        SUM(CASE WHEN score >= 8.0 THEN 1 ELSE 0 END) as count_8_to_10
      FROM Submissions
      WHERE class_id IS NOT NULL AND class_id != ''
      GROUP BY class_id
      ORDER BY grade_id ASC, class_id ASC
    `).all();

    // Phổ điểm toàn trường
    const overallDistribution = db.prepare(`
      SELECT 
        COUNT(*) as total_tests,
        ROUND(AVG(score), 2) as avg_score,
        SUM(CASE WHEN score < 5.0 THEN 1 ELSE 0 END) as count_under_5,
        SUM(CASE WHEN score >= 5.0 AND score < 6.5 THEN 1 ELSE 0 END) as count_5_to_65,
        SUM(CASE WHEN score >= 6.5 AND score < 8.0 THEN 1 ELSE 0 END) as count_65_to_8,
        SUM(CASE WHEN score >= 8.0 THEN 1 ELSE 0 END) as count_8_to_10
      FROM Submissions
    `).get();

    // Danh sách học sinh chưa làm bài nào (cần đôn đốc nhắc nhở)
    const untestedStudents = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.user_code, u.class_id, u.grade_id
      FROM Users u
      WHERE u.role = 'STUDENT'
        AND u.email NOT IN (SELECT DISTINCT user_email FROM Submissions)
      ORDER BY u.grade_id ASC, u.class_id ASC, u.full_name ASC
      LIMIT 30
    `).all();

    const totalUntestedCount = (db.prepare(`
      SELECT COUNT(*) as count
      FROM Users u
      WHERE u.role = 'STUDENT'
        AND u.email NOT IN (SELECT DISTINCT user_email FROM Submissions)
    `).get() as any).count;

    return NextResponse.json({
      stats: {
        total_students: totalStudents,
        students_k10: studentsK10,
        students_k11: studentsK11,
        total_teachers: totalTeachers,
        total_questions: totalQuestions,
        questions_by_type: questionsByType,
        total_submissions: totalSubmissions,
        avg_score: avgScoreRow.avg ? Math.round(avgScoreRow.avg * 100) / 100 : 0,
        max_score: avgScoreRow.max || 0,
        untested_count: totalUntestedCount,
      },
      top_wrong_questions: topWrongQuestions,
      score_distribution: scoreDistribution,
      overall_distribution: overallDistribution,
      untested_students: untestedStudents,
      recent_submissions: recentSubmissions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


