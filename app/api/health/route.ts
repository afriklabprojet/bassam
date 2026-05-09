import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'vip-parfumerie-bar',
    timestamp: new Date().toISOString(),
  });
}
