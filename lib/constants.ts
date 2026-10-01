/**
 * ISR revalidation windows (seconds), for fetch `next: { revalidate }` options.
 * NOT usable for route segment `export const revalidate` — Next.js requires that
 * export to be a static literal, so those sites keep an inline number with a
 * comment pointing back here to stay in sync.
 */
export const REVALIDATE_SHORT_SEC = 60;
export const REVALIDATE_MEDIUM_SEC = 300;

/** Cache-Control header values for API routes. */
export const CACHE_CONTROL_SHORT = 'public, s-maxage=60, stale-while-revalidate=300';
export const CACHE_CONTROL_MEDIUM = 'public, s-maxage=300, stale-while-revalidate=600';

/** Product list page sizes. */
export const PAGE_SIZE_DEFAULT = 8;
export const PAGE_SIZE_COLLECTION = 48;
export const PRODUCTS_LIST_PAGE_DEFAULT = 1;
export const PRODUCTS_LIST_LIMIT_DEFAULT = 12;

/** Admin list pagination. */
export const ADMIN_PAGE_DEFAULT = 1;
export const ADMIN_LIMIT_DEFAULT = 20;
export const ADMIN_LIST_LIMIT = 50;
export const ADMIN_EXPORT_LIMIT = 200;

/** Toast auto-dismiss durations (ms). */
export const TOAST_DURATION_XS_MS = 2000;
export const TOAST_DURATION_SHORT_MS = 2500;
export const TOAST_DURATION_MEDIUM_MS = 3000;
export const TOAST_DURATION_MS = 3500;
export const TOAST_DURATION_LONG_MS = 4000;
