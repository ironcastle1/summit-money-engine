import { ReliabilityController } from './controller.js';
export function installReliabilitySystem(options = {}) { const controller = new ReliabilityController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }
