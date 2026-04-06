'use client';

import { useState } from 'react';
import { useAppStore, AdminPage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

function SidebarContent({ collapsed, onNavigate, currentPage }: {
  collapsed: boolean;
  onNavigate: (page: AdminPage) => void;
  currentPage: AdminPage;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
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

export function AdminPanel() {
  const { user, adminPage, setAdminPage, logout } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          className="absolute top-6 left-[248px] z-10 hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-all"
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
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
