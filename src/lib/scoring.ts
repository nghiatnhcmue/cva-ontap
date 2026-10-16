export interface MCQPayload {
  options: { key: string; text: string }[];
  correct_answer: string; // 'A' | 'B' | 'C' | 'D'
}

export interface TFProposition {
  id: string; // 'a' | 'b' | 'c' | 'd'
  statement: string;
  is_true: boolean;
}

export interface TFPayload {
  propositions: TFProposition[];
}

export interface SAPayload {
  accepted_answers: string[]; // ['1.5', '3/2', 'một phẩy năm']
  case_sensitive?: boolean;
}

export interface QuestionData {
  id: string;
  subject_id: string;
  grade_id: number;
  chapter_id?: string;
  lesson_id?: string;
  q_type: 'MCQ' | 'TF' | 'SA';
  difficulty: 'NB' | 'TH' | 'VD' | 'VDC';
  stem: string;
  payload_json: string;
  explanation?: string;
  lock_shuffle?: number | boolean;
  points?: number;
}

export interface StudentAnswer {
  question_id: string;
  user_answer: any; // MCQ: 'A', TF: { a: boolean, b: boolean, c: boolean, d: boolean }, SA: string
}

export interface QuestionResult {
  question_id: string;
  q_type: 'MCQ' | 'TF' | 'SA';
  is_correct: boolean;
  score_earned: number;
  max_score: number;
  user_answer: any;
  correct_answer_summary: any;
  explanation?: string;
  detail?: any;
}

/**
 * Chuẩn hóa chuỗi số hoặc câu trả lời ngắn để so sánh
 */
export function normalizeSAInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    // Đổi dấu phẩy số thập phân (1,5) thành dấu chấm (1.5) nếu nằm giữa các chữ số
    .replace(/(\d+),(\d+)/g, '$1.$2')
    // Xóa khoảng trắng thừa
    .replace(/\s+/g, ' ');
}

/**
 * Chấm điểm câu MCQ (Trắc nghiệm 4 lựa chọn)
 */
export function scoreMCQ(payload: MCQPayload, studentAnswer: string, maxPoints = 0.25): QuestionResult {
  const isCorrect = String(studentAnswer || '').trim().toUpperCase() === payload.correct_answer.toUpperCase();
  return {
    question_id: '',
    q_type: 'MCQ',
    is_correct: isCorrect,
    score_earned: isCorrect ? maxPoints : 0,
    max_score: maxPoints,
    user_answer: studentAnswer,
    correct_answer_summary: payload.correct_answer,
  };
}

/**
 * Chấm điểm câu Đúng/Sai (TF - 4 mệnh đề) theo quy tắc lũy tiến chuẩn Bộ GD&ĐT
 * - Đúng 1 ý: 0.1 đ
 * - Đúng 2 ý: 0.25 đ
 * - Đúng 3 ý: 0.5 đ
 * - Đúng 4 ý: 1.0 đ
 */
export function scoreTF(
  payload: TFPayload,
  studentAnswer: Record<string, boolean | null | undefined>,
  maxPoints = 1.0
): QuestionResult {
  let correctCount = 0;
  const detail: Record<string, { expected: boolean; actual: boolean | null; is_correct: boolean }> = {};

  for (const prop of payload.propositions) {
    const key = prop.id.toLowerCase();
    const studentVal = studentAnswer ? studentAnswer[key] : null;
    const isPropCorrect = typeof studentVal === 'boolean' && studentVal === prop.is_true;
    if (isPropCorrect) {
      correctCount++;
    }
    detail[key] = {
      expected: prop.is_true,
      actual: typeof studentVal === 'boolean' ? studentVal : null,
      is_correct: isPropCorrect,
    };
  }

  let earned = 0;
  if (correctCount === 1) earned = 0.1;
  else if (correctCount === 2) earned = 0.25;
  else if (correctCount === 3) earned = 0.5;
  else if (correctCount === 4) earned = 1.0;

  // Scale theo maxPoints nếu khác 1.0
  const finalScore = maxPoints === 1.0 ? earned : Math.round(((earned * maxPoints) / 1.0) * 100) / 100;

  return {
    question_id: '',
    q_type: 'TF',
    is_correct: correctCount === 4,
    score_earned: finalScore,
    max_score: maxPoints,
    user_answer: studentAnswer,
    correct_answer_summary: payload.propositions.map((p) => ({ id: p.id, is_true: p.is_true })),
    detail: {
      correct_count: correctCount,
      props: detail,
    },
  };
}

