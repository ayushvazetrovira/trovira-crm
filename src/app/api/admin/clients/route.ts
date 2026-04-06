import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { contactPerson: { contains: search } },
            { email: { contains: search } },
            { mobile: { contains: search } },
          ],
        }
      : {};

    const companies = await db.company.findMany({
      where,
      include: {
        plan: true,
        users: { select: { id: true, name: true, email: true, role: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { leads: true, payments: true, tickets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(companies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      contactPerson,
      mobile,
      email,
      password,
      planId,
      subscriptionStartDate,
      subscriptionExpiryDate,
    } = body;

    if (!name || !contactPerson || !mobile || !email || !password || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contactPerson, mobile, email, password, planId' },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create company, user, subscription, and payment in a transaction
    const result = await db.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          contactPerson,
          mobile,
          email,
          planId,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: contactPerson,
          password,
          role: 'client',
          companyId: company.id,
        },
      });

      const startDate = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date();
      const expiryDate = subscriptionExpiryDate
        ? new Date(subscriptionExpiryDate)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

      const subscription = await tx.subscription.create({
        data: {
          companyId: company.id,
          planId,
          startDate,
          expiryDate,
          status: 'active',
        },
      });

      const payment = await tx.payment.create({
        data: {
          companyId: company.id,
          planId,
          amount: plan.price,
          method: 'UPI',
          status: 'paid',
        },
      });

      return { company, user, subscription, payment };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
