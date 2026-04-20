'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { AdminPayments } from './admin-payments-updated';
import { AdminSupport } from './admin-support';
import { AdminSettings } from './admin-settings';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Clients', page: 'clients' },
  { icon: CreditCard, label: 'Subscriptions', page: 'subscriptions' },
  { icon: Package, label: 'Plans', page: 'plans' },
  { icon: Receipt, label: 'Payments', page: 'payments' },
  { icon: HeadphonesIcon, label: 'Support', page: 'support' },
  { icon: Settings, label: 'Settings', page: 'settings' },
] as const;

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

function SidebarContent({
  collapsed,
  onNavigate,
  currentPage,
}: {
  collapsed: boolean;
  onNavigate: (page: AdminPage) => void;
  currentPage: AdminPage;
}) {
  const customLogo = useAppStore((state) => state.customLogo);
  const logout = useAppStore((state) => state.logout);

  const logoSrc = customLogo ? `/upload/${customLogo}` : '/logo.jpg';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5">
        <img
          src={logoSrc}
          alt="Logo"
          className="w-9 h-9 rounded-lg shrink-0 object-contain bg-white/20 p-1"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-bold text-base text-white truncate">Trovira CRM</h2>
            <p className="text-xs text-slate-400">Super Admin Panel</p>
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
                onClick={() => onNavigate(item.page as AdminPage)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
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
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const {
    user,
    adminPage,
    setAdminPage,
    notifications,
    showNotifications,
    setShowNotifications,
  } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderPage = useCallback(() => {
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
  }, [adminPage]);

  // ✅ FIXED useEffect (this was breaking your build)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (searchQuery.length > 1) {
      timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const results = await res.json();
            setSearchResults(results);
          }
        } catch {
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`hidden lg:flex flex-col bg-slate-900 ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}>
        <SidebarContent
          collapsed={collapsed}
          onNavigate={setAdminPage}
          currentPage={adminPage}
        />
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <div className="flex items-center gap-4">
            <Button onClick={() => setShowNotifications(!showNotifications)}>
              <Bell />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </Button>

            <Avatar>
              <AvatarFallback>
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}