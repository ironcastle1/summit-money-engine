import DxfParser from 'dxf-parser';

const EPS = 0.05;

function dxfUnitInfo(dxf) {
  const code = Number(dxf?.header?.$INSUNITS ?? 0);
  const map = {
    1: ['inches', 25.4], 2: ['feet', 304.8], 3: ['miles', 1609344],
    4: ['millimeters', 1], 5: ['centimeters', 10], 6: ['meters', 1000], 7: ['kilometers', 1_000_000],
    8: ['microinches', 0.0000254], 9: ['mils', 0.0254], 10: ['yards', 914.4],
    11: ['angstroms', 1e-7], 12: ['nanometers', 1e-6], 13: ['microns', 0.001],
    14: ['decimeters', 100], 15: ['decameters', 10_000], 16: ['hectometers', 100_000]
  };
  if (!map[code]) return { code, name: 'unitless_or_unsupported', mm_per_unit: null };
  return { code, name: map[code][0], mm_per_unit: map[code][1] };
}

function pt(x = 0, y = 0) { return { x: Number(x), y: Number(y) }; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function keyPoint(p, eps = EPS) { return `${Math.round(p.x / eps)},${Math.round(p.y / eps)}`; }
function lineLength(a, b) { return dist(a, b); }

function arcPoint(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function normalizeAngle(a) {
  let v = a % 360;
  if (v < 0) v += 360;
  return v;
}

function angleInSweep(test, start, end) {
  test = normalizeAngle(test); start = normalizeAngle(start); end = normalizeAngle(end);
  if (end < start) end += 360;
  if (test < start) test += 360;
  return test >= start && test <= end;
}

function entityGeometry(entity) {
  const type = entity.type;
  if (type === 'LINE') {
    const a = pt(entity.vertices?.[0]?.x, entity.vertices?.[0]?.y);
    const b = pt(entity.vertices?.[1]?.x, entity.vertices?.[1]?.y);
    return { type, points: [a, b], endpoints: [a, b], length: lineLength(a, b), closed: false };
  }

  if (type === 'LWPOLYLINE' || type === 'POLYLINE') {
    const points = (entity.vertices || []).map(v => pt(v.x, v.y));
    let length = 0;
    for (let i = 1; i < points.length; i++) length += lineLength(points[i - 1], points[i]);
    const closed = Boolean(entity.shape || entity.closed);
    if (closed && points.length > 1) length += lineLength(points.at(-1), points[0]);
    return {
      type,
      points,
      endpoints: closed || points.length === 0 ? [] : [points[0], points.at(-1)],
      length,
      closed
    };
  }

  if (type === 'CIRCLE') {
    const c = pt(entity.center?.x, entity.center?.y);
    const r = Number(entity.radius || 0);
    return { type, center: c, radius: r, points: [], endpoints: [], length: 2 * Math.PI * r, closed: true };
  }

  if (type === 'ARC') {
    const c = pt(entity.center?.x, entity.center?.y);
    const r = Number(entity.radius || 0);
    const start = Number(entity.startAngle || 0);
    const end = Number(entity.endAngle || 0);
    let sweep = normalizeAngle(end) - normalizeAngle(start);
    if (sweep < 0) sweep += 360;
    const a = arcPoint(c.x, c.y, r, start);
    const b = arcPoint(c.x, c.y, r, end);
    return {
      type, center: c, radius: r, start, end,
      points: [a, b], endpoints: [a, b], length: r * sweep * Math.PI / 180, closed: false
    };
  }

  return { type, unsupported: true, points: [], endpoints: [], length: 0, closed: false };
}

function updateBounds(bounds, p) {
  bounds.minX = Math.min(bounds.minX, p.x);
  bounds.maxX = Math.max(bounds.maxX, p.x);
  bounds.minY = Math.min(bounds.minY, p.y);
  bounds.maxY = Math.max(bounds.maxY, p.y);
}

function addEntityBounds(bounds, g) {
  if (g.type === 'CIRCLE') {
    updateBounds(bounds, { x: g.center.x - g.radius, y: g.center.y - g.radius });
    updateBounds(bounds, { x: g.center.x + g.radius, y: g.center.y + g.radius });
    return;
  }
  if (g.type === 'ARC') {
    for (const p of g.points) updateBounds(bounds, p);
    for (const angle of [0, 90, 180, 270]) {
      if (angleInSweep(angle, g.start, g.end)) updateBounds(bounds, arcPoint(g.center.x, g.center.y, g.radius, angle));
    }
    return;
  }
  for (const p of g.points) updateBounds(bounds, p);
}

function duplicateKey(entity) {
  const clone = { ...entity };
  delete clone.handle;
  delete clone.layer;
  return JSON.stringify(clone);
}

function endpointGraph(geometries) {
  const degree = new Map();
  for (const g of geometries) {
    for (const e of g.endpoints || []) {
      const k = keyPoint(e);
      degree.set(k, (degree.get(k) || 0) + 1);
    }
  }
  const oddOrSingle = [...degree.values()].filter(v => v % 2 !== 0).length;
  return { endpoint_nodes: degree.size, unmatched_endpoint_nodes: oddOrSingle };
}

export function analyseDxfText(text, machine = null, options = {}) {
  const parser = new DxfParser();
  const dxf = parser.parseSync(text);
  if (!dxf) throw new Error('DXF parser returned no document.');

  const detectedUnits = dxfUnitInfo(dxf);
  const override = options.unitOverride || null;
  const overrideMap = { millimeters: 1, mm: 1, inches: 25.4, inch: 25.4, in: 25.4, centimeters: 10, cm: 10, meters: 1000, m: 1000 };
  const overrideScale = override ? overrideMap[String(override).toLowerCase()] : null;
  const units = overrideScale ? { code: detectedUnits.code, name: String(override), mm_per_unit: overrideScale, source: 'owner_override' } : { ...detectedUnits, source: detectedUnits.mm_per_unit ? 'dxf_header' : 'unknown' };
  const scale = units.mm_per_unit;
  const entities = dxf.entities || [];
  const geometries = entities.map(entityGeometry);
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  let totalLength = 0;
  let closedPathCount = 0;
  let unsupported = 0;
  let smallFeatures = 0;
  const duplicateSeen = new Set();
  let duplicateCount = 0;

  let machineRules = {};
  if (machine?.rules_json) {
    try { machineRules = JSON.parse(machine.rules_json); } catch { machineRules = {}; }
  }
  const minHole = Number(machineRules.min_hole_mm || 0);

  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    if (g.unsupported) unsupported++;
    else addEntityBounds(bounds, g);
    totalLength += g.length || 0;
    if (g.closed) closedPathCount++;
    if (g.type === 'CIRCLE' && minHole > 0 && scale && g.radius * 2 * scale < minHole) smallFeatures++;
    const k = duplicateKey(entities[i]);
    if (duplicateSeen.has(k)) duplicateCount++;
    duplicateSeen.add(k);
  }

  const hasBounds = Number.isFinite(bounds.minX);
  const widthRaw = hasBounds ? bounds.maxX - bounds.minX : 0;
  const heightRaw = hasBounds ? bounds.maxY - bounds.minY : 0;
  const width = scale ? widthRaw * scale : null;
  const height = scale ? heightRaw * scale : null;
  const graph = endpointGraph(geometries.filter(g => !g.unsupported));

  const fitsMachine = scale && machine?.working_width_mm && machine?.working_height_mm
    ? ((width <= machine.working_width_mm && height <= machine.working_height_mm) ||
       (height <= machine.working_width_mm && width <= machine.working_height_mm))
    : null;

  const issues = [];
  if (unsupported) issues.push({ severity: 'review', code: 'UNSUPPORTED_ENTITIES', message: `${unsupported} DXF entities are not analysed by MERLIN yet.` });
  if (graph.unmatched_endpoint_nodes) issues.push({ severity: 'fail', code: 'OPEN_GEOMETRY', message: `${graph.unmatched_endpoint_nodes} unmatched contour endpoint nodes detected.` });
  if (duplicateCount) issues.push({ severity: 'review', code: 'DUPLICATE_GEOMETRY', message: `${duplicateCount} duplicate entities detected.` });
  if (smallFeatures) issues.push({ severity: 'review', code: 'SMALL_HOLES', message: `${smallFeatures} circles fall below the configured minimum hole size.` });
  if (fitsMachine === false) issues.push({ severity: 'fail', code: 'OUTSIDE_MACHINE', message: 'DXF exceeds the active machine envelope in both orientations.' });
  if (!scale) issues.push({ severity: 'review', code: 'DXF_UNITS_UNKNOWN', message: 'DXF units are missing or unsupported. MERLIN will show drawing-unit extents only until you confirm the intended units.' });
  if (!machineRules.min_bridge_mm || !machineRules.min_slot_mm || !machineRules.min_hole_mm) {
    issues.push({ severity: 'review', code: 'MACHINE_RULES_UNCALIBRATED', message: 'Minimum bridge/slot/hole rules are not fully calibrated; MERLIN will not invent them.' });
  }
  issues.push({ severity: 'review', code: 'TOPOLOGY_REVIEW', message: 'Retained-steel island/bridge topology cannot be proven from generic DXF geometry alone in the current deterministic validator; visual/manual review remains required.' });

  const validationStatus = issues.some(i => i.severity === 'fail') ? 'failed' : 'review_required';

  return {
    dxf,
    entities,
    geometries,
    bounds: hasBounds && scale ? { minX: bounds.minX * scale, minY: bounds.minY * scale, maxX: bounds.maxX * scale, maxY: bounds.maxY * scale } : null,
    drawing_bounds: hasBounds ? bounds : null,
    units,
    drawing_width_units: widthRaw,
    drawing_height_units: heightRaw,
    width_mm: width,
    height_mm: height,
    entity_count: entities.length,
    total_cut_length_mm: scale ? totalLength * scale : null,
    pierce_estimate: closedPathCount + Math.ceil(graph.unmatched_endpoint_nodes / 2),
    closed_path_count: closedPathCount,
    open_path_count: graph.unmatched_endpoint_nodes,
    small_feature_count: smallFeatures,
    duplicate_entity_count: duplicateCount,
    unsupported_entity_count: unsupported,
    fits_machine: fitsMachine,
    validation_status: validationStatus,
    issues
  };
}
