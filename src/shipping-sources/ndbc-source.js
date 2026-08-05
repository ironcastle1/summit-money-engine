import { BaseShippingSource } from './base-shipping-source.js';

const STATIONS = Object.freeze({
  'port-new-york-new-jersey': '44065',
  'port-los-angeles': '46222',
  'port-long-beach': '46222',
  'port-houston': '42035',
  'port-miami': '42003',
  'port-seattle-tacoma': '46041',
  'port-london-gateway': '62103',
  'port-rotterdam': '62103',
  'port-singapore': 'VMSF1',
  'port-sydney': '51202'
});

function parseNumber(value) { const number = Number(value); return Number.isFinite(number) && number < 900 ? number : null; }
function parseLatest(text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) return null;
  const headings = lines[0].replace(/^#/, '').trim().split(/\s+/);
  const values = lines.find((line, index) => index > 1 && !line.startsWith('#'))?.trim().split(/\s+/);
  if (!values) return null;
  const row = Object.fromEntries(headings.map((heading, index) => [heading, values[index]]));
  const year = Number(row.YY); const month = Number(row.MM); const day = Number(row.DD); const hour = Number(row.hh); const minute = Number(row.mm || 0);
  const observedAt = [year, month, day, hour].every(Number.isFinite) ? new Date(Date.UTC(year < 100 ? 2000 + year : year, month - 1, day, hour, minute)).toISOString() : null;
  return {
    observedAt,
    windDirectionDegrees: parseNumber(row.WDIR),
    windSpeedMetresPerSecond: parseNumber(row.WSPD),
    gustMetresPerSecond: parseNumber(row.GST),
    waveHeightMetres: parseNumber(row.WVHT),
    dominantWavePeriodSeconds: parseNumber(row.DPD),
    pressureHpa: parseNumber(row.PRES),
    airTemperatureC: parseNumber(row.ATMP),
    waterTemperatureC: parseNumber(row.WTMP),
    visibilityNauticalMiles: parseNumber(row.VIS)
  };
}

export class NdbcSource extends BaseShippingSource {
  constructor(options) {
    super({ ...options, id: 'noaa-ndbc', name: 'NOAA National Data Buoy Center', configured: options.enabled !== false, capabilities: ['MARINE_CONDITIONS'], refreshMs: 300_000, staleMs: 1_800_000 });
    this.baseUrl = options.baseUrl || 'https://www.ndbc.noaa.gov/data/realtime2';
  }

  stationFor(port) { return port.ndbcStation || STATIONS[port.id] || null; }

  async marineConditions(port) {
    const station = this.stationFor(port);
    if (!station) throw Object.assign(new Error('Port has no NDBC station'), { code: 'STATION_NOT_AVAILABLE' });
    return this.execute('MARINE_CONDITIONS', station, async () => {
      const url = `${this.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(station)}.txt`;
      const text = await this.http.text(url, { upstream: this.id, attempts: 2, timeoutMs: 12_000, accept: 'text/plain' });
      const record = parseLatest(text);
      if (!record) throw Object.assign(new Error('NDBC response contained no observation'), { code: 'NDBC_NO_DATA' });
      return { portId: port.id, stationId: station, ...record, records: [record], sourceUrl: url };
    });
  }
}

export { parseLatest as parseNdbcLatest };
