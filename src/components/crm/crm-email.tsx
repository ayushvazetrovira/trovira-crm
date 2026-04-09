'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  Inbox,
  MailOpen,
  Paperclip,
  Star,
  Reply,
  Forward,
  Trash2,
  Search,
  Plus,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

interface Email {
  id: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  preview: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  folder: string;
  createdAt: string;
}

type FolderFilter = 'all' | 'inbox' | 'sent' | 'draft' | 'trash' | 'starred';

function getRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
}

export function CrmEmail() {
  const { user } = useAppStore();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [folderFilter, setFolderFilter] = useState<FolderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId: user.companyId });
      if (folderFilter !== 'all' && folderFilter !== 'starred') {
        params.set('folder', folderFilter);
      }
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/crm/emails?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (folderFilter === 'starred') {
        setEmails(data.emails.filter((e: Email) => e.isStarred));
      } else if (folderFilter === 'all') {
        setEmails(data.emails);
      } else {
        setEmails(data.emails);
      }
    } catch {
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, folderFilter, searchQuery]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = emails.filter((email) => {
    if (folderFilter === 'starred') return email.isStarred;
    return true;
  });

  const inboxCount = emails.filter(e => e.folder === 'inbox' && !e.isRead).length;
  const sentCount = emails.filter(e => e.folder === 'sent').length;
  const totalCount = emails.filter(e => e.folder === 'inbox').length;

  const handleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === id);
    if (!email) return;
    const newStarred = !email.isStarred;
    setEmails(emails.map(em => em.id === id ? { ...em, isStarred: newStarred } : em));
    if (selectedEmail?.id === id) setSelectedEmail({ ...selectedEmail, isStarred: newStarred });
    try {
      await fetch('/api/crm/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isStarred: newStarred }),
      });
    } catch {
      toast.error('Failed to update star status');
    }
  };

  const handleMarkRead = async (email: Email) => {
    if (email.isRead) {
      setSelectedEmail(email);
      return;
    }
    setEmails(emails.map(em => em.id === email.id ? { ...em, isRead: true } : em));
    setSelectedEmail({ ...email, isRead: true });
    try {
      await fetch('/api/crm/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: email.id, isRead: true }),
      });
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id: string) => {
    setEmails(emails.map(em => em.id === id ? { ...em, folder: 'trash' } : em));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.success('Email moved to trash');
    try {
      await fetch(`/api/crm/emails?id=${id}`, { method: 'DELETE' });
    } catch {
      toast.error('Failed to delete email');
    }
  };

  const handleMoveFolder = async (id: string, folder: string) => {
    setEmails(emails.map(em => em.id === id ? { ...em, folder } : em));
    if (selectedEmail?.id === id) setSelectedEmail({ ...selectedEmail, folder });
    try {
      await fetch('/api/crm/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, folder }),
      });
      toast.success(`Email moved to ${folder}`);
    } catch {
      toast.error('Failed to move email');
    }
  };

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }
    try {
      const res = await fetch('/api/crm/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user?.companyId,
          fromName: user?.name || 'You',
          fromEmail: user?.email || '',
          toEmail: composeData.to,
          subject: composeData.subject,
          body: composeData.body,
          preview: composeData.body.substring(0, 100),
          folder: 'sent',
          hasAttachment: false,
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setComposeData({ to: '', subject: '', body: '' });
      setComposeOpen(false);
      toast.success('Email sent successfully');
      fetchEmails();
    } catch {
      toast.error('Failed to send email');
    }
  };

  const folderCounts: Record<string, number> = {
    all: totalCount,
    inbox: emails.filter(e => e.folder === 'inbox').length,
    sent: emails.filter(e => e.folder === 'sent').length,
    draft: emails.filter(e => e.folder === 'draft').length,
    trash: emails.filter(e => e.folder === 'trash' || e.folder === 'archive').length,
    starred: emails.filter(e => e.isStarred).length,
  };

  if (selectedEmail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedEmail(null)}>
          <ArrowLeft className="h-4 w-4" /> Back to Inbox
        </Button>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">
                    {getInitials(selectedEmail.fromName || 'U')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEmail.fromName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{selectedEmail.fromEmail} → {selectedEmail.toEmail}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {new Date(selectedEmail.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 rounded-lg p-5">
              {selectedEmail.body}
            </div>
            {selectedEmail.hasAttachment && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">attachment.pdf</span>
                <span className="text-xs text-gray-400 ml-auto">245 KB</span>
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" size="sm" className="gap-1.5"><Reply className="h-3.5 w-3.5" /> Reply</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Forward className="h-3.5 w-3.5" /> Forward</Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-red-500 hover:text-red-600" onClick={() => handleDelete(selectedEmail.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center"><Inbox className="h-5 w-5 text-teal-600" /></div>
            <div><p className="text-xs text-gray-500">Inbox</p><p className="text-lg font-bold text-gray-900">{totalCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center"><Send className="h-5 w-5 text-sky-600" /></div>
            <div><p className="text-xs text-gray-500">Sent</p><p className="text-lg font-bold text-gray-900">{sentCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><Mail className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Unread</p><p className="text-lg font-bold text-gray-900">{inboxCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center"><Star className="h-5 w-5 text-rose-500" /></div>
            <div><p className="text-xs text-gray-500">Starred</p><p className="text-lg font-bold text-gray-900">{emails.filter(e => e.isStarred).length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Email Client */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] min-h-[500px]">
          {/* Sidebar */}
          <div className="w-full lg:w-56 border-r bg-gray-50/50 flex-shrink-0">
            <div className="p-3 border-b">
              <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="h-4 w-4" /> Compose
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader><DialogTitle>Compose Email</DialogTitle><DialogDescription>Send a new email to your leads or contacts</DialogDescription></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5"><Label className="text-xs">To</Label><Input placeholder="recipient@example.com" value={composeData.to} onChange={e => setComposeData(d => ({ ...d, to: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Subject</Label><Input placeholder="Email subject" value={composeData.subject} onChange={e => setComposeData(d => ({ ...d, subject: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Message</Label><Textarea placeholder="Write your message..." rows={6} value={composeData.body} onChange={e => setComposeData(d => ({ ...d, body: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5" onClick={handleSend}><Send className="h-4 w-4" /> Send</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <nav className="p-2 space-y-0.5">
              {(['inbox', 'sent', 'starred', 'draft', 'trash'] as FolderFilter[]).map((f) => {
                const labels: Record<string, string> = { inbox: 'Inbox', sent: 'Sent', starred: 'Starred', draft: 'Drafts', trash: 'Trash' };
                const icons: Record<string, React.ElementType> = { inbox: Inbox, sent: Send, starred: Star, draft: Mail, trash: Trash2 };
                const Icon = icons[f];
                const count = folderCounts[f] || 0;
                return (
                  <button key={f} onClick={() => setFolderFilter(f)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${folderFilter === f ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{labels[f]}</span>
                    {count > 0 && <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{count}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Email List */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search emails..." className="pl-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MailOpen className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No emails found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <button key={email.id} onClick={() => handleMarkRead(email)} className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${!email.isRead ? 'bg-teal-50/40' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{email.fromName || email.fromEmail || 'Unknown'}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{getRelativeTime(email.createdAt)}</span>
                          </div>
                          <p className={`text-sm truncate mt-0.5 ${!email.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{email.subject}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{email.preview}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <button onClick={(e) => handleStar(email.id, e)} className="p-0.5">
                            <Star className={`h-3.5 w-3.5 ${email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          </button>
                          <div className="flex gap-0.5">
                            {email.hasAttachment && <Paperclip className="h-3 w-3 text-gray-400" />}
                            {!email.isRead && <span className="h-2 w-2 rounded-full bg-teal-500" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  );
}
