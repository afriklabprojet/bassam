const IS_DEV = process.env.NODE_ENV === 'development';
const MAX_LOG_DEPTH = 3;
const MAX_LOG_ARRAY_ITEMS = 10;
const MAX_LOG_STRING_LENGTH = 240;

const REDACTED_KEY_PATTERN = /(api[-_]?key|secret|token|authorization|cookie|password|signature)/i;
const MASKED_KEY_PATTERN = /(email|phone|mobile)/i;

type LogLevel = 'info' | 'warn' | 'error';

function truncateString(value: string): string {
  return value.length <= MAX_LOG_STRING_LENGTH
    ? value
    : `${value.slice(0, MAX_LOG_STRING_LENGTH)}...`;
}

function maskEmail(value: string): string {
  const [localPart, domainPart] = value.split('@');
  if (!localPart || !domainPart) return '[redacted-email]';

  const visibleLocal = localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 2);
  return `${visibleLocal}***@${domainPart}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '[redacted-phone]';
  return `***${digits.slice(-4)}`;
}

function sanitizeError(error: Error) {
  const stack = error.stack
    ? truncateString(error.stack.split('\n').slice(0, 4).join('\n'))
    : undefined;

  return {
    name: error.name,
    message: truncateString(error.message),
    ...(stack ? { stack } : {}),
  };
}

function sanitizeObjectMeta(meta: Record<string, unknown>, depth: number) {
  if (depth >= MAX_LOG_DEPTH) return '[object]';

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (REDACTED_KEY_PATTERN.test(key)) {
      sanitized[key] = '[redacted]';
      continue;
    }

    if (MASKED_KEY_PATTERN.test(key) && typeof value === 'string') {
      sanitized[key] = /email/i.test(key) ? maskEmail(value) : maskPhone(value);
      continue;
    }

    sanitized[key] = sanitizeLogMeta(value, depth + 1);
  }

  return sanitized;
}

function sanitizeArrayMeta(meta: unknown[], depth: number) {
  if (depth >= MAX_LOG_DEPTH) return `[array(${meta.length})]`;
  return meta.slice(0, MAX_LOG_ARRAY_ITEMS).map((item) => sanitizeLogMeta(item, depth + 1));
}

function formatUnknownMeta(meta: unknown) {
  return Object.prototype.toString.call(meta);
}

function sanitizeLogMeta(meta: unknown, depth = 0): unknown {
  if (meta === undefined || meta === null) return meta;
  if (typeof meta === 'string') return truncateString(meta);
  if (typeof meta === 'number' || typeof meta === 'boolean') return meta;
  if (meta instanceof Error) return sanitizeError(meta);


  if (Array.isArray(meta)) return sanitizeArrayMeta(meta, depth);
  if (typeof meta === 'object') return sanitizeObjectMeta(meta as Record<string, unknown>, depth);

  return formatUnknownMeta(meta);
}

function log(level: LogLevel, context: string, message: string, meta?: unknown): void {
  const safeMeta = meta === undefined ? undefined : sanitizeLogMeta(meta);

  if (IS_DEV) {
    const prefix = `[${context}]`;
    if (level === 'error') console.error(prefix, message, safeMeta ?? '');
    else if (level === 'warn') console.warn(prefix, message, safeMeta ?? '');
    else console.log(prefix, message, safeMeta ?? '');
    return;
  }

  const payload: Record<string, unknown> = {
    level,
    context,
    message,
    ts: new Date().toISOString(),
  };

  if (safeMeta !== undefined) {
    payload.meta = safeMeta;
  }

  // Production: structured JSON to stdout only (no PII in meta)
  process.stdout.write(JSON.stringify(payload) + '\n');
}

export const logger = {
  info: (context: string, message: string, meta?: unknown) => log('info', context, message, meta),
  warn: (context: string, message: string, meta?: unknown) => log('warn', context, message, meta),
  error: (context: string, message: string, meta?: unknown) => log('error', context, message, meta),
};
