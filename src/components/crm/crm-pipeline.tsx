'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  History,
  ChevronLeft,
  ChevronRight,
  Kanban,
  GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';

interface PipelineLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  value: number | null;
  followupDate: string | null;
  createdAt: string;
  followups: Array<{ id: string; date: string; purpose: string }>;
  _count: { notesList: number };
}

interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  value: number | null;
  followupDate: string | null;
  notes: string | null;
  notesList: Array<{ id: string; content: string; createdAt: string }>;
  stageHistory: Array<{ id: string; fromStage: string | null; toStage: string; createdAt: string }>;
  followups: Array<{ id: string; date: string; time: string | null; purpose: string; status: string; notes: string | null }>;
}

const STAGES = ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Won', 'Lost'];

const stageColors: Record<string, { bg: string; border: string; header: string; headerText: string }> = {
  New: { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100', headerText: 'text-gray-700' },
  Contacted: { bg: 'bg-slate-50', border: 'border-slate-200', header: 'bg-slate-100', headerText: 'text-slate-700' },
  Interested: { bg: 'bg-sky-50', border: 'border-sky-200', header: 'bg-sky-100', headerText: 'text-sky-700' },
  'Proposal Sent': { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', headerText: 'text-amber-700' },
  Won: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', headerText: 'text-emerald-700' },
  Lost: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100', headerText: 'text-red-700' },
};

const moveableStages: Record<string, string[]> = {
  New: ['Contacted'],
  Contacted: ['New', 'Interested', 'Lost'],
  Interested: ['Contacted', 'Proposal Sent', 'Lost'],
  'Proposal Sent': ['Interested', 'Won', 'Lost'],
  Won: ['Proposal Sent'],
  Lost: ['Contacted', 'Interested'],
};

export function CrmPipeline() {
  const { user } = useAppStore();
  const [pipeline, setPipeline] = useState<Record<string, PipelineLead[]>>({});
  const [loading, setLoading] = useState(true);
  const [movingLead, setMovingLead] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<LeadDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/pipeline?companyId=${user?.companyId}`);
      if (res.ok) {
        const json = await res.json();
        setPipeline(json.pipeline);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const moveLead = async (leadId: string, newStatus: string) => {
    try {
      setMovingLead(leadId);
      const res = await fetch(`/api/crm/pipeline/${leadId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, newStatus }),
      });
      if (res.ok) {
        toast.success(`Lead moved to ${newStatus}`);
        fetchPipeline();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to move lead');
      }
    } catch {
      toast.error('Failed to move lead');
    } finally {
      setMovingLead(null);
    }
  };

  const openDetail = async (leadId: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`);
      if (res.ok) {
        const lead = await res.json();
        setDetailLead(lead);
        setShowDetail(true);
      }
    } catch {
      toast.error('Failed to load lead details');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[260px] flex-shrink-0 space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Kanban className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline</h3>
        <span className="text-sm text-gray-400">
          {Object.values(pipeline).flat().length} leads
        </span>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = pipeline[stage] || [];
          const colors = stageColors[stage];
          const totalValue = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);

          return (
            <div
              key={stage}
              className={`min-w-[260px] max-w-[300px] flex-shrink-0 flex flex-col rounded-xl border ${colors.border} ${colors.bg}`}
            >
              {/* Column Header */}
              <div className={`rounded-t-xl px-4 py-3 ${colors.header}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-semibold ${colors.headerText}`}>{stage}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{stageLeads.length} leads</p>
                  </div>
                  {totalValue > 0 && (
                    <span className="text-xs font-medium text-gray-500">
                      ₹{totalValue.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Cards */}
              <ScrollArea className="flex-1 max-h-[calc(100vh-260px)]">
                <div className="p-2 space-y-2">
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => {
                      const canMove = moveableStages[stage] || [];
                      return (
                        <Card
                          key={lead.id}
                          className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-white"
                          onClick={() => openDetail(lead.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                                {lead.company && (
                                  <p className="text-xs text-gray-400 truncate">{lead.company}</p>
                                )}
                              </div>
                              <div
                                className="flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                              </div>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                              {lead.value && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>{Number(lead.value).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 capitalize">
                                {lead.source.replace('_', ' ')}
                              </Badge>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                {canMove.map((target) => (
                                  <Button
                                    key={target}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveLead(lead.id, target)}
                                    disabled={movingLead === lead.id}
                                    title={`Move to ${target}`}
                                  >
                                    {STAGES.indexOf(target) < STAGES.indexOf(stage) ? (
                                      <ChevronLeft className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <p className="text-xs">No leads</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                    {detailLead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle>{detailLead.name}</DialogTitle>
                    <DialogDescription>
                      {detailLead.company || 'No company'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Quick Move */}
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Move to Stage</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {STAGES.filter((s) => s !== detailLead.status).map((stage) => (
                      <Button
                        key={stage}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          moveLead(detailLead.id, stage);
                          setShowDetail(false);
                        }}
                        disabled={movingLead === detailLead.id}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{detailLead.phone}</span>
                  </div>
                  {detailLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{detailLead.email}</span>
                    </div>
                  )}
                  {detailLead.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{detailLead.company}</span>
                    </div>
                  )}
                  {detailLead.value && (
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                      <span>₹{Number(detailLead.value).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {detailLead.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{detailLead.notes}</p>
                )}

                <Separator />

                {/* Stage History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Stage History</h4>
                  {detailLead.stageHistory.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {detailLead.stageHistory.map((sh) => (
                        <div key={sh.id} className="flex items-center gap-3 text-sm">
                          <History className="h-3 w-3 text-teal-500 flex-shrink-0" />
                          <span className="text-gray-600">
                            {sh.fromStage || 'Start'} → {sh.toStage}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {format(new Date(sh.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No stage history</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


