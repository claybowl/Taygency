import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth';

interface VerifyRequest {
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyRequest = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await findUserByEmail(body.email);

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      userId: user.id,
      hasPhone: !!user.phone,
    });
  } catch (error) {
    console.error('[Auth Verify] Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
