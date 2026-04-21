import { NextRequest, NextResponse } from 'next/server';

// GET /api/crm/broadcast/stats?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // ── DUMMY DATA — replace with real DB queries when ready ────────
    const stats = {
      totalSent: 1284,
      totalDelivered: 1198,
      totalRead: 876,
      totalFailed: 86,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching broadcast stats:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcast stats' }, { status: 500 });
  }
}