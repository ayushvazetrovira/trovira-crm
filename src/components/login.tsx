'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, LogIn, Shield, Users } from 'lucide-react';

export function LoginPage() {
  const { login, isLoading } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const quickLogin = async (loginEmail: string, loginPassword: string) => {
    setEmail(loginEmail);
    setPassword(loginPassword);
    setError('');
    const success = await login(loginEmail, loginPassword);
    if (!success) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trovira CRM</h1>
          <p className="text-muted-foreground">Multi-Tenant SaaS Customer Relationship Management</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Access (Demo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Super Admin</span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('admin@trovira.com', 'admin123')}
            >
              admin@trovira.com
            </Button>
            <div className="flex items-center gap-2 mb-3 mt-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Client CRM — Trovira Plan</span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('raj@abcschool.com', 'client123')}
            >
              ABC School
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('amit@xyzrealty.com', 'client123')}
            >
              XYZ Realty
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('neha@pqrtravel.com', 'client123')}
            >
              PQR Travel
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('vikram@deftech.com', 'client123')}
            >
              DEF Technologies
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => quickLogin('anita@mnohealth.com', 'client123')}
            >
              MNO Healthcare
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
