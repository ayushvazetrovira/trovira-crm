import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Simple string match - login as super admin
    if (email === 'admin@trovira.com' && password === 'admin123') {
      return NextResponse.json({
        user: {
          id: 'super-admin',
          email: 'admin@trovira.com',
          name: 'Super Admin',
          role: 'admin',
          isTeamMember: false,
          companyId: null,
          companyName: null,
          planName: 'Super Admin',
          planId: null,
          subscriptionExpiry: null,
          subscriptionStatus: 'active',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
