import { QuestionData, MCQPayload, TFPayload } from './scoring';

/**
 * =========================================================================
 * MA TRẬN CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT (THPTQG) CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO
 * =========================================================================
 * Định dạng cấu trúc đề thi từ năm 2025 theo chương trình GDPT 2018:
 * - Phần I: Câu hỏi trắc nghiệm nhiều lựa chọn (MCQ) - mỗi câu 0,25đ.
 * - Phần II: Câu hỏi trắc nghiệm Đúng/Sai (TF) - mỗi câu 4 ý a,b,c,d. Thang điểm:
 *            Đúng 1 ý = 0,1đ; Đúng 2 ý = 0,25đ; Đúng 3 ý = 0,5đ; Đúng 4 ý = 1,0đ.
 * - Phần III: Câu hỏi trắc nghiệm trả lời ngắn (SA) - mỗi câu 0,25đ hoặc 0,5đ.
 * - Tổng điểm: 10,0 điểm.
 */
export interface THPTQGStructure {
  subjectKey: string;
  name: string;
  durationMinutes: number;
  totalPoints: number;
  part1_MCQ: {
    count: number;
    pointsPerQuestion: number;
    totalPoints: number;
    description: string;
  };
  part2_TF: {
    count: number;
    pointsPerQuestion: number; // 1.0đ
    totalPoints: number;
    description: string;
  };
  part3_SA: {
    count: number;
    pointsPerQuestion: number;
    totalPoints: number;
    description: string;
  };
}

export const THPTQG_EXAM_STRUCTURES: Record<string, THPTQGStructure> = {
  // Chuẩn Đề THPTQG Môn Tin Học GDPT 2018 (24 câu MCQ + 4 câu TF = 10,0 điểm, 50 phút)
  TIN_HOC: {
    subjectKey: 'tin-hoc-10',
    name: 'Cấu trúc đề THPTQG Môn Tin Học (Bộ GD&ĐT)',
    durationMinutes: 50,
    totalPoints: 10.0,
    part1_MCQ: {
      count: 24,
      pointsPerQuestion: 0.25,
      totalPoints: 6.0,
      description: 'Phần I: 24 câu trắc nghiệm 4 lựa chọn (0.25đ/câu)',
    },
    part2_TF: {
      count: 4,
      pointsPerQuestion: 1.0,
      totalPoints: 4.0,
      description: 'Phần II: 4 câu Đúng/Sai chùm 4 ý (Thang điểm: 0.1 - 0.25 - 0.5 - 1.0đ)',
    },
    part3_SA: {
      count: 0,
      pointsPerQuestion: 0.0,
      totalPoints: 0.0,
      description: 'Phần III: Không áp dụng cho môn Tin',
    },
  },

  // Chuẩn Đề THPTQG Môn Toán & KHTN (12 MCQ + 4 TF + 6 SA = 10,0 điểm, 90 phút)
  TOAN_KHTN: {
    subjectKey: 'toan',
    name: 'Cấu trúc đề THPTQG Môn Toán & KHTN (Bộ GD&ĐT)',
    durationMinutes: 90,
    totalPoints: 10.0,
    part1_MCQ: {
      count: 12,
      pointsPerQuestion: 0.25,
      totalPoints: 3.0,
      description: 'Phần I: 12 câu trắc nghiệm nhiều lựa chọn (3.0đ)',
    },
    part2_TF: {
      count: 4,
      pointsPerQuestion: 1.0,
      totalPoints: 4.0,
      description: 'Phần II: 4 câu Đúng/Sai chùm 4 ý (4.0đ)',
    },
    part3_SA: {
      count: 6,
      pointsPerQuestion: 0.5,
      totalPoints: 3.0,
      description: 'Phần III: 6 câu trắc nghiệm trả lời ngắn (3.0đ)',
    },
  },

  // Chuẩn Khảo thí Toàn Diện CVA (Linh hoạt tổng hợp cả 3 phần MCQ, TF, SA = 10,0 điểm)
  CVA_ASSESSMENT: {
    subjectKey: 'general',
    name: 'Cấu trúc đề Khảo thí Toàn diện Chu Văn An',
    durationMinutes: 45,
    totalPoints: 10.0,
    part1_MCQ: {
      count: 16,
      pointsPerQuestion: 0.25,
      totalPoints: 4.0,
      description: 'Phần I: 16 câu trắc nghiệm 4 lựa chọn (4.0đ)',
    },
    part2_TF: {
      count: 4,
      pointsPerQuestion: 1.0,
      totalPoints: 4.0,
      description: 'Phần II: 4 câu Đúng/Sai chùm 4 ý (4.0đ)',
    },
    part3_SA: {
      count: 4,
      pointsPerQuestion: 0.5,
      totalPoints: 2.0,
      description: 'Phần III: 4 câu trả lời ngắn (2.0đ)',
    },
  },
};

