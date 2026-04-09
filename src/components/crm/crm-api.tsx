'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  Webhook,
  Plug,
  Shield,
  Zap,
  BarChart3,
  Code2,
  Link2,
  Trash2,
  Plus,
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string;
  status: string;
  lastTriggered: string | null;
  successCount: number;
  failCount: number;
  createdAt: string;
}

interface ApiLog {
  id: string;
  method: string;
  path: string;
  status: number;
  timestamp: string;
  duration: string;
  ip: string;
}

const demoLogs: ApiLog[] = [
  { id: 'log_1', method: 'GET', path: '/api/crm/leads?companyId=comp_abc', status: 200, timestamp: '2025-07-10T10:45:00', duration: '45ms', ip: '192.168.1.100' },
  { id: 'log_2', method: 'POST', path: '/api/crm/leads', status: 201, timestamp: '2025-07-10T10:42:00', duration: '120ms', ip: '192.168.1.100' },
  { id: 'log_3', method: 'PUT', path: '/api/crm/pipeline/lead_123/stage', status: 200, timestamp: '2025-07-10T10:38:00', duration: '89ms', ip: '10.0.0.50' },
  { id: 'log_4', method: 'GET', path: '/api/crm/reports?companyId=comp_abc', status: 200, timestamp: '2025-07-10T10:35:00', duration: '230ms', ip: '192.168.1.100' },
  { id: 'log_5', method: 'POST', path: '/api/crm/followups', status: 201, timestamp: '2025-07-10T10:30:00', duration: '95ms', ip: '192.168.1.100' },
  { id: 'log_6', method: 'DELETE', path: '/api/crm/leads/lead_456', status: 200, timestamp: '2025-07-10T10:25:00', duration: '67ms', ip: '10.0.0.50' },
  { id: 'log_7', method: 'GET', path: '/api/crm/pipeline?companyId=comp_abc', status: 200, timestamp: '2025-07-10T10:20:00', duration: '180ms', ip: '192.168.1.100' },
  { id: 'log_8', method: 'PUT', path: '/api/crm/settings?companyId=comp_abc', status: 200, timestamp: '2025-07-10T10:15:00', duration: '55ms', ip: '192.168.1.100' },
];

const connectedApps = [
  { name: 'Google Sheets', icon: '📊', status: 'connected', description: 'Sync leads to Google Sheets automatically' },
  { name: 'Slack', icon: '💬', status: 'connected', description: 'Get notifications on Slack channels' },
  { name: 'Zapier', icon: '⚡', status: 'disconnected', description: 'Connect with 5000+ apps via Zapier' },
  { name: 'Mailchimp', icon: '📧', status: 'disconnected', description: 'Sync contacts to Mailchimp lists' },
  { name: 'Calendly', icon: '📅', status: 'connected', description: 'Schedule meetings directly from CRM' },
  { name: 'Shopify', icon: '🛒', status: 'disconnected', description: 'Import customer data from Shopify' },
];

const apiCodeExample = `// Trovira CRM API Example
const API_KEY = 'tv_live_xxxxxxxxxxxxxxxxxxxx';
const BASE_URL = 'https://api.trovira.com/v1';

// Fetch all leads
fetch(\`\${BASE_URL}/leads\`, {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));

// Create a new lead
fetch(\`\${BASE_URL}/leads\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '+91 98765 43210',
    email: 'john@example.com',
    source: 'website',
    status: 'New'
  })
});`;

