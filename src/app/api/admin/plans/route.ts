import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, userLimit, leadLimit, isActive } = body;

    if (!name || price === undefined || userLimit === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, userLimit' },
        { status: 400 }
      );
    }

    const plan = await db.plan.create({
      data: {
        name,
        price,
        userLimit,
        leadLimit: leadLimit || 500,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
