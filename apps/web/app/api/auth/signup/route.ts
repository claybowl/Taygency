import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/auth';
import { sendEmail } from '@/lib/sendgrid';

interface SignupRequest {
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SignupRequest = await req.json();

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await createUser({ email: body.email });

    await sendEmail({
      to: body.email,
      subject: 'Welcome to Vibe Planning!',
      text: `Welcome to Vibe Planning!

You're all set up. Here's how to get started:

1. Reply to this email with a list of everything you need to do
2. I'll organize and categorize your tasks
3. Text me anytime for quick updates

Just hit reply and brain dump - I'll take it from there.

- Your Vibe Planning Assistant`,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error('[Auth Signup] Error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
