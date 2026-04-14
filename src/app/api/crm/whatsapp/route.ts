import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/whatsapp?companyId=xxx&action=contacts
// GET /api/crm/whatsapp?companyId=xxx&action=messages&contactId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const action = searchParams.get('action');
    const contactId = searchParams.get('contactId');

    if (!companyId || !action) {
      return NextResponse.json({ error: 'companyId and action are required' }, { status: 400 });
    }

    if (action === 'contacts') {
      const contacts = await db.whatsAppContact.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ contacts });
    }

    if (action === 'messages') {
      if (!contactId) {
        return NextResponse.json({ error: 'contactId is required for messages' }, { status: 400 });
      }
      const messages = await db.whatsAppMessage.findMany({
        where: { contactId },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ error: 'Invalid action. Use "contacts" or "messages"' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST /api/crm/whatsapp — Create message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, content, direction } = body;

    if (!contactId || !content) {
      return NextResponse.json(
        { error: 'contactId and content are required' },
        { status: 400 }
      );
    }

    const contact = await db.whatsAppContact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const message = await db.whatsAppMessage.create({
      data: {
        contactId,
        content: content.trim(),
        direction: direction || 'outgoing',
      },
    });

    // Update contact's lastMessage and lastTime
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    await db.whatsAppContact.update({
      where: { id: contactId },
      data: {
        lastMessage: content.trim().substring(0, 50),
        lastTime: timeStr,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT /api/crm/whatsapp — Update contact (mark read, update lastMessage, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, unread, lastMessage, lastTime } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact id is required' }, { status: 400 });
    }

    const existing = await db.whatsAppContact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updateData: Prisma.WhatsAppContactUpdateInput = {};
    if (unread !== undefined) updateData.unread = unread;
    if (lastMessage !== undefined) updateData.lastMessage = lastMessage;
    if (lastTime !== undefined) updateData.lastTime = lastTime;

    const contact = await db.whatsAppContact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error updating WhatsApp contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
