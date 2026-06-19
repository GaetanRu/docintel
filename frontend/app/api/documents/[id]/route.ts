import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteDocument(Number(id));
  return NextResponse.json({ deleted: Number(id) });
}
