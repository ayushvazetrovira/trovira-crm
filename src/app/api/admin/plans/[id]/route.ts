import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const plan = await db.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { name, price, userLimit, leadLimit, isActive } = body;

    const updated = await db.plan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(userLimit !== undefined && { userLimit }),
        ...(leadLimit !== undefined && { leadLimit }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { companies: true, subscriptions: true, payments: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
