function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function pathForPolyline(points, closed) {
  if (!points?.length) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${-first.y} ${rest.map(p => `L ${p.x} ${-p.y}`).join(' ')} ${closed ? 'Z' : ''}`;
}

export function renderSvg(analysis) {
  const b = analysis.drawing_bounds || analysis.bounds || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  const rawW = Math.max(1, b.maxX - b.minX);
  const rawH = Math.max(1, b.maxY - b.minY);
  const pad = Math.max(rawW, rawH) * 0.03;
  const viewX = b.minX - pad;
  const viewY = -(b.maxY + pad);
  const viewW = rawW + pad * 2;
  const viewH = rawH + pad * 2;
  const stroke = Math.max(0.2, Math.max(viewW, viewH) / 1200);
  const body = [];

  for (const g of analysis.geometries) {
    if (g.type === 'LINE') {
      const [a,bp] = g.points;
      body.push(`<line x1="${a.x}" y1="${-a.y}" x2="${bp.x}" y2="${-bp.y}" />`);
    } else if (g.type === 'LWPOLYLINE' || g.type === 'POLYLINE') {
      body.push(`<path d="${esc(pathForPolyline(g.points, g.closed))}" />`);
    } else if (g.type === 'CIRCLE') {
      body.push(`<circle cx="${g.center.x}" cy="${-g.center.y}" r="${g.radius}" />`);
    } else if (g.type === 'ARC') {
      const [a,bp] = g.points;
      let sweep = ((g.end - g.start) % 360 + 360) % 360;
      const large = sweep > 180 ? 1 : 0;
      body.push(`<path d="M ${a.x} ${-a.y} A ${g.radius} ${g.radius} 0 ${large} 0 ${bp.x} ${-bp.y}" />`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} ${viewY} ${viewW} ${viewH}" width="1200" height="1200">\n<rect x="${viewX}" y="${viewY}" width="${viewW}" height="${viewH}" fill="white"/>\n<g fill="none" stroke="black" stroke-width="${stroke}" vector-effect="non-scaling-stroke">${body.join('\n')}</g>\n</svg>`;
}
