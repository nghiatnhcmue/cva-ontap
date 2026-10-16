export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateThreeTierShuffledExam } from '@/lib/shuffle';
import { QuestionData } from '@/lib/scoring';
import { serverCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'FLASH_QUIZ';
    const subjectId = searchParams.get('subject_id');
    const chapterId = searchParams.get('chapter_id');
    const lessonId = searchParams.get('lesson_id');
    const setId = searchParams.get('set_id');
    const qTypeFilter = searchParams.get('q_type'); // 'MCQ', 'TF', 'SA'
    const statusFilter = searchParams.get('filter'); // 'ALL', 'WRONG', 'BOOKMARKED'

    let questions: QuestionData[] = [];
    let title = 'Luyện tập';
    let durationMinutes = 45;

    // Lấy lịch sử làm bài của học sinh để ưu tiên hoặc lọc
    let userHistory: Record<string, 'MASTERED' | 'WRONG' | 'ATTEMPTED'> = {};
    let bookmarkedSet = new Set<string>();

    if (user) {
      const historyRows = db.prepare('SELECT question_id, status, is_bookmarked FROM User_Question_History WHERE user_email = ?').all(user.email) as any[];
      for (const r of historyRows) {
        userHistory[r.question_id] = r.status;
        if (r.is_bookmarked) {
          bookmarkedSet.add(r.question_id);
        }
      }
    }

    let examCode: string | undefined = undefined;
    let examStructure: any = undefined;

    if (mode === 'ASSIGNED_SET' && setId) {
      // Đề kiểm tra cố định
      const pSet = db.prepare('SELECT * FROM Practice_Sets WHERE id = ?').get(setId) as any;
      if (!pSet) {
        return NextResponse.json({ error: 'Không tìm thấy bộ đề' }, { status: 404 });
      }
      title = pSet.title;
      durationMinutes = pSet.duration_minutes || 45;

      const qIds = JSON.parse(pSet.question_ids_json || '[]') as string[];
      if (qIds.length > 0) {
        const placeholders = qIds.map(() => '?').join(',');
        const rawQuestions = db.prepare(`SELECT * FROM Questions WHERE id IN (${placeholders})`).all(...qIds) as QuestionData[];
        questions = generateThreeTierShuffledExam(rawQuestions, { userQuestionHistory: userHistory });
      }
    } else if (mode === 'LESSON' && lessonId) {
      // Ôn theo Bài học
      const lesson = db.prepare('SELECT title FROM Knowledge_Nodes WHERE id = ?').get(lessonId) as any;
      title = lesson ? `Ôn tập: ${lesson.title}` : 'Ôn tập theo bài học';
      questions = db.prepare('SELECT * FROM Questions WHERE lesson_id = ? ORDER BY id ASC').all(lessonId) as QuestionData[];
    } else if (mode === 'CHAPTER' && chapterId) {
      // Ôn theo Chương
      const chapter = db.prepare('SELECT title FROM Chapters WHERE id = ?').get(chapterId) as any;
      title = chapter ? `Ôn tập: ${chapter.title}` : 'Ôn tập theo chương';
      questions = db.prepare('SELECT * FROM Questions WHERE chapter_id = ? ORDER BY q_type ASC, id ASC').all(chapterId) as QuestionData[];
    } else if (mode === 'MARATHON' && subjectId) {
      // Ôn Toàn Bộ môn học (Marathon)
      const sub = db.prepare('SELECT name FROM Subjects WHERE id = ?').get(subjectId) as any;
      title = sub ? `Marathon Chinh Phục: ${sub.name}` : 'Chinh phục toàn bộ câu hỏi';
      questions = db.prepare('SELECT * FROM Questions WHERE subject_id = ? ORDER BY q_type ASC, id ASC').all(subjectId) as QuestionData[];
    } else if (mode === 'MOCK_EXAM') {
      // Tự sinh Đề Thi Ngẫu Nhiên với cấu trúc Ma Trận THPTQG chuẩn Bộ GD&ĐT
      let query = 'SELECT * FROM Questions WHERE 1=1';
      const params: any[] = [];

      if (subjectId) {
        query += ' AND subject_id = ?';
        params.push(subjectId);
      }
      if (user && user.grade_id) {
        query += ' AND grade_id = ?';
        params.push(parseInt(user.grade_id, 10));
      }

      // Cache ngân hàng câu hỏi gốc trong 180s để 200 - 300 học sinh bấm Bắt đầu thi không đọc disk dồn dập
      const poolKey = `q_pool_${subjectId || 'all'}_${user?.grade_id || 'all'}`;
      const allAvailable = await serverCache.getOrSet(poolKey, 180, () => {
        return db.prepare(query).all(...params) as QuestionData[];
      });

      const requestedCode = searchParams.get('exam_code') || String(100 + Math.floor(Math.random() * 900));
      const examResult = generateTHPTQGShuffledExam(allAvailable, {
        examCode: requestedCode,
        structureKey: 'TIN_HOC',
        userQuestionHistory: userHistory,
      });

      examCode = examResult.examCode;
      examStructure = examResult.structure;
      title = `Đề Thi Khảo Thí THPTQG - Mã Đề ${examResult.examCode}`;
      durationMinutes = examResult.durationMinutes;
      questions = examResult.questions;
    } else {
      // Chế độ FLASH_QUIZ: Ôn theo Câu
      let query = 'SELECT * FROM Questions WHERE 1=1';
      const params: any[] = [];

      if (subjectId) {
        query += ' AND subject_id = ?';
        params.push(subjectId);
      }
      if (chapterId) {
        query += ' AND chapter_id = ?';
        params.push(chapterId);
      }
      if (qTypeFilter && ['MCQ', 'TF', 'SA'].includes(qTypeFilter)) {
        query += ' AND q_type = ?';
        params.push(qTypeFilter);
      }
      if (user && user.grade_id && !subjectId) {
        query += ' AND grade_id = ?';
        params.push(parseInt(user.grade_id, 10));
      }

      const rawQuestions = db.prepare(query).all(...params) as QuestionData[];

      // Lọc theo WRONG hoặc BOOKMARKED nếu có yêu cầu
      if (statusFilter === 'WRONG') {
        questions = rawQuestions.filter((q) => userHistory[q.id] === 'WRONG');
        title = 'Ôn tập các câu đã làm sai';
      } else if (statusFilter === 'BOOKMARKED') {
        questions = rawQuestions.filter((q) => bookmarkedSet.has(q.id));
        title = 'Ôn tập các câu đã đánh dấu';
      } else {
        questions = rawQuestions;
        title = 'Luyện tập từng câu (Flash-Quiz)';
      }
    }

    // Bảo mật: Ẩn đáp án đúng trong đề kiểm tra nếu là MOCK_EXAM hoặc ASSIGNED_SET trước khi nộp
    const sanitizedQuestions = questions.map((q) => {
      let payload = JSON.parse(q.payload_json || '{}');
      const isQuizMode = mode === 'FLASH_QUIZ' || mode === 'LESSON';

      if (!isQuizMode) {
        // Trong chế độ thi thử, giấu đáp án đúng
        if (q.q_type === 'MCQ') {
          payload = { options: payload.options };
        } else if (q.q_type === 'TF') {
          payload = {
            propositions: (payload.propositions || []).map((p: any) => ({
              id: p.id,
              statement: p.statement,
            })),
          };
        } else if (q.q_type === 'SA') {
          payload = {};
        }
      }

      return {
        id: q.id,
        subject_id: q.subject_id,
        grade_id: q.grade_id,
        chapter_id: q.chapter_id,
        lesson_id: q.lesson_id,
        q_type: q.q_type,
        difficulty: q.difficulty,
        stem: q.stem,
        payload,
        points: q.points,
        is_bookmarked: bookmarkedSet.has(q.id),
        status: userHistory[q.id] || null,
        // Nếu là Flash-Quiz thì gửi luôn explanation và đáp án để check nhanh
        ...(isQuizMode ? { explanation: q.explanation, raw_payload: q.payload_json } : {}),
      };
    });

    return NextResponse.json({
      title,
      mode,
      duration_minutes: durationMinutes,
      exam_code: examCode,
      structure: examStructure,
      total_questions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

