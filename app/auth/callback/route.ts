import { SITE_URL } from '@/lib/site-config';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Validate redirect target to prevent open redirects
  const redirectPath = next.startsWith('/') ? next : '/';
  return NextResponse.redirect(`${SITE_URL}${redirectPath}`);
}
