'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ClientCompany {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
}

interface TicketItem {
  id: string;
  subject: string;
  issue: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  company: ClientCompany;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    closed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    closed: 'Closed',
  };
  return (
    <Badge variant="outline" className={variants[status] || 'bg-neutral-100 text-neutral-700'}>
      {labels[status] || status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <Badge variant="secondary" className={variants[priority] || 'bg-neutral-100 text-neutral-700'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export function AdminSupport() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    companyId: '',
    subject: '',
    issue: '',
    priority: 'medium',
  });
  // Status update
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePriority, setUpdatePriority] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support');
      if (!res.ok) throw new Error('Failed to load tickets');
      const json = await res.json();
      setTickets(json);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const json = await res.json();
        setClients(json.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchClients();
    fetchTickets();
  }, [fetchTickets]);

  const handleCreate = async () => {
    if (!createForm.companyId || !createForm.subject || !createForm.issue) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create ticket');
      }
      toast.success('Support ticket created successfully');
      setCreateOpen(false);
      setCreateForm({ companyId: '', subject: '', issue: '', priority: 'medium' });
      fetchTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewTicket = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setUpdateStatus(ticket.status);
    setUpdatePriority(ticket.priority);
    setViewOpen(true);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (updateStatus !== selectedTicket.status) body.status = updateStatus;
      if (updatePriority !== selectedTicket.priority) body.priority = updatePriority;

      if (Object.keys(body).length === 0) {
        toast.info('No changes to update');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update ticket');
      }
      toast.success('Ticket updated successfully');
      setViewOpen(false);
      fetchTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Tickets Table */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-180px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Ticket ID</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-neutral-400">
                      No support tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => openViewTicket(ticket)}
                    >
                      <TableCell className="font-mono text-xs text-neutral-500">
                        #{ticket.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900">
                        {ticket.company.name}
                      </TableCell>
                      <TableCell className="text-neutral-700 max-w-[200px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-neutral-500 text-sm">
                        {formatDate(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewTicket(ticket);
                          }}
                        >
                          View
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

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Submit a new support ticket on behalf of a client</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-company">Company *</Label>
              <Select
                value={createForm.companyId}
                onValueChange={(val) => setCreateForm({ ...createForm, companyId: val })}
              >
                <SelectTrigger id="ticket-company">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject *</Label>
              <Input
                id="ticket-subject"
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-issue">Issue Details *</Label>
              <Textarea
                id="ticket-issue"
                value={createForm.issue}
                onChange={(e) => setCreateForm({ ...createForm, issue: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                value={createForm.priority}
                onValueChange={(val) => setCreateForm({ ...createForm, priority: val })}
              >
                <SelectTrigger id="ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Update Ticket Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ticket #{selectedTicket?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.company.name}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-neutral-500">Subject</Label>
                <p className="text-sm font-medium text-neutral-900 mt-1">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-500">Issue Details</Label>
                <div className="mt-1 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700 whitespace-pre-wrap">
                  {selectedTicket.issue}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                <span>Updated: {formatDate(selectedTicket.updatedAt)}</span>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="update-status">Update Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger id="update-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-priority">Update Priority</Label>
                  <Select value={updatePriority} onValueChange={setUpdatePriority}>
                    <SelectTrigger id="update-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleUpdateTicket}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Updating...' : 'Update Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
