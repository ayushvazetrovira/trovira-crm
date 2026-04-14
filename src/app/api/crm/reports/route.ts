import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const [
      leadsByStatus,
      leadsBySource,
      totalLeads,
      wonLeads,
      lostLeads,
      followupStats,
    ] = await Promise.all([
      // Leads by status
      db.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),

      // Leads by source
      db.lead.groupBy({
        by: ['source'],
        where: { companyId },
        _count: { id: true },
      }),

      // Total leads
      db.lead.count({ where: { companyId } }),

      // Won leads
      db.lead.count({ where: { companyId, status: 'Won' } }),

      // Lost leads
      db.lead.count({ where: { companyId, status: 'Lost' } }),

      // Follow-up summary
      db.followup.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
    ]);

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const item of leadsByStatus) {
      statusMap[item.status] = item._count.id;
    }

    // Build source map
    const sourceMap: Record<string, number> = {};
    for (const item of leadsBySource) {
      sourceMap[item.source] = item._count.id;
    }

    // Build follow-up map
    const followupMap: Record<string, number> = {};
    for (const item of followupStats) {
      followupMap[item.status] = item._count.id;
    }

    // Conversion rates
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';
    const lossRate = totalLeads > 0 ? ((lostLeads / totalLeads) * 100).toFixed(1) : '0';

    return NextResponse.json({
      leadsByStatus: statusMap,
      leadsBySource: sourceMap,
      totalLeads,
      wonLeads,
      lostLeads,
      conversionRate: parseFloat(conversionRate),
      lossRate: parseFloat(lossRate),
      followupSummary: followupMap,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
