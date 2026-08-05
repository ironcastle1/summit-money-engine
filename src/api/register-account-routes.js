import { ValidationError } from '../core/errors.js';
import { boundedString, clampInteger } from '../core/validation.js';
import { readJsonBody, readRawBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { clearCookie, serializeCookie } from '../security/cookies.js';
import { publicUser } from '../domain/accounts/user-schema.js';

function meta(request, context) { return { ip: context.ip, userAgent: request.headers['user-agent'] || '' }; }
function csrf(request) { return request.headers['x-csrf-token']; }
function sessionCookies(config, result) {
  const secure = config.isProduction || config.accounts.secureCookies;
  return [
    serializeCookie(config.accounts.cookieName, result.token, { httpOnly: true, secure, sameSite: 'Strict', maxAge: Math.floor(config.accounts.sessionTtlMs / 1000) }),
    serializeCookie('merlin_session_state', 'authenticated', { httpOnly: false, secure, sameSite: 'Strict', maxAge: Math.floor(config.accounts.sessionTtlMs / 1000) })
  ];
}

export function registerAccountRoutes(router, services) {
  router.get('/api/auth/session', async ({ request, response }) => {
    const auth = await services.auth.authenticate(request);
    if (!auth) { sendJson(response, 200, { authenticated: false, user: null, subscription: null, entitlements: null }); return; }
    const account = await services.subscriptions.current(auth.user);
    sendJson(response, 200, { authenticated: true, user: publicUser(auth.user), csrfToken: services.auth.csrfForSession(auth.session), ...account });
  });

  router.post('/api/auth/register', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const result = await services.auth.register({ email: body.email, password: body.password, displayName: body.displayName }, meta(request, context));
    response.setHeader('set-cookie', sessionCookies(services.config, result));
    const account = await services.subscriptions.current(await services.accounts.findById(result.user.id));
    sendJson(response, 201, { authenticated: true, user: result.user, csrfToken: result.csrfToken, ...account });
  });

  router.post('/api/auth/login', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const result = await services.auth.login({ email: body.email, password: body.password }, meta(request, context));
    response.setHeader('set-cookie', sessionCookies(services.config, result));
    const account = await services.subscriptions.current(await services.accounts.findById(result.user.id));
    sendJson(response, 200, { authenticated: true, user: result.user, csrfToken: result.csrfToken, ...account });
  });

  router.post('/api/auth/logout', async ({ request, response, context }) => {
    const auth = await services.auth.requireUser(request);
    services.auth.verifyCsrf(auth, csrf(request));
    await services.auth.logout(request, meta(request, context));
    response.setHeader('set-cookie', [clearCookie(services.config.accounts.cookieName, { secure: services.config.isProduction || services.config.accounts.secureCookies, sameSite: 'Strict' }), clearCookie('merlin_session_state', { httpOnly: false, secure: services.config.isProduction || services.config.accounts.secureCookies, sameSite: 'Strict' })]);
    sendJson(response, 200, { authenticated: false });
  });

  router.post('/api/account/password', async ({ request, response, context }) => {
    const auth = await services.auth.requireUser(request);
    services.auth.verifyCsrf(auth, csrf(request));
    const body = await readJsonBody(request);
    await services.auth.changePassword(auth.user.id, body.currentPassword, body.nextPassword, meta(request, context));
    response.setHeader('set-cookie', clearCookie(services.config.accounts.cookieName, { secure: services.config.isProduction || services.config.accounts.secureCookies, sameSite: 'Strict' }));
    sendJson(response, 200, { changed: true, reauthenticationRequired: true });
  });

  router.post('/api/account/profile', async ({ request, response, context }) => {
    const auth = await services.auth.requireUser(request);
    services.auth.verifyCsrf(auth, csrf(request));
    const body = await readJsonBody(request);
    const displayName = boundedString(body.displayName, 'displayName', { min: 0, max: 80 });
    const updated = await services.accounts.update(auth.user.id, user => ({ ...user, displayName }));
    await services.audit.record({ actorUserId: auth.user.id, actorRole: auth.user.role, action: 'PROFILE_UPDATED', targetType: 'USER', targetId: auth.user.id, ...meta(request, context) });
    sendJson(response, 200, { user: publicUser(updated) });
  });

  router.get('/api/billing/plans', async ({ response }) => sendJson(response, 200, { plans: services.subscriptions.plans(), providers: services.billingProviders.health() }, { cacheControl: 'public, max-age=300' }));

  router.get('/api/billing/subscription', async ({ request, response }) => {
    const auth = await services.auth.requireUser(request);
    sendJson(response, 200, await services.subscriptions.current(auth.user));
  });

  router.post('/api/billing/checkout', async ({ request, response }) => {
    const auth = await services.auth.requireUser(request);
    services.auth.verifyCsrf(auth, csrf(request));
    const body = await readJsonBody(request);
    const origin = services.config.accounts.publicOrigin;
    const successUrl = String(body.successUrl || `${origin}/?billing=success`).slice(0, 500);
    const cancelUrl = String(body.cancelUrl || `${origin}/?billing=cancel`).slice(0, 500);
    let validRedirects = false;
    try { validRedirects = new URL(successUrl).origin === new URL(origin).origin && new URL(cancelUrl).origin === new URL(origin).origin; } catch {}
    if (!validRedirects) throw new ValidationError('Billing redirect URL must use the configured public origin');
    sendJson(response, 201, await services.subscriptions.createCheckout(auth.user, { provider: body.provider, planId: body.planId, successUrl, cancelUrl }));
  });

  router.post('/api/billing/webhooks/:provider', async ({ request, response, params }) => {
    const provider = services.billingProviders.get(params.provider);
    const rawBody = await readRawBody(request, { maximumBytes: 1_000_000 });
    const valid = await provider.verifyWebhook(rawBody, request.headers);
    if (!valid) throw new ValidationError('Webhook signature is invalid');
    let event;
    try { event = JSON.parse(rawBody); } catch { throw new ValidationError('Webhook body is invalid JSON'); }
    const mapped = provider.mapWebhook(event);
    if (!mapped) { sendJson(response, 200, { accepted: true, ignored: true }); return; }
    const result = await services.subscriptions.applyProviderEvent(provider.id, mapped, event);
    sendJson(response, 200, { accepted: true, ...result });
  });

  router.get('/api/user-data/:bucket', async ({ request, response, params }) => {
    const auth = await services.auth.requireUser(request);
    sendJson(response, 200, { bucket: params.bucket, value: await services.userData.get(auth.user, params.bucket) });
  });

  router.post('/api/user-data/:bucket', async ({ request, response, params }) => {
    const auth = await services.auth.requireUser(request);
    services.auth.verifyCsrf(auth, csrf(request));
    const body = await readJsonBody(request, { maximumBytes: 1_100_000 });
    const value = await services.userData.put(auth.user, params.bucket, body.value);
    await services.audit.record({ actorUserId: auth.user.id, actorRole: auth.user.role, action: 'USER_DATA_SAVED', targetType: 'USER_DATA', targetId: params.bucket, metadata: { count: Array.isArray(value) ? value.length : Object.keys(value || {}).length } });
    sendJson(response, 200, { bucket: params.bucket, value });
  });

  router.get('/api/admin/metrics', async ({ request, response }) => { await services.auth.requireUser(request, 'ADMIN'); sendJson(response, 200, await services.admin.metrics()); });
  router.get('/api/admin/users', async ({ request, response, context }) => { await services.auth.requireUser(request, 'ADMIN'); sendJson(response, 200, { users: await services.admin.listUsers({ query: context.query.get('q'), limit: clampInteger(context.query.get('limit'), 200, 1, 500) }) }); });
  router.get('/api/admin/audit', async ({ request, response, context }) => { await services.auth.requireUser(request, 'ADMIN'); sendJson(response, 200, { events: await services.audit.list({ action: String(context.query.get('action') || '').toUpperCase() || undefined, limit: clampInteger(context.query.get('limit'), 200, 1, 1000) }) }); });

  router.post('/api/admin/users/:userId/role', async ({ request, response, params }) => {
    const auth = await services.auth.requireUser(request, 'ADMIN'); services.auth.verifyCsrf(auth, csrf(request)); const body = await readJsonBody(request);
    sendJson(response, 200, { user: await services.admin.setRole(auth.user, params.userId, body.role) });
  });
  router.post('/api/admin/users/:userId/status', async ({ request, response, params }) => {
    const auth = await services.auth.requireUser(request, 'ADMIN'); services.auth.verifyCsrf(auth, csrf(request)); const body = await readJsonBody(request);
    sendJson(response, 200, { user: await services.admin.setStatus(auth.user, params.userId, body.status) });
  });
  router.post('/api/admin/users/:userId/subscription', async ({ request, response, params }) => {
    const auth = await services.auth.requireUser(request, 'ADMIN'); services.auth.verifyCsrf(auth, csrf(request)); const body = await readJsonBody(request);
    sendJson(response, 200, { subscription: await services.subscriptions.grant(auth.user, params.userId, body) });
  });
}
