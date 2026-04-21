'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, AdminPage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Bell,
  Search,
  X,
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

function SidebarContent({
  onNavigate,
  currentPage,
}: {
  onNavigate: (page: AdminPage) => void;
  currentPage: AdminPage;
}) {
  const logout = useAppStore((state) => state.logout);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 text-white font-bold">Trovira CRM</div>

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
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-600/20 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
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

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // 🔥 DOM SEARCH (works immediately)
  useEffect(() => {
  if (searchQuery.length < 2) {
    setResults([]);
    return;
  }

  const q = searchQuery.toLowerCase();
  const matches: string[] = [];

  // ✅ Target only useful UI content
  const elements = document.querySelectorAll(
    'table tbody tr, .card, .grid div, h1, h2, h3, p'
  );

  elements.forEach((el) => {
    const text = el.textContent?.replace(/\s+/g, ' ').trim();

    if (
      text &&
      text.length < 200 && // avoid huge junk blocks
      text.toLowerCase().includes(q)
    ) {
      matches.push(text);
    }
  });

  const unique = Array.from(new Set(matches)).slice(0, 8);

  setResults(unique);
}, [searchQuery, adminPage]);

  return (
    <div className="flex h-screen bg-slate-50">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col bg-slate-900 w-64">
        <SidebarContent
          onNavigate={setAdminPage}
          currentPage={adminPage}
        />
      </aside>

      <div className="flex-1">

        {/* HEADER */}
        <header className="h-16 bg-white border-b flex items-center px-6 relative">

          {/* SEARCH */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className="absolute right-2 top-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* RESULTS */}
            {results.length > 0 && searchOpen && (
              <div className="absolute top-12 w-full bg-white shadow-xl rounded-lg z-50">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-sm border-b last:border-none"
                  >
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="ml-auto flex items-center gap-3">
            <Button onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </Button>

            <Avatar>
              <AvatarFallback>
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}