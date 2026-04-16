'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, IndianRupee } from 'lucide-react';

interface PaymentItem {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  createdAt: string;
  company: { id: string; name: string; contactPerson: string };
  plan: { id: string; name: string; price: number };
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <Badge variant="outline" className={variants[status] || 'bg-neutral-100 text-neutral-700'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function MethodBadge({ method }: { method: string }) {
  const variants: Record<string, string> = {
    UPI: 'bg-violet-100 text-violet-700',
    Bank: 'bg-cyan-100 text-cyan-700',
    Card: 'bg-orange-100 text-orange-700',
  };
  return (
    <Badge variant="secondary" className={variants[method] || 'bg-neutral-100 text-neutral-700'}>
      {method}
    </Badge>
  );
}

export function AdminPayments() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to load payments');
      const json = await res.json();
      setPayments(json);
    } catch {
      // Handle silently, show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadInvoice = async (payment: PaymentItem) => {
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/invoice`);
      if (!res.ok) {
        alert('Failed to generate PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${payment.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Revenue</p>
                <p className="text-xl font-bold text-neutral-900">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Pending</p>
                <p className="text-xl font-bold text-neutral-900">
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Transactions</p>
                <p className="text-xl font-bold text-neutral-900">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Method</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-neutral-400">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-neutral-50 transition-colors">
                      <TableCell className="font-medium text-neutral-900">
                        {payment.company.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                          {payment.plan.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-neutral-500">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <MethodBadge method={payment.method} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadInvoice(payment)}
                          title="Download PDF Invoice"
                        >
                          <Download className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
