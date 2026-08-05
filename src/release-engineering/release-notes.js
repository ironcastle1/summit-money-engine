import { releaseId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function releaseNotes(input = {}) { return Object.freeze({ id: input.id || releaseId('notes', input.version || 'release'), version: clean(input.version, 60), title: clean(input.title || `Merlin ${input.version}`, 240), summary: clean(input.summary, 4000), highlights: unique(input.highlights, 500), fixes: unique(input.fixes, 1000), breakingChanges: unique(input.breakingChanges, 500), migrationNotes: unique(input.migrationNotes, 500), knownIssues: unique(input.knownIssues, 500), publishedAt: input.publishedAt || null, createdAt: input.createdAt || iso() }); }
