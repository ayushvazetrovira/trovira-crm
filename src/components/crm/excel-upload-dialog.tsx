'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAppStore } from '@/lib/store';
import { X } from 'lucide-react';

interface ParsedRow {
  name?: string;
  email?: string;
  password?: string;
  _rowNum: number;
  _valid: boolean;
  _error?: string;
}

interface ExcelUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function ExcelUploadDialog({ open, onClose, onUploadSuccess }: ExcelUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Only .xlsx and .xls files allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      try {
        const wb = XLSX.read(data, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

        if (json.length < 2) {
          toast.error('Excel file is empty or has no data rows');
          return;
        }

        // Normalize headers: lowercase + trim
        const rawHeaders = json[0] as string[];
        const normHeaders = rawHeaders.map((h) => (h ? h.toString().trim().toLowerCase() : ''));

        // Build column index map — FIX: use `!== -1` not truthiness, so column 0 is handled correctly
        const nameIdx = normHeaders.indexOf('name');
        const emailIdx = normHeaders.indexOf('email');
        const passwordIdx = normHeaders.indexOf('password');

        if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
          toast.error(
            `Excel must have columns: name, email, password. Found: ${rawHeaders.join(', ')}`
          );
          return;
        }

        // Parse data rows (skip header row at index 0)
        const rows: ParsedRow[] = [];
        for (let i = 1; i < json.length && rows.length < 100; i++) {
          const rowData = json[i] as string[];

          // Skip completely empty rows
          if (!rowData || rowData.every((cell) => !cell)) continue;

          const rawName = rowData[nameIdx]?.toString().trim() ?? '';
          const email = rowData[emailIdx]?.toString().trim() ?? '';
          const password = rowData[passwordIdx]?.toString().trim() ?? '';

          // Use a default name if empty or placeholder "mt"
          const name =
            !rawName || rawName.toLowerCase() === 'mt'
              ? `Team Member ${rows.length + 1}`
              : rawName;

          const validEmail = !!email && email.includes('@') && email.includes('.');
          const hasPassword = !!password;

          let _error: string | undefined;
          if (!validEmail && !hasPassword) {
            _error = 'Invalid email & password required';
          } else if (!validEmail) {
            _error = 'Invalid email';
          } else if (!hasPassword) {
            _error = 'Password required';
          }

          rows.push({
            name,
            email,
            password,
            _rowNum: i + 1,
            _valid: validEmail && hasPassword,
            _error,
          });
        }

        if (rows.length === 0) {
          toast.error('No data rows found in the file');
          return;
        }

        setParsedRows(rows);
        setFile(selectedFile);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse Excel file. Please check the file format.');
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || parsedRows.length === 0 || !user?.companyId) return;

    const validMembers = parsedRows
      .filter((r) => r._valid)
      .map((r) => ({ name: r.name!, email: r.email!, password: r.password! }));

    if (validMembers.length === 0) {
      toast.error('No valid rows to upload');
      return;
    }

    setUploading(true);

    try {
      const res = await fetch('/api/crm/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: { members: validMembers },
          companyId: user.companyId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully created ${data.createdCount} team member(s)!`);
        onUploadSuccess();
        handleClose();
      } else {
        toast.error(data.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setParsedRows([]);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const validCount = parsedRows.filter((r) => r._valid).length;
  const errorCount = parsedRows.filter((r) => !r._valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Team Members (Excel)</DialogTitle>
          <DialogDescription>
            Upload a <strong>.xlsx</strong> or <strong>.xls</strong> file with columns{' '}
            <strong>name</strong>, <strong>email</strong>, <strong>password</strong>. Max 100 rows.
            Invalid rows will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* File chooser — always visible so user can re-pick */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={file ? 'outline' : 'default'}
              size="lg"
              className="flex-1 justify-center"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              📁 {file ? `Change File (${file.name})` : 'Choose Excel File'}
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="sr-only"
            />
            {file && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={uploading}
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Format hint */}
          {!file && (
            <div className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/50">
              <strong>Expected format:</strong>
              <br />
              Row 1 headers: <code>name</code> | <code>email</code> | <code>password</code>
              <br />
              Empty or &quot;Mt&quot; name → auto-assigned as &quot;Team Member 1&quot;, &quot;Team Member 2&quot;, etc.
              <br />
              Only rows with a valid email and password will be created.
            </div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  Preview — {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} found
                </span>
                <Badge variant="default">{validCount} valid</Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">{errorCount} with errors (will be skipped)</Badge>
                )}
              </div>

              <ScrollArea className="h-56 border rounded-md">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="p-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Email</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Password</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row._valid ? 'bg-green-50/50' : 'bg-red-50/50'}
                      >
                        <td className="p-2 font-mono text-xs text-muted-foreground">
                          {row._rowNum}
                        </td>
                        <td className="p-2">{row.name || '—'}</td>
                        <td className="p-2">{row.email || '—'}</td>
                        <td className="p-2 font-mono tracking-widest">
                          {row.password ? '••••••••' : '—'}
                        </td>
                        <td className="p-2">
                          {row._valid ? (
                            <Badge variant="default" className="text-xs">
                              ✓ Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {row._error}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t mt-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          {parsedRows.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${validCount} Team Member${validCount !== 1 ? 's' : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}