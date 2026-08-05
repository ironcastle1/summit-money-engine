import { ReleaseController } from './controller.js';
export function installReleaseSystem(options = {}) { const controller = new ReleaseController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }
