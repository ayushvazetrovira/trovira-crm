// Email service for sending OTP emails
// Uses nodemailer with configurable SMTP settings
// For free email: Use Gmail with App Password or any SMTP service

import nodemailer from 'nodemailer';

// Create transporter - Configure with your email provider
// For Gmail: Use App Password (generate at myaccount.google.com/apppasswords)
// For other providers: Use their SMTP settings
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  // If no SMTP configured, use mock mode
  if (!smtpUser || !smtpPass) {
    console.log('📧 Email: Mock mode - No SMTP configured. Set SMTP_USER and SMTP_PASS to send real emails.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: smtpPort === '465', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const transporter = createTransporter();

// Email template for OTP
const getOTPEmailTemplate = (otp: string, email: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .otp-box {
      background: #f1f5f9;
      border: 2px dashed #0d9488;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #0d9488;
      letter-spacing: 8px;
    }
    .footer {
      padding: 20px 30px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 12px;
      margin: 0;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Use the OTP code below to verify your identity and create a new password.
      </p>
      
      <div class="otp-box">
        <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your OTP Code:</p>
        <div class="otp-code">${otp}</div>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        <strong>Valid for:</strong> 10 minutes<br>
        <strong>Requested from:</strong> ${email}
      </p>
      
      <div class="warning">
        <p>⚠️ <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support immediately. Never share this OTP with anyone.</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated email from Trovira CRM. Please do not reply to this email.</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} Trovira CRM. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  // If no SMTP configured, log and return success (mock mode)
  if (!transporter) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 MOCK EMAIL - OTP SENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: ${email}
OTP: ${otp}
Valid for: 10 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim());
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Trovira CRM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔐 Password Reset OTP - Trovira CRM',
      html: getOTPEmailTemplate(otp, email),
    });

    console.log(`📧 Email sent successfully to ${email}: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('📧 Email send error:', error);
    return { success: false, error: 'Failed to send OTP email. Please try again.' };
  }
}

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if OTP is expired
export function isOTPExpired(otpExpires: Date | string | null): boolean {
  if (!otpExpires) return true;
  return new Date(otpExpires) < new Date();
}
