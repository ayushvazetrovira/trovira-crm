'use client';

import { useAppStore } from '@/lib/store';
import { LoginPage } from '@/components/login';
import { AdminPanel } from '@/components/admin/admin-panel';
import { CrmPanel } from '@/components/crm/crm-panel';

export default function Home() {
  const { isAuthenticated, user } = useAppStore();

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (user.role === 'admin') {
    return <AdminPanel />;
  }

  return <CrmPanel />;
}
