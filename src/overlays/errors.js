export class OverlayError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'OverlayError';
    this.code = code;
    this.details = details;
    this.statusCode = code === 'OVERLAY_NOT_FOUND' ? 404 : 400;
  }
}
export function overlayNotFound(id) { return new OverlayError('OVERLAY_NOT_FOUND', `Overlay not found: ${id}`, { id }); }
export function invalidOverlayState(message, details) { return new OverlayError('INVALID_OVERLAY_STATE', message, details); }
export function unavailableOverlay(id, reason) { return new OverlayError('OVERLAY_UNAVAILABLE', `Overlay is unavailable: ${id}`, { id, reason }); }
