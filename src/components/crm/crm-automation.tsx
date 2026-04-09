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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Zap,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Settings,
  Trash2,
  Filter,
  MessageSquare,
  UserPlus,
  Mail,
  CheckCircle2,
  XCircle,
  Edit2,
} from 'lucide-react';

type AutomationStatus = 'active' | 'paused';
type AutomationTrigger =
  | 'lead_status_change'
  | 'new_lead_created'
  | 'followup_overdue'
  | 'lead_assigned'
  | 'task_completed';
type AutomationAction =
  | 'send_whatsapp'
  | 'send_email'
  | 'assign_lead'
  | 'create_task'
  | 'add_note';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  description: string;
  status: string;
  executions: number;
  lastRun: string | null;
  createdAt: string;
}

const triggerOptions: { value: AutomationTrigger; label: string; icon: React.ElementType }[] = [
  { value: 'lead_status_change', label: 'Lead status changes', icon: Settings },
  { value: 'new_lead_created', label: 'New lead created', icon: UserPlus },
  { value: 'followup_overdue', label: 'Follow-up is overdue', icon: Clock },
  { value: 'lead_assigned', label: 'Lead is assigned', icon: UserPlus },
  { value: 'task_completed', label: 'Task is completed', icon: CheckCircle2 },
];

const actionOptions: { value: AutomationAction; label: string; icon: React.ElementType }[] = [
  { value: 'send_whatsapp', label: 'Send WhatsApp message', icon: MessageSquare },
  { value: 'send_email', label: 'Send email', icon: Mail },
  { value: 'assign_lead', label: 'Assign lead to team member', icon: UserPlus },
  { value: 'create_task', label: 'Create a task', icon: CheckCircle2 },
  { value: 'add_note', label: 'Add a note to lead', icon: Edit2 },
];

function getTriggerLabel(value: string): string {
  return triggerOptions.find((t) => t.value === value)?.label || value;
}

function getTriggerIcon(value: string): React.ElementType {
  return triggerOptions.find((t) => t.value === value)?.icon || Settings;
}

function getActionLabel(value: string): string {
  return actionOptions.find((a) => a.value === value)?.label || value;
}

function getActionIcon(value: string): React.ElementType {
  return actionOptions.find((a) => a.value === value)?.icon || Zap;
}

const emptyForm = {
  name: '',
  trigger: 'new_lead_created' as AutomationTrigger,
  action: 'send_whatsapp' as AutomationAction,
  description: '',
};

export function CrmAutomation() {
  const { user } = useAppStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/automation?companyId=${user?.companyId}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      } else {
        toast.error('Failed to fetch automation rules');
      }
    } catch {
      toast.error('Failed to fetch automation rules');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, statusFilter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filteredRules =
    statusFilter === 'all' ? rules : rules.filter((r) => r.status === statusFilter);

  const activeRules = rules.filter((r) => r.status === 'active');
  const pausedRules = rules.filter((r) => r.status === 'paused');
  const totalExecutions = rules.reduce((acc, r) => acc + r.executions, 0);

  const stats = [
    { label: 'Total Rules', value: rules.length, icon: Bot, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active', value: activeRules.length, icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Paused', value: pausedRules.length, icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Executions', value: totalExecutions, icon: Zap, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Rule name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/crm/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user?.companyId,
          name: form.name.trim(),
          trigger: form.trigger,
          action: form.action,
          description: form.description.trim(),
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowCreateDialog(false);
        toast.success('Automation rule created successfully');
        fetchRules();
      } else {
        toast.error('Failed to create automation rule');
      }
    } catch {
      toast.error('Failed to create automation rule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/crm/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Rule "${rule.name}" is now ${newStatus}`);
        fetchRules();
      } else {
        toast.error('Failed to update rule status');
      }
    } catch {
      toast.error('Failed to update rule status');
    }
  };

  const handleDelete = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    try {
      const res = await fetch(`/api/crm/automation?id=${ruleId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Rule "${rule?.name}" deleted successfully`);
        fetchRules();
      } else {
        toast.error('Failed to delete rule');
      }
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
      {/* Stat Cards */}
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

      {/* Automation Rules */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-teal-600" />
              Automation Rules
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
                {filteredRules.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] pl-9 h-9 text-sm">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Automation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Rule</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Trigger → Action</TableHead>
                    <TableHead className="text-xs text-center">Executions</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Last Run</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => {
                    const TriggerIcon = getTriggerIcon(rule.trigger);
                    const ActionIcon = getActionIcon(rule.action);
                    const isActive = rule.status === 'active';

                    return (
                      <TableRow key={rule.id} className={!isActive ? 'opacity-70' : ''}>
                        <TableCell className="min-w-[180px]">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                              isActive ? 'bg-teal-50' : 'bg-gray-100'
                            }`}>
                              <Bot className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                              {rule.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                              <TriggerIcon className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-gray-700 text-xs">{getTriggerLabel(rule.trigger)}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded-md">
                              <ActionIcon className="h-3.5 w-3.5 text-teal-600" />
                              <span className="text-teal-700 text-xs">{getActionLabel(rule.action)}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-gray-900">{rule.executions}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(rule.lastRun)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleStatus(rule.id)}
                              className="data-[state=checked]:bg-teal-600"
                            />
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {isActive ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bot className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No automation rules found</p>
              <p className="text-xs mt-1">
                {statusFilter !== 'all'
                  ? 'Try changing the filter to see more rules.'
                  : 'Click "Create Automation" to set up your first workflow rule.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Create Automation Rule
            </DialogTitle>
            <DialogDescription>
              Set up a workflow automation to streamline your CRM processes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Welcome new leads"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={form.trigger}
                  onValueChange={(v) => setForm({ ...form, trigger: v as AutomationTrigger })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-amber-500" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={form.action}
                  onValueChange={(v) => setForm({ ...form, action: v as AutomationAction })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-teal-500" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-desc">Description</Label>
              <Textarea
                id="rule-desc"
                placeholder="Describe what this automation does..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-gray-700">{getTriggerLabel(form.trigger)}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                <span className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded border border-teal-100">
                  <Zap className="h-3.5 w-3.5 text-teal-500" />
                  <span className="text-xs text-teal-700">{getActionLabel(form.action)}</span>
                </span>
              </div>
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
              {saving ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
