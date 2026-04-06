import { create } from 'zustand';

export type UserRole = 'admin' | 'client';
export type AdminPage = 'dashboard' | 'clients' | 'subscriptions' | 'plans' | 'payments' | 'support' | 'settings';
export type CrmPage = 'dashboard' | 'leads' | 'pipeline' | 'followups' | 'reports' | 'settings';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Navigation
  adminPage: AdminPage;
  crmPage: CrmPage;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAdminPage: (page: AdminPage) => void;
  setCrmPage: (page: CrmPage) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  adminPage: 'dashboard',
  crmPage: 'dashboard',

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, adminPage: 'dashboard', crmPage: 'dashboard' });
  },

  setAdminPage: (page) => set({ adminPage: page }),
  setCrmPage: (page) => set({ crmPage: page }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
