import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';
import type { Payment } from '@prisma/client';

async function getBase64Image() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/logo.jpg`);
  if (!res.ok) throw new Error('Failed to fetch logo');

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            name: true,
            contactPerson: true,
            mobile: true,
            email: true,
          },
        },
        plan: {
          select: { name: true },
        },
      },
    }) as Payment & { company: any; plan: any } | null;

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const base64Logo = await getBase64Image();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    const formattedAmount = payment.amount.toLocaleString('en-IN');

    // ===== HEADER =====
    doc.addImage(
      `data:image/jpeg;base64,${base64Logo}`,
      'JPEG',
      margin,
      15,
      30,
      18
    );

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Trovira CRM', margin + 40, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Invoice', margin + 40, 28);

    // Right side (invoice info)
    doc.setFontSize(10);
    doc.text(`Invoice #: ${payment.id.toUpperCase()}`, pageWidth - margin, 20, { align: 'right' });
    doc.text(
      `Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`,
      pageWidth - margin,
      26,
      { align: 'right' }
    );
    doc.text(`Status: ${payment.status.toUpperCase()}`, pageWidth - margin, 32, {
      align: 'right',
    });

    let y = 55;

    // ===== BILL TO =====
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', margin, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(payment.company.name, margin, y);
    y += 5;
    doc.text(payment.company.contactPerson, margin, y);
    y += 5;
    doc.text(payment.company.email, margin, y);
    y += 5;
    doc.text(payment.company.mobile, margin, y);

    y += 15;

    // ===== TABLE HEADER =====
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, y);
    doc.text('Plan', 90, y);
    doc.text('Qty', 130, y);
    doc.text('Amount', pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // ===== TABLE ROW =====
    doc.setFont('helvetica', 'normal');
    doc.text('Subscription Payment', margin, y);
    doc.text(payment.plan.name, 90, y);
    doc.text('1', 130, y);
    doc.text(`Rs. ${formattedAmount}`, pageWidth - margin, y, { align: 'right' });

    y += 20;

    // ===== TOTAL BOX =====
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 80, y, pageWidth - margin, y);

    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Total', pageWidth - 80, y);
    doc.text(`Rs. ${formattedAmount}`, pageWidth - margin, y, {
      align: 'right',
    });

    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${payment.method.toUpperCase()}`, margin, y);

    // ===== FOOTER =====
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

    doc.setFontSize(9);
    doc.text(
      'Thank you for your business!',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );

    const buffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${payment.id.slice(
          0,
          8
        )}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}