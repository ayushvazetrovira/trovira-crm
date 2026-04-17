 'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, CrmPage } from '@/lib/store';

interface Plan {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  leadLimit: number;
  isActive: boolean;
}
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Menu,
  LogOut,
  Bell,
  ChevronRight,
  ListTodo,
  UserCog,
  Megaphone,
  Bot,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mail,
  MessageCircle,
  Plug,
  StickyNote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrmDashboard } from './crm-dashboard';
import { CrmLeads } from './crm-leads';
import { CrmPipeline } from './crm-pipeline';
import { CrmFollowups } from './crm-followups';
import { CrmTasks } from './crm-tasks';
import { CrmTeam } from './crm-team';
import { CrmReports } from './crm-reports';

import { CrmAutomation } from './crm-automation';
import { CrmEmail } from './crm-email';
import { CrmWhatsapp } from './crm-whatsapp';
import { CrmApi } from './crm-api';
import { CrmSettings } from './crm-settings';
import { CrmNotes } from './crm-notes';

const navItems: { icon: React.ElementType; label: string; page: CrmPage; section?: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Leads', page: 'leads' },
  { icon: Kanban, label: 'Pipeline', page: 'pipeline' },
  { icon: Clock, label: 'Follow-ups', page: 'followups' },
  { icon: ListTodo, label: 'Tasks', page: 'tasks' },
  { icon: UserCog, label: 'Team', page: 'team' },
  { icon: BarChart3, label: 'Reports', page: 'reports' },

  { icon: Bot, label: 'Automation', page: 'automation' },
  { icon: Mail, label: 'Email', page: 'email', section: 'integrations' },
  { icon: MessageCircle, label: 'WhatsApp Inbox', page: 'whatsapp', section: 'integrations' },
  { icon: Plug, label: 'API / Integrations', page: 'api', section: 'integrations' },
  { icon: StickyNote, label: 'Notes', page: 'notes' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

const notifIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const notifColors = {
  info: 'bg-sky-100 text-sky-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
};

function CrmNotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl border shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">{unreadCount} new</Badge>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => {
              const NotifIcon = notifIcons[notif.type] || Info;
              const colorClass = notifColors[notif.type] || notifColors.info;
              return (
                <button
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-teal-50/50' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${colorClass}`}>
                      <NotifIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function SidebarContent({
  crmPage,
  setCrmPage,
  companyName,
  onAddLead,
  plan,
  planLoading,
}: {
  crmPage: CrmPage;
  setCrmPage: (page: CrmPage) => void;
  companyName: string;
  onAddLead: () => void;
  plan: Plan | null;
  planLoading: boolean;
}) {
  const mainItems = navItems.filter(i => !i.section);
  const integrationItems = navItems.filter(i => i.section === 'integrations');

  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-5">
        <img src="/logo.jpg" alt="Trovira" className="mb-3 h-12 w-12 rounded-lg object-contain bg-white/20 p-1.5 mx-auto sm:mx-0" />
        <h1 className="text-xl font-bold text-white tracking-tight">Trovira</h1>
        <p className="text-teal-100 text-sm mt-1 truncate">{companyName}</p>
{planLoading ? (
          <Badge className="mt-2 bg-white/20 text-white border-0 text-xs">
            Loading Plan...
          </Badge>
        ) : plan ? (
          <Badge className="mt-2 bg-white/20 text-white border-0 text-xs">
            {plan.name} (₹{plan.price.toLocaleString('en-IN')}/mo)
          </Badge>
        ) : (
          <Badge className="mt-2 bg-white/20 text-white border-0 text-xs" variant="secondary">
            No Active Plan
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 sidebar-scroll">
        <nav className="flex flex-col gap-1">
          {mainItems.map((item) => {
            const isActive = crmPage === item.page;
            const Icon = item.icon;

            return (
              <button
                key={item.page}
                onClick={() => setCrmPage(item.page)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-teal-600' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-teal-500" />}
              </button>
            );
          })}

          {/* Integrations Section */}
          <div className="pt-4 pb-2">
            <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Integrations</p>
          </div>
          {integrationItems.map((item) => {
            const isActive = crmPage === item.page;
            const Icon = item.icon;

            return (
              <button
                key={item.page}
                onClick={() => setCrmPage(item.page)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-teal-600' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-teal-500" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t">
        <button
          onClick={onAddLead}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>
    </div>
  );
}

export function CrmPanel() {
  const { user, crmPage, setCrmPage, logout, notifications, showNotifications, setShowNotifications } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addLeadTrigger, setAddLeadTrigger] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/admin/plans');
        if (res.ok) {
          const plans = await res.json();
          setPlan(plans[0] || null);
        }
      } catch {
        // silent
      } finally {
        setPlanLoading(false);
      }
    }
    fetchPlan();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  const handleAddLead = () => {
    setCrmPage('leads');
    setAddLeadTrigger(true);
    setSidebarOpen(false);
    setTimeout(() => setAddLeadTrigger(false), 100);
  };

  const renderPage = () => {
    switch (crmPage) {
      case 'dashboard':
        return <CrmDashboard />;
      case 'leads':
        return <CrmLeads openAddDialog={addLeadTrigger} />;
      case 'pipeline':
        return <CrmPipeline />;
      case 'followups':
        return <CrmFollowups />;
      case 'tasks':
        return <CrmTasks />;
      case 'team':
        return <CrmTeam />;
      case 'reports':
        return <CrmReports />;

      case 'automation':
        return <CrmAutomation />;
      case 'email':
        return <CrmEmail />;
      case 'whatsapp':
        return <CrmWhatsapp />;
      case 'api':
        return <CrmApi />;
      case 'notes':
        return <CrmNotes />;
      case 'settings':
        return <CrmSettings />;
      default:
        return <CrmDashboard />;
    }
  };

  const currentPageLabel = navItems.find(n => n.page === crmPage)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r bg-white">
        <SidebarContent
          crmPage={crmPage}
          setCrmPage={(page) => setCrmPage(page)}
          companyName={user.companyName || 'My Company'}
          onAddLead={handleAddLead}
          plan={plan}
          planLoading={planLoading}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 overflow-hidden [&>div]:h-full">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent
                crmPage={crmPage}
                setCrmPage={(page) => {
                  setCrmPage(page);
                  setSidebarOpen(false);
                }}
                companyName={user.companyName || 'My Company'}
                onAddLead={handleAddLead}
                plan={plan}
                planLoading={planLoading}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex items-center gap-4">
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-900">{currentPageLabel}</h2>
<div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">{user.companyName}</p>
                {planLoading ? (
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">
                    Loading...
                  </Badge>
                ) : plan ? (
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0" title={`${plan.userLimit} users | ${plan.leadLimit >= 999999 ? 'Unlimited' : plan.leadLimit.toLocaleString('en-IN')} leads`}>
                    {plan.name}<span className="ml-1 text-[8px]">₹{plan.price.toLocaleString()}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0">
                    No Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAddLead}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <CrmNotificationsPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">{user.name}</span>
                <span className="text-xs text-gray-500 leading-tight">{user.email}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                toast.success('Logged out successfully');
              }}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={crmPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
