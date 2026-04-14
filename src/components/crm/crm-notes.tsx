'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  MoreHorizontal,
  Tag,
  Link2,
  X,
  BookOpen,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
} from 'lucide-react';

type NoteColor = 'white' | 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  tags: string | null;
  leadId: string | null;
  lead?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const colorOptions: { value: NoteColor; label: string; bg: string; border: string; header: string; dot: string }[] = [
  { value: 'white', label: 'White', bg: 'bg-white', border: 'border-gray-200', header: 'text-gray-900', dot: 'bg-gray-300' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-amber-50', border: 'border-amber-200', header: 'text-amber-900', dot: 'bg-amber-400' },
  { value: 'green', label: 'Green', bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'text-emerald-900', dot: 'bg-emerald-400' },
  { value: 'blue', label: 'Blue', bg: 'bg-sky-50', border: 'border-sky-200', header: 'text-sky-900', dot: 'bg-sky-400' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200', header: 'text-pink-900', dot: 'bg-pink-400' },
  { value: 'purple', label: 'Purple', bg: 'bg-violet-50', border: 'border-violet-200', header: 'text-violet-900', dot: 'bg-violet-400' },
];

const tagPresets = ['Important', 'Meeting', 'Idea', 'Follow-up', 'Client', 'Personal', 'Reminder', 'Action Item'];

const emptyForm = {
  title: '',
  content: '',
  color: 'white' as NoteColor,
  tags: '',
  leadId: '',
};

export function CrmNotes() {
  const { user } = useAppStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch notes from backend
  const fetchNotes = useCallback(async () => {
    if (!user?.companyId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ companyId: user.companyId });
      if (searchQuery) params.set('search', searchQuery);
      if (filterTag !== 'all') params.set('tag', filterTag);
      if (filterColor !== 'all') params.set('color', filterColor);

      const res = await fetch(`/api/crm/notes?${params}`);
      const data = await res.json();

      if (res.ok) {
        setNotes(data.notes || []);
      } else {
        toast.error(data.error || 'Failed to fetch notes');
        setNotes([]);
      }
    } catch {
      toast.error('Failed to fetch notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, searchQuery, filterTag, filterColor]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Collect all unique tags from notes
  const allTags = Array.from(
    new Set(
      notes.flatMap((n) => (n.tags ? n.tags.split(',').map((t) => t.trim()) : []))
    )
  ).filter(Boolean);

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const stats = {
    total: notes.length,
    pinned: notes.filter((n) => n.isPinned).length,
    tagged: notes.filter((n) => n.tags).length,
    recent: notes.filter((n) => {
      const diff = Date.now() - new Date(n.updatedAt).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const handleSaveNote = async () => {
    if (!form.title.trim()) {
      toast.error('Note title is required');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        const res = await fetch('/api/crm/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            title: form.title,
            content: form.content,
            color: form.color,
            tags: form.tags || null,
            leadId: form.leadId || null,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Note updated successfully');
          fetchNotes();
        } else {
          toast.error(data.error || 'Failed to update note');
        }
      } else {
        const res = await fetch('/api/crm/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: user?.companyId,
            title: form.title,
            content: form.content,
            color: form.color,
            tags: form.tags || null,
            leadId: form.leadId || null,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Note created successfully');
          fetchNotes();
        } else {
          toast.error(data.error || 'Failed to create note');
        }
      }

      setForm(emptyForm);
      setEditingNote(null);
      setShowAddDialog(false);
    } catch {
      toast.error(editingNote ? 'Failed to update note' : 'Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const res = await fetch('/api/crm/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      });
      if (res.ok) {
        fetchNotes();
        toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to toggle pin');
      }
    } catch {
      toast.error('Failed to toggle pin');
    }
  };

  const handleDeleteNote = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/notes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotes();
        setDeleteId(null);
        toast.success('Note deleted successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete note');
      }
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content,
      color: note.color as NoteColor,
      tags: note.tags || '',
      leadId: note.leadId || '',
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingNote(null);
    setForm(emptyForm);
  };

  const handleAddTag = (tag: string) => {
    const currentTags = form.tags
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    if (currentTags.includes(tag)) {
      setForm({ ...form, tags: currentTags.filter((t) => t !== tag).join(', ') });
    } else {
      setForm({ ...form, tags: [...currentTags, tag].join(', ') });
    }
  };

  const getColorConfig = (color: string) => {
    return colorOptions.find((c) => c.value === color) || colorOptions[0];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <StickyNote className="h-4 w-4 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pinned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pinned}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg">
                <Pin className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Tagged</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tagged}</p>
              </div>
              <div className="bg-sky-50 p-2 rounded-lg">
                <Tag className="h-4 w-4 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Filters + Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="w-[130px] pl-9 h-9 text-sm">
                      <SelectValue placeholder="Filter tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {colorOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9 rounded-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9 rounded-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setEditingNote(null);
                    setForm(emptyForm);
                    setShowAddDialog(true);
                  }}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Note
                </Button>
              </div>
            </div>

            {/* Active filters */}
            {(searchQuery || filterTag !== 'all' || filterColor !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs gap-1 px-2 py-0.5">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery('')} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterTag !== 'all' && (
                  <Badge variant="secondary" className="bg-sky-50 text-sky-700 text-xs gap-1 px-2 py-0.5">
                    Tag: {filterTag}
                    <button onClick={() => setFilterTag('all')} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterColor !== 'all' && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs gap-1 px-2 py-0.5">
                    Color: {filterColor}
                    <button onClick={() => setFilterColor('all')} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterTag('all');
                    setFilterColor('all');
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid/List */}
      {sortedNotes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => {
              const colorConfig = getColorConfig(note.color);
              return (
                <Card
                  key={note.id}
                  className={`${colorConfig.bg} ${colorConfig.border} border shadow-sm hover:shadow-md transition-all duration-200 group`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.isPinned && (
                          <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        <CardTitle className={`text-sm font-semibold ${colorConfig.header} truncate`}>
                          {note.title}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleTogglePin(note)}>
                            {note.isPinned ? (
                              <><PinOff className="h-4 w-4 mr-2" /> Unpin</>
                            ) : (
                              <><Pin className="h-4 w-4 mr-2" /> Pin</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditNote(note)}>
                            <Edit3 className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(note.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-5 leading-relaxed">
                      {note.content}
                    </p>

                    {/* Tags */}
                    {note.tags && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {note.tags.split(',').map((tag) => {
                          const trimmed = tag.trim();
                          if (!trimmed) return null;
                          return (
                            <Badge
                              key={trimmed}
                              variant="secondary"
                              className="bg-white/60 text-gray-600 text-[10px] px-1.5 py-0 border border-gray-200/50 cursor-pointer hover:bg-white/90"
                              onClick={() => setFilterTag(trimmed)}
                            >
                              <Tag className="h-2.5 w-2.5 mr-0.5" />
                              {trimmed}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
                      <span className="text-[11px] text-gray-400">
                        {formatRelativeDate(note.updatedAt)}
                      </span>
                      {note.lead && (
                        <div className="flex items-center gap-1 text-[11px] text-teal-600">
                          <Link2 className="h-3 w-3" />
                          {note.lead.name}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {sortedNotes.map((note) => {
                  const colorConfig = getColorConfig(note.color);
                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                      onClick={() => handleEditNote(note)}
                    >
                      <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${colorConfig.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {note.isPinned && (
                            <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          )}
                          <p className="text-sm font-semibold text-gray-900 truncate">{note.title}</p>
                          {note.tags && (
                            <div className="hidden sm:flex items-center gap-1">
                              {note.tags.split(',').slice(0, 2).map((tag) => {
                                const trimmed = tag.trim();
                                if (!trimmed) return null;
                                return (
                                  <Badge
                                    key={trimmed}
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0"
                                  >
                                    {trimmed}
                                  </Badge>
                                );
                              })}
                              {note.tags.split(',').length > 2 && (
                                <span className="text-[10px] text-gray-400">+{note.tags.split(',').length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{note.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-gray-400">
                            {formatRelativeDate(note.updatedAt)}
                          </span>
                          {note.lead && (
                            <span className="text-[11px] text-teal-600 flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {note.lead.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(note);
                          }}
                        >
                          {note.isPinned ? (
                            <PinOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Pin className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(note.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <StickyNote className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No notes found</p>
          <p className="text-xs mt-1">
            {searchQuery || filterTag !== 'all' || filterColor !== 'all'
              ? 'Try adjusting your filters.'
              : 'Click "Add Note" to create your first note.'}
          </p>
          {(searchQuery || filterTag !== 'all' || filterColor !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterTag('all');
                setFilterColor('all');
              }}
              className="mt-3"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Note Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-teal-600" />
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update your note details below.' : 'Write down your thoughts, ideas, or meeting notes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="note-title">Title *</Label>
              <Input
                id="note-title"
                placeholder="e.g., Meeting Notes, Follow-up Reminder"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="note-content">Content *</Label>
              <Textarea
                id="note-content"
                placeholder="Write your note here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Note Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      form.color === c.value
                        ? `${c.dot} border-gray-400 scale-110 ring-2 ring-offset-2 ring-gray-300`
                        : `${c.dot} border-transparent hover:scale-105`
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="note-tags">Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="note-tags"
                  placeholder="Comma-separated tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tagPresets.map((tag) => {
                  const isActive = form.tags
                    ? form.tags.split(',').map((t) => t.trim()).includes(tag)
                    : false;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-all ${
                        isActive
                          ? 'bg-teal-50 border-teal-200 text-teal-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteNote(deleteId)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
