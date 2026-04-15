import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const tickets = await db.supportTicket.findMany({
      where: { companyId },
      include: {
        company: { 
          select: { 
            id: true, 
            name: true, 
            contactPerson: true 
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const body = await request.json();
    const { subject, issue, priority } = body;

    if (!subject || !issue) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, issue' },
        { status: 400 }
      );
    }

    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        companyId,
        subject,
        issue,
        priority: priority || 'medium',
        status: 'open',
      },
      include: {
        company: { 
          select: { id: true, name: true } 
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

