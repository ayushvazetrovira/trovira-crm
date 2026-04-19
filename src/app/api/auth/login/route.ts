import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        company: {
          include: {
            plan: true,
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const activeSubscription = user.company?.subscriptions?.[0] || null;

    return NextResponse.json({
      user: {
        id: user.id,
        isTeamMember: user.role.startsWith('team_'),

        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name,
        planName: user.company?.plan?.name,
        planId: user.company?.planId,
        subscriptionExpiry: activeSubscription?.expiryDate || null,
        subscriptionStatus: activeSubscription?.status || 'none',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
