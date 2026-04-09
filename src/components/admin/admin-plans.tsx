'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Users, Target, Package, CheckCircle2, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface PlanItem {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  leadLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { companies: number; subscriptions: number; payments: number };
}

const troviraPlanFeatures = [
  'Lead Management (Add, Edit, Delete)',
  'Advanced Pipeline (Custom Stages)',
  'Follow-up Reminders & Scheduling',
  'Lead Notes & Stage History',
  'Task Management',
  'Team Management (Up to 15 Users)',
  'Send & Receive Email',
  'WhatsApp Inbox & Broadcast',
  'Export Lead Data',
  'Advanced Reports & Analytics',
  'Workflow Automation',
  'API / Integrations',
  'Custom Fields & Branding',
  'Unlimited Leads',
];

export function AdminPlans() {
  const [plan, setPlan] = useState<PlanItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      const json = await res.json();
      setPlan(json[0] || null);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        No plan configured
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Trovira Plan</h3>
        <p className="text-sm text-gray-500 mt-1">Your single subscription plan for all clients</p>
      </div>

      {/* Single Plan Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200">
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Active
        </div>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {plan._count.companies} client{plan._count.companies !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
              <Users className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Users</p>
                <p className="text-sm font-semibold text-gray-900">{plan.userLimit}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
              <Target className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Lead Limit</p>
                <p className="text-sm font-semibold text-gray-900">
                  {plan.leadLimit >= 999999 ? 'Unlimited' : plan.leadLimit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Features Included</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {troviraPlanFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Summary */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Plan Overview
            </h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <Package className="h-5 w-5 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-500">Plan Name</p>
                <p className="text-sm font-semibold text-neutral-900">{plan.name}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <span className="text-xl">₹</span>
                <p className="text-xs text-neutral-500">Price / Month</p>
                <p className="text-sm font-semibold text-emerald-600">₹{plan.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-500">User Limit</p>
                <p className="text-sm font-semibold text-neutral-900">{plan.userLimit}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <Target className="h-5 w-5 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-500">Lead Limit</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {plan.leadLimit >= 999999 ? 'Unlimited' : plan.leadLimit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
