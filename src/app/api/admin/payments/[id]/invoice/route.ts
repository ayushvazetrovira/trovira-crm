import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';
import type { Payment } from '@prisma/client';

// ── helpers ────────────────────────────────────────────────────────────────

async function getBase64Image(path: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

/** Convert a number to Indian-style words */
function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function below100(num: number): string {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  }
  function below1000(num: number): string {
    if (num < 100) return below100(num);
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + below100(num % 100) : '');
  }
  function convert(num: number): string {
    if (num === 0) return 'Zero';
    if (num < 1000) return below1000(num);
    if (num < 100000) return below1000(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + below1000(num % 1000) : '');
    if (num < 10000000) return below1000(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return below1000(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  }

  const rupees = Math.floor(n);
  const paise  = Math.round((n - rupees) * 100);
  let words    = convert(rupees) + ' Rupees';
  if (paise > 0) words += ' and ' + below100(paise) + ' Paise';
  words += ' Only';
  return words;
}

/** Try to load a QR PNG from /public/upi-qr.png — returns null if missing */
async function getQRBase64(): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/upi-qr1.jpg`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  } catch {
    return null;
  }
}

// ── route ──────────────────────────────────────────────────────────────────

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
        plan: { select: { name: true } },
      },
    }) as Payment & { company: any; plan: any } | null;

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // ── tax calculations ──────────────────────────────────────────────────
    const subtotal = payment.amount;
    const cgst     = parseFloat((subtotal * 0.09).toFixed(2));
    const sgst     = parseFloat((subtotal * 0.09).toFixed(2));
    const total    = parseFloat((subtotal + cgst + sgst).toFixed(2));
    const fmt      = (n: number) =>
      n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const payDate     = new Date(payment.paymentDate);
    const fmtDate     = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const invoiceDate = fmtDate(payDate);
    const dueDate     = fmtDate(new Date(payDate.getTime() + 14 * 86400000));
    const invoiceNum  = `INV-${payDate.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;

    // ── assets ───────────────────────────────────────────────────────────
    const base64Logo = await getBase64Image('/logo.jpg');
    const qrBase64   = await getQRBase64();

    // ── PDF setup ────────────────────────────────────────────────────────
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW  = doc.internal.pageSize.getWidth();
    const PH  = doc.internal.pageSize.getHeight();
    const ML  = 15;
    const MR  = 15;
    const RX  = PW - MR;

    // ── colour helpers ────────────────────────────────────────────────────
    type RGB = { r: number; g: number; b: number };
    const NAVY:  RGB = { r: 26,  g: 54,  b: 93  };
    const BLUE:  RGB = { r: 41,  g: 98,  b: 162 };
    const GREEN: RGB = { r: 22,  g: 163, b: 74  };
    const LGRAY: RGB = { r: 245, g: 247, b: 250 };
    const DGRAY: RGB = { r: 100, g: 116, b: 139 };
    const WHITE: RGB = { r: 255, g: 255, b: 255 };
    const BLACK: RGB = { r: 30,  g: 30,  b: 30  };

    const fill = (c: RGB) => doc.setFillColor(c.r, c.g, c.b);
    const draw = (c: RGB) => doc.setDrawColor(c.r, c.g, c.b);
    const text = (c: RGB) => doc.setTextColor(c.r, c.g, c.b);

    // ════════════════════════════════════════════════════════════════════
    // 1 ▸ HEADER
    // ════════════════════════════════════════════════════════════════════
    let y = 14;

    doc.addImage(`data:image/jpeg;base64,${base64Logo}`, 'JPEG', ML, y - 2, 22, 14);

    text(NAVY);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text('TROVIRA CRM', ML + 26, y + 5);

    text(NAVY);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', RX, y + 7, { align: 'right' });

    y += 20;
    draw(BLUE); doc.setLineWidth(0.4); doc.line(ML, y, RX, y);
    y += 6;

    // ════════════════════════════════════════════════════════════════════
    // 2 ▸ SELLER  |  INVOICE META
    // ════════════════════════════════════════════════════════════════════
    const colMid   = PW / 2 + 5;
    const metaLX   = colMid + 5;
    const metaVX   = metaLX + 34;
    const sellerY0 = y;

    // Seller
    text(BLACK); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Trovira CRM Pvt. Ltd.', ML, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); text(DGRAY);
    [
      '123, Business Park, Mumbai,',
      'Maharashtra - 400001, India',
      'GSTIN: 27ABCDE1234F1Z5',
      'Email: billing@trovira.com',
      'Phone: +91 98765 43210',
      'Website: www.troviracrm.com',
    ].forEach(line => { y += 5; doc.text(line, ML, y); });

    // Vertical rule
    draw({ r: 210, g: 222, b: 236 }); doc.setLineWidth(0.3);
    doc.line(colMid, sellerY0 - 4, colMid, y + 2);

    // Invoice meta
    const metaItems: Array<{ label: string; value: string; green?: boolean }> = [
      { label: 'Invoice #:',       value: invoiceNum },
      { label: 'Invoice Date:',    value: invoiceDate },
      { label: 'Due Date:',        value: dueDate },
      { label: 'Status:',          value: payment.status.toUpperCase(), green: true },
      { label: 'Place of Supply:', value: 'Maharashtra (27)' },
    ];
    let metaY = sellerY0;
    metaItems.forEach(item => {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); text(BLACK);
      doc.text(item.label, metaLX, metaY);
      doc.setFont('helvetica', item.green ? 'bold' : 'normal');
      text(item.green ? GREEN : DGRAY);
      doc.text(item.value, metaVX, metaY);
      metaY += 6;
    });

    y += 8;
    draw({ r: 210, g: 222, b: 236 }); doc.setLineWidth(0.3); doc.line(ML, y, RX, y);
    y += 8;

    // ════════════════════════════════════════════════════════════════════
    // 3 ▸ BILL TO  |  Invoice icon
    // ════════════════════════════════════════════════════════════════════
    text(BLUE); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', ML, y);
    draw(BLUE); doc.setLineWidth(1.2); doc.line(ML, y + 1.8, ML + 14, y + 1.8);
    doc.setLineWidth(0.3);
    y += 7;

    text(BLACK); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(payment.company.name, ML, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); text(DGRAY);
    [
      payment.company.contactPerson,
      payment.company.email,
      payment.company.mobile,
    ].forEach(line => { doc.text(line, ML, y); y += 5; });

    // (invoice card illustration removed)

    y += 5;
    draw({ r: 210, g: 222, b: 236 }); doc.setLineWidth(0.3); doc.line(ML, y, RX, y);
    y += 4;

    // ════════════════════════════════════════════════════════════════════
    // 4 ▸ ITEMS TABLE
    // ════════════════════════════════════════════════════════════════════
    const COL = { num: ML, desc: ML + 10, plan: ML + 78, qty: ML + 122, rate: ML + 142, amt: RX };
    const tableW = RX - ML;

    fill(NAVY); doc.rect(ML, y, tableW, 9, 'F');
    text(WHITE); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text('#',            COL.num + 1, y + 6);
    doc.text('DESCRIPTION',  COL.desc,    y + 6);
    doc.text('PLAN',         COL.plan,    y + 6);
    doc.text('QTY',          COL.qty,     y + 6);
    doc.text('RATE (₹)',     COL.rate,    y + 6);
    doc.text('AMOUNT (₹)',   COL.amt,     y + 6, { align: 'right' });
    y += 9;

    fill(LGRAY); doc.rect(ML, y, tableW, 13, 'F');
    text(BLACK); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const rY = y + 8.5;
    doc.text('1',                    COL.num + 1, rY);
    doc.text('Subscription Payment', COL.desc,    rY);
    doc.text(payment.plan.name,      COL.plan,    rY);
    doc.text('1',                    COL.qty,     rY);
    doc.text(fmt(subtotal),          COL.rate,    rY);
    doc.text(fmt(subtotal),          COL.amt,     rY, { align: 'right' });
    y += 13;

    draw({ r: 200, g: 215, b: 230 }); doc.setLineWidth(0.3); doc.line(ML, y, RX, y);
    y += 10;

    // ════════════════════════════════════════════════════════════════════
    // 5 ▸ AMOUNT IN WORDS (left)  |  TOTALS (right)
    // ════════════════════════════════════════════════════════════════════
    const totalsLX = colMid + 5;
    const totalsVX = RX;
    const wordsStartY = y;

    text(BLUE); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', ML, y + 2);
    text(BLACK); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const wordLines: string[] = doc.splitTextToSize(numberToWords(total), colMid - ML - 6);
    wordLines.forEach((line: string, i: number) => doc.text(line, ML, y + 8 + i * 5));

    // Totals
    let tY = y;
    const totalsData: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: 'Subtotal',   value: fmt(subtotal) },
      { label: 'CGST (9%)', value: fmt(cgst) },
      { label: 'SGST (9%)', value: fmt(sgst) },
      { label: 'Total',      value: fmt(total), bold: true },
    ];
    totalsData.forEach(row => {
      const sz = row.bold ? 10 : 9;
      doc.setFontSize(sz);
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
      text(row.bold ? BLACK : DGRAY);
      doc.text(row.label, totalsLX, tY + 2);
      text(BLACK);
      doc.text(row.value, totalsVX, tY + 2, { align: 'right' });
      tY += row.bold ? 8 : 6;
    });

    // Amount Paid highlight
    fill({ r: 220, g: 252, b: 231 });
    doc.roundedRect(totalsLX - 3, tY, RX - totalsLX + 3, 9, 2, 2, 'F');
    text(GREEN); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Amount Paid', totalsLX + 1, tY + 6.2);
    doc.text(fmt(total), totalsVX - 1, tY + 6.2, { align: 'right' });

    y = Math.max(tY + 16, wordsStartY + wordLines.length * 5 + 14);

    draw({ r: 210, g: 222, b: 236 }); doc.setLineWidth(0.3); doc.line(ML, y, RX, y);
    y += 8;

    // ════════════════════════════════════════════════════════════════════
    // 6 ▸ PAYMENT DETAILS (left)  |  QR CODE (right)
    // ════════════════════════════════════════════════════════════════════
    text(BLUE); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', ML, y);
    draw(BLUE); doc.setLineWidth(1.2); doc.line(ML, y + 1.8, ML + 37, y + 1.8);
    doc.setLineWidth(0.3);
    y += 7;

    const payDetails: [string, string][] = [
      ['Payment Method:', payment.method.toUpperCase()],
      ['Payment Date:',   invoiceDate],
      ['Bank:',           'HDFC Bank'],
      ['UPI ID:',         'billing@trovira'],
    ];
    payDetails.forEach(([label, value]) => {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); text(BLACK);
      doc.text(label, ML, y);
      doc.setFont('helvetica', 'normal'); text(DGRAY);
      doc.text(value, ML + 36, y);
      y += 6;
    });

    // QR
    const qrX  = colMid + 15;
    const qrY0 = y - 30;

    text(BLUE); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('SCAN & PAY (UPI)', qrX, qrY0 - 4);
    draw(BLUE); doc.setLineWidth(1.2); doc.line(qrX, qrY0 - 2.5, qrX + 37, qrY0 - 2.5);
    doc.setLineWidth(0.3);

    if (qrBase64) {
      doc.addImage(`data:image/png;base64,${qrBase64}`, 'PNG', qrX, qrY0, 40, 40);
    } else {
      // Placeholder — replace /public/upi-qr.png with a real QR to auto-use it
      fill({ r: 240, g: 244, b: 250 }); draw({ r: 180, g: 200, b: 220 });
      doc.setLineWidth(0.5); doc.rect(qrX, qrY0, 40, 40, 'FD');
      text(DGRAY); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
      doc.text('Place upi-qr.png',  qrX + 3, qrY0 + 18);
      doc.text('in /public folder', qrX + 3, qrY0 + 24);
    }

    text(DGRAY); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    doc.text('UPI ID: billing@trovira', qrX + 2, qrY0 + 44);

    // ════════════════════════════════════════════════════════════════════
    // 7 ▸ FOOTER
    // ════════════════════════════════════════════════════════════════════
    const footerY = PH - 22;
    draw({ r: 210, g: 222, b: 236 }); doc.setLineWidth(0.3); doc.line(ML, footerY - 5, RX, footerY - 5);

    text(BLUE); doc.setFontSize(10); doc.setFont('helvetica', 'bolditalic');
    doc.text('Thank you for your business!', PW / 2, footerY, { align: 'center' });

    // ── Output ──────────────────────────────────────────────────────────
    const buffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}