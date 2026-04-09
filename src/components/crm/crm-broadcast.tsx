'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  BarChart3,
} from 'lucide-react';

type BroadcastStatus = 'sent' | 'delivered' | 'queued' | 'draft' | 'failed';

interface Broadcast {
  id: string;
  name: string;
  message: string;
  recipients: number;
  status: string;
  delivered: number;
  read: number;
  failed: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sent: { label: 'Sent', color: 'bg-teal-100 text-teal-700', icon: Send },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  queued: { label: 'Queued', color: 'bg-amber-100 text-amber-700', icon: Clock },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const emptyForm = {
  name: '',
  message: '',
  recipientGroup: 'all',
};

export function CrmBroadcast() {
  const { user } = useAppStore();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/broadcasts?companyId=${user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: Broadcast[] = (data.broadcasts || []).map((b: Record<string, unknown>) => ({
          id: b.id,
          name: b.name,
          message: b.message,
          recipients: b.recipients,
          status: b.status,
          delivered: b.delivered,
          read: b.readCount,
          failed: b.failed,
          createdAt: b.createdAt,
        }));
        setBroadcasts(mapped);
      } else {
        toast.error('Failed to fetch broadcasts');
      }
    } catch {
      toast.error('Failed to fetch broadcasts');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const totalSent = broadcasts.filter((b) => b.status === 'sent' || b.status === 'delivered').reduce((acc, b) => acc + b.recipients, 0);
  const totalDelivered = broadcasts.reduce((acc, b) => acc + b.delivered, 0);
  const totalRead = broadcasts.reduce((acc, b) => acc + b.read, 0);
  const totalFailed = broadcasts.reduce((acc, b) => acc + b.failed, 0);

  const stats = [
    { label: 'Total Sent', value: totalSent, icon: Send, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Delivered', value: totalDelivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Read', value: totalRead, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Failed', value: totalFailed, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const filteredBroadcasts = activeTab === 'all'
    ? broadcasts
    : broadcasts.filter((b) => b.status === activeTab);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!form.message.trim()) {
      toast.error('Message content is required');
      return;
    }
    setSaving(true);
    try {
      const recipientCount = form.recipientGroup === 'all'
        ? 120
        : form.recipientGroup === 'new'
        ? 45
        : form.recipientGroup === 'interested'
        ? 38
        : 37;

      const res = await fetch('/api/crm/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user?.companyId,
          name: form.name.trim(),
          message: form.message.trim(),
          recipients: recipientCount,
          status: 'draft',
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowCreateDialog(false);
        toast.success('Broadcast campaign created successfully');
        fetchBroadcasts();
      } else {
        toast.error('Failed to create broadcast');
      }
    } catch {
      toast.error('Failed to create broadcast');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (broadcastId: string) => {
    try {
      const res = await fetch('/api/crm/broadcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: broadcastId, status: 'queued' }),
      });
      if (res.ok) {
        toast.success('Broadcast queued for sending');
        fetchBroadcasts();
      } else {
        toast.error('Failed to send broadcast');
      }
    } catch {
      toast.error('Failed to send broadcast');
    }
  };

  const handleDelete = async (broadcastId: string) => {
    try {
      const res = await fetch(`/api/crm/broadcasts?id=${broadcastId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Broadcast deleted successfully');
        fetchBroadcasts();
      } else {
        toast.error('Failed to delete broadcast');
      }
    } catch {
      toast.error('Failed to delete broadcast');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Broadcast Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-teal-600" />
              Broadcast Campaigns
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
                {broadcasts.length}
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Broadcast
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {broadcasts.length > 0 ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All
                    <Badge variant="secondary" className="ml-1.5 bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0">
                      {broadcasts.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered</TabsTrigger>
                  <TabsTrigger value="queued">Queued</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Campaign</TableHead>
                          <TableHead className="text-xs hidden lg:table-cell">Message</TableHead>
                          <TableHead className="text-xs text-center">Recipients</TableHead>
                          <TableHead className="text-xs text-center hidden sm:table-cell">Delivered</TableHead>
                          <TableHead className="text-xs text-center hidden md:table-cell">Read</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBroadcasts.length > 0 ? (
                          filteredBroadcasts.map((bc) => {
                            const statusConf = statusConfig[bc.status] || statusConfig.draft;
                            const StatusIcon = statusConf.icon;

                            return (
                              <TableRow key={bc.id}>
                                <TableCell className="min-w-[150px]">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 flex-shrink-0">
                                      <Megaphone className="h-4 w-4 text-teal-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{bc.name}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <p className="text-sm text-gray-500 line-clamp-1 max-w-[250px]">
                                    {bc.message}
                                  </p>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Users className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm font-medium">{bc.recipients}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell">
                                  <span className="text-sm text-emerald-600 font-medium">{bc.delivered}</span>
                                </TableCell>
                                <TableCell className="text-center hidden md:table-cell">
                                  <span className="text-sm text-sky-600 font-medium">{bc.read}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={`${statusConf.color} text-[11px]`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConf.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                                  {formatDate(bc.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {(bc.status === 'draft' || bc.status === 'failed') && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                        onClick={() => handleSend(bc.id)}
                                      >
                                        <Send className="h-3.5 w-3.5 mr-1" />
                                        Send
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => handleDelete(bc.id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8}>
                              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Megaphone className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm">No broadcasts with this status</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Megaphone className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No broadcast campaigns yet</p>
              <p className="text-xs mt-1">Click "Create Broadcast" to send your first message.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Broadcast Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Create Broadcast
            </DialogTitle>
            <DialogDescription>
              Create a new WhatsApp broadcast campaign to reach your leads.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bc-name">Campaign Name *</Label>
              <Input
                id="bc-name"
                placeholder="e.g., Monthly Newsletter"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bc-message">Message *</Label>
              <Textarea
                id="bc-message"
                placeholder="Type your broadcast message here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-400">
                {form.message.length}/1024 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select
                value={form.recipientGroup}
                onValueChange={(v) => setForm({ ...form, recipientGroup: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-teal-500" /> All Leads
                    </span>
                  </SelectItem>
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-sky-500" /> New Leads (status: New)
                    </span>
                  </SelectItem>
                  <SelectItem value="interested">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-emerald-500" /> Interested Leads
                    </span>
                  </SelectItem>
                  <SelectItem value="other">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-amber-500" /> Other Status Leads
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
