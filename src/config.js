import path from 'node:path';
export const config={
  host:process.env.HOST||'0.0.0.0',
  port:Number(process.env.PORT||3000),
  refreshMs:Number(process.env.MERLIN_REFRESH_MS||5*60_000),
  sourceTimeoutMs:Number(process.env.MERLIN_SOURCE_TIMEOUT_MS||5000),
  concurrency:Number(process.env.MERLIN_SOURCE_CONCURRENCY||12),
  disableLive:/^(1|true|yes)$/i.test(process.env.MERLIN_DISABLE_LIVE||''),
  currentWindowHours:Number(process.env.MERLIN_CURRENT_WINDOW_HOURS||168),
  runtimeDir:path.resolve(process.env.MERLIN_RUNTIME_DIR||'runtime'),
  userAgent:'MERLIN/8.0 public-source monitor (+https://github.com/ironcastle1/summit-money-engine)'
};
