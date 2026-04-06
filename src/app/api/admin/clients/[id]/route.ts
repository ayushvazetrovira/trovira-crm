import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await db.company.findUnique({
      where: { id },
      include: {
        plan: true,
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: { plan: true },
          orderBy: { paymentDate: 'desc' },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
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

    const company = await db.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { name, contactPerson, mobile, email, planId, status } = body;

    const updated = await db.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(mobile !== undefined && { mobile }),
        ...(email !== undefined && { email }),
        ...(planId !== undefined && { planId }),
        ...(status !== undefined && { status }),
      },
      include: { plan: true },
    });

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
    const company = await db.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Suspend the company instead of hard delete
    const suspended = await db.company.update({
      where: { id },
      data: { status: 'suspended' },
      include: { plan: true },
    });

    return NextResponse.json({ message: 'Company suspended', company: suspended });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
