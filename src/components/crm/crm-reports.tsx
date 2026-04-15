'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, CalendarDays, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';

interface ReportsData {
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  lossRate: number;
  followupSummary: Record<string, number>;
}

interface SourceItem {
  name: string;
  value: number;
  uniqueKey: string;
}

type Period = 'all' | 'daily' | 'monthly' | 'yearly';

const PIE_COLORS = [
  '#14b8a6',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

const statusBarColors: Record<string, string> = {
  New: '#6b7280',
  Contacted: '#14b8a6',
  Interested: '#0ea5e9',
  'Proposal Sent': '#f59e0b',
  Won: '#10b981',
  Lost: '#ef4444',
};

const PERIOD_LABELS: Record<Period, string> = {
  all: 'All Time',
  daily: 'Today',
  monthly: 'This Month',
  yearly: 'This Year',
};

export function CrmReports() {
  const { user } = useAppStore();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/crm/reports?companyId=${user?.companyId}&period=${period}`
        );
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    if (user?.companyId) fetchReports();
  }, [user?.companyId, period]);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!reportRef.current || !data) return;
    setExporting('pdf');
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let yOffset = 0;
      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
        yOffset += pageHeight;
      }
      pdf.save(`crm-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  // ── Excel Export ────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!data) return;
    setExporting('excel');
    try {
      const wb = XLSX.utils.book_new();

      const summaryRows = [
        ['CRM Report', PERIOD_LABELS[period]],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Metric', 'Value'],
        ['Total Leads', data.totalLeads],
        ['Won Leads', data.wonLeads],
        ['Lost Leads', data.lostLeads],
        ['Conversion Rate (%)', data.conversionRate],
        ['Loss Rate (%)', data.lossRate],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

      const sourceRows = [
        ['Source', 'Leads', 'Share (%)'],
        ...Object.entries(data.leadsBySource).map(([src, count]) => [
          src.charAt(0).toUpperCase() + src.slice(1).replace('_', ' '),
          count,
          data.totalLeads > 0 ? +((count / data.totalLeads) * 100).toFixed(1) : 0,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sourceRows), 'Leads by Source');

      const statusRows = [
        ['Status', 'Count'],
        ...Object.entries(data.leadsByStatus).map(([s, c]) => [s, c]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusRows), 'Leads by Status');

      const followupRows = [
        ['Follow-up Status', 'Count'],
        ...Object.entries(data.followupSummary).map(([k, v]) => [
          k.charAt(0).toUpperCase() + k.slice(1),
          v,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(followupRows), 'Follow-ups');

      XLSX.writeFile(wb, `crm-report-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-gray-500">
          No report data available.
        </CardContent>
      </Card>
    );
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const sourceData: SourceItem[] = Object.entries(data.leadsBySource)
    .map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
      uniqueKey: `source-${name}-${index}`,
    }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(data.leadsByStatus).map(([name, value], index) => ({
    name,
    count: value,
    uniqueKey: `status-${name}-${index}`,
    color: statusBarColors[name] || '#6b7280',
  }));

  const followupData = [
    { label: 'Pending',   value: data.followupSummary['pending']   || 0, icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Completed', value: data.followupSummary['completed'] || 0, icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overdue',   value: data.followupSummary['overdue']   || 0, icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50'     },
  ].filter((f) => f.value > 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ══ GENERATE REPORT BAR — very visible at top ══════════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Header row */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <Download className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Generate Report</span>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">

          {/* Period toggle */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 mr-1">Period:</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'daily', 'monthly', 'yearly'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 ${
                    period === p
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-2">
            {/* PDF button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-red-50 text-red-600 border border-red-200
                         hover:bg-red-100 hover:border-red-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-150"
            >
              {exporting === 'pdf'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileText className="h-4 w-4" />}
              {exporting === 'pdf' ? 'Generating…' : 'Download PDF'}
            </button>

            {/* Excel button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-green-50 text-green-700 border border-green-200
                         hover:bg-green-100 hover:border-green-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-150"
            >
              {exporting === 'excel'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileSpreadsheet className="h-4 w-4" />}
              {exporting === 'excel' ? 'Generating…' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>
      {/* ══ END GENERATE REPORT BAR ══════════════════════════════════════════ */}


      {/* ══ REPORT CONTENT captured for PDF ══════════════════════════════════ */}
      <div ref={reportRef} className="space-y-5 bg-white">

        {/* PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Leads by Source
              <span className="ml-auto text-xs font-normal text-gray-400">
                {PERIOD_LABELS[period]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SOURCE TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceData.map((item, index) => (
                  <TableRow key={item.uniqueKey}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>
                      {data.totalLeads > 0
                        ? ((item.value / data.totalLeads) * 100).toFixed(1)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* STATUS BAR CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {statusData.map((entry) => (
                    <Cell key={entry.uniqueKey} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FOLLOW-UPS */}
        {followupData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {followupData.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={`fu-${index}`} className="text-center">
                      <div className={`p-2 rounded-full ${item.bg} inline-flex mb-1`}>
                        <Icon className={item.color} />
                      </div>
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-sm text-gray-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SUMMARY STATS */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Total Leads',     value: data.totalLeads,          color: 'text-gray-800'    },
                { label: 'Won',             value: data.wonLeads,             color: 'text-emerald-600' },
                { label: 'Lost',            value: data.lostLeads,            color: 'text-red-500'     },
                { label: 'Conversion Rate', value: `${data.conversionRate}%`, color: 'text-teal-600'    },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
      {/* /reportRef */}

    </div>
  );
}