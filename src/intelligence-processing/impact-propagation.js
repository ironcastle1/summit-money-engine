const DOMAIN_LINKS = Object.freeze({
    ENERGY: { MARKET: 0.7, SUPPLY_CHAIN: 0.75, SHIPPING: 0.55, ECONOMIC: 0.65 },
    SHIPPING: { SUPPLY_CHAIN: 0.85, MARKET: 0.55, ECONOMIC: 0.6, ENERGY: 0.5 },
    MILITARY: { SECURITY: 0.9, HUMANITARIAN: 0.75, POLITICAL: 0.65, SHIPPING: 0.4 },
    ENVIRONMENTAL: { HUMANITARIAN: 0.75, INFRASTRUCTURE: 0.8, SUPPLY_CHAIN: 0.55, HEALTH: 0.4 },
    INFRASTRUCTURE: { SUPPLY_CHAIN: 0.7, ECONOMIC: 0.55, HEALTH: 0.35, HUMANITARIAN: 0.45 },
    POLITICAL: { ECONOMIC: 0.5, MARKET: 0.45, SECURITY: 0.4, INFORMATION: 0.45 },
    HEALTH: { HUMANITARIAN: 0.65, ECONOMIC: 0.45, SUPPLY_CHAIN: 0.4 },
    INFORMATION: { POLITICAL: 0.45, SECURITY: 0.35, MARKET: 0.25 }
});
export class ImpactPropagationModel {
    propagate(domains = [], options = {}) {
        const decay = options.decay || 0.65;
        const maximumDepth = options.maximumDepth || 3;
        const scores = new Map();
        const paths = [];
        const queue = domains.map(item => ({ domain: item.domain, score: Number(item.score || 0), depth: 0, path: [item.domain] }));
        while (queue.length) {
            const current = queue.shift();
            if (current.score <= (scores.get(current.domain) || 0))
                continue;
            scores.set(current.domain, current.score);
            if (current.depth >= maximumDepth)
                continue;
            for (const [target, link] of Object.entries(DOMAIN_LINKS[current.domain] || {})) {
                if (current.path.includes(target))
                    continue;
                const score = current.score * link * decay;
                if (score < 5)
                    continue;
                const path = [...current.path, target];
                paths.push({ from: current.domain, to: target, score, path });
                queue.push({ domain: target, score, depth: current.depth + 1, path });
            }
        }
        return {
            domains: [...scores.entries()].map(([domain, score]) => ({ domain, score: Math.round(score * 100) / 100 })).sort((left, right) => right.score - left.score),
            paths: paths.sort((left, right) => right.score - left.score),
            maximumDepth
        };
    }
}
