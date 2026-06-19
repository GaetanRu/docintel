import { NextRequest, NextResponse } from 'next/server';
import { parseFile, SUPPORTED_EXTENSIONS } from '@/lib/fileParser';
import { extractDocument } from '@/lib/extractor';
import { saveDocument } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ detail: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ detail: `Unsupported file type: .${ext}` }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileResult = await parseFile(buffer, file.name);
    const result = await extractDocument(fileResult);
    const saved = saveDocument(result, file.name);

    return NextResponse.json(saved);
  } catch (err) {
    const msg = (err as Error).message ?? 'Extraction failed';
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
