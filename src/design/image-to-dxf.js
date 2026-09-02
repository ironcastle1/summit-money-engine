import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import potrace from 'potrace';
import { parseSVG, makeAbsolute } from 'svg-path-parser';
import { safeFilename } from '../services/filesystem.js';
import { ingestDxf, getProduct, updateProduct, syncProductSnapshot } from '../products/product-service.js';
import { storeProductAssets } from '../products/asset-service.js';

const { trace } = potrace;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function lerp(a, b, t) { return a + (b - a) * t; }
function cubic(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y
  };
}
function quad(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt ** 2 * p0.x + 2 * mt * t * p1.x + t ** 2 * p2.x,
    y: mt ** 2 * p0.y + 2 * mt * t * p1.y + t ** 2 * p2.y
  };
}
function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}
function boundsOf(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function simplify(points, minDistance = 1.5) {
  if (points.length <= 4) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (dist(p, out[out.length - 1]) >= minDistance) out.push(p);
  }
  if (out.length >= 3 && dist(out[0], out[out.length - 1]) < minDistance) out.pop();
  return out;
}
function extractPaths(svg) {
  const out = [];
  const re = /<path[^>]*\sd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg))) out.push(m[1]);
  return out;
}
function flattenPathData(d, opts = {}) {
  const curveSegments = clamp(Number(opts.curveSegments || 14), 4, 40);
  const commands = makeAbsolute(parseSVG(d));
  const loops = [];
  let current = { x: 0, y: 0 };
  let start = null;
  let points = [];
  const pushPoint = (p) => points.push({ x: Number(p.x), y: Number(p.y) });
  const closeLoop = () => {
    if (!points.length) return;
    if (start && (points[points.length - 1].x !== start.x || points[points.length - 1].y !== start.y)) pushPoint(start);
    const loop = simplify(points, opts.minPointDistance || 1.25);
    if (loop.length >= 4) loops.push(loop);
    points = [];
  };
  for (const c of commands) {
    if (c.code === 'M') {
      closeLoop();
      current = { x: c.x, y: c.y };
      start = { x: c.x, y: c.y };
      pushPoint(current);
    } else if (c.code === 'L') {
      current = { x: c.x, y: c.y };
      pushPoint(current);
    } else if (c.code === 'H') {
      current = { x: c.x, y: current.y };
      pushPoint(current);
    } else if (c.code === 'V') {
      current = { x: current.x, y: c.y };
      pushPoint(current);
    } else if (c.code === 'C') {
      const p0 = current, p1 = { x: c.x1, y: c.y1 }, p2 = { x: c.x2, y: c.y2 }, p3 = { x: c.x, y: c.y };
      for (let i = 1; i <= curveSegments; i++) pushPoint(cubic(p0, p1, p2, p3, i / curveSegments));
      current = p3;
    } else if (c.code === 'Q') {
      const p0 = current, p1 = { x: c.x1, y: c.y1 }, p2 = { x: c.x, y: c.y };
      for (let i = 1; i <= curveSegments; i++) pushPoint(quad(p0, p1, p2, i / curveSegments));
      current = p2;
    } else if (c.code === 'A') {
      current = { x: c.x, y: c.y };
      pushPoint(current);
    } else if (c.code === 'Z') {
      closeLoop();
      current = start || current;
    }
  }
  closeLoop();
  return loops;
}
function scaleTranslate(loop, scale, dx, dy) {
  return loop.map(p => ({ x: p.x * scale + dx, y: p.y * scale + dy }));
}
function loopsBounds(loops) {
  const points = loops.flat();
  return boundsOf(points);
}
function writePolylineDXF(loop) {
  const unique = [...loop];
  if (unique.length > 1 && dist(unique[0], unique[unique.length - 1]) < 0.01) unique.pop();
  const lines = ['0', 'LWPOLYLINE', '8', '0', '90', String(unique.length), '70', '1'];
  for (const p of unique) lines.push('10', p.x.toFixed(4), '20', p.y.toFixed(4));
  return lines.join('\n');
}
function writeDxfFromLoops(loops) {
  const entities = loops.map(writePolylineDXF).join('\n');
  return Buffer.from(`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities}\n0\nENDSEC\n0\nEOF\n`, 'utf8');
}
function previewSvg(loops, width, height) {
  const path = loops.map(loop => `M ${loop.map((p, i) => `${i ? 'L' : ''} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`).join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="none" stroke="black" stroke-width="1"/></svg>`;
}
async function tracePngToSvg(buffer, detailMode = 'medium') {
  return await new Promise((resolve, reject) => {
    trace(buffer, {
      turdSize: detailMode === 'high' ? 6 : detailMode === 'low' ? 18 : 10,
      turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
      color: 'black',
      background: 'white',
      optTolerance: detailMode === 'high' ? 0.15 : 0.28,
      threshold: 170
    }, (err, svg) => err ? reject(err) : resolve(svg));
  });
}
async function preprocessRaster(buffer, mode = 'silhouette') {
  const img = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const scale = meta.width && meta.width > 1600 ? 1600 / meta.width : 1;
  let pipeline = img.resize(scale < 1 ? { width: Math.round(meta.width * scale) } : undefined).flatten({ background: '#ffffff' }).grayscale().normalise();
  if (mode === 'silhouette') {
    pipeline = pipeline.threshold(170);
  } else {
    pipeline = pipeline.blur(0.5).threshold(160);
  }
  return pipeline.png().toBuffer();
}
function keepSinglePieceLoops(loops) {
  const withArea = loops.map(loop => ({ loop, area: Math.abs(polygonArea(loop)), bounds: boundsOf(loop) }))
    .filter(x => x.area >= 100);
  if (!withArea.length) throw new Error('The image did not produce enough solid geometry after tracing. Try a cleaner, higher-contrast image.');
  withArea.sort((a, b) => b.area - a.area);
  const outer = withArea[0].loop;
  const kept = [outer];
  for (const candidate of withArea.slice(1)) {
    const p = candidate.loop[0];
    if (pointInPolygon(p, outer)) kept.push(candidate.loop);
  }
  return kept;
}
function fitLoopsToMachine(loops, machine, targetWidthMm = null, targetHeightMm = null) {
  const margin = 8;
  const b = loopsBounds(loops);
  const maxW = Math.max(30, Math.min(Number(machine?.working_width_mm || 642.62) - margin * 2, targetWidthMm || Infinity));
  const maxH = Math.max(30, Math.min(Number(machine?.working_height_mm || 591.82) - margin * 2, targetHeightMm || Infinity));
  const scale = Math.min(maxW / b.width, maxH / b.height);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('Could not scale the traced geometry to the active machine envelope.');
  const dx = margin - b.minX * scale + (maxW - b.width * scale) / 2;
  const dy = margin - b.minY * scale + (maxH - b.height * scale) / 2;
  const out = loops.map(loop => scaleTranslate(loop, scale, dx, dy));
  const ob = loopsBounds(out);
  return { loops: out, width_mm: ob.width, height_mm: ob.height, scale };
}

export async function createProductFromImage(db, { file, name, category, legalStatus, primaryMaterialId = null, target_width_mm = null, target_height_mm = null, mode = 'silhouette', detail = 'medium' }) {
  if (!file?.buffer?.length) throw Object.assign(new Error('Image file required'), { status: 400 });
  if (!/^image\//i.test(file.mimetype || '')) throw Object.assign(new Error('Supported input types are image files only'), { status: 400 });
  const machine = db.prepare('SELECT * FROM machines WHERE active=1 ORDER BY created_at LIMIT 1').get();
  if (!machine) throw new Error('No active machine is configured');

  const processed = await preprocessRaster(file.buffer, mode);
  const svg = await tracePngToSvg(processed, detail);
  const pathData = extractPaths(svg);
  if (!pathData.length) throw new Error('The uploaded image could not be traced into vector outlines. Try a clearer image.');
  let loops = pathData.flatMap(d => flattenPathData(d, { curveSegments: detail === 'high' ? 18 : 12, minPointDistance: detail === 'high' ? 0.8 : 1.2 }));
  loops = keepSinglePieceLoops(loops);
  const fitted = fitLoopsToMachine(loops, machine, target_width_mm ? Number(target_width_mm) : null, target_height_mm ? Number(target_height_mm) : null);
  const dxfBuffer = writeDxfFromLoops(fitted.loops);
  const stem = safeFilename((name || file.originalname || 'image-design').replace(/\.[^.]+$/, ''));
  const product = ingestDxf(db, {
    buffer: dxfBuffer,
    originalname: `${stem}.dxf`,
    name: name || stem,
    category: category || 'wall art',
    legalStatus: legalStatus || 'review_required',
    unitOverride: 'millimeters',
    primaryMaterialId
  });

  storeProductAssets(db, product.id, [{ ...file, originalname: file.originalname || `${stem}.png`, size: file.size || file.buffer.length }], 'photos');

  const root = path.resolve(process.env.MERLIN_PRODUCT_DIR || './data/products', product.product_code);
  const assetDir = path.join(root, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });
  const processedPath = path.join(assetDir, `${safeFilename(product.product_code)}_trace_preview.svg`);
  fs.writeFileSync(processedPath, previewSvg(fitted.loops, Number(machine.working_width_mm || 642.62), Number(machine.working_height_mm || 591.82)));

  const notes = [
    'Generated by MERLIN V8 image-to-DXF pipeline.',
    `Mode: ${mode}. Detail: ${detail}.`,
    'MERLIN kept a single connected outer silhouette with internal holes only, then scaled it to the active table envelope.',
    'If the artistic fidelity is not good enough, clean the source image or simplify the subject before regenerating.'
  ].join(' ');
  updateProduct(db, product.id, {
    notes,
    target_width_mm: Math.round(fitted.width_mm * 10) / 10,
    target_height_mm: Math.round(fitted.height_mm * 10) / 10,
    status: 'review_required',
    legal_status: legalStatus || 'review_required'
  });
  syncProductSnapshot(db, product.id);
  return getProduct(db, product.id);
}
