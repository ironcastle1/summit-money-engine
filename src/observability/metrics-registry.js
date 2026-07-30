const DEFAULT_BUCKETS = Object.freeze([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);

function labelKey(labels = {}) {
  return Object.entries(labels)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('|');
}

function normalizeName(name) {
  const value = String(name || '').trim();
  if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(value)) throw new TypeError(`Invalid metric name: ${value}`);
  return value;
}

function numeric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('Metric values must be finite numbers');
  return number;
}

function cloneLabels(labels = {}) {
  return Object.freeze(Object.fromEntries(Object.entries(labels).map(([key, value]) => [String(key), String(value)])));
}

export class MetricsRegistry {
  #counters = new Map();
  #gauges = new Map();
  #histograms = new Map();
  #startedAt = Date.now();

  increment(name, labels = {}, amount = 1) {
    const metricName = normalizeName(name);
    const key = `${metricName}{${labelKey(labels)}}`;
    const current = this.#counters.get(key) || { name: metricName, labels: cloneLabels(labels), value: 0 };
    current.value += numeric(amount);
    this.#counters.set(key, current);
    return current.value;
  }

  setGauge(name, value, labels = {}) {
    const metricName = normalizeName(name);
    const key = `${metricName}{${labelKey(labels)}}`;
    const record = { name: metricName, labels: cloneLabels(labels), value: numeric(value), updatedAt: Date.now() };
    this.#gauges.set(key, record);
    return record.value;
  }

  observe(name, value, labels = {}, buckets = DEFAULT_BUCKETS) {
    const metricName = normalizeName(name);
    const observation = numeric(value);
    const normalizedBuckets = [...new Set(buckets.map(numeric).filter(bucket => bucket >= 0))].sort((a, b) => a - b);
    const key = `${metricName}{${labelKey(labels)}}`;
    let record = this.#histograms.get(key);
    if (!record) {
      record = {
        name: metricName,
        labels: cloneLabels(labels),
        count: 0,
        sum: 0,
        minimum: null,
        maximum: null,
        buckets: normalizedBuckets.map(upperBound => ({ upperBound, count: 0 }))
      };
      this.#histograms.set(key, record);
    }
    record.count += 1;
    record.sum += observation;
    record.minimum = record.minimum === null ? observation : Math.min(record.minimum, observation);
    record.maximum = record.maximum === null ? observation : Math.max(record.maximum, observation);
    for (const bucket of record.buckets) if (observation <= bucket.upperBound) bucket.count += 1;
    return observation;
  }

  counter(name, labels = {}) {
    const metricName = normalizeName(name);
    return this.#counters.get(`${metricName}{${labelKey(labels)}}`)?.value || 0;
  }

  gauge(name, labels = {}) {
    const metricName = normalizeName(name);
    return this.#gauges.get(`${metricName}{${labelKey(labels)}}`)?.value ?? null;
  }

  snapshot() {
    const counters = [...this.#counters.values()].map(record => ({ ...record, labels: { ...record.labels } }));
    const gauges = [...this.#gauges.values()].map(record => ({ ...record, labels: { ...record.labels } }));
    const histograms = [...this.#histograms.values()].map(record => ({
      ...record,
      labels: { ...record.labels },
      mean: record.count ? record.sum / record.count : null,
      buckets: record.buckets.map(bucket => ({ ...bucket }))
    }));
    return {
      startedAt: new Date(this.#startedAt).toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.#startedAt) / 1000),
      counters,
      gauges,
      histograms,
      generatedAt: new Date().toISOString()
    };
  }

  prometheus() {
    const lines = [];
    const formatLabels = labels => {
      const entries = Object.entries(labels || {});
      if (!entries.length) return '';
      const body = entries.map(([key, value]) => `${key}="${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`).join(',');
      return `{${body}}`;
    };
    for (const metric of this.#counters.values()) lines.push(`${metric.name}${formatLabels(metric.labels)} ${metric.value}`);
    for (const metric of this.#gauges.values()) lines.push(`${metric.name}${formatLabels(metric.labels)} ${metric.value}`);
    for (const metric of this.#histograms.values()) {
      for (const bucket of metric.buckets) lines.push(`${metric.name}_bucket${formatLabels({ ...metric.labels, le: bucket.upperBound })} ${bucket.count}`);
      lines.push(`${metric.name}_bucket${formatLabels({ ...metric.labels, le: '+Inf' })} ${metric.count}`);
      lines.push(`${metric.name}_sum${formatLabels(metric.labels)} ${metric.sum}`);
      lines.push(`${metric.name}_count${formatLabels(metric.labels)} ${metric.count}`);
    }
    return `${lines.join('\n')}\n`;
  }

  reset() {
    this.#counters.clear();
    this.#gauges.clear();
    this.#histograms.clear();
    this.#startedAt = Date.now();
  }
}
