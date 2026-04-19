'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  UserCog,
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  ListTodo,
  UserCheck,
} from 'lucide-react';

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
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/team?companyId=${user?.companyId}`);
      const data = await res.json();

      const mapped = (data.members || []).map((m: any) => ({
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
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and Email required');
      return;
    }

    setSaving(true);

    try {
      const roleMap = {
        'Admin': 'team_admin',
        'Manager': 'team_manager',
        'Agent': 'team_agent',
        'Viewer': 'team_viewer',
      };
      const backendRole = roleMap[form.role as keyof typeof roleMap] || 'team_agent';

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
        toast.success('Member added');
        setShowInviteDialog(false);
        setForm(emptyForm);
        fetchMembers();
      } else {
        toast.error('Failed to add member');
      }
    } catch {
      toast.error('Error adding member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/crm/team?id=${id}`, { method: 'DELETE' });
    fetchMembers();
  };

  if (loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Team Members</h2>

        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4 space-y-3">

              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {m.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>

              <Badge>{m.role}</Badge>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{m.tasksAssigned} tasks</span>
                <span>{m.leadsManaged} leads</span>
              </div>

              <Button size="sm" variant="outline" onClick={() => handleRemove(m.id)}>
                Remove
              </Button>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Invite a new member</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              type="password"
              placeholder="Password (default: Client@123)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {/* ✅ FIXED SELECT */}
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>

              <SelectTrigger>
                <SelectValue />
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
            <Button onClick={handleInvite} disabled={saving}>
              {saving ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}