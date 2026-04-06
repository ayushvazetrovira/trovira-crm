'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type TeamRole = 'Admin' | 'Manager' | 'Agent' | 'Viewer';
type MemberStatus = 'active' | 'inactive';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string;
  status: MemberStatus;
  tasksAssigned: number;
  leadsManaged: number;
  joinedAt: string;
}

const roleConfig: Record<TeamRole, { color: string; icon: React.ElementType }> = {
  Admin: { color: 'bg-purple-100 text-purple-700', icon: Shield },
  Manager: { color: 'bg-teal-100 text-teal-700', icon: UserCog },
  Agent: { color: 'bg-sky-100 text-sky-700', icon: UserCheck },
  Viewer: { color: 'bg-gray-100 text-gray-600', icon: Users },
};

const sampleMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@abcschool.com',
    role: 'Admin',
    phone: '+91 98765 43210',
    status: 'active',
    tasksAssigned: 12,
    leadsManaged: 48,
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Neha Patel',
    email: 'neha@abcschool.com',
    role: 'Manager',
    phone: '+91 98765 43211',
    status: 'active',
    tasksAssigned: 8,
    leadsManaged: 35,
    joinedAt: '2024-03-20',
  },
  {
    id: '3',
    name: 'Amit Singh',
    email: 'amit@abcschool.com',
    role: 'Agent',
    phone: '+91 98765 43212',
    status: 'active',
    tasksAssigned: 15,
    leadsManaged: 62,
    joinedAt: '2024-02-10',
  },
  {
    id: '4',
    name: 'Sneha Gupta',
    email: 'sneha@abcschool.com',
    role: 'Agent',
    phone: '+91 98765 43213',
    status: 'active',
    tasksAssigned: 6,
    leadsManaged: 22,
    joinedAt: '2024-06-01',
  },
  {
    id: '5',
    name: 'Vikram Joshi',
    email: 'vikram@abcschool.com',
    role: 'Viewer',
    phone: '+91 98765 43214',
    status: 'inactive',
    tasksAssigned: 3,
    leadsManaged: 10,
    joinedAt: '2024-04-15',
  },
  {
    id: '6',
    name: 'Pooja Reddy',
    email: 'pooja@abcschool.com',
    role: 'Agent',
    phone: '+91 98765 43215',
    status: 'active',
    tasksAssigned: 9,
    leadsManaged: 41,
    joinedAt: '2024-05-22',
  },
];

const emptyForm = {
  name: '',
  email: '',
  role: 'Agent' as TeamRole,
};

export function CrmTeam() {
  const { user } = useAppStore();
  const [members, setMembers] = useState<TeamMember[]>(sampleMembers);
  const [loading, setLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const activeMembers = members.filter((m) => m.status === 'active');
  const inactiveMembers = members.filter((m) => m.status === 'inactive');

  const stats = {
    total: members.length,
    active: activeMembers.length,
    inactive: inactiveMembers.length,
    totalLeads: members.reduce((acc, m) => acc + m.leadsManaged, 0),
  };

  const handleInvite = () => {
    if (!form.name.trim()) {
      toast.error('Member name is required');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        phone: '-',
        status: 'active',
        tasksAssigned: 0,
        leadsManaged: 0,
        joinedAt: new Date().toISOString().split('T')[0],
      };
      setMembers((prev) => [newMember, ...prev]);
      setForm(emptyForm);
      setShowInviteDialog(false);
      setSaving(false);
      toast.success(`Invitation sent to ${newMember.email}`);
    }, 400);
  };

  const handleToggleStatus = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
          : m
      )
    );
    const member = members.find((m) => m.id === memberId);
    if (member) {
      toast.success(
        `${member.name} is now ${member.status === 'active' ? 'inactive' : 'active'}`
      );
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (member) {
      toast.success(`${member.name} has been removed from the team`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-teal-100 text-teal-700',
      'bg-emerald-100 text-emerald-700',
      'bg-cyan-100 text-cyan-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-rose-100 text-rose-700',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <XCircle className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg">
                <UserCog className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Grid */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-teal-600" />
          Team Members
          <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
            {members.length}
          </Badge>
        </h3>
        <Button
          onClick={() => setShowInviteDialog(true)}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Invite Member
        </Button>
      </div>

      {members.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const roleConf = roleConfig[member.role];
            const RoleIcon = roleConf.icon;

            return (
              <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={`${getAvatarColor(member.name)} font-semibold text-sm`}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${roleConf.color}`}
                          >
                            <RoleIcon className="h-3 w-3 mr-0.5" />
                            {member.role}
                          </Badge>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 mt-0.5 ${
                            member.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {member.status === 'active' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-0.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-0.5" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5 text-teal-500" />
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-900">{member.tasksAssigned}</span> tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-900">{member.leadsManaged}</span> leads
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleToggleStatus(member.id)}
                    >
                      {member.status === 'active' ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No team members yet</p>
            <p className="text-xs mt-1">Click "Invite Member" to add your first team member.</p>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>Send an invitation to add a new member to your team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="member-name">Full Name *</Label>
              <Input
                id="member-name"
                placeholder="e.g., John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email *</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="e.g., john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as TeamRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    <span className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-purple-500" /> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="Manager">
                    <span className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 text-teal-500" /> Manager
                    </span>
                  </SelectItem>
                  <SelectItem value="Agent">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-sky-500" /> Agent
                    </span>
                  </SelectItem>
                  <SelectItem value="Viewer">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-gray-400" /> Viewer
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
