import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    api_key_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
