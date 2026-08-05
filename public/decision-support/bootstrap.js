import { DecisionSupportController } from './controller.js';

export function installDecisionSupportSystem(options = {}) {
  const controller = new DecisionSupportController(options);
  return Object.freeze({
    activate() {
      controller.activate();
    },
    refresh(options) {
      return controller.refresh(options);
    },
    controller
  });
}
