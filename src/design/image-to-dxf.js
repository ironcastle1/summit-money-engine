/**
 * MERLIN V8.4 compatibility module.
 *
 * Image -> DXF conversion in V8.4 runs in the browser through
 * public/image-dxf.js, then uploads the generated millimetre DXF through the
 * ordinary product/DXF ingestion API.  Keeping this server-side module is
 * deliberate: older V8 repository copies imported this path directly.  A
 * stale old route can therefore import this file without crashing Node.
 *
 * Do not reintroduce svg-path-parser named ESM imports here.  The old V8.0.x
 * implementation used a CommonJS package as named ESM exports and failed at
 * process startup on Node 20.
 */
export async function createProductFromImage() {
  const error = new Error('Server-side image conversion is not used in MERLIN V8.4. Refresh the V8.4 dashboard and use Products → Generate DXF from image.');
  error.status = 409;
  error.code = 'MERLIN_IMAGE_PIPELINE_BROWSER_V84';
  throw error;
}

export default { createProductFromImage };
