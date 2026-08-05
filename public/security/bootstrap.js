import { SecurityController } from './controller.js';

export function installSecuritySystem(options = {}) {
  const controller = new SecurityController(options);
  return Object.freeze({
    activate: () => controller.activate(),
    refresh: () => controller.refresh(),
    controller
  });
}
