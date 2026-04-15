'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Lock,
  Save,
  CreditCard,
  Shield,
  Crown,
  CheckCircle2,
  Users,
  Target,
  Zap,
  Bot,
  BarChart3,
  Kanban,
  ListTodo,
  UserCog,
  Clock,
} from 'lucide-react';

interface Settings {
  businessName: string;
  whatsappNumber: string;
  logo: string;
  email: string;
  phone: string;
}

export function CrmSettings() {
  const { user } = useAppStore();

  const [settings, setSettings] = useState<Settings>({
    businessName: '',
    whatsappNumber: '',
    logo: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`/api/crm/settings?companyId=${user?.companyId}`);
        if (res.ok) {
          const json = await res.json();

          // ✅ FIX: prevent null values crashing inputs
          setSettings({
            businessName: json?.businessName ?? '',
            whatsappNumber: json?.whatsappNumber ?? '',
            logo: json?.logo ?? '',
            email: json?.email ?? '',
            phone: json?.phone ?? '',
          });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    if (user?.companyId) fetchSettings();
  }, [user?.companyId]);

  const handleSaveBusiness = async () => {
    try {
      setSavingBusiness(true);

      const res = await fetch(`/api/crm/settings?companyId=${user?.companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Business information updated successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update settings');
      }
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSavingPassword(true);

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            Profile Settings
          </CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Display Name</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Email</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{user?.email}</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-600" />
            Business Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <Label>Business Name</Label>
              <Input
                value={settings.businessName ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, businessName: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={settings.email ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={settings.phone ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input
                value={settings.whatsappNumber ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, whatsappNumber: e.target.value })
                }
              />
            </div>

          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveBusiness} disabled={savingBusiness}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Lock className="h-4 w-4 text-teal-600" />
            Change Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
            }
          />

          <Input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
          />

          <Input
            type="password"
            placeholder="Confirm password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
            }
          />

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              Change Password
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}