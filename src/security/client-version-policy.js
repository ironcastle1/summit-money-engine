function parse(version) {
  const match = String(version || '').match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
}

export class ClientVersionPolicy {
  constructor(options = {}) {
    this.serverVersion = options.serverVersion;
    this.minimumMajor = options.minimumMajor || parse(options.serverVersion)?.major || 0;
    this.metrics = options.metrics;
  }

  inspect(value) {
    const client = parse(value);
    const server = parse(this.serverVersion);
    if (!client || !server) return { state: 'UNKNOWN', client: value || null, server: this.serverVersion };
    const state = client.major < this.minimumMajor ? 'UNSUPPORTED' : client.major > server.major ? 'AHEAD' : client.major === server.major && client.minor < Math.max(0, server.minor - 2) ? 'STALE' : 'SUPPORTED';
    this.metrics?.increment('summit_client_versions_total', { state, major: client.major });
    return { state, client: value, server: this.serverVersion };
  }
}