/**
 * Chấm điểm câu Trả lời ngắn (SA - Short Answer)
 */
export function scoreSA(payload: SAPayload, studentAnswer: string, maxPoints = 0.25): QuestionResult {
  const normUser = normalizeSAInput(studentAnswer);
  const acceptedNorm = payload.accepted_answers.map((ans) => normalizeSAInput(ans));

  const isCorrect = acceptedNorm.some((ans) => {
    if (ans === normUser) return true;
    // So sánh số học nếu cả 2 đều là số hợp lệ
    const numAns = parseFloat(ans);
    const numUser = parseFloat(normUser);
    if (!isNaN(numAns) && !isNaN(numUser) && Math.abs(numAns - numUser) < 1e-6) {
      return true;
    }
    return false;
  });

  return {
    question_id: '',
    q_type: 'SA',
    is_correct: isCorrect,
    score_earned: isCorrect ? maxPoints : 0,
    max_score: maxPoints,
    user_answer: studentAnswer,
    correct_answer_summary: payload.accepted_answers,
  };
}

/**
 * Hàm tổng quát chấm 1 câu hỏi
 */
export function gradeSingleQuestion(q: QuestionData, studentAnswer: any): QuestionResult {
  let parsedPayload: any = {};
  try {
    parsedPayload = typeof q.payload_json === 'string' ? JSON.parse(q.payload_json) : q.payload_json;
  } catch (err) {
    console.error('Lỗi parse payload câu hỏi', q.id, err);
  }

  const defaultPoints = q.points !== undefined && q.points !== null ? q.points : q.q_type === 'TF' ? 1.0 : 0.25;

  let res: QuestionResult;
  if (q.q_type === 'MCQ') {
    res = scoreMCQ(parsedPayload, studentAnswer, defaultPoints);
  } else if (q.q_type === 'TF') {
    res = scoreTF(parsedPayload, studentAnswer, defaultPoints);
  } else {
    res = scoreSA(parsedPayload, studentAnswer, defaultPoints);
  }

  res.question_id = q.id;
  res.explanation = q.explanation;
  return res;
}

/**
 * Chấm bài kiểm tra toàn diện và trả về tổng điểm, phân tích chi tiết
 */
export function gradeSubmission(
  questions: QuestionData[],
  studentAnswers: Record<string, any>
): {
  totalScore: number;
  maxScore: number;
  results: QuestionResult[];
  percentage: number;
  mcqStats: { correct: number; total: number };
  tfStats: { correctCountTotal: number; total: number };
  saStats: { correct: number; total: number };
} {
  const results: QuestionResult[] = [];
  let totalScore = 0;
  let maxScore = 0;

  const mcqStats = { correct: 0, total: 0 };
  const tfStats = { correctCountTotal: 0, total: 0 };
  const saStats = { correct: 0, total: 0 };

  for (const q of questions) {
    const studentAns = studentAnswers[q.id];
    const res = gradeSingleQuestion(q, studentAns);
    results.push(res);

    totalScore += res.score_earned;
    maxScore += res.max_score;

    if (q.q_type === 'MCQ') {
      mcqStats.total++;
      if (res.is_correct) mcqStats.correct++;
    } else if (q.q_type === 'TF') {
      tfStats.total++;
      if (res.is_correct) tfStats.correctCountTotal++;
    } else if (q.q_type === 'SA') {
      saStats.total++;
      if (res.is_correct) saStats.correct++;
    }
  }

  // Làm tròn 2 chữ số thập phân
  totalScore = Math.round(totalScore * 100) / 100;
  maxScore = Math.round(maxScore * 100) / 100;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  return {
    totalScore,
    maxScore,
    results,
    percentage,
    mcqStats,
    tfStats,
    saStats,
  };
}

