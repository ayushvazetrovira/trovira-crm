import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { companyId };

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          followups: {
            where: { status: 'pending' },
            orderBy: { date: 'asc' },
            take: 1,
          },
          _count: {
            select: { notesList: true, stageHistory: true, followups: true },
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, phone, email, company, source, status, followupDate, notes, value } = body;

    if (!companyId || !name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, name, phone' },
        { status: 400 }
      );
    }

    // Check company lead limit
    const companyData = await db.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (companyData) {
      const leadCount = await db.lead.count({ where: { companyId } });
      if (leadCount >= companyData.plan.leadLimit) {
        return NextResponse.json(
          { error: `Lead limit reached (${companyData.plan.leadLimit}). Please upgrade your plan.` },
          { status: 400 }
        );
      }
    }

    const lead = await db.lead.create({
      data: {
        companyId,
        name,
        phone,
        email: email || null,
        company: company || null,
        source: source || 'manual',
        status: status || 'New',
        followupDate: followupDate ? new Date(followupDate) : null,
        notes: notes || null,
        value: value || null,
      },
    });

    // Create initial stage history entry
    await db.leadStageHistory.create({
      data: {
        leadId: lead.id,
        fromStage: null,
        toStage: status || 'New',
      },
    });

    // Create a note if provided
    if (notes) {
      await db.leadNote.create({
        data: {
          leadId: lead.id,
          content: notes,
        },
      });
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
