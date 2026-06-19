import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getAllDocuments());
}
