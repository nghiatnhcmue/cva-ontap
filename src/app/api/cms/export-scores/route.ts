export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Không có quyền truy cập xuất báo cáo' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const gradeId = searchParams.get('grade_id');
    const setId = searchParams.get('set_id');

    const db = getDatabase();

    let sql = `
      SELECT 
        s.user_name as 'Họ và tên',
        s.user_email as 'Email học sinh',
        s.class_id as 'Lớp',
        s.grade_id as 'Khối',
        ps.title as 'Tên bài kiểm tra',
        s.score as 'Điểm số',
        s.max_score as 'Thang điểm',
        ROUND((s.score / s.max_score) * 100, 1) as 'Tỷ lệ %',
        s.duration_sec as 'Thời gian làm bài (giây)',
        CASE WHEN s.is_first_attempt = 1 THEN 'Lần 1' ELSE 'Làm lại' END as 'Lần thi',
        s.submitted_at as 'Thời gian nộp bài'
      FROM Submissions s
      LEFT JOIN Practice_Sets ps ON s.set_id = ps.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (classId) {
      sql += ' AND s.class_id = ?';
      params.push(classId);
    }
    if (gradeId) {
      sql += ' AND s.grade_id = ?';
      params.push(parseInt(gradeId, 10));
    }
    if (setId) {
      sql += ' AND s.set_id = ?';
      params.push(setId);
    }

    sql += ' ORDER BY s.class_id ASC, s.score DESC, s.duration_sec ASC';

    const records = db.prepare(sql).all(...params);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu lượt làm bài nào thỏa mãn bộ lọc' }, { status: 404 });
    }

    // Tạo file Excel bằng SheetJS
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Điểm');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const filename = `Bao_Cao_Diem_${classId || (gradeId ? `Khoi_${gradeId}` : 'Toan_Truong')}_${Date.now()}.xlsx`;

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

