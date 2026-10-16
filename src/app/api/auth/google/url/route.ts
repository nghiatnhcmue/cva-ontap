export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OAUTH_CONFIG, getGoogleAuthUrl } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!GOOGLE_OAUTH_CONFIG.clientId) {
      return NextResponse.json({
        configured: false,
        message: 'Google Client ID chưa được điền trong .env',
      });
    }

    const authUrl = getGoogleAuthUrl(redirectUri);
    return NextResponse.json({
      configured: true,
      authUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
