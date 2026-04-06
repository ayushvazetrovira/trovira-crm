import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const subscription = await db.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const { planId, expiryDate, status } = body;

    // If upgrading the plan, also update company plan and create a payment
    let updatedSubscription;
    if (planId && planId !== subscription.planId) {
      const plan = await db.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const result = await db.$transaction(async (tx) => {
        // Update subscription
        const sub = await tx.subscription.update({
          where: { id },
          data: {
            ...(planId && { planId }),
            ...(expiryDate && { expiryDate: new Date(expiryDate) }),
            ...(status && { status }),
          },
          include: {
            company: { select: { id: true, name: true } },
            plan: true,
          },
        });

        // Update company plan
        await tx.company.update({
          where: { id: subscription.companyId },
          data: { planId },
        });

        // Create payment for the new plan
        const payment = await tx.payment.create({
          data: {
            companyId: subscription.companyId,
            planId,
            amount: plan.price,
            method: 'UPI',
            status: 'paid',
          },
        });

        return { subscription: sub, payment };
      });

      return NextResponse.json(result);
    }

    // Simple renewal/extension
    updatedSubscription = await db.subscription.update({
      where: { id },
      data: {
        ...(planId && { planId }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(status && { status }),
      },
      include: {
        company: { select: { id: true, name: true } },
        plan: true,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
