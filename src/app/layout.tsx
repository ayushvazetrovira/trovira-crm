import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trovira CRM - Multi-Tenant SaaS CRM",
  description: "Comprehensive multi-tenant CRM platform with admin panel and client CRM. Manage clients, leads, pipelines, and subscriptions.",
  keywords: ["CRM", "Trovira", "SaaS", "Lead Management", "Customer Relationship Management"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "/logo.jpg", // Dynamic favicon not supported in metadata, static fallback
  },
  openGraph: {
    title: "Trovira CRM",
    description: "Multi-Tenant SaaS Customer Relationship Management",
    siteName: "Trovira",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trovira CRM",
    description: "Multi-Tenant SaaS Customer Relationship Management",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
