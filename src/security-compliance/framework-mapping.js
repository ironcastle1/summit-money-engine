const mappings = Object.freeze({
  'IAM-01': ['ISO27001:A.5.16', 'SOC2:CC6.2', 'NIST_CSF:PR.AA-01', 'CIS_V8:5'],
  'IAM-02': ['ISO27001:A.8.5', 'SOC2:CC6.3', 'NIST_CSF:PR.AA-03', 'CIS_V8:6.3'],
  'DAT-02': ['ISO27001:A.8.24', 'SOC2:CC6.7', 'NIST_CSF:PR.DS-01', 'CIS_V8:3.11'],
  'OPS-01': ['ISO27001:A.8.15', 'SOC2:CC7.2', 'NIST_CSF:DE.CM-09', 'CIS_V8:8'],
  'OPS-02': ['ISO27001:A.5.24', 'SOC2:CC7.4', 'NIST_CSF:RS.MA-01', 'CIS_V8:17'],
  'OPS-03': ['ISO27001:A.8.8', 'SOC2:CC7.1', 'NIST_CSF:ID.RA-01', 'CIS_V8:7'],
  'GOV-02': ['ISO27001:A.5.19', 'SOC2:CC9.2', 'NIST_CSF:GV.SC-06', 'CIS_V8:15'],
  'PRI-01': ['UK_GDPR:ART12-23', 'EU_GDPR:ART12-23'],
  'PRI-02': ['UK_GDPR:ART30', 'EU_GDPR:ART30'],
  'PRI-03': ['UK_GDPR:ART44-49', 'EU_GDPR:ART44-49']
});

export function mappingsForControl(controlId) {
  return Object.freeze(mappings[String(controlId || '').toUpperCase()] || []);
}

export function controlsForFramework(frameworkId) {
  const prefix = `${String(frameworkId || '').toUpperCase()}:`;
  return Object.freeze(Object.entries(mappings).filter(([, refs]) => refs.some(ref => ref.startsWith(prefix))).map(([controlId, refs]) => ({ controlId, references: refs.filter(ref => ref.startsWith(prefix)) })));
}
