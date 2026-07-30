import { loadConfig } from '../src/config/load-config.js';

const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const sample = production ? { ...process.env, NODE_ENV: 'production' } : { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' };
const issues = [];
let config;
try { config = loadConfig(sample); } catch (error) { issues.push({ severity: 'ERROR', key: 'CONFIG', message: error.message }); }

if (config) {
  if (production && config.accounts.publicOrigin === 'https://example.com') issues.push({ severity: 'ERROR', key: 'PUBLIC_ORIGIN', message: 'Replace the placeholder production origin' });
  if (production && !config.accounts.secureCookies) issues.push({ severity: 'ERROR', key: 'SECURE_COOKIES', message: 'Secure cookies must be enabled in production' });
  if (config.userAgent.includes('replace@example.com')) issues.push({ severity: 'WARN', key: 'DATA_USER_AGENT', message: 'Set a real operational contact address' });
  if (!config.accounts.bootstrapOwner.email) issues.push({ severity: 'WARN', key: 'OWNER_EMAIL', message: 'No bootstrap owner is configured' });
  if (!config.acled.accessToken) issues.push({ severity: 'INFO', key: 'ACLED_ACCESS_TOKEN', message: 'ACLED remains NOT_CONFIGURED' });
  if (!config.markets.alphaVantageApiKey) issues.push({ severity: 'INFO', key: 'ALPHA_VANTAGE_API_KEY', message: 'Equity/FX feeds remain NOT_CONFIGURED' });
  if (!config.news.xBearerToken) issues.push({ severity: 'INFO', key: 'X_BEARER_TOKEN', message: 'X feed remains NOT_CONFIGURED' });
  if (!config.intelligence.reliefWebAppName) issues.push({ severity: 'INFO', key: 'RELIEFWEB_APP_NAME', message: 'ReliefWeb remains NOT_CONFIGURED' });
}

for (const issue of issues) console.log(`${issue.severity.padEnd(5)} ${issue.key.padEnd(28)} ${issue.message}`);
const errors = issues.filter(issue => issue.severity === 'ERROR');
console.log(`Environment validation: ${errors.length} errors / ${issues.length} notices`);
if (errors.length) process.exitCode = 1;
