const DEFAULT_HEADERS = {
  "User-Agent": "SummitSecurityCompanion/1.0 open-source travel security research tool",
  Accept: "application/json,text/plain,*/*"
};

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);
  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
      body: options.body,
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}) {
  const text = await fetchText(url, options);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}: ${err.message}`);
  }
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : " ";
    });
}

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { fetchJson, fetchText, stripHtml, decodeEntities };
