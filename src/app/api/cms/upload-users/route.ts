export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseUserFile, upsertUsersToDatabase } from '@/lib/excel-parser';
import { ALLOWED_DOMAIN } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền đồng bộ phân quyền từ file Excel/CSV' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file .xlsx hoặc .csv để tải lên' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file người dùng với parser tự động nhận diện header và format
    // và KHÓA CỨNG chỉ nhận email @ttgdtxcva.edu.vn
    const { users, rejected, totalRows } = parseUserFile(buffer, file.name);

    if (users.length === 0) {
      return NextResponse.json(
        {
          error: `Không tìm thấy bản ghi nào có email hợp lệ thuộc tên miền @${ALLOWED_DOMAIN}. Tất cả ${rejected.length} dòng đã bị loại bỏ vì sai tên miền.`,
          rejected,
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = upsertUsersToDatabase(db, users);

    let message = `Đồng bộ thành công ${result.total} người dùng thuộc tên miền @${ALLOWED_DOMAIN} (Thêm mới: ${result.inserted}, Cập nhật: ${result.updated}).`;
    if (rejected.length > 0) {
      message += ` Đã tự động loại bỏ ${rejected.length} dòng không thuộc @${ALLOWED_DOMAIN} (@gmail.com hoặc domain lạ).`;
    }

    return NextResponse.json({
      success: true,
      message,
      stats: {
        ...result,
        rejectedCount: rejected.length,
        rejectedDetails: rejected.slice(0, 10), // Trả về tối đa 10 dòng đầu để xem chi tiết
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
