import { makePublishingId } from './ids.js';
import { clean, frozen } from './utilities.js';

const HEX = /^#[0-9a-f]{6}$/i;
function colour(value, fallback) {
  return HEX.test(String(value || '')) ? String(value).toUpperCase() : fallback;
}

export function brandKitRecord(input = {}) {
  const now = new Date().toISOString();
  return frozen({
    id: clean(input.id, 190) || makePublishingId('brand', input.name),
    name: clean(input.name || 'Merlin standard', 180),
    organisation: clean(input.organisation || 'Merlin', 180),
    logoUrl: clean(input.logoUrl || '/assets/merlin-logo-black.png', 500),
    markUrl: clean(input.markUrl || '/assets/merlin-mark-black.png', 500),
    colours: frozen({
      ink: colour(input.colours?.ink, '#10212A'),
      paper: colour(input.colours?.paper, '#F5F2E9'),
      accent: colour(input.colours?.accent, '#B98A42'),
      danger: colour(input.colours?.danger, '#B93B47'),
      muted: colour(input.colours?.muted, '#65747C')
    }),
    typography: frozen({
      heading: clean(input.typography?.heading || 'Georgia', 120),
      body: clean(input.typography?.body || 'Arial', 120),
      data: clean(input.typography?.data || 'Arial Narrow', 120)
    }),
    footer: clean(input.footer || 'Prepared by Merlin Intelligence', 500),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
