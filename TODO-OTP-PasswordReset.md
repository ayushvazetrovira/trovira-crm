# OTP Password Reset Implementation Plan

## Overview
Implement a secure OTP-based password reset feature where users must verify their identity via OTP sent to email before resetting password.

## Steps

### 1. Database Schema Updates
- [ ] Update prisma/schema.prisma to add OTP fields to User model
  - otp: string (stores the OTP code)
  - otpExpires: DateTime (when OTP expires)
  - otpAttempts: Int (failed attempts counter)

### 2. Create Email Service
- [ ] Create src/lib/email.ts for sending OTP emails (using nodemailer with free SMTP)
  - Support for Gmail SMTP (free with app password)
  - Mock mode for testing without email configuration

### 3. API Routes
- [ ] Update /api/auth/forgot-password/route.ts to split into:
  - POST /request-otp - Generate and send OTP to email
  - POST /verify-otp - Verify OTP and reset password

### 4. Store Updates
- [ ] Update src/lib/store.ts to add:
  - requestOTP action
  - verifyOTPAndResetPassword action

### 5. Frontend Updates
- [ ] Update src/components/login.tsx:
  - Step 1: Enter email to request OTP
  - Step 2: Enter OTP + new password + confirm password
  - Add visual feedback for each step

## Implementation Status
- [x] Step 1: Schema updates completed (prisma/schema.prisma)
- [x] Step 2: Email service created (src/lib/email.ts)
- [x] Step 3: API routes updated (src/app/api/auth/forgot-password/route.ts)
- [x] Step 4: Store updated (src/lib/store.ts)
- [x] Step 5: Frontend UI updated (src/components/login.tsx)
- [x] Step 6: Database synced (prisma db push)
- [x] Step 7: Dependencies installed (nodemailer, @types/nodemailer)

## Email Configuration (Optional)
To enable real emails, add these to your .env file:
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=your-email@gmail.com
- SMTP_PASS=your-app-password
- SMTP_FROM=Trovira CRM <your-email@gmail.com>

Without these, the system works in mock mode (logs OTP to console).
