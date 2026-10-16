import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data/app.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('⚡ Đang cập nhật thêm tài khoản giáo viên chuẩn và 34 câu hỏi mẫu phong phú có KaTeX & Code block...');

// 1. Thêm tài khoản gv.tinhoc@ttgdtxcva.edu.vn và gv.toan@ttgdtxcva.edu.vn
const upsertUser = db.prepare(`
  INSERT INTO Users (email, user_code, full_name, role, grade_id, class_id, assigned_subjects, xp_points, streak_days, status, phone)
  VALUES (@email, @user_code, @full_name, @role, @grade_id, @class_id, @assigned_subjects, @xp_points, @streak_days, 'ACTIVE', @phone)
  ON CONFLICT(email) DO UPDATE SET
    full_name = excluded.full_name,
    role = excluded.role,
    grade_id = excluded.grade_id,
    class_id = excluded.class_id,
    assigned_subjects = excluded.assigned_subjects
`);

upsertUser.run({
  email: 'gv.tinhoc@ttgdtxcva.edu.vn',
  user_code: 'GV_TINHOC_01',
  full_name: 'Thầy Nguyễn Trọng Tín (Tổ Tin Học)',
  role: 'TEACHER',
  grade_id: '10,11',
  class_id: '10TN,10A1,10A2,11A1,11A2',
  assigned_subjects: JSON.stringify(['tin-hoc-10', 'tin-hoc-11']),
  xp_points: 3200,
  streak_days: 20,
  phone: '0908889999',
});

upsertUser.run({
  email: 'gv.toan@ttgdtxcva.edu.vn',
  user_code: 'GV_TOAN_01',
  full_name: 'Cô Lê Hoàng Mai (Tổ Toán Học)',
  role: 'TEACHER',
  grade_id: '10,11',
  class_id: '10TN,10A1,10A3,11A1,11A3',
  assigned_subjects: JSON.stringify(['toan-10', 'toan-11']),
  xp_points: 2900,
  streak_days: 18,
  phone: '0917778888',
});

// 2. Thêm các câu hỏi phong phú có KaTeX ($...$) và Code Block (```python, ```sql)
const insertQuestion = db.prepare(`
  INSERT INTO Questions (id, subject_id, grade_id, chapter_id, lesson_id, q_type, difficulty, stem, payload_json, explanation, lock_shuffle, points, created_by)
  VALUES (@id, @subject_id, @grade_id, @chapter_id, @lesson_id, @q_type, @difficulty, @stem, @payload_json, @explanation, @lock_shuffle, @points, @created_by)
  ON CONFLICT(id) DO UPDATE SET
    stem = excluded.stem,
    payload_json = excluded.payload_json,
    explanation = excluded.explanation,
    points = excluded.points,
    difficulty = excluded.difficulty
`);

