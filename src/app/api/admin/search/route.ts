import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  page: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase();

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Parallel searches
    const [clients, tickets, plans, subscriptions, payments] = await Promise.all([
      db.company.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { id: { contains: q } },
          ],
        },
        select: { id: true, name: true },
        take: 3,
      }),
      db.supportTicket.findMany({
        where: {
          OR: [
            { subject: { contains: q, mode: 'insensitive' } },
            { issue: { contains: q, mode: 'insensitive' } },
            { id: { contains: q } },
          ],
        },
        include: { company: { select: { name: true } } },
        take: 3,
      }),
      db.plan.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { id: { contains: q } },
          ],
        },
        select: { id: true, name: true },
        take: 2,
      }),
      db.subscription.findMany({
        where: {
          OR: [
            { id: { contains: q } },
          ],
        },
        include: {
          company: { select: { name: true } },
          plan: { select: { name: true } },
        },
        take: 2,
      }),
      // ✅ FIXED: removed `select` — use `include` only, pick fields manually
      db.payment.findMany({
        where: {
          OR: [
            { id: { contains: q } },
            { company: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          company: { select: { name: true } },
        },
        take: 3,
      }),
    ]);

    const results: SearchResult[] = [];

    // Format clients
    clients.forEach((client) => {
      results.push({
        id: client.id,
        title: client.name,
        category: 'Client',
        page: 'clients',
      });
    });

    // Format tickets
    tickets.forEach((ticket) => {
      results.push({
        id: ticket.id,
        title: ticket.subject,
        category: `Support - ${ticket.company.name}`,
        page: 'support',
      });
    });

    // Format plans
    plans.forEach((plan) => {
      results.push({
        id: plan.id,
        title: plan.name,
        category: 'Plan',
        page: 'plans',
      });
    });

    // Format subscriptions
    subscriptions.forEach((sub) => {
      results.push({
        id: sub.id,
        title: `${sub.company.name} - ${sub.plan.name}`,
        category: 'Subscription',
        page: 'subscriptions',
      });
    });

    // Format payments
    payments.forEach((pay) => {
      results.push({
        id: pay.id,
        title: `${pay.company.name} - ₹${pay.amount}`,
        category: `Payment (${pay.method})`,
        page: 'payments',
      });
    });

    return NextResponse.json(results.slice(0, 10));
  } catch (error: unknown) {
    console.error('Search error:', error);
    return NextResponse.json([]);
  }
}