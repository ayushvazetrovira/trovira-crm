import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { leadId, newStatus } = body;

    if (!leadId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, newStatus' },
        { status: 400 }
      );
    }

    // Find the current lead
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create stage history and update lead in transaction
    const result = await db.$transaction(async (tx) => {
      const history = await tx.leadStageHistory.create({
        data: {
          leadId,
          fromStage: lead.status,
          toStage: newStatus,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: { status: newStatus },
      });

      return { history, lead: updatedLead };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
