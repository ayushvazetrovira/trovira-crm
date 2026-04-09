import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/emails?companyId=xxx&folder=inbox&search=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const folder = searchParams.get('folder') || '';
    const search = searchParams.get('search') || '';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const andConditions: Prisma.CrmEmailWhereInput[] = [{ companyId }];

    if (folder && folder !== 'all' && folder !== 'starred') {
      andConditions.push({ folder });
    }

    if (search) {
      andConditions.push({
        OR: [
          { subject: { contains: search } },
          { fromName: { contains: search } },
          { fromEmail: { contains: search } },
          { toEmail: { contains: search } },
          { preview: { contains: search } },
        ],
      });
    }

    const emails = await db.crmEmail.findMany({
      where: { AND: andConditions },
      orderBy: { createdAt: 'desc' },
    });

    // If folder is 'starred', filter on the client side since it's a boolean field
    const result = folder === 'starred'
      ? emails.filter(e => e.isStarred)
      : emails;

    return NextResponse.json({ emails: result });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// POST /api/crm/emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, fromName, fromEmail, toEmail, subject, preview, body: emailBody, folder, hasAttachment } = body;

    if (!companyId || !toEmail || !subject) {
      return NextResponse.json(
        { error: 'companyId, toEmail, and subject are required' },
        { status: 400 }
      );
    }

    const email = await db.crmEmail.create({
      data: {
        companyId,
        fromName: fromName || '',
        fromEmail: fromEmail || '',
        toEmail,
        subject,
        preview: preview || (emailBody ? emailBody.substring(0, 100) : ''),
        body: emailBody || '',
        folder: folder || 'sent',
        hasAttachment: hasAttachment || false,
        isRead: true,
      },
    });

    return NextResponse.json({ email }, { status: 201 });
  } catch (error) {
    console.error('Error creating email:', error);
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
  }
}

// PUT /api/crm/emails
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, isStarred, folder } = body;

    if (!id) {
      return NextResponse.json({ error: 'Email id is required' }, { status: 400 });
    }

    const existing = await db.crmEmail.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const updateData: Prisma.CrmEmailUpdateInput = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (folder !== undefined) updateData.folder = folder;

    const email = await db.crmEmail.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}

// DELETE /api/crm/emails?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Email id is required' }, { status: 400 });
    }

    const existing = await db.crmEmail.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    await db.crmEmail.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
  }
}
