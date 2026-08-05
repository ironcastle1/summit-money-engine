import { AutomationController } from './controller.js';
export function installAutomationSystem(options = {}) { const controller = new AutomationController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }
