const DOMAIN_SCENARIOS = Object.freeze({
    SHIPPING: [
        { title: 'Extended route closure', probability: 0.35, horizonHours: 72 },
        { title: 'Congestion spreads to alternative ports', probability: 0.45, horizonHours: 120 },
        { title: 'Freight and insurance costs rise', probability: 0.55, horizonHours: 168 }
    ],
    ENERGY: [
        { title: 'Regional supply interruption', probability: 0.35, horizonHours: 72 },
        { title: 'Spot prices rise', probability: 0.5, horizonHours: 48 },
        { title: 'Strategic stocks are released', probability: 0.2, horizonHours: 168 }
    ],
    MILITARY: [
        { title: 'Operational escalation', probability: 0.4, horizonHours: 72 },
        { title: 'Additional actors become involved', probability: 0.25, horizonHours: 168 },
        { title: 'Temporary ceasefire or pause', probability: 0.2, horizonHours: 120 }
    ],
    POLITICAL: [
        { title: 'Emergency policy response', probability: 0.45, horizonHours: 72 },
        { title: 'Leadership or coalition pressure rises', probability: 0.3, horizonHours: 336 },
        { title: 'New sanctions or diplomatic measures', probability: 0.25, horizonHours: 168 }
    ],
    ENVIRONMENTAL: [
        { title: 'Secondary infrastructure failures', probability: 0.35, horizonHours: 72 },
        { title: 'Humanitarian demand increases', probability: 0.5, horizonHours: 120 },
        { title: 'Transport access remains constrained', probability: 0.4, horizonHours: 96 }
    ]
});
export class ScenarioSeedGenerator {
    generate(event, options = {}) {
        const domains = (event?.impact?.domains || []).map(item => item.domain);
        const materiality = Number(event?.materiality?.score || 50);
        const confidence = Number(event?.confidence?.score || 50);
        const seeds = [];
        for (const domain of domains.slice(0, 5)) {
            for (const template of DOMAIN_SCENARIOS[domain] || []) {
                const adjusted = adjustProbability(template.probability, materiality, confidence, event);
                seeds.push({
                    id: `scenario_${event.id}_${slug(domain)}_${slug(template.title)}`,
                    eventId: event.id,
                    domain,
                    title: template.title,
                    probability: adjusted,
                    confidence: Math.min(100, Math.round(confidence * 0.75)),
                    horizonHours: template.horizonHours,
                    assumptions: buildAssumptions(event, domain),
                    indicators: indicatorsFor(domain, template.title),
                    generatedAt: new Date().toISOString()
                });
            }
        }
        return seeds.sort((left, right) => right.probability - left.probability).slice(0, options.limit || 12);
    }
}
function adjustProbability(base, materiality, confidence, event) {
    let probability = base;
    probability += (materiality - 50) / 500;
    probability += (confidence - 50) / 1000;
    if (event.status === 'ESCALATING')
        probability += 0.08;
    if (event.crossBorderImpact)
        probability += 0.05;
    return Math.max(0.03, Math.min(0.95, Math.round(probability * 1000) / 1000));
}
function buildAssumptions(event, domain) {
    return [
        `Current ${domain.toLowerCase()} impact remains active`,
        `Materiality remains near ${event.materiality?.score || 'current'} points`,
        `No decisive countermeasure is assumed unless evidence changes`
    ];
}
function indicatorsFor(domain, title) {
    const generic = ['official status updates', 'independent-source confirmation', 'materiality trend'];
    const specific = {
        SHIPPING: ['vessel queues', 'port waiting times', 'freight rates'],
        ENERGY: ['spot prices', 'pipeline flows', 'inventory releases'],
        MILITARY: ['force movements', 'strike frequency', 'frontline changes'],
        POLITICAL: ['official statements', 'legislative action', 'diplomatic meetings'],
        ENVIRONMENTAL: ['damage assessments', 'aftershocks', 'access constraints']
    };
    return [...(specific[domain] || []), ...generic].map(indicator => ({ indicator, scenario: title }));
}
function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