/**
 * Thuật toán PRNG (Mulberry32) tạo dãy số ngẫu nhiên có Seed từ Mã đề thi (VD: Mã 101, 102, 203)
 * Giúp mã đề luôn sinh ra cùng một đề cố định, giáo viên có thể in đề và in bảng đáp án chính xác 100%!
 */
export function createSeededRNG(seedNumber: number) {
  let s = Math.abs(seedNumber) + 1;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Thuật toán Fisher-Yates xáo trộn mảng tổng quát (hỗ trợ cả RNG mặc định hoặc Seeded RNG)
 */
export function fisherYatesShuffle<T>(array: T[], customRng?: () => number): T[] {
  const rng = customRng || Math.random;
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Trộn các phương án A, B, C, D của câu hỏi MCQ (Tầng 3)
 * Giữ nguyên đáp án đúng bằng cách ánh xạ lại key A, B, C, D
 */
export function shuffleMCQOptions(q: QuestionData, customRng?: () => number): QuestionData {
  if (q.lock_shuffle || q.q_type !== 'MCQ') return q;

  let payload: MCQPayload;
  try {
    payload = typeof q.payload_json === 'string' ? JSON.parse(q.payload_json) : q.payload_json;
  } catch {
    return q;
  }

  if (!payload.options || payload.options.length < 2) return q;

  // Lấy nội dung của đáp án đúng hiện tại
  const originalCorrectKey = payload.correct_answer;
  const originalCorrectOption = payload.options.find((o) => o.key === originalCorrectKey);
  const originalCorrectText = originalCorrectOption ? originalCorrectOption.text : '';

  // Xáo trộn thứ tự các lựa chọn bằng Fisher-Yates
  const shuffledTexts = fisherYatesShuffle(payload.options.map((o) => o.text), customRng);
  const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'];

  const newOptions = shuffledTexts.map((text, idx) => ({
    key: optionKeys[idx] || String.fromCharCode(65 + idx),
    text,
  }));

  const newCorrectKey = newOptions.find((o) => o.text === originalCorrectText)?.key || 'A';

  const newPayload: MCQPayload = {
    options: newOptions,
    correct_answer: newCorrectKey,
  };

  return {
    ...q,
    payload_json: JSON.stringify(newPayload),
  };
}

/**
 * Trộn các mệnh đề a, b, c, d của câu hỏi TF (Tầng 3)
 */
export function shuffleTFPropositions(q: QuestionData, customRng?: () => number): QuestionData {
  if (q.lock_shuffle || q.q_type !== 'TF') return q;

  let payload: TFPayload;
  try {
    payload = typeof q.payload_json === 'string' ? JSON.parse(q.payload_json) : q.payload_json;
  } catch {
    return q;
  }

  if (!payload.propositions || payload.propositions.length < 2) return q;

  const shuffledProps = fisherYatesShuffle(payload.propositions, customRng);
  const propKeys = ['a', 'b', 'c', 'd'];

  const newProps = shuffledProps.map((p, idx) => ({
    id: propKeys[idx] || p.id,
    statement: p.statement,
    is_true: p.is_true,
  }));

  const newPayload: TFPayload = {
    propositions: newProps,
  };

  return {
    ...q,
    payload_json: JSON.stringify(newPayload),
  };
}

/**
 * Kết quả sinh đề thi theo Mã Đề chuẩn THPTQG
 */
export interface GeneratedExamResult {
  examCode: string;
  structure: THPTQGStructure;
  durationMinutes: number;
  totalPoints: number;
  questions: QuestionData[];
  answerKeyMatrix: Record<string, any>; // Bảng đáp án đối chiếu cho giáo viên
}

/**
 * HÀM TRỘN ĐỀ THI 3 TẦNG CHUẨN THPTQG (BỘ GD&ĐT):
 * 
 * - Tầng 1: Lọc và chọn câu hỏi theo đúng Ma trận cấu trúc đề THPTQG
 *   (Phần I: MCQ, Phần II: Đúng/Sai TF, Phần III: Trả lời ngắn SA),
 *   đảm bảo tỷ lệ độ khó (Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%).
 * - Tầng 2: Đảo ngẫu nhiên thứ tự câu hỏi BÊN TRONG từng phần độc lập (Không lẫn lộn thứ tự giữa các phần).
 * - Tầng 3: Đảo ngẫu nhiên vị trí các phương án A, B, C, D của câu hỏi trắc nghiệm.
 * 
 * Hỗ trợ tạo Mã đề thi 3 chữ số (101, 102, 203...) có tính lặp lại (reproducible) để in ấn và chấm thi.
 */
export function generateTHPTQGShuffledExam(
  allQuestions: QuestionData[],
  options?: {
    examCode?: string; // Ví dụ: '101', '102', '203'
    structureKey?: 'TIN_HOC' | 'TOAN_KHTN' | 'CVA_ASSESSMENT';
    userQuestionHistory?: Record<string, 'MASTERED' | 'WRONG' | 'ATTEMPTED'>;
  }
): GeneratedExamResult {
  // 1. Xác định Mã Đề (3 chữ số ngẫu nhiên hoặc theo chỉ định)
  const code = options?.examCode || String(100 + Math.floor(Math.random() * 900));
  const seed = parseInt(code, 10) || 101;
  const rng = createSeededRNG(seed);

  // 2. Xác định cấu trúc ma trận đề thi
  const structKey = options?.structureKey || 'TIN_HOC';
  const structure = THPTQG_EXAM_STRUCTURES[structKey] || THPTQG_EXAM_STRUCTURES.TIN_HOC;

  const history = options?.userQuestionHistory || {};

  // Tầng 1: Phân loại câu hỏi theo 3 Phần và ưu tiên câu chưa làm / làm sai
  const rawMCQ = allQuestions.filter((q) => q.q_type === 'MCQ');
  const rawTF = allQuestions.filter((q) => q.q_type === 'TF');
  const rawSA = allQuestions.filter((q) => q.q_type === 'SA');

  const prioritizeGroup = (items: QuestionData[]) => {
    const notAttempted: QuestionData[] = [];
    const wrong: QuestionData[] = [];
    const mastered: QuestionData[] = [];

    for (const q of items) {
      const status = history[q.id];
      if (!status) notAttempted.push(q);
      else if (status === 'WRONG') wrong.push(q);
      else mastered.push(q);
    }

    return [
      ...fisherYatesShuffle(notAttempted, rng),
      ...fisherYatesShuffle(wrong, rng),
      ...fisherYatesShuffle(mastered, rng),
    ];
  };

  // Chọn đúng số lượng câu hỏi theo ma trận THPTQG (nếu ngân hàng ít hơn, lấy tối đa hiện có)
  const limitMCQ = Math.min(rawMCQ.length, structure.part1_MCQ.count || rawMCQ.length);
  const limitTF = Math.min(rawTF.length, structure.part2_TF.count || rawTF.length);
  const limitSA = Math.min(rawSA.length, structure.part3_SA.count || rawSA.length);

  const selectedMCQ = prioritizeGroup(rawMCQ).slice(0, limitMCQ);
  const selectedTF = prioritizeGroup(rawTF).slice(0, limitTF);
  const selectedSA = prioritizeGroup(rawSA).slice(0, limitSA);

  // Tầng 2: Đảo ngẫu nhiên thứ tự câu hỏi BÊN TRONG từng phần độc lập
  const shuffledMCQ = fisherYatesShuffle(selectedMCQ, rng);
  const shuffledTF = fisherYatesShuffle(selectedTF, rng);
  const shuffledSA = fisherYatesShuffle(selectedSA, rng);

  // Tầng 3: Đảo ngẫu nhiên các phương án A, B, C, D và mệnh đề con a, b, c, d
  const finalMCQ = shuffledMCQ.map((q) => shuffleMCQOptions(q, rng));
  const finalTF = shuffledTF.map((q) => shuffleTFPropositions(q, rng));
  const finalSA = shuffledSA;

  // Gom toàn bộ đề thi theo đúng thứ tự chuẩn Bộ GD&ĐT: Phần I -> Phần II -> Phần III
  const finalQuestions = [...finalMCQ, ...finalTF, ...finalSA];

  // 3. Tự động sinh Bảng Đáp Án Ma Trận (Answer Key) tương ứng với Mã Đề này
  const answerKeyMatrix: Record<string, any> = {};
  finalQuestions.forEach((q, idx) => {
    const qNum = idx + 1;
    try {
      const payload = typeof q.payload_json === 'string' ? JSON.parse(q.payload_json) : q.payload_json;
      if (q.q_type === 'MCQ') {
        answerKeyMatrix[qNum] = payload.correct_answer;
      } else if (q.q_type === 'TF') {
        const tfProps: Record<string, boolean> = {};
        (payload.propositions || []).forEach((p: any) => {
          tfProps[p.id] = p.is_true;
        });
        answerKeyMatrix[qNum] = tfProps;
      } else if (q.q_type === 'SA') {
        answerKeyMatrix[qNum] = payload.acceptable_answers || [payload.correct_answer];
      }
    } catch {
      answerKeyMatrix[qNum] = null;
    }
  });

  return {
    examCode: code,
    structure,
    durationMinutes: structure.durationMinutes,
    totalPoints: structure.totalPoints,
    questions: finalQuestions,
    answerKeyMatrix,
  };
}

/**
 * Hàm backward compatibility cho các module hiện tại
 */
export function generateThreeTierShuffledExam(
  allQuestions: QuestionData[],
  options?: {
    limitMCQ?: number;
    limitTF?: number;
    limitSA?: number;
    userQuestionHistory?: Record<string, 'MASTERED' | 'WRONG' | 'ATTEMPTED'>;
  }
): QuestionData[] {
  const result = generateTHPTQGShuffledExam(allQuestions, {
    userQuestionHistory: options?.userQuestionHistory,
  });
  return result.questions;
}
