'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Trophy,
  XCircle,
  TrendingUp,
  Target,
  PieChart,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
} from 'recharts';

interface ReportsData {
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  lossRate: number;
  followupSummary: Record<string, number>;
}

const PIE_COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

const statusBarColors: Record<string, string> = {
  New: '#6b7280',
  Contacted: '#14b8a6',
  Interested: '#0ea5e9',
  'Proposal Sent': '#f59e0b',
  Won: '#10b981',
  Lost: '#ef4444',
};

export function CrmReports({ isBasic = false }: { isBasic?: boolean }) {
  const { user } = useAppStore();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(`/api/crm/reports?companyId=${user?.companyId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (user?.companyId) fetchReports();
  }, [user?.companyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500">No report data available.</p>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: 'Total Leads',
      value: data.totalLeads,
      icon: Users,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: 'Won Leads',
      value: data.wonLeads,
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      subtitle: `${data.conversionRate}% conversion`,
    },
    {
      label: 'Lost Leads',
      value: data.lostLeads,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      subtitle: `${data.lossRate}% loss rate`,
    },
    {
      label: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ];

  const sourceData = Object.entries(data.leadsBySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
  }));

  const statusData = Object.entries(data.leadsByStatus).map(([name, value]) => ({
    name,
    count: value,
    color: statusBarColors[name] || '#6b7280',
  }));

  const followupData = [
    { label: 'Pending', value: data.followupSummary['pending'] || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: data.followupSummary['completed'] || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overdue', value: data.followupSummary['overdue'] || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ].filter((f) => f.value > 0);

  const totalFollowups = followupData.reduce((sum, f) => sum + f.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                    )}
                  </div>
                  <div className={`${card.bg} p-2.5 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads by Source - Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-teal-600" />
              Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Status - Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Leads by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-600" />
            Follow-up Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalFollowups > 0 ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {followupData.map((item) => {
                  const Icon = item.icon;
                  const percentage = ((item.value / totalFollowups) * 100).toFixed(0);
                  return (
                    <div key={item.label} className="text-center">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${item.bg} mb-2`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-xs text-gray-400">{percentage}%</p>
                    </div>
                  );
                })}
              </div>

              {/* Simple bar visualization */}
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                {followupData.map((item, idx) => {
                  const width = (item.value / totalFollowups) * 100;
                  const bgColors = ['bg-amber-500', 'bg-emerald-500', 'bg-red-500'];
                  return (
                    <div
                      key={item.label}
                      className={`${bgColors[idx]} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                {followupData.map((item) => (
                  <span key={item.label} className="text-xs text-gray-400">
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Target className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No follow-up data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Table */}
      {sourceData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Leads</TableHead>
                  <TableHead className="text-xs">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceData
                  .sort((a, b) => b.value - a.value)
                  .map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.value}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {data.totalLeads > 0
                          ? ((item.value / data.totalLeads) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
