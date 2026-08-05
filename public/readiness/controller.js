import { installAccessibilityEnhancements } from './accessibility.js';
import { createConnectionStatus } from './connection-status.js';
import { installDemoMode } from './demo-mode.js';
import { installErrorBoundary } from './error-boundary.js';
import { installKeyboardShortcuts } from './keyboard-shortcuts.js';
import { createOnboarding } from './onboarding.js';
import { loadPreferences } from './preferences.js';
import { createPerformanceMonitor } from './performance-monitor.js';
import { createResponsiveNavigation } from './responsive-navigation.js';
import { createThemeManager, THEMES } from './theme-manager.js';

export function createMarketReadinessController(options = {}) {
  const preferences = loadPreferences();
  const theme = createThemeManager({ select: document.querySelector('#theme-select') });
  theme.apply(preferences.theme, false);
  const navigation = createResponsiveNavigation();
  const accessibility = installAccessibilityEnhancements();
  const connection = createConnectionStatus();
  const errors = installErrorBoundary({ onError: report => options.onClientError?.(report) });
  const demo = installDemoMode();
  const onboarding = createOnboarding();
  const performance = createPerformanceMonitor({ onSample: sample => options.onPerformance?.(sample) });
  const help = document.querySelector('#help-button');
  help?.addEventListener('click', () => onboarding.show());
  let themeIndex = Math.max(0, THEMES.indexOf(theme.current()));
  const stopShortcuts = installKeyboardShortcuts({
    openHelp: () => onboarding.show(),
    openNavigationIndex: index => document.querySelectorAll('.merlin-nav-item')[index]?.click(),
    cycleTheme: () => { themeIndex = (themeIndex + 1) % THEMES.length; theme.apply(THEMES[themeIndex]); },
    escape: () => { navigation.close(); if (onboarding.isOpen()) onboarding.close(); }
  });
  if (!preferences.onboardingComplete && !sessionStorage.getItem('merlin.guide.dismissed')) {
    setTimeout(() => onboarding.show(), 900);
    sessionStorage.setItem('merlin.guide.dismissed', '1');
  }
  document.documentElement.dataset.marketReadiness = 'installed';
  return Object.freeze({
    theme,
    navigation,
    accessibility,
    connection,
    errors,
    demo,
    onboarding,
    performance,
    audit: () => ({ accessibility: accessibility.audit(), performance: performance.sample(), errors: errors.reports() }),
    destroy() { stopShortcuts(); performance.destroy(); connection.destroy(); errors.destroy(); accessibility.destroy(); }
  });
}
