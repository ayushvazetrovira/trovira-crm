'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import {
  MessageCircle,
  Send,
  Phone,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Users,
  Clock,
  Circle,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  contactId: string;
  content: string;
  direction: string;
  isRead: boolean;
  createdAt: string;
}

const avatarColors = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
}

function getAvatarColor(name: string, idx: number): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash + idx) % avatarColors.length];
}

function getMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function CrmWhatsapp() {
  const { user } = useAppStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    if (!user?.companyId) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`/api/crm/whatsapp?companyId=${user.companyId}&action=contacts`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setContacts(data.contacts);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  }, [user?.companyId]);

  const fetchMessages = useCallback(async (contactId: string) => {
    if (!contactId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/crm/whatsapp?companyId=${user?.companyId}&action=messages&contactId=${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectContact = async (id: string) => {
    setSelectedContact(id);
    setMessages([]);
    // Mark contact as read
    const contact = contacts.find(c => c.id === id);
    if (contact && contact.unread > 0) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
      try {
        await fetch('/api/crm/whatsapp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, unread: 0 }),
        });
      } catch {
        // silent fail
      }
    }
    fetchMessages(id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp_${Date.now()}`,
      contactId: selectedContact,
      content,
      direction: 'outgoing',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Update contact lastMessage
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setContacts(prev => prev.map(c => c.id === selectedContact ? { ...c, lastMessage: content.substring(0, 50), lastTime: timeStr } : c));

    try {
      const res = await fetch('/api/crm/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContact, content, direction: 'outgoing' }),
      });
      if (!res.ok) throw new Error('Failed to send');
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const currentMessages = messages;
  const currentContact = contacts.find(c => c.id === selectedContact);
  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0);
  const activeContacts = contacts.filter(c => c.isOnline).length;
  const totalMessages = messages.length;

  const filteredContacts = contacts.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><MessageCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Conversations</p><p className="text-lg font-bold text-gray-900">{contacts.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Unread</p><p className="text-lg font-bold text-gray-900">{totalUnread}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center"><Circle className="h-5 w-5 text-teal-600" /></div>
            <div><p className="text-xs text-gray-500">Online Now</p><p className="text-lg font-bold text-gray-900">{activeContacts}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center"><Users className="h-5 w-5 text-sky-600" /></div>
            <div><p className="text-xs text-gray-500">Messages</p><p className="text-lg font-bold text-gray-900">{totalMessages}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Client */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] min-h-[500px]">
          {/* Contacts List */}
          <div className="w-full lg:w-80 border-r flex-shrink-0 flex flex-col">
            <div className="p-3 border-b bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search or start new chat" className="pl-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingContacts ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button key={contact.id} onClick={() => handleSelectContact(contact.id)} className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedContact === contact.id ? 'bg-teal-50' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={`${getAvatarColor(contact.name, contacts.indexOf(contact))} text-sm font-semibold`}>{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      {contact.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0 border-b border-gray-100 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 truncate">{contact.name}</span>
                        <span className={`text-xs flex-shrink-0 ml-2 ${contact.unread > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{contact.lastTime}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                        {contact.unread > 0 && <span className="h-5 min-w-[20px] rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 ml-2 flex-shrink-0">{contact.unread}</span>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">
            {currentContact ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={`${getAvatarColor(currentContact.name, contacts.indexOf(currentContact))} text-xs font-semibold`}>{getInitials(currentContact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{currentContact.name}</p>
                    <p className="text-xs text-gray-500">{currentContact.isOnline ? <span className="text-green-600">Online</span> : 'Last seen recently'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9"><Search className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className={`h-12 rounded-xl ${i % 2 === 0 ? 'ml-auto w-3/4' : 'w-3/4'}`} />
                      ))}
                    </div>
                  ) : currentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">No messages yet. Start a conversation!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                      {currentMessages.map((msg) => {
                        const isOutgoing = msg.direction === 'outgoing';
                        return (
                          <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${isOutgoing ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none shadow-sm'}`}>
                              <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500">{getMessageTime(msg.createdAt)}</span>
                                {isOutgoing && (
                                  msg.isRead ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> :
                                  <Check className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 bg-white border-t">
                  <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 flex-shrink-0"><Smile className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 flex-shrink-0"><Paperclip className="h-5 w-5" /></Button>
                    <Input
                      placeholder="Type a message"
                      className="flex-1 h-10 border-gray-200 rounded-full px-4"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                      disabled={sending}
                    />
                    <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="h-9 w-9 rounded-full bg-green-600 hover:bg-green-700 text-white flex-shrink-0 disabled:opacity-50" size="icon">
                      {sending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
