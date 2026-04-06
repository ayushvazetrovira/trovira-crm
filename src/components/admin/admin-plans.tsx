'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Plus, Users, Target } from 'lucide-react';
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

export function AdminPlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    userLimit: '',
    leadLimit: '',
    isActive: true,
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    price: '',
    userLimit: '',
    leadLimit: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

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

  const openEdit = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      price: String(plan.price),
      userLimit: String(plan.userLimit),
      leadLimit: String(plan.leadLimit),
      isActive: plan.isActive,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const body: Record<string, string | boolean | number> = {};
      if (editForm.name !== selectedPlan.name) body.name = editForm.name;
      if (editForm.price !== String(selectedPlan.price)) body.price = parseInt(editForm.price) || 0;
      if (editForm.userLimit !== String(selectedPlan.userLimit)) body.userLimit = parseInt(editForm.userLimit) || 1;
      if (editForm.leadLimit !== String(selectedPlan.leadLimit)) body.leadLimit = parseInt(editForm.leadLimit) || 500;
      if (editForm.isActive !== selectedPlan.isActive) body.isActive = editForm.isActive;

      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update plan');
      }

      toast.success('Plan updated successfully');
      setEditOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name || !createForm.price || !createForm.userLimit) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          price: parseInt(createForm.price) || 0,
          userLimit: parseInt(createForm.userLimit) || 1,
          leadLimit: parseInt(createForm.leadLimit) || 500,
          isActive: createForm.isActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create plan');
      }

      toast.success('Plan created successfully');
      setCreateOpen(false);
      setCreateForm({ name: '', price: '', userLimit: '', leadLimit: '', isActive: true });
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Plan Name</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Users</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Lead Limit</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Companies</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-neutral-400">
                      No plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
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
                          {plan.leadLimit.toLocaleString('en-IN')}
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(plan)}
                          title="Edit Plan"
                        >
                          <Pencil className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details for {selectedPlan?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹/month)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-users">User Limit</Label>
                <Input
                  id="edit-users"
                  type="number"
                  value={editForm.userLimit}
                  onChange={(e) => setEditForm({ ...editForm, userLimit: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leads">Lead Limit</Label>
              <Input
                id="edit-leads"
                type="number"
                value={editForm.leadLimit}
                onChange={(e) => setEditForm({ ...editForm, leadLimit: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
              <Label htmlFor="edit-active" className="text-sm">Active</Label>
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan for clients</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Plan Name *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Enterprise"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-price">Price (₹/month) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                  placeholder="4999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-users">User Limit *</Label>
                <Input
                  id="create-users"
                  type="number"
                  value={createForm.userLimit}
                  onChange={(e) => setCreateForm({ ...createForm, userLimit: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-leads">Lead Limit</Label>
              <Input
                id="create-leads"
                type="number"
                value={createForm.leadLimit}
                onChange={(e) => setCreateForm({ ...createForm, leadLimit: e.target.value })}
                placeholder="500"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
              <Label htmlFor="create-active" className="text-sm">Active</Label>
              <Switch
                id="create-active"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
