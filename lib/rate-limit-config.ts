import type { RateLimitConfig } from './rate-limit';

export const CONTACT_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSec: 600 };
export const CONSULTATION_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSec: 600 };
export const NEWSLETTER_RATE_LIMIT: RateLimitConfig = { limit: 3, windowSec: 300 };
export const PAYMENT_INITIATE_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSec: 60 };
export const REVIEWS_POST_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSec: 600 };
/** Strict: protects against brute-forcing promo codes. */
export const PROMO_CODE_VALIDATE_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSec: 60 };
/** LLM calls are costly — tighter window than other public forms. */
export const CHAT_RATE_LIMIT: RateLimitConfig = { limit: 15, windowSec: 300 };
/** Public order tracking: number + phone are both required; this slows down guessing either one. */
export const ORDER_TRACK_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSec: 600 };
