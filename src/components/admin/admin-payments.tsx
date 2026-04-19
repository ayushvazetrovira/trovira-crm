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
import { Download, IndianRupee, FileText } from 'lucide-react';

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
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  };

  return <Badge className={variants[status] || ''}>{status}</Badge>;
}

function MethodBadge({ method }: { method: string }) {
  return <Badge variant="secondary">{method}</Badge>;
}

export function AdminPayments() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      setPayments(data);
    } catch {
      setPayments([]);
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

  // ✅ FIXED FUNCTION
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  // ✅ Now correctly outside
  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/admin/payments/report');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed');
    }
  };

  const handleDownloadInvoice = async (payment: PaymentItem) => {
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/invoice`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${payment.id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      alert('Invoice download failed');
    }
  };

  return (
    <div className="space-y-4">

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p>Total Revenue</p>
            <p>₹{totalRevenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p>Pending</p>
            <p>₹{pendingAmount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p>Transactions</p>
            <p>{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Payments
            <Button onClick={handleDownloadReport}>
              <FileText className="w-4 h-4 mr-2" />
              Report
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading...</TableCell>
                  </TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.company.name}</TableCell>
                    <TableCell>₹{p.amount}</TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <Button onClick={() => handleDownloadInvoice(p)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}