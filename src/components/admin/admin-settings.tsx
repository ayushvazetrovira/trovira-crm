'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Mail,
  User,
  Calendar,
  Globe,
  Building2,
} from 'lucide-react';

export function AdminSettings() {
  const { user } = useAppStore();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Admin Profile */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{user?.name || 'Admin'}</h3>
              <p className="text-sm text-neutral-500">{user?.email || 'admin@trovira.com'}</p>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
                Administrator
              </Badge>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <User className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Full Name</p>
                <p className="text-sm font-medium text-neutral-900">{user?.name || 'Admin User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Mail className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm font-medium text-neutral-900">{user?.email || 'admin@trovira.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Shield className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Role</p>
                <p className="text-sm font-medium text-neutral-900">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Company ID</p>
                <p className="text-sm font-mono text-neutral-900">{user?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Globe className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Application</p>
                <p className="text-sm font-medium text-neutral-900">Trovira CRM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Building2 className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Version</p>
                <p className="text-sm font-medium text-neutral-900">1.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Shield className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Framework</p>
                <p className="text-sm font-medium text-neutral-900">Next.js 15</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Environment</p>
                <p className="text-sm font-medium text-neutral-900">Production</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h4 className="text-sm font-semibold text-emerald-800 mb-2">About Trovira CRM</h4>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Trovira CRM is a comprehensive customer relationship management platform designed
              for businesses of all sizes. Manage leads, track follow-ups, monitor subscriptions,
              and streamline your sales pipeline — all in one place.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
