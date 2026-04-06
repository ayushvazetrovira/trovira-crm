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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Target, Package, CheckCircle2, XCircle, Star } from 'lucide-react';
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

const planFeatures: Record<string, string[]> = {
  Starter: [
    'Lead Management (Add, Edit, Delete)',
    'Basic Pipeline (6 Stages)',
    'Follow-up Reminders',
    'Lead Notes',
    'Basic Reports',
    'WhatsApp Lead Capture',
    '1 User Access',
    '500 Lead Limit',
  ],
  Business: [
    'Everything in Starter',
    'Advanced Pipeline',
    'Task Management',
    'Team Management (Up to 5 Users)',
    'Send & Receive Email',
    'WhatsApp Inbox',
    'Export Lead Data',
    'Advanced Reports',
    '5,000 Lead Limit',
  ],
  Pro: [
    'Everything in Business',
    'Workflow Automation',
    'WhatsApp Broadcast',
    'Custom Fields',
    'API / Integrations',
    'Remove Branding',
    'Custom Pipelines',
    'Role Management',
    '15 Users Access',
    'Unlimited Leads',
  ],
};

const planColors: Record<string, { bg: string; border: string; iconBg: string; iconText: string; badge: string }> = {
  Starter: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-100',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    badge: 'bg-gray-200 text-gray-700',
  },
  Business: {
    bg: 'bg-gradient-to-br from-teal-50 to-emerald-50',
    border: 'border-teal-200',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-700',
  },
  Pro: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
};

export function AdminPlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      const json = await res.json();
      setPlans(json);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[500px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
        <p className="text-sm text-gray-500 mt-1">Manage your fixed subscription plans for clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const colors = planColors[plan.name] || planColors['Starter'];
          const features = planFeatures[plan.name] || [];
          const isPopular = plan.name === 'Business';

          return (
            <Card key={plan.id} className={`relative overflow-hidden ${colors.bg} ${colors.border} border`}>
              {isPopular && (
                <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
                    <Package className={`h-5 w-5 ${colors.iconText}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`${colors.badge} border-0 text-xs`}>
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
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2.5 bg-white/60 rounded-lg">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Users</p>
                      <p className="text-sm font-semibold text-gray-900">{plan.userLimit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white/60 rounded-lg">
                    <Target className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Lead Limit</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {plan.leadLimit >= 999999 ? 'Unlimited' : plan.leadLimit.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</p>
                  <div className="space-y-2">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans Summary Table */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Plans Overview
            </h4>
          </div>
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Plan Name</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Users</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Lead Limit</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Active Clients</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-neutral-50 transition-colors">
                    <TableCell className="font-medium text-neutral-900">{plan.name}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ₹{plan.price.toLocaleString('en-IN')}/mo
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <Users className="h-3.5 w-3.5" />
                        {plan.userLimit}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <Target className="h-3.5 w-3.5" />
                        {plan.leadLimit >= 999999 ? 'Unlimited' : plan.leadLimit.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-neutral-500">
                      {plan._count.companies}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          plan.isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
