import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/broadcasts?companyId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status') || '';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const andConditions: Prisma.BroadcastWhereInput[] = [{ companyId }];

    if (status) {
      andConditions.push({ status });
    }

    const broadcasts = await db.broadcast.findMany({
      where: { AND: andConditions },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

// POST /api/crm/broadcasts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, message, recipients, status } = body;

    if (!companyId || !name || !message) {
      return NextResponse.json(
        { error: 'companyId, name, and message are required' },
        { status: 400 }
      );
    }

    if (!name.trim()) {
      return NextResponse.json({ error: 'Campaign name cannot be empty' }, { status: 400 });
    }

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const broadcast = await db.broadcast.create({
      data: {
        companyId,
        name: name.trim(),
        message: message.trim(),
        recipients: recipients || 0,
        status: status || 'draft',
        delivered: 0,
        readCount: 0,
        failed: 0,
      },
    });

    return NextResponse.json({ broadcast }, { status: 201 });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}

// PUT /api/crm/broadcasts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, message, recipients, status, delivered, readCount, failed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Broadcast id is required' }, { status: 400 });
    }

    // Verify broadcast exists
    const existing = await db.broadcast.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    const updateData: Prisma.BroadcastUpdateInput = {};
    if (name !== undefined) updateData.name = name.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (recipients !== undefined) updateData.recipients = recipients;
    if (status !== undefined) updateData.status = status;
    if (delivered !== undefined) updateData.delivered = delivered;
    if (readCount !== undefined) updateData.readCount = readCount;
    if (failed !== undefined) updateData.failed = failed;

    const broadcast = await db.broadcast.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ broadcast });
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
  }
}

// DELETE /api/crm/broadcasts?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Broadcast id is required' }, { status: 400 });
    }

    // Verify broadcast exists
    const existing = await db.broadcast.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    await db.broadcast.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
  }
}
