'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  UserPlus,
  Eye,
  Trophy,
  XCircle,
  Clock,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Activity,
  BarChart3,
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
} from 'recharts';
import { format } from 'date-fns';

interface DashboardData {
  leadsByStatus: Record<string, number>;
  todayFollowups: number;
  todayFollowupList: Array<{
    id: string;
    date: string;
    time: string | null;
    purpose: string;
    lead: { id: string; name: string; phone: string; company: string | null };
  }>;
  overdueFollowups: number;
  recentLeads: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    source: string;
    status: string;
    company: string | null;
    createdAt: string;
  }>;
  totalLeads: number;
  totalFollowups: number;
  recentActivities: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  New: 'bg-gray-100 text-gray-700',
  Contacted: 'bg-white text-gray-600 border border-gray-300',
  Interested: 'bg-sky-100 text-sky-800',
  'Proposal Sent': 'bg-amber-100 text-amber-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-red-100 text-red-800',
};

const barColors = ['#6b7280', '#14b8a6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
      {status}
    </Badge>
  );
}

export function CrmDashboard() {
  const { user } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/crm/dashboard?companyId=${user?.companyId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    if (user?.companyId) fetchDashboard();
  }, [user?.companyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500">No dashboard data available.</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: 'Total Leads', value: data.totalLeads, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'New Leads', value: data.leadsByStatus['New'] || 0, icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Interested', value: data.leadsByStatus['Interested'] || 0, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Won', value: data.leadsByStatus['Won'] || 0, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Lost', value: data.leadsByStatus['Lost'] || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Follow-ups', value: data.todayFollowups, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const chartData = Object.entries(data.leadsByStatus).map(([key, value], idx) => ({
    name: key,
    count: value,
    color: barColors[idx % barColors.length],
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Today Follow-ups */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead Status Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Lead Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
                No leads data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Follow-ups */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Today&apos;s Follow-ups
              {data.todayFollowups > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 ml-1">
                  {data.todayFollowups}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayFollowupList.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {data.todayFollowupList.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fu.lead.name}</p>
                      <p className="text-xs text-gray-500 truncate">{fu.purpose}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {fu.time || format(new Date(fu.date), 'hh:mm a')}
                      </p>
                      <p className="text-xs text-gray-400">{fu.lead.company || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
                <Calendar className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No follow-ups scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLeads.slice(0, 5).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-sm">{lead.name}</TableCell>
                      <TableCell className="text-sm text-gray-500 capitalize">{lead.source}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Users className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No leads yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-teal-500 mt-1.5" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Activity className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No activity recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {data.overdueFollowups > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                You have {data.overdueFollowups} overdue follow-up{data.overdueFollowups > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600">Please check your follow-ups section.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
