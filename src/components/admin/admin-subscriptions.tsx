'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ArrowUpCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Subscription {
  id: string;
  startDate: string;
  expiryDate: string;
  status: string;
  company: { id: string; name: string; contactPerson: string; mobile: string };
  plan: Plan;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <Badge variant="outline" className={variants[status] || 'bg-neutral-100 text-neutral-700'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'renew' | 'upgrade' | 'extend'>('renew');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [newPlanId, setNewPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (!res.ok) throw new Error('Failed to load subscriptions');
      const json = await res.json();
      setSubscriptions(json);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const json = await res.json();
        setPlans(json);
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openDialog = (sub: Subscription, mode: 'renew' | 'upgrade' | 'extend') => {
    setSelectedSub(sub);
    setDialogMode(mode);
    setNewPlanId('');
    setExtendDays('30');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedSub) return;
    setSubmitting(true);

    try {
      const body: Record<string, string> = {};
      if (dialogMode === 'extend') {
        const currentExpiry = new Date(selectedSub.expiryDate);
        const days = parseInt(extendDays) || 30;
        const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
        body.expiryDate = newExpiry.toISOString();
        body.status = 'active';
      } else if (dialogMode === 'upgrade') {
        if (!newPlanId) {
          toast.error('Please select a new plan');
          setSubmitting(false);
          return;
        }
        body.planId = newPlanId;
        body.status = 'active';
      } else {
        // Renew: reset expiry to 30 days from now
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        body.expiryDate = newExpiry.toISOString();
        body.status = 'active';
      }

      const res = await fetch(`/api/admin/subscriptions/${selectedSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Operation failed');
      }

      const actionLabel = dialogMode === 'renew' ? 'Renewed' : dialogMode === 'upgrade' ? 'Upgraded' : 'Extended';
      toast.success(`Subscription ${actionLabel} successfully`);
      setDialogOpen(false);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-180px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-neutral-400">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-neutral-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-neutral-900">{sub.company.name}</p>
                          <p className="text-xs text-neutral-400">{sub.company.contactPerson}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                          {sub.plan.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-neutral-500">
                        {formatDate(sub.startDate)}
                      </TableCell>
                      <TableCell className="text-neutral-500">
                        {formatDate(sub.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => openDialog(sub, 'renew')}
                            title="Renew for 30 days"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Renew</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                            onClick={() => openDialog(sub, 'upgrade')}
                            title="Change plan"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Upgrade</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => openDialog(sub, 'extend')}
                            title="Extend subscription"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Extend</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'renew' && 'Renew Subscription'}
              {dialogMode === 'upgrade' && 'Upgrade Plan'}
              {dialogMode === 'extend' && 'Extend Subscription'}
            </DialogTitle>
            <DialogDescription>
              {selectedSub && (
                <>
                  For <span className="font-semibold text-neutral-900">{selectedSub.company.name}</span>
                  {' '}on <span className="font-semibold">{selectedSub.plan.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {dialogMode === 'renew' && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
                This will renew the subscription for 30 days from today and set status to active.
              </div>
            )}

            {dialogMode === 'extend' && (
              <div className="space-y-3">
                <Label htmlFor="extend-days">Extend by (days)</Label>
                <Input
                  id="extend-days"
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  min="1"
                  max="365"
                  placeholder="30"
                />
                <p className="text-xs text-neutral-500">
                  Current expiry: {selectedSub ? formatDate(selectedSub.expiryDate) : 'N/A'}
                </p>
              </div>
            )}

            {dialogMode === 'upgrade' && (
              <div className="space-y-3">
                <Label htmlFor="new-plan">Select New Plan</Label>
                <Select value={newPlanId} onValueChange={setNewPlanId}>
                  <SelectTrigger id="new-plan">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans
                      .filter((p) => p.isActive && p.id !== selectedSub?.plan.id)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price.toLocaleString('en-IN')}/mo
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Upgrading will change the company plan and create a new payment entry.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting
                ? 'Processing...'
                : dialogMode === 'renew'
                ? 'Renew Now'
                : dialogMode === 'upgrade'
                ? 'Upgrade Plan'
                : 'Extend Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
