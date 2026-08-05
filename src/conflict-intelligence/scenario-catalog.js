export const CONFLICT_SCENARIOS = Object.freeze([
Object.freeze({
  id: 'REGIONAL_ENTRY',
  label: 'Regional actor enters',
  effects: {
    escalation: 22,
    intensity: 14,
    regional: 28,
    logistics: 10
  }
}),
Object.freeze({
  id: 'MASS_MOBILIZATION',
  label: 'Mass mobilization',
  effects: {
    escalation: 20,
    intensity: 12,
    economic: 9,
    humanitarian: 8
  }
}),
Object.freeze({
  id: 'STRATEGIC_STRIKE',
  label: 'Strategic missile strike',
  effects: {
    escalation: 30,
    infrastructure: 24,
    civilian: 12,
    regional: 18
  }
}),
Object.freeze({
  id: 'CHOKEPOINT_CLOSURE',
  label: 'Strategic chokepoint closure',
  effects: {
    logistics: 35,
    economic: 22,
    regional: 10,
    escalation: 8
  }
}),
Object.freeze({
  id: 'CEASEFIRE',
  label: 'Ceasefire holds',
  effects: {
    escalation: -28,
    intensity: -24,
    humanitarian: -12,
    civilian: -10
  }
}),
Object.freeze({
  id: 'NEGOTIATED_SETTLEMENT',
  label: 'Negotiated settlement',
  effects: {
    escalation: -40,
    intensity: -36,
    regional: -18,
    economic: -10
  }
})
]);
