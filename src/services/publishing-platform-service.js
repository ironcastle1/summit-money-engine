import {
  AudienceStore,
  BrandKitStore,
  DeliveryJobStore,
  EditionStore,
  OwnerRecordStore,
  PublicationAnalyticsStore,
  PublicationArchiveStore,
  PublicationDeliveryRouter,
  PublicationScheduler,
  PublicationStore,
  PublishingExportService,
  SubscriberStore,
  TemplateStore,
  buildPublicationPreview,
  composeEditionContent,
  createInAppPublicationChannel,
  createPublicationWebhookChannel,
  createShareLink,
  editionPeriod,
  editionRecord,
  evaluateAccess,
  nextEditionNumber,
  personalizeEdition,
  planCampaign,
  publicationQualityGate,
  publishingCatalog,
  publishingDiagnostics,
  resolveRecipients,
  subjectLine,
  verifyPasscode,
  verifyShareToken,
  watermarkRecord
} from '../publishing/index.js';

export class PublishingPlatformService {
  constructor(options = {}) {
    this.decisionSupport = options.decisionSupport;
    this.automation = options.automation;
    this.publications = options.publications || new PublicationStore();
    this.editions = options.editions || new EditionStore();
    this.templates = options.templates || new TemplateStore();
    this.brandKits = options.brandKits || new BrandKitStore();
    this.audiences = options.audiences || new AudienceStore();
    this.subscribers = options.subscribers || new SubscriberStore();
    this.deliveries = options.deliveries || new DeliveryJobStore();
    this.analytics = options.analytics || new PublicationAnalyticsStore();
    this.archive = options.archive || new PublicationArchiveStore();
    this.shareStore = options.shareStore || new OwnerRecordStore({ maximum: 10000 });
    this.secret = options.secret || process.env.PUBLICATION_SHARE_SECRET || 'merlin-local-share-secret';
    this.exporter = options.exporter || new PublishingExportService();
    this.deliveryRouter = options.deliveryRouter || new PublicationDeliveryRouter({
      channels: [
        createInAppPublicationChannel({ notifications: options.automation?.notifications }),
        createPublicationWebhookChannel({ fetchImpl: options.fetchImpl || globalThis.fetch })
      ]
    });
    this.scheduler = new PublicationScheduler({
      publications: this.publications,
      editions: this.editions,
      generate: (owner, input) => this.generateEdition(owner, input),
      publish: (owner, editionId, input) => this.publishEdition(owner, editionId, input)
    });
  }

  catalog() { return publishingCatalog(); }
  diagnostics(owner) { return publishingDiagnostics(this, owner); }

