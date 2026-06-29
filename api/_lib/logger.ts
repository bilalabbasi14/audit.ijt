type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LEVELS) return env as LogLevel;
  return process.env.NODE_ENV = 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[minLevel()];
}

function write(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${scope} ${message}`;
  const payload = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

  switch (level) {
    case 'debug':
      console.debug(line + payload);
      break;
    case 'info':
      console.info(line + payload);
      break;
    case 'warn':
      console.warn(line + payload);
      break;
    case 'error':
      console.error(line + payload);
      break;
    default: {
      const _exhaustive: never = level;
      console.log(line + payload, _exhaustive);
    }
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => write('debug', scope, message, meta),
    info: (message: string, meta?: Record<string, unknown>) => write('info', scope, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => write('warn', scope, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => write('error', scope, message, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
