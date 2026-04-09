import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/notes?companyId=xxx&search=xxx&tag=xxx&color=xxx&pinned=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const color = searchParams.get('color') || '';
    const pinned = searchParams.get('pinned') || '';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const andConditions: Prisma.NoteWhereInput[] = [{ companyId }];

    // Search across title, content, and tags
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
          { tags: { contains: search } },
        ],
      });
    }

    // Filter by tag
    if (tag) {
      andConditions.push({ tags: { contains: tag } });
    }

    // Filter by color
    if (color) {
      andConditions.push({ color });
    }

    // Filter pinned only
    if (pinned === 'true') {
      andConditions.push({ isPinned: true });
    }

    const notes = await db.note.findMany({
      where: { AND: andConditions },
      include: {
        lead: { select: { id: true, name: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/crm/notes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, title, content, color, tags, isPinned, leadId } = body;

    if (!companyId || !title || !content) {
      return NextResponse.json(
        { error: 'companyId, title, and content are required' },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const note = await db.note.create({
      data: {
        companyId,
        title: title.trim(),
        content: content.trim(),
        color: color || 'white',
        isPinned: isPinned || false,
        tags: tags?.trim() || null,
        leadId: leadId || null,
      },
      include: {
        lead: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// PUT /api/crm/notes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, color, tags, isPinned, leadId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }

    // Verify note exists
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const updateData: Prisma.NoteUpdateInput = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (color !== undefined) updateData.color = color;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (tags !== undefined) updateData.tags = tags?.trim() || null;
    if (leadId !== undefined) updateData.lead = leadId ? { connect: { id: leadId } } : { disconnect: true };

    const note = await db.note.update({
      where: { id },
      data: updateData,
      include: {
        lead: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/crm/notes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }

    // Verify note exists
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
