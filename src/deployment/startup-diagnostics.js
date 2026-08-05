const SECRET_FIELDS = Object.freeze([
  ['accounts.sessionSecret', config => config.accounts?.sessionSecret],
  ['billing.stripe.secretKey', config => config.billing?.stripe?.secretKey],
  ['billing.paypal.clientSecret', config => config.billing?.paypal?.clientSecret],
  ['billing.coinbase.keySecret', config => config.billing?.coinbase?.keySecret]
]);

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function connectorState(config) {
  const entries = [
    ['acled', configured(config.acled?.accessToken)],
    ['x', configured(config.news?.xBearerToken)],
    ['alpha-vantage', configured(config.markets?.alphaVantageApiKey)],
    ['google-civic', configured(config.intelligence?.googleCivicApiKey)],
    ['imf-portwatch', configured(config.shipping?.portWatchBaseUrl)],
    ['un-comtrade', Boolean(config.shipping?.comtradeEnabled)],
    ['eia', configured(config.shipping?.eiaApiKey) || configured(config.shipping?.eiaRouteUrl)],
    ['stripe', configured(config.billing?.stripe?.secretKey)],
    ['paypal', configured(config.billing?.paypal?.clientId) && configured(config.billing?.paypal?.clientSecret)],
    ['coinbase-business', configured(config.billing?.coinbase?.bearerToken) || configured(config.billing?.coinbase?.keyId)]
  ];
  return Object.freeze(entries.map(([id, isConfigured]) => Object.freeze({ id, configured: isConfigured })));
}

function issue(code, severity, message, remediation) {
  return Object.freeze({ code, severity, message, remediation });
}

export function buildStartupDiagnostics(config) {
  const blockers = [];
  const warnings = [];

  if (config.isProduction && /example\.com/i.test(config.accounts.publicOrigin)) {
    blockers.push(issue(
      'PUBLIC_ORIGIN_PLACEHOLDER',
      'BLOCKER',
      'PUBLIC_ORIGIN still uses the example.com placeholder.',
      'Set PUBLIC_ORIGIN to the deployed HTTPS origin.'
    ));
  }

  if (config.isProduction && !config.accounts.secureCookies) {
    blockers.push(issue(
      'INSECURE_PRODUCTION_COOKIES',
      'BLOCKER',
      'Secure session cookies are disabled in production.',
      'Set SECURE_COOKIES=true.'
    ));
  }

  if (!config.mapTiles.enabled) {
    warnings.push(issue(
      'REMOTE_MAP_TILES_DISABLED',
      'WARNING',
      'Remote map tiles are disabled; the local political fallback will be used.',
      'Enable MAP_TILES_ENABLED for the full street-map experience.'
    ));
  }

  if (!config.acled.accessToken) {
    warnings.push(issue(
      'ACLED_NOT_CONFIGURED',
      'WARNING',
      'ACLED conflict ingestion is not configured.',
      'Set ACLED_ACCESS_TOKEN to enable the live ACLED connector.'
    ));
  }

  if (!config.news.xBearerToken) {
    warnings.push(issue(
      'X_NOT_CONFIGURED',
      'WARNING',
      'The X recent-search connector is disabled.',
      'Set X_BEARER_TOKEN only when a valid API subscription is available.'
    ));
  }

  const billingConfigured = [
    config.billing.stripe.secretKey,
    config.billing.paypal.clientId && config.billing.paypal.clientSecret,
    config.billing.coinbase.bearerToken || (config.billing.coinbase.keyId && config.billing.coinbase.keySecret)
  ].some(Boolean);

  if (config.isProduction && !billingConfigured) {
    warnings.push(issue(
      'BILLING_NOT_CONFIGURED',
      'WARNING',
      'No payment provider is configured; paid plan checkout will remain unavailable.',
      'Configure Stripe, PayPal or Coinbase Business credentials.'
    ));
  }

  const weakSecrets = SECRET_FIELDS
    .map(([id, read]) => ({ id, value: read(config) }))
    .filter(entry => configured(entry.value) && /development-only|change-me|changethis/i.test(entry.value));
  if (config.isProduction && weakSecrets.length) {
    blockers.push(issue(
      'DEVELOPMENT_SECRET_IN_PRODUCTION',
      'BLOCKER',
      `Development placeholder secrets remain configured: ${weakSecrets.map(entry => entry.id).join(', ')}.`,
      'Replace every placeholder with a randomly generated production secret.'
    ));
  }

  const connectors = connectorState(config);
  const configuredConnectors = connectors.filter(entry => entry.configured).length;
  const generatedAt = new Date().toISOString();

  return Object.freeze({
    version: config.version,
    environment: config.environment,
    ready: blockers.length === 0,
    status: blockers.length ? 'BLOCKED' : warnings.length ? 'READY_WITH_WARNINGS' : 'READY',
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    connectors,
    connectorSummary: Object.freeze({ configured: configuredConnectors, total: connectors.length }),
    generatedAt
  });
}

export function assertStartupReadiness(diagnostics) {
  if (diagnostics.ready) return diagnostics;
  const error = new Error(`Merlin startup blocked: ${diagnostics.blockers.map(entry => entry.code).join(', ')}`);
  error.code = 'STARTUP_READINESS_FAILED';
  error.diagnostics = diagnostics;
  throw error;
}
