'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { login, requestOTP, verifyOTP, isLoading } = useAppStore();
  
  // Three modes: login, request-otp (step 1), reset-password (step 2)
  const [mode, setMode] = useState<'login' | 'request-otp' | 'reset-password'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot password form state
  const [fpEmail, setFpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await login(email, password);
    if (!success) {
      setLoginError('Invalid email or password');
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    if (!fpEmail) {
      setFpError('Email is required');
      return;
    }

    const result = await requestOTP(fpEmail);
    if (result.success) {
      setOtpSent(true);
      setFpSuccess(result.message || 'OTP sent to your email. Please check and enter the code.');
      setMode('reset-password');
    } else {
      setFpError(result.error || 'Failed to send OTP');
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    if (!otp) {
      setFpError('OTP is required');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setFpError('New password and confirm password are required');
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

    const result = await verifyOTP(fpEmail, otp, newPassword, confirmPassword);
    if (result.success) {
      setFpSuccess('Password reset successfully! Please login with your new password.');
      // Reset and go back to login after 3 seconds
      setTimeout(() => {
        setMode('login');
        setFpEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpSent(false);
        setFpSuccess('');
      }, 3000);
    } else {
      setFpError(result.error || 'Failed to reset password');
    }
  };

  const switchToForgot = () => {
    setMode('request-otp');
    setLoginError('');
    setFpError('');
    setFpSuccess('');
    setOtpSent(false);
  };

  const switchToLogin = () => {
    setMode('login');
    setFpError('');
    setFpSuccess('');
    setOtpSent(false);
  };

  const switchToRequestOTP = () => {
    setMode('request-otp');
    setFpError('');
    setFpSuccess('');
    setOtp('');
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

        {/* Step 1: Request OTP */}
        {mode === 'request-otp' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email to receive an OTP code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestOTP} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
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

        {/* Step 2: Verify OTP & Reset Password */}
        {mode === 'reset-password' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Verify OTP & Reset Password
              </CardTitle>
              <CardDescription>
                Enter the OTP sent to your email and create a new password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
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
                  <Label htmlFor="fp-email-display">Email</Label>
                  <Input
                    id="fp-email-display"
                    type="email"
                    value={fpEmail}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Check your email for the 6-digit OTP code
                  </p>
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
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {isLoading ? 'Verifying...' : 'Verify & Reset Password'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToRequestOTP}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Request new OTP
                  </button>
                </div>
                <div className="text-center pt-2 border-t">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
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
