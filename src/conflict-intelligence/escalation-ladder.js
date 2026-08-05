export function escalationLadder(score,
indicators = {
}) {
  const steps = [{
    id: 1,
    label: 'Routine contact',
    active: score >= 10
  },
  {
    id: 2,
    label: 'Sustained clashes',
    active: score >= 25
  },
  {
    id: 3,
    label: 'Cross-border or strategic strikes',
    active: score >= 45 || indicators.crossBorder > 0
  },
  {
    id: 4,
    label: 'Mobilization and infrastructure attack',
    active: score >= 65 || indicators.mobilization > 1
  },
  {
    id: 5,
    label: 'Regional war / unconventional threshold',
    active: score >= 85 || indicators.strategicWeapons > 2
  }];
  return Object.freeze(steps.map(step => Object.freeze(step)));
}
