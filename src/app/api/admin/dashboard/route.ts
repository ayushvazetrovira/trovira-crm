import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();

    const [totalClients, activeClients, expiredClients, totalLeads, subscriptions, plans] =
      await Promise.all([
        db.company.count(),
        db.company.count({ where: { status: 'active' } }),
        db.company.count({ where: { status: { in: ['inactive', 'suspended'] } } }),
        db.lead.count(),
        db.subscription.findMany({
          include: { plan: true, company: true },
        }),
        db.plan.findMany({ where: { isActive: true } }),
      ]);

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    for (const plan of plans) {
      planDistribution[plan.name] = await db.company.count({
        where: { planId: plan.id },
      });
    }

    // Monthly revenue from active subscriptions
    let monthlyRevenue = 0;
    for (const sub of subscriptions) {
      if (sub.status === 'active') {
        monthlyRevenue += sub.plan.price;
      }
    }

    return NextResponse.json({
      totalClients,
      activeClients,
      expiredClients,
      totalLeads,
      planDistribution,
      monthlyRevenue,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
      expiredSubscriptions: subscriptions.filter((s) => s.status === 'expired').length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
