export const VIEW_COMMANDS = Object.freeze([
  ['map', 'Open map', 'Global event radius analysis', '1'],
  ['news', 'Open news', 'Verified news and social intelligence', '2'],
  ['shipping', 'Open shipping', 'Ports, routes and trade disruption', '3'],
  ['intelligence', 'Open places', 'Country and city intelligence', '4'],
  ['opportunities', 'Open opportunities', 'Ranked cross-signal opportunities', '5'],
  ['markets', 'Open markets', 'Market scanner and probability models', '6'],
  ['replay', 'Open replay', 'Historical strategy replay', '7'],
  ['predictions', 'Open predictions', 'Prediction market intelligence', '8'],
  ['alerts', 'Open alerts', 'Alert rules and trigger history', '9'],
  ['ops', 'Open system', 'Health, quality and deployment status', '0'],
  ['account', 'Open account', 'Account, plan and cloud data', 'A']
].map(([view, label, detail, shortcut]) => ({ id: `view:${view}`, type: 'view', view, label, detail, shortcut })));

export const ACTION_COMMANDS = Object.freeze([
  { id: 'action:refresh', type: 'action', label: 'Refresh current view', detail: 'Request the latest available data', shortcut: 'R' },
  { id: 'action:search', type: 'action', label: 'Focus place search', detail: 'Search a place or coordinates', shortcut: '/' },
  { id: 'action:workspaces', type: 'action', label: 'Open workspaces', detail: 'Save or restore a complete workspace', shortcut: 'W' },
  { id: 'action:diagnostics', type: 'action', label: 'Open diagnostics', detail: 'Inspect source health and failures', shortcut: 'D' },
  { id: 'action:sound', type: 'action', label: 'Cycle sound mode', detail: 'Off, alert-only or full interface audio', shortcut: 'M' },
  { id: 'action:density', type: 'action', label: 'Toggle interface density', detail: 'Comfortable or compact data layout', shortcut: 'C' },
  { id: 'action:motion', type: 'action', label: 'Toggle motion', detail: 'Full or reduced interface motion', shortcut: 'G' }
]);

export function createCommandRegistry(extra = []) {
  return [...VIEW_COMMANDS, ...ACTION_COMMANDS, ...extra];
}

function tokenize(value) {
  return String(value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function scoreField(field, query) {
  const value = String(field || '').toLowerCase();
  if (!value) return 0;
  if (value === query) return 100;
  if (value.startsWith(query)) return 72;
  if (value.includes(query)) return 48;
  return 0;
}

export function rankCommands(commands, query, limit = 12) {
  const clean = String(query || '').toLowerCase().trim();
  if (!clean) return commands.slice(0, limit);
  const tokens = tokenize(clean);
  return commands
    .map(command => {
      const haystack = `${command.label} ${command.detail} ${command.view || ''} ${command.shortcut || ''}`.toLowerCase();
      const tokenScore = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 20 : -40), 0);
      const score = scoreField(command.label, clean) + scoreField(command.view, clean) + scoreField(command.id, clean) + tokenScore;
      return { command, score };
    })
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.command.label.localeCompare(right.command.label))
    .slice(0, limit)
    .map(item => item.command);
}
