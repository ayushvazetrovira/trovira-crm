import { create } from 'zustand';

export type UserRole = 'admin' | 'client' | 'team_agent' | 'team_manager' | 'team_admin' | 'team_viewer';
export type AdminPage = 'dashboard' | 'clients' | 'subscriptions' | 'plans' | 'payments' | 'support' | 'settings';
export type CrmPage = 'dashboard' | 'leads' | 'pipeline' | 'followups' | 'tasks' | 'team' | 'reports' | 'broadcast' | 'automation' | 'email' | 'whatsapp' | 'api' | 'notes' | 'settings';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isTeamMember?: boolean;
  companyId?: string;
  companyName?: string;
  planName?: string;
  planId?: string;
  subscriptionExpiry?: string;
  subscriptionStatus?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Navigation
  adminPage: AdminPage;
  crmPage: CrmPage;
  isTeamMember: boolean;
  clientFilter: 'all' | 'active' | 'inactive';

  // Branding
  customLogo: string | null;

  // Notifications
  notifications: Notification[];
  showNotifications: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAdminPage: (page: AdminPage) => void;
  setCrmPage: (page: CrmPage) => void;
  setIsTeamMember: (isTeamMember: boolean) => void;
  setLoading: (loading: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setCustomLogo: (filename: string | null) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
user: null,
  isAuthenticated: false,
  isLoading: false,

  adminPage: 'dashboard',
  crmPage: 'dashboard',
  isTeamMember: false,
  clientFilter: 'all',
  customLogo: null,
  notifications: [
{ id: '1', title: 'Welcome!', message: 'Welcome to Trovira CRM. Get started by exploring the dashboard.', type: 'info', read: false, createdAt: '2024-01-01T00:00:00Z' },
    { id: '2', title: 'New Lead Added', message: 'A new lead was captured from WhatsApp.', type: 'success', read: false, createdAt: '2024-01-02T00:00:00Z' },

    { id: '3', title: 'Follow-up Reminder', message: 'You have follow-ups scheduled for today.', type: 'warning', read: false, createdAt: '2024-01-03T00:00:00Z' },

  ],
  showNotifications: false,

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
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            isTeamMember: data.user.isTeamMember || false
          });
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
    set({ user: null, isAuthenticated: false, adminPage: 'dashboard', crmPage: 'dashboard', isTeamMember: false });
  },

  setAdminPage: (page) => set({ adminPage: page }),
  setCrmPage: (page) => set({ crmPage: page }),
  setIsTeamMember: (isTeamMember) => set({ isTeamMember }),
  setClientFilter: (filter) => set({ clientFilter: filter }),
  setLoading: (loading) => set({ isLoading: loading }),
  setShowNotifications: (show) => set({ showNotifications: show }),
  setCustomLogo: (filename) => set({ customLogo: filename }),
  markNotificationRead: (id) => {
    set({ notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n) });
  },
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    set({ notifications: [newNotification, ...get().notifications] });
  },
}));

