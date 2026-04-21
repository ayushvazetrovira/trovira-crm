// Empty file for broadcast dashboard - paste your code here

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Send,
  CheckCheck,
  BookOpen,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { BroadcastDrillDownDrawer } from './broadcast-drilldown-drawer';

export type DrillDownStatus = 'sent' | 'delivered' | 'read' | 'failed';

interface BroadcastStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
}

interface MetricCard {
  key: DrillDownStatus;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  description: string;
}

export function BroadcastDashboard() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<BroadcastStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<DrillDownStatus | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/broadcast/stats?companyId=${user.companyId}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Failed to load broadcast stats');
      }
    } catch {
      toast.error('Failed to load broadcast stats');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCardClick = (status: DrillDownStatus) => {
    setActiveStatus(status);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Small delay before clearing so drawer close animation completes
    setTimeout(() => setActiveStatus(null), 300);
  };

  const cards: MetricCard[] = [
    {
      key: 'sent',
      label: 'Total Sent',
      value: stats?.totalSent ?? 0,
      icon: <Send className="w-5 h-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200 hover:border-blue-400',
      description: 'Messages dispatched to WhatsApp',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: stats?.totalDelivered ?? 0,
      icon: <CheckCheck className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200 hover:border-emerald-400',
      description: 'Successfully reached recipient',
    },
    {
      key: 'read',
      label: 'Read',
      value: stats?.totalRead ?? 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200 hover:border-violet-400',
      description: 'Opened and read by recipient',
    },
    {
      key: 'failed',
      label: 'Failed',
      value: stats?.totalFailed ?? 0,
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200 hover:border-red-400',
      description: 'Could not be delivered',
    },
  ];

  const deliveryRate =
    stats && stats.totalSent > 0
      ? Math.round((stats.totalDelivered / stats.totalSent) * 100)
      : 0;

  const readRate =
    stats && stats.totalDelivered > 0
      ? Math.round((stats.totalRead / stats.totalDelivered) * 100)
      : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Broadcast Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click any card to inspect individual message records
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>
                Delivery rate:{' '}
                <span className="font-semibold text-foreground">{deliveryRate}%</span>
              </span>
            </div>
            <div className="text-muted-foreground/50">|</div>
            <div>
              Read rate:{' '}
              <span className="font-semibold text-foreground">{readRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`
                cursor-pointer border-2 transition-all duration-200 select-none
                ${card.border}
                ${activeStatus === card.key && drawerOpen ? 'ring-2 ring-offset-1 ring-current scale-[0.98]' : ''}
                hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
              `}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  {/* Click hint */}
                  <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                    View →
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm font-medium mt-0.5">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drill-down Drawer */}
      {activeStatus && (
        <BroadcastDrillDownDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          status={activeStatus}
          companyId={user?.companyId ?? ''}
        />
      )}
    </div>
  );
}