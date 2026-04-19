'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Eye, Trash2, Phone, Mail, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  leadLimit: number;
  isActive: boolean;
}

interface ClientCompany {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  plan: Plan;
  users: { id: string; name: string; email: string; role: string }[];
  subscriptions: { id: string; startDate: string; expiryDate: string; status: string }[];
  _count: { leads: number; payments: number; tickets: number };
}

interface ClientDetail extends Omit<ClientCompany, '_count'> {
  subscriptions: { id: string; startDate: string; expiryDate: string; status: string; plan: Plan }[];
  payments: { id: string; amount: number; paymentDate: string; method: string; status: string; plan: Plan }[];
  tickets: { id: string; subject: string; status: string; priority: string; createdAt: string }[];
  _count: { leads: number };
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-red-100 text-red-700 border-red-200',
    suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <Badge variant="outline" className={variants[status] || 'bg-neutral-100 text-neutral-700'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function AdminClients() {
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add form state
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    password: '',
    subscriptionStartDate: '',
    subscriptionExpiryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to load clients');
      const json = await res.json();
      setClients(json);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = async () => {
    if (!form.name || !form.contactPerson || !form.mobile || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create client');
      }
      toast.success('Client created successfully');
      setAddOpen(false);
      setForm({
        name: '',
        contactPerson: '',
        mobile: '',
        email: '',
        password: '',
        subscriptionStartDate: '',
        subscriptionExpiryDate: '',
      });
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewClient = async (id: string) => {
    setDetailLoading(true);
    setViewOpen(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      if (!res.ok) throw new Error('Failed to load client details');
      const json = await res.json();
      setSelectedClient(json);
    } catch {
      toast.error('Failed to load client details');
      setViewOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuspendClient = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to suspend client');
      toast.success('Client suspended successfully');
      fetchClients();
    } catch {
      toast.error('Failed to suspend client');
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
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Clients Table */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Contact Person</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Mobile</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Email</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Expiry</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <TableSkeleton />
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-neutral-400">
                      {search ? 'No clients found matching your search' : 'No clients yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-neutral-50 transition-colors">
                      <TableCell className="font-medium text-neutral-900">{client.name}</TableCell>
                      <TableCell className="text-neutral-600">{client.contactPerson}</TableCell>
                      <TableCell className="hidden md:table-cell text-neutral-500">{client.mobile}</TableCell>
                      <TableCell className="hidden lg:table-cell text-neutral-500">{client.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={client.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-neutral-500">
                        {client.subscriptions[0]
                          ? formatDate(client.subscriptions[0].expiryDate)
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewClient(client.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-neutral-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            onClick={() => handleSuspendClient(client.id)}
                            title="Suspend Client"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Add Client Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Create a new client company with subscription</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-person">Contact Person *</Label>
                <Input
                  id="contact-person"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Initial password for client login"
              />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Subscription Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={form.subscriptionStartDate}
                  onChange={(e) => setForm({ ...form, subscriptionStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Subscription Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={form.subscriptionExpiryDate}
                  onChange={(e) => setForm({ ...form, subscriptionExpiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>Loading client details...</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Separator />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : selectedClient ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  {selectedClient.name}
                </DialogTitle>
                <DialogDescription>
                  Client details and activity overview
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Company Info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-500">Mobile:</span>
                    <span className="font-medium">{selectedClient.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-500">Email:</span>
                    <span className="font-medium">{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500">Contact:</span>
                    <span className="font-medium">{selectedClient.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-500">Joined:</span>
                    <span className="font-medium">{formatDate(selectedClient.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">Status:</span>
                  <StatusBadge status={selectedClient.status} />
                  <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                    Plan: {selectedClient.plan.name}
                  </Badge>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-neutral-50 p-3 text-center">
                    <p className="text-lg font-bold text-neutral-900">{selectedClient._count.leads}</p>
                    <p className="text-xs text-neutral-500">Total Leads</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 text-center">
                    <p className="text-lg font-bold text-neutral-900">{selectedClient.users.length}</p>
                    <p className="text-xs text-neutral-500">Users</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 text-center">
                    <p className="text-lg font-bold text-neutral-900">{selectedClient.payments.length}</p>
                    <p className="text-xs text-neutral-500">Payments</p>
                  </div>
                </div>

                {/* Subscriptions */}
                {selectedClient.subscriptions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Subscriptions</h4>
                    <div className="space-y-2">
                      {selectedClient.subscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 text-sm">
                          <div>
                            <span className="font-medium">{sub.plan.name}</span>
                            <span className="text-neutral-400 ml-2">
                              {formatDate(sub.startDate)} - {formatDate(sub.expiryDate)}
                            </span>
                          </div>
                          <StatusBadge status={sub.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {selectedClient.users.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Users</h4>
                    <div className="space-y-1">
                      {selectedClient.users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 text-sm">
                          <span className="font-medium">{u.name}</span>
                          <span className="text-neutral-400">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Payments */}
                {selectedClient.payments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Recent Payments</h4>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-1">
                        {selectedClient.payments.slice(0, 5).map((p) => (
                          <div key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 text-sm">
                            <span className="font-medium">{p.plan.name}</span>
                            <span className="font-semibold text-emerald-600">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-neutral-400">{formatDate(p.paymentDate)}</span>
                            <Badge
                              variant="outline"
                              className={
                                p.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : p.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Tickets */}
                {selectedClient.tickets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Support Tickets</h4>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-1">
                        {selectedClient.tickets.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 text-sm">
                            <span className="font-medium truncate mr-4">{t.subject}</span>
                            <Badge
                              variant="outline"
                              className={
                                t.status === 'open'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : t.status === 'in_progress'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              }
                            >
                              {t.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
