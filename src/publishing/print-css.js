export function printCss(brand = {}) {
  const colours = brand.colours || {};
  const typography = brand.typography || {};
  return `
:root{--ink:${colours.ink || '#10212A'};--paper:${colours.paper || '#F5F2E9'};--accent:${colours.accent || '#B98A42'};--muted:${colours.muted || '#65747C'};}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:${typography.body || 'Arial'},sans-serif;line-height:1.45}
.report{max-width:210mm;margin:0 auto;padding:18mm;background:var(--paper)}h1,h2,h3{font-family:${typography.heading || 'Georgia'},serif;margin:0 0 8px}h1{font-size:34px}h2{font-size:22px;border-bottom:2px solid var(--accent);padding-bottom:5px}.meta{color:var(--muted);font-size:12px}.block{margin:0 0 24px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.metric{border:1px solid #ccd2d4;padding:10px}.metric strong{display:block;font-size:22px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ccd2d4;padding:7px;text-align:left}.watermark{position:fixed;inset:45% 0 auto;transform:rotate(-28deg);text-align:center;font-size:38px;opacity:.08;z-index:0}.classification{font-weight:700;letter-spacing:.12em;color:var(--accent)}@page{size:A4;margin:12mm}@media print{body{background:white}.report{padding:0;max-width:none}.block{break-inside:avoid}.page-break{break-before:page}}
`;
}
