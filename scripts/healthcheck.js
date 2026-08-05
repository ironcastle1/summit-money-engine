const port = Number(process.env.PORT || 4173);
const host = process.env.HEALTHCHECK_HOST || '127.0.0.1';
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 4000);
try {
  const response = await fetch(`http://${host}:${port}/api/ops/ready`, { signal: controller.signal });
  if (!response.ok) process.exitCode = 1;
} catch {
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
