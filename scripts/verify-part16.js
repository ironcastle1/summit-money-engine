import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const required = [
  'src/security-compliance/index.js',
  'src/services/security-compliance-service.js',
  'src/api/register-security-compliance-routes.js',
  'public/security/bootstrap.js',
  'public/security/controller.js',
  'public/css/security-v20.css',
  'tests/part16/platform.test.js'
];
for (const relative of required) await access(path.join(root, relative));
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
const merlin = await readFile(path.join(root, 'public/merlin.js'), 'utf8');
if (!index.includes('data-view="security"')) throw new Error('Security navigation missing');
if (!index.includes('merlin.js?v=20.16.0')) throw new Error('Client version not updated');
if (!merlin.includes('installSecuritySystem')) throw new Error('Security system not bootstrapped');
const serverModules = await readdir(path.join(root, 'src/security-compliance'));
const browserModules = await readdir(path.join(root, 'public/security'));
if (serverModules.filter(name => name.endsWith('.js')).length < 55) throw new Error('Security server module count is incomplete');
if (browserModules.filter(name => name.endsWith('.js')).length < 12) throw new Error('Security browser module count is incomplete');
console.log(JSON.stringify({ part: 16, status: 'PASS', serverModules: serverModules.length, browserModules: browserModules.length }, null, 2));
