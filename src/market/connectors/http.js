const lastByHost = new Map();
const DEFAULT_GAP_MS = 1400;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function respectfulFetch(url, { headers = {}, timeoutMs = 20000, minHostGapMs = DEFAULT_GAP_MS } = {}) {
  const u = new URL(url);
  const last = lastByHost.get(u.host) || 0;
  const wait = Math.max(0, minHostGapMs - (Date.now() - last));
  if (wait) await sleep(wait);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': process.env.MERLIN_RESEARCH_USER_AGENT || 'MERLIN-CNC-Research/4.0',
        'accept-language': 'en-GB,en;q=0.9',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers
      }
    });
    lastByHost.set(u.host, Date.now());
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') || '';
    return { url: response.url, contentType, text: await response.text() };
  } finally { clearTimeout(timer); }
}
