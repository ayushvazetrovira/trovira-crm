import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/tasks?companyId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status') || '';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const andConditions: Prisma.CrmTaskWhereInput[] = [{ companyId }];

    // Filter by status
    if (status && status !== 'all') {
      andConditions.push({ status });
    }

    const tasks = await db.crmTask.findMany({
      where: { AND: andConditions },
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/crm/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, title, description, assignedTo, dueDate, priority, status } = body;

    if (!companyId || !title) {
      return NextResponse.json(
        { error: 'companyId and title are required' },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    const task = await db.crmTask.create({
      data: {
        companyId,
        title: title.trim(),
        description: (description || '').trim(),
        assignedTo: (assignedTo || '').trim(),
        dueDate: dueDate || '',
        priority: priority || 'medium',
        status: status || 'pending',
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT /api/crm/tasks
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, assignedTo, dueDate, priority, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    // Verify task exists
    const existing = await db.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: Prisma.CrmTaskUpdateInput = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo.trim();
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;

    const task = await db.crmTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/crm/tasks?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    // Verify task exists
    const existing = await db.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.crmTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