  async seed(owner) {
    const brand = await this.brandKits.put(owner, { id: 'brand-merlin-standard', name: 'Merlin Standard', organisation: 'Merlin Intelligence' });
    const templates = [];
    templates.push(await this.templates.put(owner, { id: 'template-morning-brief', name: 'Morning Intelligence Brief', category: 'EXECUTIVE', requiredBlockTypes: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'RECOMMENDATIONS'], formats: ['HTML', 'MARKDOWN', 'JSON'] }));
    templates.push(await this.templates.put(owner, { id: 'template-country-risk', name: 'Country Risk Report', category: 'COUNTRY_RISK', requiredBlockTypes: ['EXECUTIVE_SUMMARY', 'COUNTRY_TABLE', 'SOURCES'], formats: ['HTML', 'JSON', 'CSV'] }));
    templates.push(await this.templates.put(owner, { id: 'template-route-exposure', name: 'Route Exposure Bulletin', category: 'LOGISTICS', requiredBlockTypes: ['EXECUTIVE_SUMMARY', 'ROUTE_TABLE', 'MAP_SNAPSHOT'], formats: ['HTML', 'MARKDOWN'] }));
    const publication = await this.publications.put(owner, { id: 'publication-merlin-daily', name: 'Merlin Daily Intelligence', description: 'Daily executive intelligence and opportunity briefing.', state: 'ACTIVE', cadence: 'DAILY', templateId: templates[0].id, brandKitId: brand.id, approvalRequired: false, schedule: { cadence: 'DAILY', hour: 7, minute: 0, timezone: 'Europe/London', enabled: true } });
    return { brand, templates, publication };
  }

  async snapshot(owner) {
    const [publications, editions, subscribers, audiences, templates, brandKits, deliveries, analytics, shares, diagnostics] = await Promise.all([
      this.publications.list(owner), this.editions.list(owner, { limit: 1000 }), this.subscribers.list(owner, { limit: 1000 }),
      this.audiences.list(owner), this.templates.list(owner), this.brandKits.list(owner), this.deliveries.list(owner, { limit: 500 }),
      this.analytics.summary(owner), this.listShares(owner), this.diagnostics(owner)
    ]);
    return Object.freeze({ publications, editions, subscribers, audiences, templates, brandKits, deliveries, analytics, shares, diagnostics, generatedAt: new Date().toISOString() });
  }

  async generateEdition(owner, input = {}) {
    const publication = await this.publications.get(owner, input.publicationId);
    if (!publication) throw new Error('Publication not found');
    const editions = await this.editions.list(owner, { publicationId: publication.id, limit: 10000 });
    const snapshot = input.snapshot || await this.decisionSupport?.snapshot?.({ owner, hours: input.hours || 72 });
    const report = input.report || (!input.snapshot && this.decisionSupport?.report ? await this.decisionSupport.report({ owner, snapshot, type: input.reportType || 'EXECUTIVE_BRIEF' }) : null);
    const blocks = composeEditionContent({ ...input, snapshot: report || snapshot });
    const edition = editionRecord({
      publicationId: publication.id,
      editionNumber: nextEditionNumber(editions, publication.id),
      title: input.title || `${publication.name} — ${new Date().toISOString().slice(0, 10)}`,
      subtitle: input.subtitle || publication.description,
      state: input.state || 'DRAFT',
      classification: input.classification || publication.classification,
      period: input.period || editionPeriod(input.scheduledFor || Date.now(), publication.cadence),
      scheduledFor: input.scheduledFor || null,
      blocks,
      sourceIds: input.sourceIds || snapshot?.sourceIds || [],
      metadata: { templateId: publication.templateId, brandKitId: publication.brandKitId, reportId: report?.id || null }
    });
    await this.archive.archive(owner, 'EDITION_DRAFT', edition);
    return this.editions.put(owner, edition);
  }

  async preview(owner, editionId, input = {}) {
    const edition = await this.editions.get(owner, editionId);
    if (!edition) return null;
    const publication = await this.publications.get(owner, edition.publicationId);
    const brand = await this.brandKits.get(owner, input.brandKitId || publication?.brandKitId);
    return buildPublicationPreview(edition, { ...input, brand, approvalRequired: publication?.approvalRequired !== false });
  }

  async approveEdition(owner, editionId, input = {}) {
    const edition = await this.editions.get(owner, editionId);
    if (!edition) return null;
    const history = [...(edition.approval?.history || []), Object.freeze({ state: String(input.state || 'APPROVED').toUpperCase(), actor: input.actor || owner, note: input.note || '', time: new Date().toISOString() })];
    return this.editions.transition(owner, editionId, history.at(-1).state === 'APPROVED' ? 'APPROVED' : 'IN_REVIEW', { approval: Object.freeze({ history }) });
  }

  async publishEdition(owner, editionId, input = {}) {
    const edition = await this.editions.get(owner, editionId);
    if (!edition) return null;
    const publication = await this.publications.get(owner, edition.publicationId);
    const quality = publicationQualityGate(edition, { approvalRequired: publication?.approvalRequired !== false, approvals: edition.approval?.history || [], requireSources: input.requireSources !== false, requiredBlockTypes: input.requiredBlockTypes || [] });
    if (!quality.passed && !input.overrideQuality) return Object.freeze({ published: false, edition, quality });
    const published = await this.editions.transition(owner, editionId, 'PUBLISHED', { quality, publishedAt: new Date().toISOString() });
    await this.archive.archive(owner, 'EDITION_PUBLISHED', published);
    return Object.freeze({ published: true, edition: published, quality });
  }

  async createShare(owner, input = {}) {
    const edition = await this.editions.get(owner, input.editionId);
    if (!edition) return null;
    const share = createShareLink({ ...input, owner, editionId: edition.id, classification: edition.classification }, this.secret);
    await this.shareStore.put(owner, share);
    await this.analytics.record(owner, { type: 'SHARED', editionId: edition.id, publicationId: edition.publicationId, channel: 'SECURE_LINK' });
    return Object.freeze({ ...share, url: `/publication/share/${share.token}` });
  }

  async listShares(owner) { return this.shareStore.list(owner, { limit: 10000 }); }

  async accessShare(token, input = {}) {
    const payload = verifyShareToken(token, this.secret);
    if (!payload) return { allowed: false, reasons: ['INVALID_TOKEN'] };
    const share = await this.shareStore.get(payload.owner, payload.id);
    if (!share) return { allowed: false, reasons: ['SHARE_NOT_FOUND'] };
    const access = evaluateAccess({ ...share, now: input.now, passcodeRequired: Boolean(share.passcode), passcodeValid: share.passcode ? verifyPasscode(input.passcode, share.passcode) : true, clearance: input.clearance || share.clearance });
    if (!access.allowed) return { ...access, share: { id: share.id, expiresAt: share.expiresAt } };
    const edition = await this.editions.get(payload.owner, share.editionId);
    const updated = Object.freeze({ ...share, views: Number(share.views || 0) + 1 });
    await this.shareStore.put(payload.owner, updated);
    await this.analytics.record(payload.owner, { type: 'VIEWED', editionId: edition?.id, publicationId: edition?.publicationId, channel: 'SECURE_LINK' });
    return { ...access, edition, share: updated };
  }

  async deliverEdition(owner, input = {}) {
    const edition = await this.editions.get(owner, input.editionId);
    if (!edition) return null;
    const publication = await this.publications.get(owner, edition.publicationId);
    const allSubscribers = await this.subscribers.list(owner, { limit: 10000 });
    const selectedAudiences = (await this.audiences.list(owner, { limit: 1000 })).filter(item => (input.audienceIds || publication?.audienceIds || []).includes(item.id));
    const recipients = resolveRecipients({ subscribers: allSubscribers, audiences: selectedAudiences, subscriberIds: input.subscriberIds || [], classification: edition.classification });
    const campaign = planCampaign({ editionId: edition.id, recipients, batchSize: input.batchSize || 250, startAt: input.startAt, intervalMinutes: input.intervalMinutes });
    const job = await this.deliveries.create(owner, { editionId: edition.id, publicationId: edition.publicationId, recipients: recipients.map(item => item.id), channels: input.channels || ['IN_APP', 'SECURE_LINK'], state: 'DELIVERING' });
    const results = [];
    for (const recipient of recipients) {
      const personalized = personalizeEdition(edition, recipient);
      const share = input.createShares === false ? null : await this.createShare(owner, { editionId: edition.id, clearance: recipient.clearance, lifetimeHours: input.lifetimeHours, allowDownload: input.allowDownload });
      const channels = input.channels || recipient.channels || ['IN_APP'];
      const message = { owner, recipient, editionId: edition.id, subject: subjectLine({ title: personalized.title, urgency: input.urgency }), summary: personalized.subtitle, shareUrl: share?.url || null, payload: { edition: personalized, shareUrl: share?.url || null }, severity: input.urgency || 'INFO' };
      const delivered = await this.deliveryRouter.deliver(message, channels);
      results.push(...delivered);
      for (const result of delivered) await this.analytics.record(owner, { type: result.state === 'DELIVERED' ? 'DELIVERED' : result.state === 'FAILED' ? 'BOUNCED' : 'DELIVERED', editionId: edition.id, publicationId: edition.publicationId, subscriberId: recipient.id, channel: result.channel, metadata: { state: result.state, reason: result.reason } });
    }
    const deliveredCount = results.filter(item => item.state === 'DELIVERED').length;
    const failedCount = results.filter(item => item.state === 'FAILED').length;
    const state = failedCount && deliveredCount ? 'PARTIAL' : failedCount ? 'FAILED' : 'DELIVERED';
    const complete = await this.deliveries.transition(owner, job.id, state, { results: Object.freeze(results) });
    return Object.freeze({ job: complete, campaign, recipients: recipients.length, results });
  }
}

export function createPublishingPlatformService(options) {
  return new PublishingPlatformService(options);
}
