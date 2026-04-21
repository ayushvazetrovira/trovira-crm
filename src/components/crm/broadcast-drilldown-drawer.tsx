'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Send,
  CheckCheck,
  BookOpen,
  XCircle,
  Search,
  Phone,
  User,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { DrillDownStatus } from './broadcast-dashboard';

interface MessageRecord {
  id: string;
  recipientName: string;
  recipientPhone: string;
  status: string;
  sentAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  campaignName: string;
}

interface BroadcastDrillDownDrawerProps {
  open: boolean;
  onClose: () => void;
  status: DrillDownStatus;
  companyId: string;
}

const PAGE_SIZE = 20;

const STATUS_META: Record<
  DrillDownStatus,
  { label: string; icon: React.ReactNode; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  sent: {
    label: 'Sent',
    icon: <Send className="w-4 h-4" />,
    color: 'text-blue-600',
    badgeVariant: 'outline',
  },
  delivered: {
    label: 'Delivered',
    icon: <CheckCheck className="w-4 h-4" />,
    color: 'text-emerald-600',
    badgeVariant: 'default',
  },
  read: {
    label: 'Read',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'text-violet-600',
    badgeVariant: 'secondary',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    badgeVariant: 'destructive',
  },
};

function EmptyIcon({ status }: { status: DrillDownStatus }) {
  const cls = 'w-10 h-10';
  if (status === 'sent')      return <Send className={cls} />;
  if (status === 'delivered') return <CheckCheck className={cls} />;
  if (status === 'read')      return <BookOpen className={cls} />;
  return <XCircle className={cls} />;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function BroadcastDrillDownDrawer({
  open,
  onClose,
  status,
  companyId,
}: BroadcastDrillDownDrawerProps) {
  const [records, setRecords] = useState<MessageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [campaigns, setCampaigns] = useState<string[]>([]);

  const meta = STATUS_META[status];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchRecords = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
        status,
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(search && { search }),
        ...(dateFilter !== 'all' && { dateFilter }),
        ...(campaignFilter !== 'all' && { campaign: campaignFilter }),
      });

      const res = await fetch(`/api/crm/broadcast/messages?${params}`);
      const data = await res.json();

      if (res.ok) {
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
        // Collect unique campaign names for filter dropdown
        if (data.campaigns) setCampaigns(data.campaigns);
      } else {
        toast.error(data.error || 'Failed to load message records');
      }
    } catch {
      toast.error('Failed to load message records');
    } finally {
      setLoading(false);
    }
  }, [companyId, status, page, search, dateFilter, campaignFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, campaignFilter, status]);

  useEffect(() => {
    if (open) fetchRecords();
  }, [open, fetchRecords]);

  // Relevant timestamp for each status
  const getTimestamp = (r: MessageRecord): string => {
    if (status === 'delivered') return formatDateTime(r.deliveredAt);
    if (status === 'read') return formatDateTime(r.readAt);
    if (status === 'failed') return formatDateTime(r.failedAt);
    return formatDateTime(r.sentAt);
  };

  const timestampLabel =
    status === 'delivered' ? 'Delivered At'
    : status === 'read' ? 'Read At'
    : status === 'failed' ? 'Failed At'
    : 'Sent At';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className={meta.color}>{meta.icon}</span>
            <SheetTitle className="text-base">
              {meta.label} Messages
            </SheetTitle>
            <Badge variant={meta.badgeVariant} className="ml-1 tabular-nums">
              {total.toLocaleString()}
            </Badge>
          </div>
          <SheetDescription className="text-xs mt-0.5">
            Individual WhatsApp message records — click a row to inspect
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="px-6 py-3 border-b bg-muted/30 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={fetchRecords}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Date filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            {/* Campaign filter */}
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center text-muted-foreground">
              <span className={`mb-3 opacity-30 ${meta.color}`}>
                <EmptyIcon status={status} />
              </span>
              <p className="font-medium">No records found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="px-6 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: recipient info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {r.recipientName || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{r.recipientPhone}</span>
                      </div>
                      {r.campaignName && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {r.campaignName}
                          </Badge>
                        </div>
                      )}
                      {status === 'failed' && r.failureReason && (
                        <p className="text-xs text-red-500 mt-1 truncate">
                          ✕ {r.failureReason}
                        </p>
                      )}
                    </div>

                    {/* Right: status + timestamp */}
                    <div className="text-right shrink-0">
                      <Badge variant={meta.badgeVariant} className="text-[10px] mb-1">
                        {meta.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground justify-end">
                        <Clock className="w-3 h-3" />
                        <span>{getTimestamp(r)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-6 py-3 border-t bg-background flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}