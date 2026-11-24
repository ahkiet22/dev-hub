type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'tokenhash',
  'token_hash',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'api_key',
]);

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return '[REDACTED]';
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redactValue(k, v);
    }
    return out;
  }
  return value;
}

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? (redactValue('meta', meta) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => writeLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      writeLog('debug', message, meta);
    }
  },
};
