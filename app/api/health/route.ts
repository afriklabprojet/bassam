import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const start = Date.now();
  let dbStatus: 'ok' | 'degraded' = 'ok';
  let dbLatencyMs: number | null = null;

  try {
    const supabase = createServiceClient();
    const dbStart = Date.now();
    const { error } = await supabase.from('products').select('id').limit(1).single();
    dbLatencyMs = Date.now() - dbStart;
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows — DB is reachable, just empty
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'degraded';
  }

  const overall = dbStatus === 'ok' ? 'ok' : 'degraded';
  const statusCode = overall === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      status: overall,
      service: 'vip-parfumerie-bar',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    },
    { status: statusCode }
  );
}
