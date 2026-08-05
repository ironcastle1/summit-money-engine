export function dataCompatibility(input = {}) { const issues = []; if (Number(input.invalidRecords) > 0)
    issues.push({ code: 'INVALID_RECORDS', count: Number(input.invalidRecords), severity: 'FAIL' }); if (Number(input.orphanedRecords) > 0)
    issues.push({ code: 'ORPHANED_RECORDS', count: Number(input.orphanedRecords), severity: 'WARN' }); if (Number(input.lossPercent) > 0)
    issues.push({ code: 'DATA_LOSS_RISK', value: Number(input.lossPercent), severity: Number(input.lossPercent) > .1 ? 'FAIL' : 'WARN' }); if (input.roundTripPassed === false)
    issues.push({ code: 'ROUND_TRIP_FAILED', severity: 'FAIL' }); return Object.freeze({ compatible: !issues.some(item => item.severity === 'FAIL'), issues, recordsChecked: Number(input.recordsChecked) || 0, roundTripPassed: input.roundTripPassed !== false }); }
