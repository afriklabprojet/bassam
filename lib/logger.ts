const IS_DEV = process.env.NODE_ENV === 'development';

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, context: string, message: string, meta?: unknown): void {
  if (IS_DEV) {
    const prefix = `[${context}]`;
    if (level === 'error') console.error(prefix, message, meta ?? '');
    else if (level === 'warn') console.warn(prefix, message, meta ?? '');
    else console.log(prefix, message, meta ?? '');
    return;
  }
  // Production: structured JSON to stdout only (no PII in meta)
  process.stdout.write(
    JSON.stringify({ level, context, message, ts: new Date().toISOString() }) + '\n'
  );
}

export const logger = {
  info: (context: string, message: string, meta?: unknown) => log('info', context, message, meta),
  warn: (context: string, message: string, meta?: unknown) => log('warn', context, message, meta),
  error: (context: string, message: string, meta?: unknown) => log('error', context, message, meta),
};