export function CrmApi() {
  const { user } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('tv_live_a1b2c3d4e5f6g7h8i9j0');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: 'lead.created' });
  const [activeTab, setActiveTab] = useState<'overview' | 'webhooks' | 'logs' | 'docs'>('overview');
  const [apps, setApps] = useState(connectedApps);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/webhooks?companyId=${user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: WebhookConfig[] = (data.webhooks || []).map((w: Record<string, unknown>) => ({
          id: w.id,
          name: w.name,
          url: w.url,
          events: w.events || '',
          status: w.status || 'active',
          lastTriggered: w.lastTriggered || null,
          successCount: w.successCount || 0,
          failCount: w.failCount || 0,
          createdAt: w.createdAt,
        }));
        setWebhooks(mapped);
      } else {
        toast.error('Failed to fetch webhooks');
      }
    } catch {
      toast.error('Failed to fetch webhooks');
    } finally {
      setWebhooksLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const regenerateApiKey = () => {
    toast.success('API key regenerated. Old key will be deactivated in 24 hours.');
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast.error('Please fill in webhook name and URL');
      return;
    }
    try {
      const res = await fetch('/api/crm/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user?.companyId,
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
        }),
      });
      if (res.ok) {
        setNewWebhook({ name: '', url: '', events: 'lead.created' });
        setWebhookDialogOpen(false);
        toast.success('Webhook created successfully');
        fetchWebhooks();
      } else {
        toast.error('Failed to create webhook');
      }
    } catch {
      toast.error('Failed to create webhook');
    }
  };

  const toggleWebhook = async (id: string) => {
    const wh = webhooks.find((w) => w.id === id);
    if (!wh) return;
    const newStatus = wh.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/crm/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success('Webhook status updated');
        fetchWebhooks();
      } else {
        toast.error('Failed to update webhook');
      }
    } catch {
      toast.error('Failed to update webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/webhooks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Webhook deleted');
        fetchWebhooks();
      } else {
        toast.error('Failed to delete webhook');
      }
    } catch {
      toast.error('Failed to delete webhook');
    }
  };

  const toggleApp = (name: string) => {
    setApps(apps.map(a => a.name === name ? { ...a, status: a.status === 'connected' ? 'disconnected' : 'connected' } : a));
    toast.success(`App ${name === apps.find(a => a.name === name)?.status ? 'disconnected' : 'connected'}`);
  };

  const totalApiCalls = webhooks.reduce((sum, w) => sum + w.successCount + w.failCount, 0) + 1250;
  const activeWebhooks = webhooks.filter(w => w.status === 'active').length;

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Zap },
    { key: 'webhooks' as const, label: 'Webhooks', icon: Webhook },
    { key: 'logs' as const, label: 'API Logs', icon: BarChart3 },
    { key: 'docs' as const, label: 'Documentation', icon: Code2 },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center"><Key className="h-5 w-5 text-teal-600" /></div>
            <div><p className="text-xs text-gray-500">API Key</p><p className="text-sm font-bold text-gray-900">Active</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">API Calls</p><p className="text-lg font-bold text-gray-900">{totalApiCalls.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><Webhook className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Active Webhooks</p><p className="text-lg font-bold text-gray-900">{activeWebhooks}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Plug className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-xs text-gray-500">Connected Apps</p><p className="text-lg font-bold text-gray-900">{apps.filter(a => a.status === 'connected').length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* API Key */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-teal-600" /> API Key</CardTitle>
              <CardDescription>Use this key to authenticate API requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <Shield className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <code className="text-sm font-mono text-gray-700 flex-1 truncate">{showApiKey ? apiKey : '••••••••••••••••••••••••••••••'}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerateApiKey}><RefreshCw className="h-3.5 w-3.5" /> Regenerate Key</Button>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">Keep your API key secure. Never share it publicly or commit it to version control.</p>
              </div>
            </CardContent>
          </Card>

          {/* Connected Apps */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4 text-teal-600" /> Connected Apps</CardTitle>
              <CardDescription>Manage third-party integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apps.map((app) => (
                  <div key={app.name} className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <span className="text-2xl">{app.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      <p className="text-xs text-gray-500 truncate">{app.description}</p>
                    </div>
                    <Switch checked={app.status === 'connected'} onCheckedChange={() => toggleApp(app.name)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Webhooks</h3>
              <p className="text-sm text-gray-500">Configure webhook endpoints to receive real-time events</p>
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5" onClick={() => setWebhookDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add Webhook
            </Button>
          </div>

          {webhooksLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <Card key={wh.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{wh.name}</p>
                          <Badge variant="outline" className={`text-xs ${wh.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {wh.status === 'active' ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 font-mono truncate">{wh.url}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">Events: {wh.events}</span>
                          <span className="text-xs text-emerald-600">{wh.successCount} success</span>
                          <span className="text-xs text-red-500">{wh.failCount} failed</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleWebhook(wh.id)}>
                          {wh.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteWebhook(wh.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Webhook className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No webhooks configured</p>
                <p className="text-xs mt-1">Click "Add Webhook" to set up your first endpoint.</p>
              </CardContent>
            </Card>
          )}

          {/* Create Webhook Dialog */}
          <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>Set up a new webhook endpoint to receive events</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Webhook Name</Label>
                  <Input placeholder="e.g., Lead Created Webhook" value={newWebhook.name} onChange={e => setNewWebhook(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Endpoint URL</Label>
                  <Input placeholder="https://your-app.com/webhooks/..." value={newWebhook.url} onChange={e => setNewWebhook(d => ({ ...d, url: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Events (comma separated)</Label>
                  <Input placeholder="lead.created, lead.updated" value={newWebhook.events} onChange={e => setNewWebhook(d => ({ ...d, events: e.target.value }))} />
                  <p className="text-xs text-gray-400">Available: lead.created, lead.updated, lead.stage_changed, payment.received, payment.failed</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleCreateWebhook}>Create Webhook</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-teal-600" /> API Request Logs</CardTitle>
            <CardDescription>Monitor all API requests in real-time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-340px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-xs">Method</TableHead>
                    <TableHead className="font-semibold text-xs">Endpoint</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs hidden sm:table-cell">Duration</TableHead>
                    <TableHead className="font-semibold text-xs hidden md:table-cell">IP</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-mono font-bold px-1.5 ${
                          log.method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          log.method === 'POST' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          log.method === 'PUT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>{log.method}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-700 max-w-[200px] truncate">{log.path}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${log.status < 300 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 hidden sm:table-cell">{log.duration}</TableCell>
                      <TableCell className="text-xs text-gray-400 font-mono hidden md:table-cell">{log.ip}</TableCell>
                      <TableCell className="text-xs text-gray-400 text-right">{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === 'docs' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4 text-teal-600" /> API Documentation</CardTitle>
            <CardDescription>Quick reference for Trovira CRM REST API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Endpoints */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Endpoints</h4>
              {[
                { method: 'GET', path: '/v1/leads', desc: 'List all leads' },
                { method: 'POST', path: '/v1/leads', desc: 'Create a new lead' },
                { method: 'GET', path: '/v1/leads/:id', desc: 'Get lead details' },
                { method: 'PUT', path: '/v1/leads/:id', desc: 'Update a lead' },
                { method: 'DELETE', path: '/v1/leads/:id', desc: 'Delete a lead' },
                { method: 'GET', path: '/v1/pipeline', desc: 'Get pipeline data' },
                { method: 'PUT', path: '/v1/pipeline/:id/stage', desc: 'Move lead to new stage' },
                { method: 'GET', path: '/v1/followups', desc: 'List follow-ups' },
                { method: 'POST', path: '/v1/followups', desc: 'Create follow-up' },
                { method: 'GET', path: '/v1/reports', desc: 'Get reports data' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Badge variant="outline" className={`text-[10px] font-mono font-bold px-1.5 w-14 justify-center ${
                    ep.method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    ep.method === 'POST' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    ep.method === 'PUT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>{ep.method}</Badge>
                  <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                  <span className="text-xs text-gray-500">{ep.desc}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Code Example */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Start Example</h4>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                  <code>{apiCodeExample}</code>
                </pre>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-gray-800 hover:bg-gray-700 text-gray-400" onClick={() => { navigator.clipboard.writeText(apiCodeExample); toast.success('Code copied!'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Full Documentation</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> API Reference</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Pause(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function Play(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
