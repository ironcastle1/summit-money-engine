import { CommercialController } from './controller.js';
export function installCommercialSystem() { const controller = new CommercialController(); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }
