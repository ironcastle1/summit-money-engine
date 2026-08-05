export function commercialJson(value) { return JSON.stringify({ generatedAt: new Date().toISOString(), data: value }, null, 2); }
