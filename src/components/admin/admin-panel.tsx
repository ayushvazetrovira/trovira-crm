'use client';

import { useState } from 'react';
import { useAppStore, AdminPage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Receipt,
  HeadphonesIcon,
  Settings,
  LogOut,
  Menu,
  Building2,
  ChevronLeft,
  Bell,
  Search,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { AdminDashboard } from './admin-dashboard';
import { AdminClients } from './admin-clients';
import { AdminSubscriptions } from './admin-subscriptions';
import { AdminPlans } from './admin-plans';
import { AdminPayments } from './admin-payments';
import { AdminSupport } from './admin-support';
import { AdminSettings } from './admin-settings';

const menuItems: { icon: typeof LayoutDashboard; label: string; page: AdminPage }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Clients', page: 'clients' },
  { icon: CreditCard, label: 'Subscriptions', page: 'subscriptions' },
  { icon: Package, label: 'Plans', page: 'plans' },
  { icon: Receipt, label: 'Payments', page: 'payments' },
  { icon: HeadphonesIcon, label: 'Support', page: 'support' },
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

function SidebarContent({ collapsed, onNavigate, currentPage }: {
  collapsed: boolean;
  onNavigate: (page: AdminPage) => void;
  currentPage: AdminPage;
}) {
  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-5">
          <img src="/logo.jpg" alt="Trovira" className="w-9 h-9 rounded-lg shrink-0 object-contain bg-white/20 p-1" />
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-base text-white truncate">Trovira</h2>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>
      <Separator className="bg-slate-700" />
      <ScrollArea className="flex-1 py-4 px-3">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-slate-700" />
      <div className="p-3">
        <button
          onClick={() => useAppStore.getState().logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl border shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
              {unreadCount} new
            </Badge>
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
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-emerald-50/50' : ''}`}
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
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
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

export function AdminPanel() {
  const { user, adminPage, setAdminPage, notifications, showNotifications, setShowNotifications } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderPage = () => {
    switch (adminPage) {
      case 'dashboard': return <AdminDashboard />;
      case 'clients': return <AdminClients />;
      case 'subscriptions': return <AdminSubscriptions />;
      case 'plans': return <AdminPlans />;
      case 'payments': return <AdminPayments />;
      case 'support': return <AdminSupport />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  const handleNavigate = (page: AdminPage) => {
    setAdminPage(page);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        <SidebarContent collapsed={collapsed} onNavigate={handleNavigate} currentPage={adminPage} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 z-10 hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-all"
          style={{ left: collapsed ? '56px' : '248px' }}
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-slate-900">
          <SidebarContent collapsed={false} onNavigate={handleNavigate} currentPage={adminPage} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <NotificationsPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="animate-in fade-in duration-300">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
