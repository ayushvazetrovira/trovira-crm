'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, ArrowLeft, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { login, forgotPassword, isLoading } = useAppStore();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot password form state
  const [fpEmail, setFpEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await login(email, password);
    if (!success) {
      setLoginError('Invalid email or password');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    if (!fpEmail || !newPassword || !confirmPassword) {
      setFpError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFpError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFpError('Password must be at least 6 characters');
      return;
    }

    const result = await forgotPassword(fpEmail, newPassword, confirmPassword);
    if (result.success) {
      setFpSuccess('Password reset successfully! Please login with your new password.');
      setFpEmail('');
      setNewPassword('');
      setConfirmPassword('');
      // Switch back to login after 2 seconds
      setTimeout(() => {
        setMode('login');
        setFpSuccess('');
      }, 2500);
    } else {
      setFpError(result.error || 'Failed to reset password');
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    setLoginError('');
    setFpError('');
    setFpSuccess('');
  };

  const switchToLogin = () => {
    setMode('login');
    setFpError('');
    setFpSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <img 
            src="/logo.jpg" 
            alt="Trovira CRM" 
            className="mx-auto h-16 w-16 rounded-xl object-contain bg-white/20 p-2 shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trovira CRM</h1>
            <p className="text-muted-foreground text-sm">Multi-Tenant SaaS Customer Relationship Management</p>
          </div>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
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
                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToForgot}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your admin email and a new password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {fpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{fpError}</AlertDescription>
                  </Alert>
                )}
                {fpSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{fpSuccess}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-new-password">New Password</Label>
                  <Input
                    id="fp-new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-confirm-password">Confirm Password</Label>
                  <Input
                    id="fp-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

