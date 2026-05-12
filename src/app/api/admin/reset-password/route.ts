import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getServerSession } from 'next-auth'; // if using NextAuth, else check auth header

export async function POST(request: Request) {
  try {
    // TODO: Add auth check - only super admin
    // const session = await getServerSession();
    // if (session?.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Super admin only' }, { status: 403 });
    // }

    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

