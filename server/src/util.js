function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function cleanText(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isEnglishLike(text) {
  const s = String(text || '');
  if (!s) return false;
  if (/[\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF]/.test(s)) return false;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(1, s.length) < 0.16;
}

function stableId(value) {
  let h = 2166136261;
  const s = String(value || Math.random());
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `id_${(h >>> 0).toString(36)}`;
}

function milesToMeters(miles) {
  return Number(miles || 5) * 1609.344;
}

function distanceMiles(aLat, aLng, bLat, bLng) {
  const lat1 = Number(aLat), lon1 = Number(aLng), lat2 = Number(bLat), lon2 = Number(bLng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const A = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

function ageLabel(dateValue) {
  const t = new Date(dateValue || 0).getTime();
  if (!Number.isFinite(t) || !t) return 'date unknown';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 60) return `${Math.max(1, min)}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function extractTerms(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9£$€%.-]{3,}/g) || [];
}

function parseXmlItems(xml) {
  const chunks = [...String(xml || '').matchAll(/<item[\s\S]*?<\/item>/gi)].map(m => m[0]);
  return chunks.map(item => {
    const get = (tag) => {
      const cdata = item.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i'));
      if (cdata) return cleanText(cdata[1]);
      const normal = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return cleanText(normal ? normal[1] : '');
    };
    return {
      title: get('title'),
      link: get('link'),
      description: get('description'),
      pubDate: get('pubDate') || get('dc:date') || get('published'),
      source: get('source')
    };
  }).filter(x => x.title || x.link);
}

function pointFromName(text, cities) {
  const s = String(text || '').toLowerCase();
  for (const city of cities || []) {
    const name = city.name.toLowerCase();
    if (s.includes(name)) return city;
  }
  return null;
}

module.exports = {
  clamp,
  cleanText,
  isEnglishLike,
  stableId,
  milesToMeters,
  distanceMiles,
  domainFromUrl,
  ageLabel,
  extractTerms,
  parseXmlItems,
  pointFromName
};
