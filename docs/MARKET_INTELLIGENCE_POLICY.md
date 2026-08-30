# MERLIN Market Intelligence Policy

MERLIN is an evidence collector and interpreter, not an opportunity-score generator.

For every synthesised market observation it should preserve:

1. what was actually observed;
2. why that evidence may be relevant to the current business;
3. direct evidence statements;
4. supporting evidence if any;
5. important unknowns;
6. a small validation action where appropriate;
7. source URLs.

MERLIN must not infer a sales volume, market share, conversion rate, profitability figure or confidence percentage merely because a product appears in search results.

Raw collected evidence is stored separately from local-AI synthesis. If the model cannot interpret the evidence reliably, the raw evidence remains available instead of forcing a conclusion.

Collectors are deliberately throttled and use public pages/feeds. The code does not bypass logins, CAPTCHAs, paywalls or anti-bot controls.
