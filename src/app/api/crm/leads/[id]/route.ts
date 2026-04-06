import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        notesList: {
          orderBy: { createdAt: 'desc' },
        },
        stageHistory: {
          orderBy: { createdAt: 'desc' },
        },
        followups: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { name, phone, email, company, source, status, followupDate, notes, value } = body;

    const updated = await db.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(source !== undefined && { source }),
        ...(status !== undefined && { status }),
        ...(followupDate !== undefined && { followupDate: followupDate ? new Date(followupDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(value !== undefined && { value }),
      },
    });

    // If status changed, record in stage history
    if (status && status !== lead.status) {
      await db.leadStageHistory.create({
        data: {
          leadId: id,
          fromStage: lead.status,
          toStage: status,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete related records first, then the lead
    await db.$transaction(async (tx) => {
      await tx.leadNote.deleteMany({ where: { leadId: id } });
      await tx.leadStageHistory.deleteMany({ where: { leadId: id } });
      await tx.followup.deleteMany({ where: { leadId: id } });
      await tx.lead.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
