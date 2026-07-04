const listeners = new Set();
const state = { data: null, activeFilter: 'all', map: null, markers: [], routes: [], charts: {} };
export function getState(){ return state; }
export function setState(patch){ Object.assign(state, patch); listeners.forEach(fn => fn(state)); }
export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
