import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const followup = await db.followup.findUnique({ where: { id } });
    if (!followup) {
      return NextResponse.json({ error: 'Followup not found' }, { status: 404 });
    }

    const { status, date, time, purpose, notes } = body;

    const updated = await db.followup.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(purpose !== undefined && { purpose }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
