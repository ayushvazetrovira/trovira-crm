'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, DollarSign, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardData {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  totalLeads: number;
  planDistribution: Record<string, number>;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  color: string;
}) {
  return (
    <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            {description && <p className="text-xs text-neutral-400">{description}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="border-neutral-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const planChartData = data
    ? Object.entries(data.planDistribution).map(([name, value]) => ({ name, value }))
    : [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard
              title="Total Clients"
              value={data.totalClients}
              icon={Users}
              color="bg-neutral-800"
            />
            <StatCard
              title="Active Clients"
              value={data.activeClients}
              icon={UserCheck}
              description={`${Math.round((data.activeClients / Math.max(data.totalClients, 1)) * 100)}% of total`}
              color="bg-emerald-600"
            />
            <StatCard
              title="Inactive / Suspended"
              value={data.expiredClients}
              icon={UserX}
              color="bg-red-500"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${data.monthlyRevenue.toLocaleString('en-IN')}`}
              icon={DollarSign}
              description={`${data.activeSubscriptions} active subscriptions`}
              color="bg-amber-500"
            />
            <StatCard
              title="Total Leads"
              value={data.totalLeads}
              icon={Target}
              description="Across all clients"
              color="bg-violet-600"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Skeleton className="h-64 w-64 rounded-full" />
              </div>
            ) : planChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {planChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} companies`, 'Count']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-neutral-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-neutral-400">
                No plan data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Overview */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900">Subscription Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : data ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-neutral-700">Active Subscriptions</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{data.activeSubscriptions}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-neutral-700">Expired Subscriptions</span>
                  </div>
                  <span className="text-lg font-bold text-red-500">{data.expiredSubscriptions}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700">Total Subscriptions</span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900">{data.totalSubscriptions}</span>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600 mb-1">Estimated Monthly Revenue</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ₹{data.monthlyRevenue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
