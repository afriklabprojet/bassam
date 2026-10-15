import { SITE_URL } from '@/lib/site-config';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const flowId = requestUrl.searchParams.get('sb_flow_id');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(
      `${SITE_URL}/auth/reset-password?error=missing_code`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined
  );

  if (error) {
    console.error('Auth callback code exchange failed', {
      code: error.code,
      status: error.status,
    });
    return NextResponse.redirect(
      `${SITE_URL}/auth/reset-password?error=invalid_or_expired_link`
    );
  }

  // Validate redirect target to prevent open redirects
  const redirectPath = next.startsWith('/') ? next : '/';
  return NextResponse.redirect(`${SITE_URL}${redirectPath}`);
}
