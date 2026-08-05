export const ACCESSIBILITY_REQUIREMENTS = Object.freeze([
  { id: 'document-language', level: 'A', description: 'Document language is declared.' },
  { id: 'unique-landmarks', level: 'A', description: 'Main, navigation and complementary landmarks are identifiable.' },
  { id: 'keyboard-access', level: 'A', description: 'Every interactive control is operable with a keyboard.' },
  { id: 'visible-focus', level: 'AA', description: 'Keyboard focus has a clearly visible indicator.' },
  { id: 'dialog-focus', level: 'A', description: 'Dialogs trap focus and restore it on close.' },
  { id: 'control-names', level: 'A', description: 'Interactive controls expose accessible names.' },
  { id: 'status-announcements', level: 'AA', description: 'Async status changes use polite live regions.' },
  { id: 'reduced-motion', level: 'AA', description: 'Reduced-motion preferences disable non-essential animation.' },
  { id: 'contrast', level: 'AA', description: 'Text and controls meet contrast requirements.' },
  { id: 'skip-link', level: 'A', description: 'A skip link moves focus to the main working surface.' },
  { id: 'touch-targets', level: 'AA', description: 'Primary controls use practical touch target dimensions.' },
  { id: 'zoom-reflow', level: 'AA', description: 'Content remains usable at narrow widths and browser zoom.' }
]);

export function summarizeAccessibility(results = []) {
  const byId = new Map(results.map(result => [result.id, result]));
  const checks = ACCESSIBILITY_REQUIREMENTS.map(requirement => {
    const result = byId.get(requirement.id);
    return Object.freeze({ ...requirement, status: result?.status || 'NOT_TESTED', evidence: result?.evidence || null });
  });
  const failed = checks.filter(check => check.status === 'FAIL');
  const passed = checks.filter(check => check.status === 'PASS');
  return Object.freeze({
    status: failed.length ? 'FAIL' : passed.length === checks.length ? 'PASS' : 'INCOMPLETE',
    checks,
    passed: passed.length,
    failed: failed.length,
    total: checks.length
  });
}
