'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Plus, Trash2, Users } from 'lucide-react';
import { ExcelUploadDialog } from './excel-upload-dialog';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  tasksAssigned: number;
  leadsManaged: number;
  joinedAt: string;
}

const emptyForm = {
  name: '',
  email: '',
  role: 'Agent',
  password: 'Client@123',
};

export function CrmTeam() {
  const { user } = useAppStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchMembers = useCallback(
    async (isRefresh = false) => {
      if (!user?.companyId) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/crm/team?companyId=${user.companyId}`);
        const data = await res.json();

        const mapped: TeamMember[] = (data.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role || 'Agent',
          phone: m.phone || '-',
          status: m.role === 'inactive_client' ? 'inactive' : 'active',
          tasksAssigned: m.tasksAssigned || 0,
          leadsManaged: m.leadsManaged || 0,
          joinedAt: m.createdAt,
        }));

        setMembers(mapped);
      } catch {
        toast.error('Failed to fetch team members');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.companyId]
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Called after Excel upload succeeds — refreshes the list and shows feedback
  const handleUploadSuccess = useCallback(async () => {
    setShowExcelDialog(false);
    await fetchMembers(true);
    toast.success('Team members loaded successfully!');
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and Email are required');
      return;
    }

    setSaving(true);
    try {
      const roleMap: Record<string, string> = {
        Admin: 'team_admin',
        Manager: 'team_manager',
        Agent: 'team_agent',
        Viewer: 'team_viewer',
      };
      const backendRole = roleMap[form.role] ?? 'team_agent';

      const res = await fetch('/api/crm/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: backendRole,
          companyId: user?.companyId,
        }),
      });

      if (res.ok) {
        toast.success('Member added successfully');
        setShowInviteDialog(false);
        setForm(emptyForm);
        await fetchMembers(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add member');
      }
    } catch {
      toast.error('Error adding member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`/api/crm/team?id=${id}`, { method: 'DELETE' });
      // Optimistically remove from UI immediately
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const getRoleBadgeVariant = (role: string) => {
    if (role.includes('admin')) return 'destructive';
    if (role.includes('manager')) return 'default';
    return 'secondary';
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">Team Members</h2>
          <Badge variant="outline">{members.length}</Badge>
          {refreshing && (
            <span className="text-xs text-muted-foreground animate-pulse">Refreshing…</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setShowInviteDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
          <Button onClick={() => setShowExcelDialog(true)} variant="outline" size="sm">
            📊 Upload Excel
          </Button>
        </div>
      </div>

      {/* Excel Upload Dialog */}
      <ExcelUploadDialog
        open={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Empty state */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm mt-1">Add a member manually or upload an Excel file to get started.</p>
        </div>
      ) : (
        /* Members grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">

                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>

                {/* Role badge + status */}
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(m.role)} className="text-xs capitalize">
                    {m.role.replace('team_', '')}
                  </Badge>
                  <Badge
                    variant={m.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {m.status}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>{m.tasksAssigned} tasks</span>
                  <span>{m.leadsManaged} leads</span>
                  <span>
                    {m.joinedAt
                      ? new Date(m.joinedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>

                {/* Remove */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(m.id)}
                  disabled={removingId === m.id}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {removingId === m.id ? 'Removing…' : 'Remove'}
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Single Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Fill in the details to add a new member to your team.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password (default: Client@123)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving ? 'Adding…' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}