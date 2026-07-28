const { fetchJson } = require("../core/http");
const { stableId } = require("../core/geo");
const { byName } = require("../data/countryMeta");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");
async function collectReliefWeb() {
  startSource("ReliefWeb", "humanitarian-crisis");
  const url = "https://api.reliefweb.int/v2/reports?appname=summit-security-companion&profile=list&preset=latest&limit=100&fields[include][]=title&fields[include][]=url&fields[include][]=date.created&fields[include][]=country.name&fields[include][]=source.name&fields[include][]=primary_country.name";
  try {
    const data = await fetchJson(url, { timeout: 15000 });
    const events = (data.data || []).map(row => {
      const f = row.fields || {};
      const title = f.title || "Humanitarian report";
      const country = (f.primary_country && f.primary_country.name) || (Array.isArray(f.country) && f.country[0] && f.country[0].name) || "";
      const meta = byName(country);
      return {
        id: stableId(`relief:${row.id}:${title}`), kind: "crisis", severity: 3, title, summary: title, country, place: country || "Crisis area",
        lat: meta ? meta.centre[0] : 20, lng: meta ? meta.centre[1] : 12,
        source: Array.isArray(f.source) && f.source[0] ? f.source[0].name : "ReliefWeb", sourceSystem: "ReliefWeb", url: f.url || "", publishedAt: f.date && f.date.created, confidence: "humanitarian-report"
      };
    });
    markSuccess("ReliefWeb", events.length, "Loaded humanitarian reports", { url });
    return events;
  } catch (err) { markFailure("ReliefWeb", err, { url }); return []; }
}
module.exports = { collectReliefWeb };
