import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail, isOTPExpired } from '@/lib/email';

// OTP expiry time in minutes
const OTP_EXPIRY_MINUTES = 10;
// Maximum OTP attempts before lockout
const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, otp, newPassword, confirmPassword } = body;

    // Action: Request OTP
    if (action === 'request-otp') {
      return await handleRequestOTP(email);
    }

    // Action: Verify OTP and reset password
    if (action === 'verify-otp') {
      return await handleVerifyOTP(email, otp, newPassword, confirmPassword);
    }

    // Legacy: Direct password reset (for backward compatibility)
    return await handleLegacyReset(email, body.newPassword, body.confirmPassword);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OTP request
async function handleRequestOTP(email: string): Promise<NextResponse> {
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Check if user exists
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return success even if user not found (security best practice)
    // This prevents email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If the email exists, an OTP will be sent shortly.',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Update user with OTP
  await db.user.update({
    where: { email },
    data: {
      otp,
      otpExpires,
      otpAttempts: 0, // Reset attempts
    },
  });

  // Send OTP via email
  const emailResult = await sendOTPEmail(email, otp);

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || 'Failed to send OTP email' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'OTP sent successfully. Please check your email.',
  });
}

// Handle OTP verification and password reset
async function handleVerifyOTP(
  email: string,
  otp: string,
  newPassword: string,
  confirmPassword: string
): Promise<NextResponse> {
  // Validate inputs
  if (!email || !otp || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: 'All fields are required: email, OTP, new password, and confirm password' },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'New password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Find user
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check OTP attempts
  if (user.otpAttempts && user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please request a new OTP.' },
      { status: 403 }
    );
  }

  // Check if OTP exists
  if (!user.otp || !user.otpExpires) {
    return NextResponse.json(
      { error: 'No OTP requested. Please request an OTP first.' },
      { status: 400 }
    );
  }

  // Check if OTP is expired
  if (isOTPExpired(user.otpExpires)) {
    return NextResponse.json(
      { error: 'OTP expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

// Debug: Log the full comparison details
  console.log('=== OTP Verification Debug ===');
  console.log('Input Email:', email);
  console.log('Stored OTP:', user.otp);
  console.log('Input OTP:', otp);
  console.log('OTP Length Match:', user.otp?.length === otp?.length);
  console.log('Exact Match:', user.otp === otp);
  console.log('=========================');

  // Direct string comparison
  if (user.otp !== otp) {
    // Increment failed attempts
    const newAttempts = (user.otpAttempts || 0) + 1;
    await db.user.update({
      where: { email },
      data: { otpAttempts: newAttempts },
    });

    const remainingAttempts = MAX_OTP_ATTEMPTS - newAttempts;
    if (remainingAttempts <= 0) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `Invalid OTP. ${remainingAttempts} attempts remaining.` },
      { status: 400 }
    );
  }

  // OTP verified - Update password and clear OTP
  await db.user.update({
    where: { email },
    data: {
      password: newPassword,
      otp: null, // Clear OTP
      otpExpires: null, // Clear expiry
      otpAttempts: 0, // Reset attempts
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  });
}

// Legacy handler for backward compatibility
async function handleLegacyReset(
  email: string,
  newPassword: string,
  confirmPassword: string
): Promise<NextResponse> {
  if (!email || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: 'Email, new password, and confirm password are required' },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'New password must be at least 6 characters' },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only allow super admin to reset password via this flow
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'This reset option is only available for super admin' },
      { status: 403 }
    );
  }

  await db.user.update({
    where: { email },
    data: { password: newPassword },
  });

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  });
}
