function escape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"',
  '""')}"` : text;
}
export class ConflictExportService {
  toCsv(theatres = []) {
    const rows = [['id',
    'name',
    'country',
    'phase',
    'risk',
    'escalation',
    'intensity',
    'civilian_exposure',
    'logistics_exposure',
    'confidence',
    'events']];
    for (const item of theatres)
    rows.push([item.id,
    item.name,
    item.country,
    item.phase,
    item.risk.score,
    item.escalation.score,
    item.intensity.score,
    item.exposure.civilian.score,
    item.exposure.logistics.score,
    item.confidence.score,
    item.eventCount]);
    return rows.map(row => row.map(escape).join(',')).join('\n');
  }
  toJson(snapshot) {
    return JSON.stringify(snapshot,
    null,
    2);
  }
  summary(snapshot) {
    const theatres = snapshot.theatres || [];
    return Object.freeze({
      title: 'Merlin Conflict Intelligence Brief',
      generatedAt: snapshot.generatedAt,
      theatres: theatres.length,
      critical: theatres.filter(item => item.risk.score >= 65).length,
      highestRisk: theatres[0] ? {
        name: theatres[0].name,
        score: theatres[0].risk.score
      }
      : null,
      notes: ['Scores are evidence-weighted estimates, not declarations of fact.',
      'Unavailable and inferred inputs remain explicitly labelled.']
    });
  }
}
