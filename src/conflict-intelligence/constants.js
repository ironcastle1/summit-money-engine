export const CONFLICT_EVENT_TYPES = Object.freeze([
'BATTLE',
'AIRSTRIKE',
'MISSILE_STRIKE',
'DRONE_STRIKE',
'SHELLING',
'INCURSION',
'TERROR_ATTACK',
'SABOTAGE',
'BLOCKADE',
'MOBILIZATION',
'CEASEFIRE',
'CEASEFIRE_VIOLATION',
'TERRITORIAL_CHANGE',
'ARREST',
'PROTEST',
'OTHER'
]);
export const CONFLICT_PHASES = Object.freeze(['LATENT',
'TENSION',
'ACTIVE',
'INTENSE',
'STALEMATE',
'DE_ESCALATING',
'CEASEFIRE']);
export const ESCALATION_LEVELS = Object.freeze([
Object.freeze({
  id: 'ROUTINE',
  minimum: 0,
  maximum: 24.99,
  label: 'Routine activity'
}),
Object.freeze({
  id: 'ELEVATED',
  minimum: 25,
  maximum: 44.99,
  label: 'Elevated'
}),
Object.freeze({
  id: 'SERIOUS',
  minimum: 45,
  maximum: 64.99,
  label: 'Serious'
}),
Object.freeze({
  id: 'CRITICAL',
  minimum: 65,
  maximum: 79.99,
  label: 'Critical'
}),
Object.freeze({
  id: 'EXTREME',
  minimum: 80,
  maximum: 100,
  label: 'Extreme'
})
]);
export const WEAPON_CLASSES = Object.freeze(['SMALL_ARMS',
'ARTILLERY',
'ARMOUR',
'AIRCRAFT',
'MISSILE',
'DRONE',
'NAVAL',
'CYBER',
'CBRN',
'UNKNOWN']);
export const SOURCE_STATES = Object.freeze(['MEASURED',
'CORROBORATED',
'INFERRED',
'REFERENCE',
'UNAVAILABLE']);
export const THEATRE_WEIGHTS = Object.freeze({
  intensity: .23,
  escalation: .22,
  civilian: .12,
  infrastructure: .09,
  humanitarian: .10,
  regional: .09,
  logistics: .08,
  economic: .07
});
