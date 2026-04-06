'use client';

import React, { useState } from 'react';
import { useAppStore, CrmPage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Search,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrmDashboard } from './crm-dashboard';
import { CrmLeads } from './crm-leads';
import { CrmPipeline } from './crm-pipeline';
import { CrmFollowups } from './crm-followups';
import { CrmReports } from './crm-reports';
import { CrmSettings } from './crm-settings';

const navItems: { icon: React.ElementType; label: string; page: CrmPage }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Leads', page: 'leads' },
  { icon: Kanban, label: 'Pipeline', page: 'pipeline' },
  { icon: Clock, label: 'Follow-ups', page: 'followups' },
  { icon: BarChart3, label: 'Reports', page: 'reports' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

function SidebarContent({
  crmPage,
  setCrmPage,
  companyName,
  onAddLead,
}: {
  crmPage: CrmPage;
  setCrmPage: (page: CrmPage) => void;
  companyName: string;
  onAddLead: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-5">
        <h1 className="text-xl font-bold text-white tracking-tight">Trovira</h1>
        <p className="text-teal-100 text-sm mt-1 truncate">{companyName}</p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
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
      </ScrollArea>

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
  const { user, crmPage, setCrmPage, logout } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addLeadTrigger, setAddLeadTrigger] = useState(false);

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
      case 'reports':
        return <CrmReports />;
      case 'settings':
        return <CrmSettings />;
      default:
        return <CrmDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r bg-white">
        <SidebarContent
          crmPage={crmPage}
          setCrmPage={(page) => setCrmPage(page)}
          companyName={user.companyName || 'My Company'}
          onAddLead={handleAddLead}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
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
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex items-center gap-4">
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-900">
                {navItems.find((n) => n.page === crmPage)?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-gray-500">{user.companyName}</p>
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

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
            </Button>

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
