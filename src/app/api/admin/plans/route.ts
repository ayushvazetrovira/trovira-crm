import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const plans = await db.plan.findMany({
      include: {
        _count: {
          select: { companies: true, subscriptions: true, payments: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
