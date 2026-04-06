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
          setSettings(json);
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
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
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
      {/* Profile Settings */}
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
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400">Account Owner</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Email Address</Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Company</Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.companyName || '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Role</Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-gray-400" />
                <Badge variant="secondary" className="capitalize bg-teal-100 text-teal-700">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-600" />
            Business Information
          </CardTitle>
          <CardDescription>Manage your business details that appear in your CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Your business name"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="business@example.com"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="+91 98765 43210"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="+91 98765 43210"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveBusiness}
              disabled={savingBusiness}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {savingBusiness ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-600" />
            Subscription Plan
          </CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  <Crown className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Free Plan</p>
                  <p className="text-sm text-gray-500">Basic CRM features</p>
                </div>
              </div>
              <Badge className="bg-teal-100 text-teal-700 border-teal-200" variant="outline">
                Active
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Lead Limit</p>
                <p className="font-medium">50 leads</p>
              </div>
              <div>
                <p className="text-gray-500">Users</p>
                <p className="font-medium">1 user</p>
              </div>
              <div>
                <p className="text-gray-500">Support</p>
                <p className="font-medium">Email</p>
              </div>
              <div>
                <p className="text-gray-500">API Access</p>
                <p className="font-medium">Limited</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-teal-600" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password for security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              variant="outline"
            >
              {savingPassword ? (
                'Changing...'
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1.5" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
