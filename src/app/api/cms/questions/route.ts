export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serverCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền truy cập CMS' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject_id');
    const gradeId = searchParams.get('grade_id');
    const qType = searchParams.get('q_type');
    const search = searchParams.get('search');

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '15', 10)));
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    if (subjectId) {
      whereClause += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (gradeId) {
      whereClause += ' AND grade_id = ?';
      params.push(parseInt(gradeId, 10));
    }
    if (qType) {
      whereClause += ' AND q_type = ?';
      params.push(qType);
    }
    if (search) {
      whereClause += ' AND (stem LIKE ? OR explanation LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Đếm tổng số câu hỏi theo điều kiện lọc
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM Questions ${whereClause}`).get(...params) as any;
    const total = countRow ? countRow.total : 0;

    // Lấy câu hỏi theo trang (Pagination)
    const pagedQuery = `SELECT * FROM Questions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const questions = db.prepare(pagedQuery).all(...params, limit, offset);

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền thực hiện hành động này' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      subject_id,
      grade_id,
      chapter_id,
      lesson_id,
      q_type,
      difficulty = 'NB',
      stem,
      payload,
      explanation,
      lock_shuffle = 0,
      points = 1.0,
    } = body;

    if (!subject_id || !grade_id || !q_type || !stem || !payload) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' }, { status: 400 });
    }

    const db = getDatabase();
    const questionId = id || `q_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    db.prepare(`
      INSERT INTO Questions (
        id, subject_id, grade_id, chapter_id, lesson_id, q_type, difficulty, stem,
        payload_json, explanation, lock_shuffle, points, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        subject_id = excluded.subject_id,
        grade_id = excluded.grade_id,
        chapter_id = excluded.chapter_id,
        lesson_id = excluded.lesson_id,
        q_type = excluded.q_type,
        difficulty = excluded.difficulty,
        stem = excluded.stem,
        payload_json = excluded.payload_json,
        explanation = excluded.explanation,
        lock_shuffle = excluded.lock_shuffle,
        points = excluded.points
    `).run(
      questionId,
      subject_id,
      parseInt(grade_id, 10),
      chapter_id || null,
      lesson_id || null,
      q_type,
      difficulty,
      stem,
      payloadStr,
      explanation || null,
      lock_shuffle ? 1 : 0,
      points,
      user.email
    );

    serverCache.invalidate('questions');
    serverCache.invalidate('static_subjects');
    serverCache.invalidate('static_subject_tree');
    serverCache.invalidate('q_pool');

    return NextResponse.json({ success: true, question_id: questionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền truy cập CMS' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu question id' }, { status: 400 });
    }

    const db = getDatabase();
    db.prepare('DELETE FROM Questions WHERE id = ?').run(id);

    serverCache.invalidate('questions');
    serverCache.invalidate('static_subjects');
    serverCache.invalidate('static_subject_tree');
    serverCache.invalidate('q_pool');

    return NextResponse.json({ success: true, message: 'Đã xóa câu hỏi' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

