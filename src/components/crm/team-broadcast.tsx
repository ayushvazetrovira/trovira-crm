'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Megaphone, Send, Users, Info, Clock, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export function TeamBroadcast() {
  const { addNotification, notifications, isTeamMember, markNotificationRead, user } = useAppStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ackedBroadcasts, setAckedBroadcasts] = useState<Set<string>>(new Set());
  const [ackingId, setAckingId] = useState<string | null>(null);

  const teamBroadcasts = useMemo(() => notifications
    .filter(n => n.title === '📢 Team Broadcast')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    if (message.length > 1024) {
      toast.error('Message too long (max 1024 chars)');
      return;
    }

    setSending(true);
    try {
      addNotification({
        title: '📢 Team Broadcast',
        message: message.trim(),
        type: 'info' as const,
      });
      toast.success('Broadcast sent to all team members!');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleAcknowledge = (broadcastId: string) => {
    if (ackedBroadcasts.has(broadcastId)) return;
    setAckingId(broadcastId);
    setAckedBroadcasts(prev => new Set([...prev, broadcastId]));
    markNotificationRead(broadcastId);
    toast.success('Acknowledged!');
    setAckingId(null);
  };

  if (isTeamMember) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Team Broadcasts</CardTitle>
                <CardDescription>Messages from your client admin</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="ml-auto">
              {teamBroadcasts.length} messages
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px] rounded-md border p-4">
              {teamBroadcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Megaphone className="w-12 h-12 opacity-30 mb-4" />
                  <p className="text-lg font-medium">No team broadcasts yet</p>
                  <p className="text-sm">Your client admin will send updates here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamBroadcasts.map((notif) => {
                    const acked = ackedBroadcasts.has(notif.id);
                    const isAcking = ackingId === notif.id;
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                          acked
                            ? 'bg-emerald-50 border-emerald-200'
                            : !notif.read
                            ? 'bg-sky-50 border-sky-200 ring-1 ring-sky-200/50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => markNotificationRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 ${
                            acked ? 'bg-emerald-100' : 'bg-sky-100'
                          }`}>
                            {acked ? (
                              <ThumbsUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Info className="w-5 h-5 text-sky-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">📢 Team Broadcast</h4>
                              {!notif.read && !acked && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                              {acked && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs py-0 h-5">
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-2">{notif.message}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleString()}
                              </div>
                              {!acked && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcknowledge(notif.id);
                                  }}
                                  disabled={isAcking}
                                  className="h-7 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                                >
                                  {isAcking ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Acknowledging…
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp className="w-3 h-3 mr-1" />
                                      Acknowledge
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Client admin form
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Send Team Broadcast</CardTitle>
          <p className="text-muted-foreground text-center">
            Instant message to all team members (appears in their Broadcast page & bell)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-msg">Message</Label>
            <Textarea
              id="team-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to all team members..."
              rows={6}
              className="resize-none"
              disabled={sending}
              maxLength={1024}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Visible to all team members</span>
              <span>{message.length}/1024</span>
            </div>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={sending || !message.trim()} 
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          >
            {sending ? (
              <>
                <Send className="w-4 h-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                <Users className="w-4 h-4 mr-2" />
                Send to All Team
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


