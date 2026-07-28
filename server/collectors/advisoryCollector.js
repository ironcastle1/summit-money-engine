const { fetchText, stripHtml } = require("../core/http");
const cache = require("../core/cacheStore");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

async function fcdoAdvice(country) {
  if (!country || !country.slug) return { available: false, source: "UK FCDO", confidence: "missing" };
  const key = `fcdo:${country.slug}`;
  const cached = cache.get(key); if (cached) return cached;
  startSource("UK FCDO travel advice", "travel-advice");
  const url = `https://www.gov.uk/foreign-travel-advice/${country.slug}`;
  try {
    const html = await fetchText(url, { timeout: 12000, headers: { Accept: "text/html" } });
    const title = stripHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || `${country.name} travel advice`);
    const plain = stripHtml(html);
    const lowered = plain.toLowerCase();
    let level = "check advice";
    if (lowered.includes("advise against all travel")) level = "avoid all travel areas present";
    else if (lowered.includes("advise against all but essential travel")) level = "essential travel only areas present";
    else if (lowered.includes("no travel can be guaranteed safe")) level = "heightened caution";
    const result = { available: true, title, level, summary: plain.slice(0, 900), url, source: "UK FCDO", confidence: "official-advisory" };
    markSuccess("UK FCDO travel advice", 1, `Loaded ${country.name}`);
    return cache.set(key, result, 12 * 60 * 60 * 1000);
  } catch (err) {
    markFailure("UK FCDO travel advice", err, { country: country.name });
    return { available: false, source: "UK FCDO failed", confidence: "failed" };
  }
}

module.exports = { fcdoAdvice };
