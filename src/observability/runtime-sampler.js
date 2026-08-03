import { monitorEventLoopDelay } from 'node:perf_hooks';
import os from 'node:os';

function megabytes(bytes) { return Math.round((bytes / 1024 / 1024) * 10) / 10; }
function milliseconds(nanoseconds) { return Math.round((nanoseconds / 1e6) * 100) / 100; }

export class RuntimeSampler {
  constructor(options = {}) {
    this.metrics = options.metrics;
    this.intervalMs = options.intervalMs || 10_000;
    this.eventLoop = monitorEventLoopDelay({ resolution: 20 });
    this.timer = null;
    this.startedAt = Date.now();
    this.last = null;
  }

  start() {
    if (this.timer) return;
    this.eventLoop.enable();
    this.sample();
    this.timer = setInterval(() => this.sample(), this.intervalMs);
    this.timer.unref?.();
  }

  sample() {
    const memory = process.memoryUsage();
    const load = os.loadavg();
    const snapshot = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: {
        rss: megabytes(memory.rss),
        heapUsed: megabytes(memory.heapUsed),
        heapTotal: megabytes(memory.heapTotal),
        external: megabytes(memory.external),
        arrayBuffers: megabytes(memory.arrayBuffers || 0)
      },
      eventLoopMs: {
        mean: Number.isFinite(this.eventLoop.mean) ? milliseconds(this.eventLoop.mean) : 0,
        p50: milliseconds(this.eventLoop.percentile(50)),
        p95: milliseconds(this.eventLoop.percentile(95)),
        p99: milliseconds(this.eventLoop.percentile(99)),
        maximum: milliseconds(this.eventLoop.max)
      },
      cpu: {
        load1: Math.round(load[0] * 100) / 100,
        load5: Math.round(load[1] * 100) / 100,
        load15: Math.round(load[2] * 100) / 100,
        cores: os.cpus().length
      },
      process: {
        pid: process.pid,
        node: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };
    this.last = snapshot;
    this.metrics?.setGauge('merlin_process_uptime_seconds', snapshot.uptimeSeconds);
    this.metrics?.setGauge('merlin_process_memory_rss_bytes', memory.rss);
    this.metrics?.setGauge('merlin_process_memory_heap_used_bytes', memory.heapUsed);
    this.metrics?.setGauge('merlin_event_loop_delay_p95_ms', snapshot.eventLoopMs.p95);
    this.metrics?.setGauge('merlin_cpu_load_1m', snapshot.cpu.load1);
    this.eventLoop.reset();
    return snapshot;
  }

  snapshot() { return this.last || this.sample(); }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.eventLoop.disable();
  }
}
