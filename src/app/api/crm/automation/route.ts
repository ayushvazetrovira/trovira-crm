import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/automation?companyId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status') || '';
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    const where: Prisma.AutomationRuleWhereInput = { companyId };
    if (status && status !== 'all') where.status = status;
    const rules = await db.automationRule.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ rules });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// POST /api/crm/automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, trigger, action, description, status } = body;
    if (!companyId || !name) return NextResponse.json({ error: 'companyId and name required' }, { status: 400 });
    const rule = await db.automationRule.create({
      data: { companyId, name, trigger: trigger || 'new_lead_created', action: action || 'send_whatsapp', description: description || '', status: status || 'active' }
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// PUT /api/crm/automation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const rule = await db.automationRule.update({ where: { id }, data });
    return NextResponse.json({ rule });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// DELETE /api/crm/automation?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.automationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
