export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serverCache } from '@/lib/cache';

/**
 * Phân tích cú pháp văn bản câu hỏi nhanh
 */
function parseQuickTextQuestions(rawText: string, defaultSubject = 'tin-hoc-10', defaultGrade = 10) {
  const blocks = rawText.split(/(?=\[(?:MCQ|TF|SA)\])/i).filter((b) => b.trim().length > 0);
  const questions: any[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) continue;

    const firstLine = lines[0].toUpperCase();
    let qType: 'MCQ' | 'TF' | 'SA' = 'MCQ';
    if (firstLine.includes('[TF]')) qType = 'TF';
    else if (firstLine.includes('[SA]')) qType = 'SA';

    // Tìm dòng stem (nội dung câu hỏi)
    let stem = '';
    let explanation = '';
    let lineIdx = 1;

    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (/^[A-D]\.|\b[a-d]\)|\bĐáp án:|\bGiải thích:/i.test(line)) {
        break;
      }
      stem += (stem ? ' ' : '') + line.replace(/^câu\s*\d+[:.]\s*/i, '');
    }

    if (!stem && lines[1]) {
      stem = lines[1].replace(/^câu\s*\d+[:.]\s*/i, '');
      lineIdx = 2;
    }

    let payload: any = {};

    if (qType === 'MCQ') {
      const options: { key: string; text: string }[] = [];
      let correctAnswer = 'A';

      for (let i = lineIdx; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([A-D])[\.\:]\s*(.+)/i);
        if (match) {
          options.push({ key: match[1].toUpperCase(), text: match[2].trim() });
        } else if (/^đáp án[\:\s]+([A-D])/i.test(line)) {
          const ansMatch = line.match(/^đáp án[\:\s]+([A-D])/i);
          if (ansMatch) correctAnswer = ansMatch[1].toUpperCase();
        } else if (/^giải thích[\:\s]+(.+)/i.test(line)) {
          explanation = line.replace(/^giải thích[\:\s]+/i, '').trim();
        }
      }

      payload = { options, correct_answer: correctAnswer };
    } else if (qType === 'TF') {
      const propositions: { id: string; statement: string; is_true: boolean }[] = [];

      for (let i = lineIdx; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([a-d])\)\s*(.+)/i);
        if (match) {
          const id = match[1].toLowerCase();
          let stmt = match[2].trim();
          let isTrue = false;

          // Kiểm tra xem có đuôi [Đ] hoặc [S] hay (Đúng)/(Sai) không
          if (/\[[đd]\]|\(đúng\)/i.test(stmt)) {
            isTrue = true;
            stmt = stmt.replace(/\[[đd]\]|\(đúng\)/i, '').trim();
          } else if (/\[[s]\]|\(sai\)/i.test(stmt)) {
            isTrue = false;
            stmt = stmt.replace(/\[[s]\]|\(sai\)/i, '').trim();
          }

          propositions.push({ id, statement: stmt, is_true: isTrue });
        } else if (/^giải thích[\:\s]+(.+)/i.test(line)) {
          explanation = line.replace(/^giải thích[\:\s]+/i, '').trim();
        }
      }

      payload = { propositions };
    } else if (qType === 'SA') {
      const acceptedAnswers: string[] = [];

      for (let i = lineIdx; i < lines.length; i++) {
        const line = lines[i];
        if (/^đáp án[\:\s]+(.+)/i.test(line)) {
          const ansPart = line.replace(/^đáp án[\:\s]+/i, '').trim();
          const parts = ansPart.split(/[,;|]/).map((s) => s.trim());
          acceptedAnswers.push(...parts);
        } else if (/^giải thích[\:\s]+(.+)/i.test(line)) {
          explanation = line.replace(/^giải thích[\:\s]+/i, '').trim();
        }
      }

      payload = { accepted_answers: acceptedAnswers.length > 0 ? acceptedAnswers : ['1'] };
    }

    questions.push({
      id: `q_imp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      subject_id: defaultSubject,
      grade_id: defaultGrade,
      q_type: qType,
      difficulty: 'TH',
      stem,
      payload_json: JSON.stringify(payload),
      explanation,
      lock_shuffle: 0,
      points: qType === 'TF' ? 1.0 : 0.25,
    });
  }

  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền truy cập CMS' }, { status: 403 });
    }

    const body = await request.json();
    const { raw_text, subject_id = 'tin-hoc-10', grade_id = 10, chapter_id } = body;

    if (!raw_text || !raw_text.trim()) {
      return NextResponse.json({ error: 'Nội dung import trống' }, { status: 400 });
    }

    const parsedQuestions = parseQuickTextQuestions(raw_text, subject_id, parseInt(grade_id, 10));
    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Không nhận diện được câu hỏi nào. Vui lòng kiểm tra định dạng [MCQ], [TF], [SA].' },
        { status: 400 }
      );
    }

    // Nếu chỉ yêu cầu xem trước (Live Preview)
    if (body.preview_only) {
      const previewList = parsedQuestions.map((q) => ({
        ...q,
        payload: JSON.parse(q.payload_json),
      }));
      return NextResponse.json({
        success: true,
        preview: true,
        count: previewList.length,
        questions: previewList,
      });
    }

    const db = getDatabase();

    const insertStmt = db.prepare(`
      INSERT INTO Questions (
        id, subject_id, grade_id, chapter_id, q_type, difficulty, stem,
        payload_json, explanation, lock_shuffle, points, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const runTx = db.transaction(() => {
      for (const q of parsedQuestions) {
        insertStmt.run(
          q.id,
          q.subject_id,
          q.grade_id,
          chapter_id || null,
          q.q_type,
          q.difficulty,
          q.stem,
          q.payload_json,
          q.explanation || null,
          q.lock_shuffle,
          q.points,
          user.email
        );
        count++;
      }
    });

    runTx();

    serverCache.invalidate('questions');
    serverCache.invalidate('static_subjects');
    serverCache.invalidate('static_subject_tree');
    serverCache.invalidate('q_pool');

    return NextResponse.json({
      success: true,
      imported_count: count,
      message: `Đã nhập thành công ${count} câu hỏi vào hệ thống!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