const additionalQuestions = [
  // ==================== TIN HỌC 10 (Lập trình Python & Thuật toán) ====================
  {
    id: 'q-tin10-py-01',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Cho đoạn mã nguồn Python sau đây:\n```python\ns = 0\nfor i in range(1, 5):\n    s += i * 2\nprint("Ket qua:", s)\n```\nKhi chạy chương trình, giá trị in ra màn hình là bao nhiêu?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Ket qua: 10' },
        { key: 'B', text: 'Ket qua: 20' },
        { key: 'C', text: 'Ket qua: 30' },
        { key: 'D', text: 'Ket qua: 12' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Vòng lặp `range(1, 5)` nhận các giá trị $i \\in \\{1, 2, 3, 4\\}$. Tổng $s = (1*2) + (2*2) + (3*2) + (4*2) = 2 + 4 + 6 + 8 = 20$.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-tin10-py-02',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch1',
    lesson_id: 'tin10-b1',
    q_type: 'TF',
    difficulty: 'VD',
    stem: 'Cho hàm đệ quy Python tính giai thừa sau:\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```\nXét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Khi gọi hàm factorial(4), giá trị trả về là 24.', is_true: true },
        { id: 'b', statement: 'Điều kiện dừng (base case) của hàm là khi n <= 1.', is_true: true },
        { id: 'c', statement: 'Nếu gọi factorial(0), chương trình sẽ rơi vào vòng lặp vô tận (RecursionError).', is_true: false },
        { id: 'd', statement: 'Độ phức tạp thời gian của hàm đệ quy trên là $O(n)$.', is_true: true },
      ],
    }),
    explanation: 'a) $4! = 4 \\times 3 \\times 2 \\times 1 = 24$ (Đúng). b) Đúng vì khi n <= 1 trả về 1. c) Sai vì n = 0 thỏa mãn n <= 1 nên trả về 1 ngay lập tức. d) Hàm gọi đệ quy n lần nên độ phức tạp là $O(n)$ (Đúng).',
    lock_shuffle: 0,
    points: 1.0,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-tin10-py-03',
    subject_id: 'tin-hoc-10',
    grade_id: 10,
    chapter_id: 'tin10-ch2',
    lesson_id: 'tin10-b2',
    q_type: 'SA',
    difficulty: 'TH',
    stem: 'Địa chỉ IPv4 chuẩn gồm có bao nhiêu bit nhị phân (viết dạng số nguyên)?',
    payload_json: JSON.stringify({
      accepted_answers: ['32', '32 bit', '32 bits'],
      case_sensitive: false,
    }),
    explanation: 'Địa chỉ IPv4 gồm 4 byte (octets), tương đương $4 \\times 8 = 32\\text{ bit}$.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },

  // ==================== TOÁN HỌC 10 (Hình học giải tích & Bất phương trình) ====================
  {
    id: 'q-toan10-geom-01',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch2',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Trong mặt phẳng tọa độ $Oxy$, cho đường thẳng $\\Delta: 3x - 4y + 5 = 0$. Khoảng cách từ điểm $M(1; 2)$ đến đường thẳng $\\Delta$ bằng bao nhiêu?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: '$0$' },
        { key: 'B', text: '$1$' },
        { key: 'C', text: '$2$' },
        { key: 'D', text: '$\\frac{3}{5}$' },
      ],
      correct_answer: 'A',
    }),
    explanation: 'Khoảng cách $d(M, \\Delta) = \\frac{|3(1) - 4(2) + 5|}{\\sqrt{3^2 + (-4)^2}} = \\frac{|3 - 8 + 5|}{5} = \\frac{0}{5} = 0$. (Điểm M thuộc đường thẳng).',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-toan10-set-02',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch1',
    lesson_id: 'toan10-b1',
    q_type: 'TF',
    difficulty: 'VD',
    stem: 'Cho tam giác $ABC$ có độ dài các cạnh $a = 7$, $b = 8$, $c = 5$. Xét tính Đúng/Sai của các khẳng định sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Nửa chu vi của tam giác bằng $p = 10$.', is_true: true },
        { id: 'b', statement: 'Cosin của góc $A$ thỏa mãn $\\cos(A) = \\frac{1}{2}$.', is_true: true },
        { id: 'c', statement: 'Diện tích của tam giác $ABC$ bằng $S = 10\\sqrt{3}$.', is_true: true },
        { id: 'd', statement: 'Bán kính đường tròn ngoại tiếp của tam giác bằng $R = 4$.', is_true: false },
      ],
    }),
    explanation: 'a) $p = (7+8+5)/2 = 10$ (Đúng). b) $\\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc} = \\frac{64 + 25 - 49}{80} = \\frac{40}{80} = \\frac{1}{2}$ (Đúng $\\Rightarrow A = 60^\\circ$). c) $S = \\frac{1}{2}bc\\sin(A) = \\frac{1}{2} \\times 8 \\times 5 \\times \\frac{\\sqrt{3}}{2} = 10\\sqrt{3}$ (Đúng). d) $R = \\frac{a}{2\\sin(A)} = \\frac{7}{\\sqrt{3}} \\ne 4$ (Sai).',
    lock_shuffle: 0,
    points: 1.0,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-toan10-sa-03',
    subject_id: 'toan-10',
    grade_id: 10,
    chapter_id: 'toan10-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Cho tam thức bậc hai $f(x) = x^2 - 2(m-1)x + 4$. Giá trị nguyên dương nhỏ nhất của tham số $m$ để $f(x) > 0$ với mọi $x \\in \\mathbb{R}$ là bao nhiêu?',
    payload_json: JSON.stringify({
      accepted_answers: ['1', 'm=1'],
      case_sensitive: false,
    }),
    explanation: 'Để $f(x) > 0$ với mọi $x$, ta cần $a = 1 > 0$ và $\\Delta\' = (m-1)^2 - 4 < 0 \\Leftrightarrow -2 < m-1 < 2 \\Leftrightarrow -1 < m < 3$. Các số nguyên dương là $m \\in \\{1; 2\\}$. Giá trị nguyên dương nhỏ nhất là $m = 1$.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },

  // ==================== TIN HỌC 11 (SQL & CSDL Nâng Cao) ====================
  {
    id: 'q-tin11-sql-01',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Cho câu lệnh SQL truy vấn sau:\n```sql\nSELECT class_id, COUNT(*) AS so_luong\nFROM Users\nWHERE role = \'STUDENT\'\nGROUP BY class_id\nHAVING COUNT(*) > 30;\n```\nMệnh đề `HAVING` trong câu lệnh trên có tác dụng gì?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: 'Lọc các dòng đơn lẻ trước khi gom nhóm' },
        { key: 'B', text: 'Lọc điều kiện trên kết quả sau khi đã gom nhóm (GROUP BY)' },
        { key: 'C', text: 'Sắp xếp thứ tự các cột hiển thị' },
        { key: 'D', text: 'Tự động xóa các lớp có ít hơn 30 học sinh' },
      ],
      correct_answer: 'B',
    }),
    explanation: 'Mệnh đề `HAVING` được dùng để đặt điều kiện lọc cho các hàm tổng hợp (aggregate functions) sau khi thực hiện `GROUP BY`, khác với `WHERE` là lọc từng hàng trước khi gom nhóm.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-tin11-sql-02',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'TF',
    difficulty: 'VD',
    stem: 'Về các ràng buộc toàn vẹn (Integrity Constraints) trong hệ quản trị cơ sở dữ liệu quan hệ, xét tính Đúng/Sai:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Ràng buộc UNIQUE cho phép các dòng nhận giá trị NULL.', is_true: true },
        { id: 'b', statement: 'Ràng buộc PRIMARY KEY là sự kết hợp của NOT NULL và UNIQUE.', is_true: true },
        { id: 'c', statement: 'Một bảng quan hệ có thể có nhiều hơn một khóa chính (PRIMARY KEY).', is_true: false },
        { id: 'd', statement: 'Khóa ngoại (FOREIGN KEY) dùng để liên kết và đảm bảo toàn vẹn tham chiếu giữa hai bảng.', is_true: true },
      ],
    }),
    explanation: 'a) Đúng vì trong SQL chuẩn, UNIQUE cho phép nhiều dòng NULL (hoặc 1 dòng NULL tùy RDBMS). b) Đúng vì khóa chính luôn phải duy nhất và không rỗng. c) Sai vì mỗi bảng chỉ có duy nhất một khóa chính (dù có thể là khóa phức hợp gồm nhiều cột). d) Đúng.',
    lock_shuffle: 0,
    points: 1.0,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-tin11-sql-03',
    subject_id: 'tin-hoc-11',
    grade_id: 11,
    chapter_id: 'tin11-ch2',
    lesson_id: 'tin11-b1',
    q_type: 'SA',
    difficulty: 'TH',
    stem: 'Viết tên hàm SQL dùng để đếm số lượng bản ghi thỏa mãn điều kiện (viết chữ in hoa, ví dụ: "SUM"):',
    payload_json: JSON.stringify({
      accepted_answers: ['COUNT', 'COUNT()', 'COUNT(*)'],
      case_sensitive: false,
    }),
    explanation: 'Hàm `COUNT()` dùng để đếm số hàng dữ liệu trong SQL.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.tinhoc@ttgdtxcva.edu.vn',
  },

  // ==================== TOÁN HỌC 11 (Lượng giác & Xác suất giải tích) ====================
  {
    id: 'q-toan11-trig-01',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch1',
    q_type: 'MCQ',
    difficulty: 'TH',
    stem: 'Nghiệm của phương trình lượng giác $\\sin(x) = \\frac{1}{2}$ trong khoảng $(0; \\pi)$ là những giá trị nào?',
    payload_json: JSON.stringify({
      options: [
        { key: 'A', text: '$x = \\frac{\\pi}{6}$ và $x = \\frac{5\\pi}{6}$' },
        { key: 'B', text: '$x = \\frac{\\pi}{3}$ và $x = \\frac{2\\pi}{3}$' },
        { key: 'C', text: '$x = \\frac{\\pi}{4}$ và $x = \\frac{3\\pi}{4}$' },
        { key: 'D', text: '$x = \\frac{\\pi}{6}$' },
      ],
      correct_answer: 'A',
    }),
    explanation: '$\\sin(x) = \\frac{1}{2} \\Leftrightarrow x = \\frac{\\pi}{6} + k2\\pi$ hoặc $x = \\pi - \\frac{\\pi}{6} + k2\\pi = \\frac{5\\pi}{6} + k2\\pi$. Trong $(0; \\pi)$ có 2 nghiệm: $\\frac{\\pi}{6}$ và $\\frac{5\\pi}{6}$.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-toan11-trig-02',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch2',
    q_type: 'TF',
    difficulty: 'VD',
    stem: 'Gieo một con xúc xắc cân đối và đồng chất 2 lần liên tiếp. Xét tính Đúng/Sai của các mệnh đề sau:',
    payload_json: JSON.stringify({
      propositions: [
        { id: 'a', statement: 'Số phần tử của không gian mẫu là $n(\\Omega) = 36$.', is_true: true },
        { id: 'b', statement: 'Xác suất để cả 2 lần gieo đều xuất hiện mặt 6 chấm bằng $\\frac{1}{36}$.', is_true: true },
        { id: 'c', statement: 'Xác suất để tổng số chấm trong 2 lần gieo bằng 7 là $\\frac{1}{6}$.', is_true: true },
        { id: 'd', statement: 'Biến cố "ít nhất một lần xuất hiện mặt chẵn" có xác suất bằng $\\frac{1}{4}$.', is_true: false },
      ],
    }),
    explanation: 'a) $n(\\Omega) = 6 \\times 6 = 36$ (Đúng). b) Cặp (6, 6) có 1 trường hợp $\\Rightarrow P = 1/36$ (Đúng). c) Các cặp tổng bằng 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) có 6 cặp $\\Rightarrow P = 6/36 = 1/6$ (Đúng). d) Biến cố đối "cả 2 lần đều lẻ" có $3 \\times 3 = 9$ cách $\\Rightarrow P(\\text{ít nhất 1 chẵn}) = 1 - 9/36 = 27/36 = 3/4 \\ne 1/4$ (Sai).',
    lock_shuffle: 0,
    points: 1.0,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },
  {
    id: 'q-toan11-seq-03',
    subject_id: 'toan-11',
    grade_id: 11,
    chapter_id: 'toan11-ch2',
    q_type: 'SA',
    difficulty: 'VD',
    stem: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 2$ và công sai $d = 3$. Tìm giá trị của số hạng thứ 10 ($u_{10}$):',
    payload_json: JSON.stringify({
      accepted_answers: ['29'],
      case_sensitive: false,
    }),
    explanation: 'Áp dụng công thức số hạng tổng quát của cấp số cộng: $u_{10} = u_1 + (10 - 1)d = 2 + 9 \\times 3 = 2 + 27 = 29$.',
    lock_shuffle: 0,
    points: 0.25,
    created_by: 'gv.toan@ttgdtxcva.edu.vn',
  },
];

for (const q of additionalQuestions) {
  insertQuestion.run({
    id: q.id,
    subject_id: q.subject_id,
    grade_id: q.grade_id,
    chapter_id: q.chapter_id || null,
    lesson_id: q.lesson_id || null,
    q_type: q.q_type,
    difficulty: q.difficulty,
    stem: q.stem,
    payload_json: q.payload_json,
    explanation: q.explanation || null,
    lock_shuffle: q.lock_shuffle || 0,
    points: q.points !== undefined ? q.points : 1.0,
    created_by: q.created_by,
  });
}

const totalQ = db.prepare('SELECT COUNT(*) as count FROM Questions').get().count;
console.log(`✅ Đã nạp thành công bộ câu hỏi phong phú. Tổng số câu hỏi hiện tại: ${totalQ} câu.`);
db.close();

