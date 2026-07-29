import { BaseShippingSource } from './base-shipping-source.js';
import { round } from '../core/numbers.js';

function number(record, keys) { for (const key of keys) { const value = Number(record?.[key]); if (Number.isFinite(value)) return value; } return null; }
function text(record, keys) { for (const key of keys) if (record?.[key] !== undefined && record?.[key] !== null) return String(record[key]); return ''; }

export class ImfPortWatchSource extends BaseShippingSource {
  constructor(options) {
    super({ ...options, id: 'imf-portwatch', name: 'IMF PortWatch', configured: Boolean(options.baseUrl), capabilities: ['PORT_ACTIVITY', 'CHOKEPOINT_ACTIVITY'], refreshMs: 900_000, staleMs: 86_400_000 });
    this.baseUrl = options.baseUrl || '';
    this.portField = options.portField || 'portid';
  }

  async portActivity(port) {
    const identifier = port.portwatchId || port.id;
    return this.execute('PORT_ACTIVITY', identifier, async () => {
      const url = new URL(this.baseUrl);
      url.searchParams.set('where', `${this.portField}='${String(identifier).replaceAll("'", "''")}'`);
      url.searchParams.set('outFields', '*');
      url.searchParams.set('orderByFields', 'date DESC');
      url.searchParams.set('resultRecordCount', '60');
      url.searchParams.set('returnGeometry', 'false');
      url.searchParams.set('f', 'json');
      const payload = await this.http.json(url, { upstream: this.id });
      if (payload?.error) throw Object.assign(new Error(payload.error.message || 'PortWatch error'), { code: 'PORTWATCH_ERROR' });
      const rows = (payload.features || []).map(feature => feature.attributes || feature);
      const latest = rows[0] || {};
      return {
        portId: port.id, observedAt: text(latest, ['date', 'Date', 'datetime', 'timestamp']),
        calls: number(latest, ['portcalls', 'port_calls', 'calls']),
        callsChangePct: number(latest, ['portcalls_change', 'calls_change_pct', 'callsChangePct']),
        tradeVolumeTonnes: number(latest, ['trade', 'trade_tonnes', 'volume']),
        tradeVolumeChangePct: number(latest, ['trade_change', 'trade_change_pct', 'tradeVolumeChangePct']),
        waitingTimeChangePct: number(latest, ['waiting_change', 'waiting_time_change_pct', 'waitingTimeChangePct']),
        sampleSize: rows.length, records: rows, sourceUrl: String(url)
      };
    });
  }
}
