import {
  ConflictController
}
from './conflict-controller.js';
export async function installConflictIntelligenceSystem(options = {
}) {
  const controller = new ConflictController(options);
  try {
    await controller.initialize();
  }
  catch (error) {
    console.warn('conflict-intelligence.initialize.failed',
    error);
  }
  return controller;
}
