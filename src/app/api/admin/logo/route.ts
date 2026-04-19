import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('logo') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP, or SVG.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
    }

    // Ensure upload dir exists
    const uploadDir = path.join(process.cwd(), 'upload');
    await mkdir(uploadDir, { recursive: true });

    // Unique filename
    const ext = path.extname(file.name);
    const filename = `logo-${Date.now()}${ext}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return filename for store
    return NextResponse.json({ filename, url: `/upload/${filename}` });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

