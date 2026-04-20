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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PlanItem {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  leadLimit: number;
  isActive: boolean;
  features: string | null;
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 0, userLimit: 0, leadLimit: 0, isActive: false, features: [] as string[] });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      const json = await res.json();
      const activePlan = json[0];
      if (activePlan) {
        setPlan(activePlan);
        setFormData({
          name: activePlan.name,
          price: activePlan.price,
          userLimit: activePlan.userLimit,
          leadLimit: activePlan.leadLimit,
          isActive: activePlan.isActive,
          features: activePlan.features ? JSON.parse(activePlan.features) : troviraPlanFeatures,
        });
      }
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const saveData = {
        ...formData,
        features: JSON.stringify(formData.features),
      };
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
      setFormData({
        name: updatedPlan.name,
        price: updatedPlan.price,
        userLimit: updatedPlan.userLimit,
        leadLimit: updatedPlan.leadLimit,
        isActive: updatedPlan.isActive,
        features: updatedPlan.features ? JSON.parse(updatedPlan.features) : troviraPlanFeatures,
      });
      toast.success('Plan updated successfully');
      setEditing(false);
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  }, [plan, formData]);

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

    const displayFeatures = plan.features ? JSON.parse(plan.features) : troviraPlanFeatures;

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
                  {plan?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {editing ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="ml-2 h-7 px-3"
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="ml-2 h-7 px-3"
                  >
                    Edit Plan
                  </Button>
                )}
                <span className="text-xs text-gray-500">
                  {plan._count.companies} client{plan._count.companies !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
<div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              ₹{plan?.price?.toLocaleString('en-IN') || '0'}/<span className="text-lg">month</span>
            </p>
            <p className="text-sm text-gray-500">Billed monthly per company</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
{editing ? (
                <div className="space-y-3 p-4 bg-white/80 rounded-xl border">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    min="0"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
                  <Users className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-sm font-semibold text-gray-900">{plan?.userLimit}</p>
                  </div>
                </div>
              )}
{editing ? (
                <>
                  <div className="space-y-3 p-4 bg-white/80 rounded-xl border">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">User Limit</label>
                    <input
                      type="number"
                      value={formData.userLimit}
                      onChange={(e) => setFormData({...formData, userLimit: parseInt(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      min="1"
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white/80 rounded-xl border">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Lead Limit (999999 = Unlimited)</label>
                    <input
                      type="number"
                      value={formData.leadLimit}
                      onChange={(e) => setFormData({...formData, leadLimit: parseInt(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white/80 rounded-xl border col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Features (JSON array)</label>
                    <Textarea
                      value={JSON.stringify(formData.features, null, 2)}
                      onChange={(e) => {
                        try {
                          const feats = JSON.parse(e.target.value);
                          if (Array.isArray(feats)) {
                            setFormData({...formData, features: feats});
                          }
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full text-xs font-mono min-h-[150px] resize-vertical"
                      placeholder={JSON.stringify(troviraPlanFeatures.slice(0,3), null, 2)}
                    />
                    <p className="text-xs text-gray-500 mt-1">["Feature 1", "Feature 2", ...]</p>
                  </div>
                  <div className="space-y-3 p-4 bg-white/80 rounded-xl border">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Active</label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
                  <Target className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-500">Lead Limit</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {plan?.leadLimit >= 999999 ? 'Unlimited' : plan?.leadLimit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
          </div>

          {editing ? (
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={saving || !plan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          ) : (
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
          )}
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
                <Package className="h-5 w-5 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-500">Price / Month</p>
                <p className="text-sm font-semibold text-emerald-600">Contact Sales</p>
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
