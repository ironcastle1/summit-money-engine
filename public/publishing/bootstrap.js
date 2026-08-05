import { PublishingController } from './controller.js';
export function installPublishingSystem(options = {}) {
  const controller = new PublishingController(options);
  return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller });
}
