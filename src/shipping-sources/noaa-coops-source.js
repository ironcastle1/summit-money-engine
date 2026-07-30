import { BaseShippingSource } from './base-shipping-source.js';
import { mean, round } from '../core/numbers.js';

function compactDate(date) { return date.toISOString().slice(0, 10).replaceAll('-', ''); }
function observations(payload) {
  return (payload?.data || []).map(item => ({ timestamp: item.t, value: Number(item.v), flags: item.f || '' })).filter(item => Number.isFinite(item.value));
}

export class NoaaCoopsSource extends BaseShippingSource {
  constructor(options) {
    super({ ...options, id: 'noaa-coops', name: 'NOAA CO-OPS', configured: options.enabled !== false, capabilities: ['PORT_CONDITIONS'], refreshMs: 300_000, staleMs: 1_800_000 });
    this.baseUrl = options.baseUrl || 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  }

  async portConditions(port) {
    if (!port.noaaStation) throw Object.assign(new Error('Port has no NOAA station'), { code: 'STATION_NOT_AVAILABLE' });
    return this.execute('PORT_CONDITIONS', `${port.noaaStation}:${compactDate(new Date())}`, async () => {
      const end = new Date();
      const begin = new Date(end.getTime() - 24 * 3_600_000);
      const common = { application: 'summit-money-map', begin_date: compactDate(begin), end_date: compactDate(end), datum: 'MLLW', station: port.noaaStation, time_zone: 'gmt', units: 'metric', format: 'json' };
      const observedUrl = new URL(this.baseUrl);
      for (const [key, value] of Object.entries({ ...common, product: 'water_level' })) observedUrl.searchParams.set(key, value);
      const predictionUrl = new URL(this.baseUrl);
      for (const [key, value] of Object.entries({ ...common, product: 'predictions', interval: 'h' })) predictionUrl.searchParams.set(key, value);
      const [observedPayload, predictionPayload] = await Promise.all([
        this.http.json(observedUrl, { upstream: this.id }), this.http.json(predictionUrl, { upstream: this.id })
      ]);
      if (observedPayload?.error) throw Object.assign(new Error(observedPayload.error.message || 'NOAA error'), { code: 'NOAA_ERROR' });
      const observed = observations(observedPayload);
      const predicted = (predictionPayload?.predictions || []).map(item => Number(item.v)).filter(Number.isFinite);
      const latest = observed.at(-1) || null;
      const observedMean = mean(observed.map(item => item.value));
      const predictedMean = mean(predicted);
      return {
        portId: port.id, stationId: port.noaaStation, observedAt: latest?.timestamp || null, waterLevelMetres: latest?.value ?? null,
        waterLevelAnomalyMetres: Number.isFinite(observedMean) && Number.isFinite(predictedMean) ? round(observedMean - predictedMean, 3) : null,
        sampleSize: observed.length, records: observed.slice(-48), sourceUrl: String(observedUrl)
      };
    });
  }
}
