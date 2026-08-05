export function conflictPhase(input = {
}) {
  const events = input.events || [],
  escalation = Number(input.escalation?.score) || 0,
  intensity = Number(input.intensity?.score) || 0,
  ceasefires = events.filter(event => event.type === 'CEASEFIRE').length,
  violations = events.filter(event => event.type === 'CEASEFIRE_VIOLATION').length;
  if (ceasefires && violations === 0 && intensity < 25)
  return 'CEASEFIRE';
  if (input.trend === 'FALLING' && intensity < 45)
  return 'DE_ESCALATING';
  if (intensity >= 75 || escalation >= 80)
  return 'INTENSE';
  if (intensity >= 45 || escalation >= 45)
  return 'ACTIVE';
  if (events.length && intensity >= 20)
  return 'TENSION';
  return events.length ? 'LATENT' : 'LATENT';
}
