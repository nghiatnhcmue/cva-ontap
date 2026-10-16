export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xem danh sách người dùng' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const grade = searchParams.get('grade');
    const classId = searchParams.get('class_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let countSql = 'SELECT COUNT(*) as count FROM Users WHERE 1=1';
    let sql = 'SELECT * FROM Users WHERE 1=1';
    const params: any[] = [];

    if (role) {
      countSql += ' AND role = ?';
      sql += ' AND role = ?';
      params.push(role);
    }
    if (grade) {
      countSql += ' AND grade_id = ?';
      sql += ' AND grade_id = ?';
      params.push(grade);
    }
    if (classId) {
      countSql += ' AND class_id = ?';
      sql += ' AND class_id = ?';
      params.push(classId);
    }
    if (search) {
      countSql += ' AND (full_name LIKE ? OR email LIKE ? OR user_code LIKE ?)';
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR user_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const totalRecords = (db.prepare(countSql).get(...params) as any).count;

    sql += ' ORDER BY role ASC, grade_id ASC, class_id ASC, full_name ASC LIMIT ? OFFSET ?';
    const users = db.prepare(sql).all(...params, limit, offset);

    // Lấy danh sách các lớp hiện có để lọc
    const classes = db.prepare(`SELECT DISTINCT class_id, grade_id FROM Users WHERE role = 'STUDENT' AND class_id IS NOT NULL ORDER BY grade_id ASC, class_id ASC`).all();

    return NextResponse.json({
      users,
      classes,
      pagination: {
        page,
        limit,
        total: totalRecords,
        total_pages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
