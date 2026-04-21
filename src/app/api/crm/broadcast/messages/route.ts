import { NextRequest, NextResponse } from 'next/server';

// ── Dummy message records ───────────────────────────────────────────────────
const DUMMY_MESSAGES = [
  // SENT / DELIVERED / READ
  { id: '1',  recipientName: 'Ananya Iyer',      recipientPhone: '+91 98765 43210', status: 'read',      campaignName: 'Diwali Offer',     sentAt: '2026-04-20T09:00:00Z', deliveredAt: '2026-04-20T09:01:00Z', readAt: '2026-04-20T09:15:00Z', failedAt: null, failureReason: null },
  { id: '2',  recipientName: 'Priyanka Sharma',  recipientPhone: '+91 91234 56789', status: 'delivered', campaignName: 'Diwali Offer',     sentAt: '2026-04-20T09:01:00Z', deliveredAt: '2026-04-20T09:02:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '3',  recipientName: 'Aditi Rao',        recipientPhone: '+91 93456 78901', status: 'read',      campaignName: 'Diwali Offer',     sentAt: '2026-04-20T09:02:00Z', deliveredAt: '2026-04-20T09:03:00Z', readAt: '2026-04-20T10:00:00Z', failedAt: null, failureReason: null },
  { id: '4',  recipientName: 'Sneha Kulkarni',   recipientPhone: '+91 94567 89012', status: 'failed',    campaignName: 'Diwali Offer',     sentAt: '2026-04-20T09:03:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-20T09:03:05Z', failureReason: 'Number not on WhatsApp' },
  { id: '5',  recipientName: 'Meera Nair',       recipientPhone: '+91 95678 90123', status: 'read',      campaignName: 'Diwali Offer',     sentAt: '2026-04-20T09:04:00Z', deliveredAt: '2026-04-20T09:05:00Z', readAt: '2026-04-20T11:00:00Z', failedAt: null, failureReason: null },
  { id: '6',  recipientName: 'Kavya Reddy',      recipientPhone: '+91 96789 01234', status: 'delivered', campaignName: 'New Year Sale',    sentAt: '2026-04-19T10:00:00Z', deliveredAt: '2026-04-19T10:01:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '7',  recipientName: 'Divya Menon',      recipientPhone: '+91 97890 12345', status: 'read',      campaignName: 'New Year Sale',    sentAt: '2026-04-19T10:01:00Z', deliveredAt: '2026-04-19T10:02:00Z', readAt: '2026-04-19T12:00:00Z', failedAt: null, failureReason: null },
  { id: '8',  recipientName: 'Pooja Desai',      recipientPhone: '+91 98901 23456', status: 'failed',    campaignName: 'New Year Sale',    sentAt: '2026-04-19T10:02:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-19T10:02:10Z', failureReason: 'Opted out of messages' },
  { id: '9',  recipientName: 'Asha Pillai',      recipientPhone: '+91 99012 34567', status: 'read',      campaignName: 'New Year Sale',    sentAt: '2026-04-19T10:03:00Z', deliveredAt: '2026-04-19T10:04:00Z', readAt: '2026-04-19T13:00:00Z', failedAt: null, failureReason: null },
  { id: '10', recipientName: 'Lakshmi Verma',    recipientPhone: '+91 90123 45678', status: 'delivered', campaignName: 'New Year Sale',    sentAt: '2026-04-19T10:04:00Z', deliveredAt: '2026-04-19T10:05:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '11', recipientName: 'Riya Joshi',       recipientPhone: '+91 88765 43210', status: 'read',      campaignName: 'Product Launch',   sentAt: '2026-04-18T08:00:00Z', deliveredAt: '2026-04-18T08:01:00Z', readAt: '2026-04-18T09:00:00Z', failedAt: null, failureReason: null },
  { id: '12', recipientName: 'Nisha Patel',      recipientPhone: '+91 87654 32109', status: 'failed',    campaignName: 'Product Launch',   sentAt: '2026-04-18T08:01:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-18T08:01:05Z', failureReason: 'Invalid phone number' },
  { id: '13', recipientName: 'Sunita Gupta',     recipientPhone: '+91 86543 21098', status: 'delivered', campaignName: 'Product Launch',   sentAt: '2026-04-18T08:02:00Z', deliveredAt: '2026-04-18T08:03:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '14', recipientName: 'Rekha Singh',      recipientPhone: '+91 85432 10987', status: 'read',      campaignName: 'Product Launch',   sentAt: '2026-04-18T08:03:00Z', deliveredAt: '2026-04-18T08:04:00Z', readAt: '2026-04-18T10:30:00Z', failedAt: null, failureReason: null },
  { id: '15', recipientName: 'Geeta Sharma',     recipientPhone: '+91 84321 09876', status: 'read',      campaignName: 'Product Launch',   sentAt: '2026-04-18T08:04:00Z', deliveredAt: '2026-04-18T08:05:00Z', readAt: '2026-04-18T11:00:00Z', failedAt: null, failureReason: null },
  { id: '16', recipientName: 'Uma Krishnan',     recipientPhone: '+91 83210 98765', status: 'failed',    campaignName: 'Flash Sale',       sentAt: '2026-04-17T07:00:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-17T07:00:10Z', failureReason: 'Message template rejected' },
  { id: '17', recipientName: 'Sonal Mehta',      recipientPhone: '+91 82109 87654', status: 'delivered', campaignName: 'Flash Sale',       sentAt: '2026-04-17T07:01:00Z', deliveredAt: '2026-04-17T07:02:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '18', recipientName: 'Tanya Bose',       recipientPhone: '+91 81098 76543', status: 'read',      campaignName: 'Flash Sale',       sentAt: '2026-04-17T07:02:00Z', deliveredAt: '2026-04-17T07:03:00Z', readAt: '2026-04-17T08:00:00Z', failedAt: null, failureReason: null },
  { id: '19', recipientName: 'Vandana Tiwari',   recipientPhone: '+91 80987 65432', status: 'failed',    campaignName: 'Flash Sale',       sentAt: '2026-04-17T07:03:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-17T07:03:05Z', failureReason: 'Account suspended by WhatsApp' },
  { id: '20', recipientName: 'Chitra Nambiar',   recipientPhone: '+91 79876 54321', status: 'read',      campaignName: 'Flash Sale',       sentAt: '2026-04-17T07:04:00Z', deliveredAt: '2026-04-17T07:05:00Z', readAt: '2026-04-17T09:00:00Z', failedAt: null, failureReason: null },
  { id: '21', recipientName: 'Deepa Agarwal',    recipientPhone: '+91 78765 43210', status: 'delivered', campaignName: 'Re-engagement',    sentAt: '2026-04-16T06:00:00Z', deliveredAt: '2026-04-16T06:01:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '22', recipientName: 'Hema Chandran',    recipientPhone: '+91 77654 32109', status: 'read',      campaignName: 'Re-engagement',    sentAt: '2026-04-16T06:01:00Z', deliveredAt: '2026-04-16T06:02:00Z', readAt: '2026-04-16T08:00:00Z', failedAt: null, failureReason: null },
  { id: '23', recipientName: 'Jyoti Rawat',      recipientPhone: '+91 76543 21098', status: 'failed',    campaignName: 'Re-engagement',    sentAt: '2026-04-16T06:02:00Z', deliveredAt: null,                   readAt: null,                   failedAt: '2026-04-16T06:02:08Z', failureReason: 'Number not on WhatsApp' },
  { id: '24', recipientName: 'Kavitha Suresh',   recipientPhone: '+91 75432 10987', status: 'delivered', campaignName: 'Re-engagement',    sentAt: '2026-04-16T06:03:00Z', deliveredAt: '2026-04-16T06:04:00Z', readAt: null,                   failedAt: null, failureReason: null },
  { id: '25', recipientName: 'Leela Bhat',       recipientPhone: '+91 74321 09876', status: 'read',      campaignName: 'Re-engagement',    sentAt: '2026-04-16T06:04:00Z', deliveredAt: '2026-04-16T06:05:00Z', readAt: '2026-04-16T09:30:00Z', failedAt: null, failureReason: null },
];

// Unique campaign names
const ALL_CAMPAIGNS = [...new Set(DUMMY_MESSAGES.map((m) => m.campaignName))];

// GET /api/crm/broadcast/messages?companyId=xxx&status=sent&page=1&pageSize=20&search=&dateFilter=week&campaign=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId  = searchParams.get('companyId');
    const status     = searchParams.get('status') ?? 'sent';
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize   = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20', 10));
    const search     = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const dateFilter = searchParams.get('dateFilter') ?? 'all';
    const campaign   = searchParams.get('campaign') ?? '';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    let results = [...DUMMY_MESSAGES];

    // Status filter — 'sent' shows all records (everything was sent)
    if (status !== 'sent') {
      results = results.filter((m) => m.status === status);
    }

    // Search by name or phone
    if (search) {
      results = results.filter(
        (m) =>
          m.recipientName.toLowerCase().includes(search) ||
          m.recipientPhone.includes(search)
      );
    }

    // Date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let from: Date;
      if (dateFilter === 'today') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      results = results.filter((m) => new Date(m.sentAt) >= from);
    }

    // Campaign filter
    if (campaign) {
      results = results.filter((m) => m.campaignName === campaign);
    }

    const total = results.length;

    // Pagination
    const skip = (page - 1) * pageSize;
    const records = results.slice(skip, skip + pageSize);

    return NextResponse.json({
      records,
      total,
      campaigns: ALL_CAMPAIGNS,
    });
  } catch (error) {
    console.error('Error fetching broadcast messages:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcast messages' }, { status: 500 });
  }
}