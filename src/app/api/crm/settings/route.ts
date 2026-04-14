import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const settings = await db.crmSetting.findFirst({
      where: { companyId },
    });

    if (!settings) {
      return NextResponse.json({
        businessName: '',
        whatsappNumber: '',
        logo: '',
        email: '',
        phone: '',
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const body = await request.json();
    const { businessName, whatsappNumber, logo, email, phone } = body;

    // Upsert: update if exists, create if not
    const existing = await db.crmSetting.findFirst({
      where: { companyId },
    });

    let settings;
    if (existing) {
      settings = await db.crmSetting.update({
        where: { id: existing.id },
        data: {
          ...(businessName !== undefined && { businessName }),
          ...(whatsappNumber !== undefined && { whatsappNumber }),
          ...(logo !== undefined && { logo }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
      });
    } else {
      settings = await db.crmSetting.create({
        data: {
          companyId,
          businessName: businessName || null,
          whatsappNumber: whatsappNumber || null,
          logo: logo || null,
          email: email || null,
          phone: phone || null,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
