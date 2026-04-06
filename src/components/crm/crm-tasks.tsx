'use client';

import React, { useState } from 'react';
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
import { toast } from 'sonner';
import {
  ListTodo,
  Plus,
  Clock,
  Flag,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Filter,
} from 'lucide-react';

type TaskPriority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in-progress' | 'completed';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; icon: React.ElementType }> = {
  high: { label: 'High', color: 'bg-red-100 text-red-700', icon: Flag },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  low: { label: 'Low', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
};

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Follow up with Priya Sharma',
    description: 'Send pricing details and schedule a demo call for the school management software.',
    assignedTo: 'Priya Sharma',
    dueDate: '2025-02-15',
    priority: 'high',
    status: 'pending',
    createdAt: '2025-02-01',
  },
  {
    id: '2',
    title: 'Prepare proposal for ABC Realty',
    description: 'Create a detailed proposal document for the real estate CRM integration project.',
    assignedTo: 'Rajesh Kumar',
    dueDate: '2025-02-12',
    priority: 'high',
    status: 'in-progress',
    createdAt: '2025-01-28',
  },
  {
    id: '3',
    title: 'Update lead source tracking',
    description: 'Review and update the lead source tracking in settings for better attribution.',
    assignedTo: 'Neha Patel',
    dueDate: '2025-02-20',
    priority: 'medium',
    status: 'pending',
    createdAt: '2025-02-05',
  },
  {
    id: '4',
    title: 'Send welcome email to new leads',
    description: 'Send personalized welcome emails to the 12 new leads captured this week.',
    assignedTo: 'Amit Singh',
    dueDate: '2025-02-10',
    priority: 'medium',
    status: 'completed',
    createdAt: '2025-01-25',
  },
  {
    id: '5',
    title: 'Organize team training session',
    description: 'Schedule and prepare materials for the CRM onboarding training for new team members.',
    assignedTo: 'Sneha Gupta',
    dueDate: '2025-02-18',
    priority: 'low',
    status: 'pending',
    createdAt: '2025-02-03',
  },
  {
    id: '6',
    title: 'Review quarterly pipeline report',
    description: 'Analyze the Q4 pipeline conversion rates and prepare insights for the team meeting.',
    assignedTo: 'Rajesh Kumar',
    dueDate: '2025-02-08',
    priority: 'high',
    status: 'completed',
    createdAt: '2025-01-20',
  },
  {
    id: '7',
    title: 'Fix WhatsApp template issues',
    description: 'Review and fix rejected WhatsApp message templates for broadcast campaigns.',
    assignedTo: 'Amit Singh',
    dueDate: '2025-02-14',
    priority: 'medium',
    status: 'in-progress',
    createdAt: '2025-02-02',
  },
  {
    id: '8',
    title: 'Onboard client PQR Travels',
    description: 'Complete the onboarding process for PQR Travels including data migration.',
    assignedTo: 'Neha Patel',
    dueDate: '2025-02-22',
    priority: 'low',
    status: 'pending',
    createdAt: '2025-02-06',
  },
];

const emptyForm = {
  title: '',
  description: '',
  assignedTo: '',
  dueDate: '',
  priority: 'medium' as TaskPriority,
  status: 'pending' as TaskStatus,
};

export function CrmTasks() {
  const { user } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filteredTasks = statusFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === statusFilter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const handleAddTask = () => {
    if (!form.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!form.assignedTo.trim()) {
      toast.error('Assigned to is required');
      return;
    }
    if (!form.dueDate) {
      toast.error('Due date is required');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo.trim(),
        dueDate: form.dueDate,
        priority: form.priority,
        status: form.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks((prev) => [newTask, ...prev]);
      setForm(emptyForm);
      setShowAddDialog(false);
      setSaving(false);
      toast.success('Task created successfully');
    }, 400);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    toast.success(`Task marked as ${statusConfig[newStatus].label}`);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success('Task deleted successfully');
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
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <ListTodo className="h-4 w-4 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-teal-600" />
              Tasks
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
                {filteredTasks.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] pl-9 h-9 text-sm">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Task</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Assigned To</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Due Date</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const priority = priorityConfig[task.priority];
                    const status = statusConfig[task.status];
                    const PriorityIcon = priority.icon;
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

                    return (
                      <TableRow key={task.id} className={task.status === 'completed' ? 'opacity-60' : ''}>
                        <TableCell className="min-w-[200px]">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[250px]">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-semibold flex-shrink-0">
                              {task.assignedTo.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-700">{task.assignedTo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${priority.color} text-[11px]`}>
                            <PriorityIcon className="h-3 w-3 mr-1" />
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                          >
                            <SelectTrigger className={`h-7 w-[120px] text-xs ${status.color} border-0`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTask(task.id)}
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
              <ListTodo className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-xs mt-1">
                {statusFilter !== 'all'
                  ? 'Try changing the filter to see more tasks.'
                  : 'Click "Add Task" to create your first task.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Add New Task
            </DialogTitle>
            <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g., Follow up with lead"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Add task details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assigned To *</Label>
                <Input
                  id="task-assignee"
                  placeholder="e.g., Rajesh Kumar"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date *</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-red-500" /> High
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Low
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
