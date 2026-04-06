import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const leads = await db.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        followups: {
          where: { status: 'pending' },
          orderBy: { date: 'asc' },
          take: 1,
        },
        _count: {
          select: { notesList: true },
        },
      },
    });

    // Group by status for pipeline view
    const stages = ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Won', 'Lost'];
    const pipeline: Record<string, typeof leads> = {};

    for (const stage of stages) {
      pipeline[stage] = leads.filter((lead) => lead.status === stage);
    }

    // Also include any status not in the predefined stages
    const knownStatuses = new Set(stages);
    for (const lead of leads) {
      if (!knownStatuses.has(lead.status)) {
        if (!pipeline[lead.status]) {
          pipeline[lead.status] = [];
        }
        pipeline[lead.status].push(lead);
      }
    }

    return NextResponse.json({
      pipeline,
      stages,
      totalLeads: leads.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
