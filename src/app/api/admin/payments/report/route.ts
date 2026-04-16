import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';

export async function GET() {
  try {
    const payments = await db.payment.findMany({
      include: {
        company: {
          select: {
            name: true,
            contactPerson: true,
          },
        },
        plan: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TROVIRA CRM - Payments Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 35);

    // Table
    const tableData = payments.map(p => [
      p.company.name,
      p.plan.name,
      `₹${p.amount}`,
      new Date(p.paymentDate).toLocaleDateString('en-IN'),
      p.method,
      p.status,
    ]);

    (doc as any).autoTable({
      head: [['Company', 'Plan', 'Amount', 'Date', 'Method', 'Status']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [45, 150, 80], textColor: 255, fontSize: 10 },
      styles: { fontSize: 8 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 250;
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${payments.length}`, 14, finalY + 20);
    doc.text('Total Revenue: ₹' + payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0), 14, finalY + 30);

    const buffer = Buffer.from(doc.output('arraybuffer') as ArrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="payments-report.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 });
  }
}
