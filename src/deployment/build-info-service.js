import { readFile } from 'node:fs/promises';
import path from 'node:path';

export class BuildInfoService {
  constructor(options = {}) {
    this.root = options.root;
    this.config = options.config;
    this.startedAt = new Date().toISOString();
    this.cached = null;
  }

  async snapshot() {
    if (this.cached) return { ...this.cached, processStartedAt: this.startedAt, generatedAt: new Date().toISOString() };
    let packageData = {};
    try { packageData = JSON.parse(await readFile(path.join(this.root, 'package.json'), 'utf8')); } catch {}
    this.cached = {
      name: packageData.name || 'merlin',
      version: this.config.version,
      packageVersion: packageData.version || null,
      environment: this.config.environment,
      node: process.version,
      commitSha: process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || process.env.FLY_IMAGE_REF || process.env.COMMIT_SHA || null,
      deploymentId: process.env.RENDER_INSTANCE_ID || process.env.FLY_ALLOC_ID || process.env.HOSTNAME || null,
      region: process.env.RENDER_REGION || process.env.FLY_REGION || process.env.AWS_REGION || null,
      capabilities: ['PWA', 'OFFLINE_SHELL', 'OBSERVABILITY', 'DATA_QUALITY', 'SECURITY_HEADERS', 'COMPRESSED_STATIC', 'HEALTH_CHECKS', 'CI', 'CONTAINER']
    };
    return { ...this.cached, processStartedAt: this.startedAt, generatedAt: new Date().toISOString() };
  }
}
