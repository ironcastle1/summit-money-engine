import { daysBetween } from './time.js';
export function lifecycleStage(input = {}, now = new Date()) { if (input.cancelledAt)
    return 'CHURNED'; if (Number(input.retentionRisk || 0) >= 70)
    return 'AT_RISK'; if (input.expansionOpen)
    return 'EXPANDING'; if (input.trialEndsAt && new Date(input.trialEndsAt) > now)
    return 'TRIAL'; if (Number(input.onboardingScore || 0) < 100)
    return 'ONBOARDING'; if (Number(input.adoptionScore || 0) < 55)
    return 'ADOPTING'; if (input.createdAt && daysBetween(input.createdAt, now) < 2)
    return 'LEAD'; return 'ESTABLISHED'; }
