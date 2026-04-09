import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/webhooks?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    const webhooks = await db.webhook.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ webhooks });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// POST /api/crm/webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, url, events, status } = body;
    if (!companyId || !name || !url) return NextResponse.json({ error: 'companyId, name, url required' }, { status: 400 });
    const webhook = await db.webhook.create({
      data: { companyId, name, url, events: events || '', status: status || 'active' }
    });
    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// PUT /api/crm/webhooks
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Webhook id is required' }, { status: 400 });
    const existing = await db.webhook.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    const webhook = await db.webhook.update({ where: { id }, data });
    return NextResponse.json({ webhook });
  } catch (error) { console.error('Error updating webhook:', error); return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 }); }
}

// DELETE /api/crm/webhooks?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Webhook id is required' }, { status: 400 });
    const existing = await db.webhook.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    await db.webhook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { console.error('Error deleting webhook:', error); return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 }); }
}
