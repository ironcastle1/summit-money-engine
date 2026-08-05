function stationPorts(catalog, predicate, limit) {
  return catalog.listPorts({ limit: 500 }).filter(predicate).slice(0, limit);
}

export class NoaaCoopsConnector {
  constructor(options = {}) {
    this.source = options.source;
    this.catalog = options.catalog;
    this.limit = Math.max(1, Math.min(12, Number(options.limit) || 5));
  }

  async fetch() {
    const ports = stationPorts(this.catalog, port => Boolean(port.noaaStation), this.limit);
    const settled = await Promise.allSettled(ports.map(port => this.source.portConditions(port)));
    const records = settled.filter(result => result.status === 'fulfilled').map(result => result.value);
    if (!records.length) {
      throw Object.assign(new Error('NOAA CO-OPS returned no port observations'), { code: 'NOAA_COOPS_NO_DATA' });
    }
    return {
      records,
      observedAt: records.map(record => record.observedAt).filter(Boolean).sort().at(-1) || new Date().toISOString(),
      metadata: { requestedPorts: ports.length, observationPorts: records.length }
    };
  }
}

export class NdbcObservationConnector {
  constructor(options = {}) {
    this.source = options.source;
    this.catalog = options.catalog;
    this.limit = Math.max(1, Math.min(12, Number(options.limit) || 5));
  }

  async fetch() {
    const ports = stationPorts(this.catalog, port => Boolean(this.source.stationFor(port)), this.limit);
    const settled = await Promise.allSettled(ports.map(port => this.source.marineConditions(port)));
    const records = settled.filter(result => result.status === 'fulfilled').map(result => result.value);
    if (!records.length) {
      throw Object.assign(new Error('NOAA NDBC returned no marine observations'), { code: 'NDBC_NO_DATA' });
    }
    return {
      records,
      observedAt: records.map(record => record.observedAt).filter(Boolean).sort().at(-1) || new Date().toISOString(),
      metadata: { requestedPorts: ports.length, observationPorts: records.length }
    };
  }
}
