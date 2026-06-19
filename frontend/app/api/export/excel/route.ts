import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const docs: Record<string, unknown>[] = body.documents ?? [];
  if (!docs.length) return NextResponse.json({ detail: 'No documents' }, { status: 400 });

  const rows = docs.map((d) => ({
    'Source File':       d.source_name ?? '',
    'Processed At':      d.processed_at ?? '',
    'Document Type':     d.document_type ?? '',
    'Priority':          d.priority ?? '',
    'From':              d.from_party ?? '',
    'To':                d.to_party ?? '',
    'Date':              d.date ?? '',
    'Due Date':          d.due_date ?? '',
    'Total Amount':      d.total_amount ?? '',
    'Reference Number':  d.reference_number ?? '',
    'Summary':           d.summary ?? '',
    'Action Items':      Array.isArray(d.action_items)
                           ? (d.action_items as string[]).join(' | ')
                           : (d.action_items ?? ''),
    'Key Parties':       Array.isArray(d.key_parties)
                           ? (d.key_parties as string[]).join(' | ')
                           : (d.key_parties ?? ''),
    'Tags':              Array.isArray(d.tags)
                           ? (d.tags as string[]).join(', ')
                           : (d.tags ?? ''),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Documents');

  // Auto-width columns
  const colWidths = Object.keys(rows[0]).map((k) => ({
    wch: Math.max(k.length, ...rows.map((r) => String(r[k as keyof typeof r] ?? '').length)),
  }));
  ws['!cols'] = colWidths;

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="docintel_export.xlsx"',
    },
  });
}
