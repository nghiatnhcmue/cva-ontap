export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 1. Admin
    const admins = db.prepare(`SELECT id, email, full_name, role, grade_id, class_id FROM Users WHERE role = 'ADMIN' LIMIT 1`).all();

    // 2. Giáo viên
    const teachers = db.prepare(`SELECT id, email, full_name, role, grade_id, class_id, assigned_subjects FROM Users WHERE role = 'TEACHER' LIMIT 3`).all();

    // 3. Học sinh K10 tiêu biểu
    const studentsK10 = db.prepare(`SELECT id, email, full_name, role, grade_id, class_id, xp_points FROM Users WHERE role = 'STUDENT' AND grade_id = '10' LIMIT 5`).all();

    // 4. Học sinh K11 tiêu biểu
    const studentsK11 = db.prepare(`SELECT id, email, full_name, role, grade_id, class_id, xp_points FROM Users WHERE role = 'STUDENT' AND grade_id = '11' LIMIT 5`).all();

    return NextResponse.json({
      admins,
      teachers: teachers.map((t: any) => ({
        ...t,
        assigned_subjects: JSON.parse(t.assigned_subjects || '[]'),
      })),
      studentsK10,
      studentsK11,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
