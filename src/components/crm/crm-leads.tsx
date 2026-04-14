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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  History,
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  followupDate: string | null;
  notes: string | null;
  value: number | null;
  createdAt: string;
  followups: Array<{ id: string; date: string; time: string | null; purpose: string }>;
  _count?: { notesList: number; stageHistory: number; followups: number };
}

interface LeadDetail extends Lead {
  notesList: Array<{ id: string; content: string; createdAt: string }>;
  stageHistory: Array<{ id: string; fromStage: string | null; toStage: string; createdAt: string }>;
  followups: Array<{ id: string; date: string; time: string | null; purpose: string; status: string; notes: string | null }>;
}

const statusColors: Record<string, string> = {
  New: 'bg-gray-100 text-gray-700',
  Contacted: 'bg-white text-gray-600 border border-gray-300',
  Interested: 'bg-sky-100 text-sky-800',
  'Proposal Sent': 'bg-amber-100 text-amber-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-red-100 text-red-800',
};

const sourceOptions = ['manual', 'website', 'referral', 'social_media', 'advertisement', 'phone', 'email', 'whatsapp', 'other'];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  company: '',
  source: 'manual',
  status: 'New',
  followupDate: '',
  notes: '',
  value: '',
};

export function CrmLeads({ openAddDialog }: { openAddDialog: boolean }) {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('companyId', user?.companyId || '');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads);
        setTotal(json.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, statusFilter, sourceFilter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (openAddDialog) {
      setShowAddDialog(true);
      setForm(emptyForm);
    }
  }, [openAddDialog]);

  const handleSaveLead = async () => {
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : null,
          companyId: user?.companyId,
        }),
      });
      if (res.ok) {
        toast.success('Lead created successfully');
        setShowAddDialog(false);
        setForm(emptyForm);
        fetchLeads();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create lead');
      }
    } catch {
      toast.error('Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead || !form.name || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/crm/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : null,
        }),
      });
      if (res.ok) {
        toast.success('Lead updated successfully');
        setShowEditDialog(false);
        setForm(emptyForm);
        fetchLeads();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update lead');
      }
    } catch {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Lead deleted successfully');
        fetchLeads();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete lead');
      }
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`);
      if (res.ok) {
        const lead = await res.json();
        setSelectedLead(lead);
        setShowDetailDialog(true);
      }
    } catch {
      toast.error('Failed to load lead details');
    }
  };

  const openEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`);
      if (res.ok) {
        const lead = await res.json();
        setSelectedLead(lead);
        setForm({
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          company: lead.company || '',
          source: lead.source,
          status: lead.status,
          followupDate: lead.followupDate ? format(new Date(lead.followupDate), 'yyyy-MM-dd') : '',
          notes: lead.notes || '',
          value: lead.value ? String(lead.value) : '',
        });
        setShowEditDialog(true);
      }
    } catch {
      toast.error('Failed to load lead');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  setForm(emptyForm);
                  setShowAddDialog(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Leads
            {!loading && <span className="text-sm text-gray-400 font-normal ml-2">({total} total)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Source</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Follow-up</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-sm">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{lead.phone}</TableCell>
                      <TableCell className="text-sm text-gray-500 hidden md:table-cell">{lead.email || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500 capitalize hidden sm:table-cell">
                        {lead.source.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[lead.status] || 'bg-gray-100 text-gray-700'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden lg:table-cell">
                        {lead.followupDate ? format(new Date(lead.followupDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(lead.id)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={deleting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No leads found</p>
              <p className="text-xs mt-1">Try adjusting your filters or add a new lead</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter the details of the new lead below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Lead name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  placeholder="Company name"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={form.followupDate}
                  onChange={(e) => setForm({ ...form, followupDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Value (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this lead..."
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
            <Button onClick={handleSaveLead} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? 'Saving...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update the lead details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Lead name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  placeholder="Company name"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={form.followupDate}
                  onChange={(e) => setForm({ ...form, followupDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Value (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this lead..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLead} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? 'Saving...' : 'Update Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                    {selectedLead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle>{selectedLead.name}</DialogTitle>
                    <DialogDescription>
                      {selectedLead.company || 'No company'} &middot;{' '}
                      <Badge variant="secondary" className={statusColors[selectedLead.status] || 'bg-gray-100'}>
                        {selectedLead.status}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{selectedLead.company}</span>
                      </div>
                    )}
                    {selectedLead.value && (
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                        <span>{Number(selectedLead.value).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedLead.followupDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{format(new Date(selectedLead.followupDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  {selectedLead.notes && (
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
                  )}
                </div>

                <Separator />

                {/* Stage History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Stage History
                  </h4>
                  {selectedLead.stageHistory.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedLead.stageHistory.map((sh) => (
                        <div key={sh.id} className="flex items-center gap-3 text-sm">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 flex-shrink-0">
                            <History className="h-3 w-3 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-600">
                              {sh.fromStage || 'Start'} <span className="text-gray-400">&rarr;</span> {sh.toStage}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {format(new Date(sh.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No stage history recorded</p>
                  )}
                </div>

                <Separator />

                {/* Follow-ups */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Follow-ups ({selectedLead.followups.length})
                  </h4>
                  {selectedLead.followups.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedLead.followups.map((fu) => (
                        <div key={fu.id} className="flex items-center gap-3 text-sm">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 flex-shrink-0">
                            <Calendar className="h-3 w-3 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 truncate">{fu.purpose}</p>
                            {fu.notes && <p className="text-xs text-gray-400 truncate">{fu.notes}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">
                              {format(new Date(fu.date), 'MMM d, yyyy')}
                              {fu.time && ` ${fu.time}`}
                            </p>
                            <Badge
                              variant="secondary"
                              className={
                                fu.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }
                            >
                              {fu.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No follow-ups recorded</p>
                  )}
                </div>

                <Separator />

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes ({selectedLead.notesList?.length || 0})
                  </h4>
                  {selectedLead.notesList && selectedLead.notesList.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedLead.notesList.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No notes recorded</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailDialog(false);
                    openEdit(selectedLead.id);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Lead
                </Button>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
