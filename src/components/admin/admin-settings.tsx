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
  Image as ImageIcon,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminSettings() {
  const { user, customLogo } = useAppStore();

  const logoSrc = customLogo ? `/upload/${customLogo}` : '/logo.jpg';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Super Admin Profile
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>

            <div>
              <h3 className="font-semibold">{user?.name || 'Admin'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <Badge>Super Administrator</Badge>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock icon={<User />} label="Name" value={user?.name} />
            <InfoBlock icon={<Mail />} label="Email" value={user?.email} />
            <InfoBlock icon={<Shield />} label="Role" value="Super Admin" />
            <InfoBlock icon={<Calendar />} label="ID" value={user?.id} />
          </div>
        </CardContent>
      </Card>

      {/* Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Platform Info
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock icon={<Globe />} label="App" value="Trovira CRM" />
            <InfoBlock icon={<Building2 />} label="Version" value="1.0.0" />
            <InfoBlock icon={<Shield />} label="Framework" value="Next.js" />
            <InfoBlock icon={<Calendar />} label="Env" value="Production" />
          </div>

          <Separator className="my-6" />

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                Branding
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 border rounded flex items-center justify-center">
                    <img
                      src={logoSrc}
                      alt="logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Current Logo</p>
                </div>

                <div className="flex-1">
                  <Label>Upload Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append('logo', file);

                      const res = await fetch('/api/admin/logo', {
                        method: 'POST',
                        body: formData,
                      });

                      if (res.ok) {
                        const data = await res.json();
                        useAppStore.getState().setCustomLogo(data.filename);
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

// small reusable component
function InfoBlock({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value || 'N/A'}</p>
      </div>
    </div>
  );
}