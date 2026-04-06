import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      leadsByStatus,
      todayFollowups,
      recentLeads,
      totalLeads,
      totalFollowups,
      recentActivities,
    ] = await Promise.all([
      // Leads grouped by status
      db.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),

      // Today's follow-ups
      db.followup.findMany({
        where: {
          companyId,
          date: { gte: today, lt: tomorrow },
          status: 'pending',
        },
        include: {
          lead: { select: { id: true, name: true, phone: true, company: true } },
        },
        orderBy: { date: 'asc' },
      }),

      // Recent leads (last 10)
      db.lead.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Total lead count
      db.lead.count({ where: { companyId } }),

      // Total follow-up count
      db.followup.count({ where: { companyId } }),

      // Recent activity logs
      db.activityLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const item of leadsByStatus) {
      statusMap[item.status] = item._count.id;
    }

    // Overdue follow-ups
    const overdueFollowups = await db.followup.count({
      where: {
        companyId,
        date: { lt: today },
        status: 'pending',
      },
    });

    return NextResponse.json({
      leadsByStatus: statusMap,
      todayFollowups: todayFollowups.length,
      todayFollowupList: todayFollowups,
      overdueFollowups,
      recentLeads,
      totalLeads,
      totalFollowups,
      recentActivities,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
