import { recordId } from './id.js';
import { clean } from './text.js';

const DAY_NAMES = Object.freeze(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

function normalizeDays(days) {
  const values = Array.isArray(days) && days.length ? days : DAY_NAMES;
  return Object.freeze([...new Set(values.map(value => String(value).slice(0, 3).toUpperCase()).filter(value => DAY_NAMES.includes(value)))]);
}

function normalizeTime(value) {
  const match = String(value || '08:00').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '08:00';
  const hours = Math.max(0, Math.min(23, Number(match[1])));
  const minutes = Math.max(0, Math.min(59, Number(match[2])));
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function briefingScheduleRecord(input = {}) {
  const now = new Date().toISOString();
  return Object.freeze({
    id: clean(input.id, 180) || recordId('schedule', `${input.name}-${input.time}`),
    name: clean(input.name || 'Scheduled briefing', 160),
    enabled: input.enabled !== false,
    type: clean(input.type || 'MORNING', 40).toUpperCase(),
    time: normalizeTime(input.time),
    days: normalizeDays(input.days),
    timezone: clean(input.timezone || 'UTC', 80),
    minimumPriority: Math.max(0, Math.min(100, Number(input.minimumPriority) || 45)),
    domains: Object.freeze((input.domains || []).map(value => clean(value, 40).toUpperCase()).filter(Boolean)),
    recipients: Object.freeze((input.recipients || []).map(value => clean(value, 200)).filter(Boolean).slice(0, 100)),
    formats: Object.freeze((input.formats || ['JSON']).map(value => clean(value, 20).toUpperCase()).filter(Boolean)),
    lastRunAt: input.lastRunAt ? new Date(input.lastRunAt).toISOString() : null,
    nextRunAt: input.nextRunAt ? new Date(input.nextRunAt).toISOString() : null,
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}

function dateParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

export function scheduleDue(schedule, now = new Date()) {
  if (!schedule.enabled) return false;
  let parts;
  try { parts = dateParts(now, schedule.timezone); } catch { parts = dateParts(now, 'UTC'); }
  const day = String(parts.weekday).slice(0, 3).toUpperCase();
  const currentTime = `${parts.hour}:${parts.minute}`;
  if (!schedule.days.includes(day) || currentTime !== schedule.time) return false;
  if (!schedule.lastRunAt) return true;
  return Date.parse(schedule.lastRunAt) < now.getTime() - 55_000;
}

export class BriefingScheduleStore {
  constructor(options = {}) {
    this.maximum = Math.max(10, Number(options.maximum) || 250);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async put(owner, input) {
    const bucket = this.bucket(owner);
    const item = briefingScheduleRecord(input);
    if (!bucket.has(item.id) && bucket.size >= this.maximum) throw new RangeError('Briefing schedule limit reached');
    bucket.set(item.id, item);
    return item;
  }

  async list(owner, filters = {}) {
    const type = filters.type ? String(filters.type).toUpperCase() : null;
    return Object.freeze([...this.bucket(owner).values()]
      .filter(item => filters.enabled === undefined || item.enabled === Boolean(filters.enabled))
      .filter(item => !type || item.type === type)
      .sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name)));
  }

  async due(owner, now = new Date()) {
    const items = await this.list(owner, { enabled: true });
    return Object.freeze(items.filter(item => scheduleDue(item, now)));
  }

  async markRun(owner, id, time = new Date()) {
    const existing = this.bucket(owner).get(String(id));
    if (!existing) return null;
    const item = briefingScheduleRecord({ ...existing, lastRunAt: time.toISOString() });
    this.bucket(owner).set(item.id, item);
    return item;
  }

  async remove(owner, id) {
    return this.bucket(owner).delete(String(id));
  }
}
