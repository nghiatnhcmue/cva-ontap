export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !String(clientId).trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập Google Client ID hợp lệ' }, { status: 400 });
    }

    const cleanClientId = String(clientId).trim();
    const cleanSecret = String(clientSecret || '').trim();

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Cập nhật GOOGLE_CLIENT_ID
    if (envContent.includes('GOOGLE_CLIENT_ID=')) {
      envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID=${cleanClientId}`);
    } else {
      envContent += `\nGOOGLE_CLIENT_ID=${cleanClientId}`;
    }

    // Cập nhật NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (envContent.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*/, `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${cleanClientId}`);
    } else {
      envContent += `\nNEXT_PUBLIC_GOOGLE_CLIENT_ID=${cleanClientId}`;
    }

    // Cập nhật GOOGLE_CLIENT_SECRET nếu có
    if (cleanSecret) {
      if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
        envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/, `GOOGLE_CLIENT_SECRET=${cleanSecret}`);
      } else {
        envContent += `\nGOOGLE_CLIENT_SECRET=${cleanSecret}`;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    // Cập nhật trực tiếp process.env trong runtime
    process.env['GOOGLE_CLIENT_ID'] = cleanClientId;
    if (cleanSecret) {
      process.env['GOOGLE_CLIENT_SECRET'] = cleanSecret;
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình Google OAuth thành công!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
