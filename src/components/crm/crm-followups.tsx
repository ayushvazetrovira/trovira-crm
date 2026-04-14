'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  User,
  Target,
  CalendarClock,
} from 'lucide-react';
import { format, isToday, isPast, isFuture, startOfDay } from 'date-fns';

interface Followup {
  id: string;
  date: string;
  time: string | null;
  purpose: string;
  notes: string | null;
  status: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    company: string | null;
    status: string;
  };
}

interface LeadOption {
  id: string;
  name: string;
  phone: string;
}

export function CrmFollowups() {
  const { user } = useAppStore();
  const [todayFollowups, setTodayFollowups] = useState<Followup[]>([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState<Followup[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<Followup[]>([]);
  const [completedFollowups, setCompletedFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [form, setForm] = useState({
    leadId: '',
    date: '',
    time: '',
    purpose: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      const [today, upcoming, overdue, completed] = await Promise.all([
        fetch(`/api/crm/followups?companyId=${user?.companyId}&status=today`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/crm/followups?companyId=${user?.companyId}&status=upcoming`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/crm/followups?companyId=${user?.companyId}&status=overdue`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/crm/followups?companyId=${user?.companyId}&status=completed`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setTodayFollowups(today);
      setUpcomingFollowups(upcoming);
      setOverdueFollowups(overdue);
      setCompletedFollowups(completed);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/leads?companyId=${user?.companyId}&limit=100`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads.map((l: { id: string; name: string; phone: string }) => ({ id: l.id, name: l.name, phone: l.phone })));
      }
    } catch {
      // silent
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchFollowups();
    fetchLeads();
  }, [fetchFollowups, fetchLeads]);

  const handleAddFollowup = async () => {
    if (!form.leadId || !form.date || !form.purpose) {
      toast.error('Lead, date, and purpose are required');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          companyId: user?.companyId,
        }),
      });
      if (res.ok) {
        toast.success('Follow-up created successfully');
        setShowAddDialog(false);
        setForm({ leadId: '', date: '', time: '', purpose: '', notes: '' });
        fetchFollowups();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create follow-up');
      }
    } catch {
      toast.error('Failed to create follow-up');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setCompleting(id);
      const res = await fetch(`/api/crm/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        toast.success('Follow-up marked as completed');
        fetchFollowups();
      } else {
        toast.error('Failed to update follow-up');
      }
    } catch {
      toast.error('Failed to update follow-up');
    } finally {
      setCompleting(null);
    }
  };

  const getFollowupTabData = () => {
    switch (activeTab) {
      case 'today': return todayFollowups;
      case 'upcoming': return upcomingFollowups;
      case 'overdue': return overdueFollowups;
      case 'completed': return completedFollowups;
      default: return todayFollowups;
    }
  };

  const renderEmptyState = (icon: React.ReactNode, message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      {icon}
      <p className="text-sm mt-2">{message}</p>
    </div>
  );

  const renderTable = (items: Followup[], showComplete = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Lead Name</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Phone</TableHead>
          <TableHead className="text-xs">Date</TableHead>
          <TableHead className="text-xs hidden md:table-cell">Time</TableHead>
          <TableHead className="text-xs hidden lg:table-cell">Purpose</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Status</TableHead>
          {showComplete && <TableHead className="text-xs text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((fu) => (
          <TableRow key={fu.id}>
            <TableCell className="font-medium text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-semibold flex-shrink-0">
                  {fu.lead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{fu.lead.name}</p>
                  {fu.lead.company && <p className="text-xs text-gray-400">{fu.lead.company}</p>}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-500 hidden sm:table-cell">{fu.lead.phone}</TableCell>
            <TableCell className="text-sm">
              <span className={activeTab === 'overdue' ? 'text-red-600 font-medium' : ''}>
                {format(new Date(fu.date), 'MMM d, yyyy')}
              </span>
            </TableCell>
            <TableCell className="text-sm text-gray-500 hidden md:table-cell">
              {fu.time || '-'}
            </TableCell>
            <TableCell className="text-sm text-gray-600 hidden lg:table-cell max-w-[200px] truncate">
              {fu.purpose}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge
                variant="secondary"
                className={
                  fu.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : activeTab === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }
              >
                {fu.status === 'completed' ? 'Completed' : 'Pending'}
              </Badge>
            </TableCell>
            {showComplete && fu.status !== 'completed' && (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleComplete(fu.id)}
                  disabled={completing === fu.id}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {completing === fu.id ? '...' : 'Complete'}
                </Button>
              </TableCell>
            )}
            {showComplete && fu.status === 'completed' && (
              <TableCell />
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayFollowups.length}</p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingFollowups.length}</p>
              </div>
              <div className="bg-sky-50 p-2 rounded-lg">
                <CalendarClock className="h-4 w-4 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueFollowups.length}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedFollowups.length}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Follow-ups
            </CardTitle>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Follow-up
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="today">
                  Today
                  {todayFollowups.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
                      {todayFollowups.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming
                  {upcomingFollowups.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 bg-sky-100 text-sky-700 text-[10px] px-1.5 py-0">
                      {upcomingFollowups.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue
                  {overdueFollowups.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 bg-red-100 text-red-700 text-[10px] px-1.5 py-0">
                      {overdueFollowups.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {completedFollowups.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                      {completedFollowups.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-4">
                {todayFollowups.length > 0 ? (
                  <div className="overflow-x-auto">{renderTable(todayFollowups)}</div>
                ) : (
                  renderEmptyState(<Calendar className="h-10 w-10 opacity-30" />, 'No follow-ups for today')
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="mt-4">
                {upcomingFollowups.length > 0 ? (
                  <div className="overflow-x-auto">{renderTable(upcomingFollowups)}</div>
                ) : (
                  renderEmptyState(<CalendarClock className="h-10 w-10 opacity-30" />, 'No upcoming follow-ups')
                )}
              </TabsContent>
              <TabsContent value="overdue" className="mt-4">
                {overdueFollowups.length > 0 ? (
                  <div className="overflow-x-auto">{renderTable(overdueFollowups)}</div>
                ) : (
                  renderEmptyState(<AlertTriangle className="h-10 w-10 opacity-30" />, 'No overdue follow-ups')
                )}
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                {completedFollowups.length > 0 ? (
                  <div className="overflow-x-auto">{renderTable(completedFollowups, false)}</div>
                ) : (
                  renderEmptyState(<CheckCircle2 className="h-10 w-10 opacity-30" />, 'No completed follow-ups')
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Follow-up Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
            <DialogDescription>Schedule a new follow-up for a lead.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} - {l.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Input
                placeholder="e.g., Discuss pricing proposal"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFollowup} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? 'Creating...' : 'Create Follow-up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
