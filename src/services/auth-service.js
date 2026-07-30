import { randomUUID } from 'node:crypto';
import { ApplicationError, ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from '../core/errors.js';
import { createUser, publicUser } from '../domain/accounts/user-schema.js';
import { validateEmail } from '../domain/accounts/email.js';
import { validatePassword } from '../domain/accounts/password-policy.js';
import { hashPassword, passwordHashNeedsUpgrade, verifyPassword } from '../security/password-hasher.js';
import { parseCookies } from '../security/cookies.js';
import { randomToken, tokenHash } from '../security/tokens.js';
import { roleAtLeast } from '../domain/accounts/roles.js';

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

export class AuthService {
  constructor(options) { Object.assign(this, options); }

  async initialize() {
    await this.sessions.purge();
    if (!this.bootstrap?.email || !this.bootstrap?.password) return;
    const existing = await this.accounts.findByEmail(this.bootstrap.email);
    if (existing) return;
    const password = validatePassword(this.bootstrap.password);
    const user = createUser({ email: this.bootstrap.email, displayName: this.bootstrap.displayName || 'Owner', passwordHash: await hashPassword(password), role: 'OWNER', emailVerifiedAt: new Date().toISOString() });
    await this.accounts.create(user);
    await this.audit.record({ actorUserId: user.id, actorRole: user.role, action: 'OWNER_BOOTSTRAPPED', targetType: 'USER', targetId: user.id });
  }

  async register(input, requestMeta = {}) {
    if (!this.allowRegistration) throw new ForbiddenError('Public registration is disabled');
    const email = validateEmail(input.email);
    const password = validatePassword(input.password);
    if (await this.accounts.findByEmail(email)) throw new ConflictError('An account with this email already exists');
    const user = createUser({ email, displayName: String(input.displayName || '').trim().slice(0, 80), passwordHash: await hashPassword(password), role: 'USER' });
    const created = await this.accounts.create(user);
    if (!created) throw new ConflictError('An account with this email already exists');
    await this.audit.record({ actorUserId: user.id, actorRole: user.role, action: 'ACCOUNT_REGISTERED', targetType: 'USER', targetId: user.id, ...requestMeta });
    return this.createSession(user, requestMeta);
  }

  async login(input, requestMeta = {}) {
    const email = validateEmail(input.email);
    const user = await this.accounts.findByEmail(email);
    const genericFailure = () => new UnauthorizedError('Email or password is incorrect');
    if (!user) { await hashPassword(String(input.password || 'invalid-password!A1')); throw genericFailure(); }
    if (user.status !== 'ACTIVE') throw new ForbiddenError('Account is not active');
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) throw new ApplicationError('Account is temporarily locked', { code: 'ACCOUNT_LOCKED', statusCode: 423, expose: true, details: { lockedUntil: user.lockedUntil } });
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      const updated = await this.accounts.update(user.id, current => {
        current.failedLoginCount = Number(current.failedLoginCount || 0) + 1;
        if (current.failedLoginCount >= LOCK_AFTER) current.lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
        return current;
      });
      await this.audit.record({ actorUserId: user.id, actorRole: user.role, action: 'LOGIN_FAILED', targetType: 'USER', targetId: user.id, outcome: 'DENIED', metadata: { failedLoginCount: updated.failedLoginCount }, ...requestMeta });
      throw genericFailure();
    }
    const updated = await this.accounts.update(user.id, async current => {
      current.failedLoginCount = 0; current.lockedUntil = null; current.lastLoginAt = new Date().toISOString();
      if (passwordHashNeedsUpgrade(current.passwordHash)) current.passwordHash = await hashPassword(input.password);
      return current;
    });
    await this.audit.record({ actorUserId: user.id, actorRole: user.role, action: 'LOGIN_SUCCEEDED', targetType: 'USER', targetId: user.id, ...requestMeta });
    return this.createSession(updated, requestMeta);
  }

  async createSession(user, requestMeta = {}) {
    const token = randomToken(32);
    const csrfToken = randomToken(24);
    const now = Date.now();
    const session = { id: randomUUID(), userId: user.id, tokenHash: tokenHash(token, this.secret), csrfToken, csrfHash: tokenHash(csrfToken, this.secret), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + this.sessionTtlMs).toISOString(), revokedAt: null, ip: requestMeta.ip || null, userAgent: String(requestMeta.userAgent || '').slice(0, 300), lastSeenAt: new Date(now).toISOString() };
    await this.sessions.create(session);
    return { token, csrfToken, expiresAt: session.expiresAt, user: publicUser(user) };
  }

  async authenticate(request) {
    const token = parseCookies(request.headers.cookie)[this.cookieName];
    if (!token) return null;
    const session = await this.sessions.find(tokenHash(token, this.secret));
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) return null;
    const user = await this.accounts.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') return null;
    return { user, session, token };
  }

  async requireUser(request, requiredRole = 'USER') {
    const auth = await this.authenticate(request);
    if (!auth) throw new UnauthorizedError('Authentication required');
    if (!roleAtLeast(auth.user.role, requiredRole)) throw new ForbiddenError('Insufficient permission');
    return auth;
  }

  csrfForSession(session) { return session?.csrfToken || null; }

  verifyCsrf(auth, supplied) {
    if (!supplied || tokenHash(supplied, this.secret) !== auth.session.csrfHash) throw new ForbiddenError('CSRF token is invalid');
    return true;
  }

  async logout(request, requestMeta = {}) {
    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[this.cookieName];
    if (!token) return false;
    const auth = await this.authenticate(request);
    await this.sessions.revoke(tokenHash(token, this.secret));
    if (auth) await this.audit.record({ actorUserId: auth.user.id, actorRole: auth.user.role, action: 'LOGOUT', targetType: 'SESSION', targetId: auth.session.id, ...requestMeta });
    return true;
  }

  async changePassword(userId, currentPassword, nextPassword, requestMeta = {}) {
    const user = await this.accounts.findById(userId);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) throw new UnauthorizedError('Current password is incorrect');
    validatePassword(nextPassword);
    const hashed = await hashPassword(nextPassword);
    await this.accounts.update(userId, current => ({ ...current, passwordHash: hashed }));
    await this.sessions.revokeUser(userId);
    await this.audit.record({ actorUserId: userId, actorRole: user.role, action: 'PASSWORD_CHANGED', targetType: 'USER', targetId: userId, ...requestMeta });
    return true;
  }
}
