import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = { companyId };

    if (status === 'today') {
      where.date = { gte: today, lt: tomorrow };
      where.status = 'pending';
    } else if (status === 'upcoming') {
      where.date = { gte: tomorrow };
      where.status = 'pending';
    } else if (status === 'overdue') {
      where.date = { lt: today };
      where.status = 'pending';
    } else if (status === 'completed') {
      where.status = 'completed';
    }

    const followups = await db.followup.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, phone: true, company: true, status: true } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(followups);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, companyId, date, time, purpose, notes } = body;

    if (!leadId || !companyId || !date || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, companyId, date, purpose' },
        { status: 400 }
      );
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const followup = await db.followup.create({
      data: {
        leadId,
        companyId,
        date: new Date(date),
        time: time || null,
        purpose,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
      },
    });

    // Also update the lead's followupDate
    await db.lead.update({
      where: { id: leadId },
      data: { followupDate: new Date(date) },
    });

    return NextResponse.json(followup, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
