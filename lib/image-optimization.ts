const SUPABASE_STORAGE_PUBLIC_PATH = '/storage/v1/object/public/';

export function shouldBypassNextImageOptimization(src?: string | null): boolean {
  if (!src) return false;

  if (src.startsWith('data:') || src.startsWith('blob:')) return true;
  if (src.startsWith('/')) return false;

  try {
    const url = new URL(src);

    return (
      (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) &&
      url.pathname.startsWith(SUPABASE_STORAGE_PUBLIC_PATH)
    );
  } catch {
    return false;
  }
}