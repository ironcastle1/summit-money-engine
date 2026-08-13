export const CLAIM_RISK_RULES = Object.freeze([
  {
    "id": "cl-001",
    "label": "Anonymous imminent-action claim",
    "risk": 22,
    "terms": [
      "officials say attack imminent",
      "sources say attack imminent",
      "could strike within hours"
    ],
    "requiresCorroboration": true,
    "why": "Imminent-action claims can move markets before evidence appears and require independent confirmation."
  },
  {
    "id": "cl-002",
    "label": "Single-source battlefield casualty claim",
    "risk": 18,
    "terms": [
      "killed hundreds",
      "mass casualties",
      "enemy losses"
    ],
    "requiresCorroboration": true,
    "why": "Casualty figures from belligerents are frequently revised or contested."
  },
  {
    "id": "cl-003",
    "label": "Territorial control claim",
    "risk": 18,
    "terms": [
      "captured the town",
      "seized control",
      "liberated the city"
    ],
    "requiresCorroboration": true,
    "why": "Control claims should be confirmed with multiple independent or geolocated sources."
  },
  {
    "id": "cl-004",
    "label": "Attribution before technical evidence",
    "risk": 16,
    "terms": [
      "was behind the attack",
      "responsible for cyberattack",
      "state-sponsored attack"
    ],
    "requiresCorroboration": true,
    "why": "Attribution can lag operational facts and should not be allowed to obscure confirmed impact."
  },
  {
    "id": "cl-005",
    "label": "Nuclear weaponisation allegation",
    "risk": 24,
    "terms": [
      "building a nuclear weapon",
      "weaponization activity",
      "nuclear bomb program"
    ],
    "requiresCorroboration": true,
    "why": "Weaponisation allegations have very high consequence and require technical/official evidence."
  },
  {
    "id": "cl-006",
    "label": "Nuclear breakout timeline estimate",
    "risk": 18,
    "terms": [
      "weeks from a bomb",
      "days from breakout",
      "breakout time"
    ],
    "requiresCorroboration": true,
    "why": "Breakout estimates depend on assumptions and should be separated from verified enrichment data."
  },
  {
    "id": "cl-007",
    "label": "Unverified shipping closure rumor",
    "risk": 22,
    "terms": [
      "strait is closed",
      "shipping has stopped",
      "all ships halted"
    ],
    "requiresCorroboration": true,
    "why": "Chokepoint closure claims can reprice markets rapidly and should be checked against traffic and official notices."
  },
  {
    "id": "cl-008",
    "label": "Unverified vessel damage",
    "risk": 16,
    "terms": [
      "ship sinking",
      "tanker sunk",
      "vessel destroyed"
    ],
    "requiresCorroboration": true,
    "why": "Initial maritime incident reports often misstate damage severity."
  },
  {
    "id": "cl-009",
    "label": "Sanctions leak before legal text",
    "risk": 14,
    "terms": [
      "sanctions expected",
      "planning sanctions",
      "set to impose sanctions"
    ],
    "requiresCorroboration": true,
    "why": "Market impact depends on final legal scope, entities, effective date and licensing."
  },
  {
    "id": "cl-010",
    "label": "Tariff leak before proclamation",
    "risk": 14,
    "terms": [
      "tariffs expected",
      "considering tariffs",
      "set to announce tariff"
    ],
    "requiresCorroboration": true,
    "why": "Trade policy leaks should be distinguished from signed rules or proclamations."
  },
  {
    "id": "cl-011",
    "label": "Ceasefire agreed but not implemented",
    "risk": 13,
    "terms": [
      "ceasefire agreed in principle",
      "tentative ceasefire",
      "framework for ceasefire"
    ],
    "requiresCorroboration": true,
    "why": "A political agreement may not produce operational de-escalation until implementation starts."
  },
  {
    "id": "cl-012",
    "label": "Peace-talk optimism language",
    "risk": 9,
    "terms": [
      "constructive talks",
      "positive atmosphere",
      "progress in talks"
    ],
    "requiresCorroboration": false,
    "why": "Diplomatic tone is weaker than signed terms, force pullbacks or verified implementation."
  },
  {
    "id": "cl-013",
    "label": "State-media military success claim",
    "risk": 20,
    "terms": [
      "destroyed all targets",
      "decisive victory",
      "enemy routed"
    ],
    "requiresCorroboration": true,
    "why": "Belligerent state media has strong incentives to frame operational outcomes."
  },
  {
    "id": "cl-014",
    "label": "State-media denial of damage",
    "risk": 18,
    "terms": [
      "no damage occurred",
      "all systems normal",
      "attack had no effect"
    ],
    "requiresCorroboration": true,
    "why": "Official denials should be checked against operator, imagery and independent reporting."
  },
  {
    "id": "cl-015",
    "label": "Anonymous energy outage estimate",
    "risk": 13,
    "terms": [
      "sources estimate outage",
      "unconfirmed production loss",
      "may have lost output"
    ],
    "requiresCorroboration": true,
    "why": "Physical energy impact should be confirmed by operators, flows or government data."
  },
  {
    "id": "cl-016",
    "label": "Operator confirmed outage",
    "risk": -10,
    "terms": [
      "operator confirmed outage",
      "company said production halted",
      "terminal operator confirmed"
    ],
    "requiresCorroboration": false,
    "why": "Named operator confirmation materially improves confidence in physical impact."
  },
  {
    "id": "cl-017",
    "label": "Primary legal document",
    "risk": -14,
    "terms": [
      "executive order signed",
      "regulation published",
      "official journal published",
      "general license issued"
    ],
    "requiresCorroboration": false,
    "why": "Published legal text is stronger than secondary summaries for policy scope."
  },
  {
    "id": "cl-018",
    "label": "Primary central-bank decision",
    "risk": -14,
    "terms": [
      "central bank announced",
      "monetary policy committee decided",
      "FOMC decided"
    ],
    "requiresCorroboration": false,
    "why": "Primary central-bank releases are authoritative for the decision itself."
  },
  {
    "id": "cl-019",
    "label": "Primary port notice",
    "risk": -12,
    "terms": [
      "port authority announced",
      "harbour master notice",
      "port condition"
    ],
    "requiresCorroboration": false,
    "why": "Port authorities are strong primary evidence for operational restrictions."
  },
  {
    "id": "cl-020",
    "label": "Primary aviation notice",
    "risk": -12,
    "terms": [
      "NOTAM issued",
      "civil aviation authority announced",
      "airspace notice"
    ],
    "requiresCorroboration": false,
    "why": "Official airspace notices are operational evidence and should outrank media paraphrase."
  },
  {
    "id": "cl-021",
    "label": "Prediction-market movement treated as fact",
    "risk": 17,
    "terms": [
      "prediction market proves",
      "odds confirm",
      "market says event will happen"
    ],
    "requiresCorroboration": true,
    "why": "Prediction markets aggregate beliefs and liquidity; they do not verify factual claims."
  },
  {
    "id": "cl-022",
    "label": "Social-media viral claim",
    "risk": 23,
    "terms": [
      "viral video shows",
      "social media users claim",
      "widely shared video"
    ],
    "requiresCorroboration": true,
    "why": "Viral content may be old, mislocated or edited and needs provenance checks."
  },
  {
    "id": "cl-023",
    "label": "Satellite image interpretation",
    "risk": 14,
    "terms": [
      "satellite images suggest",
      "imagery appears to show"
    ],
    "requiresCorroboration": true,
    "why": "Satellite imagery can be valuable but interpretation, date and location must be verified."
  },
  {
    "id": "cl-024",
    "label": "Intelligence assessment leak",
    "risk": 17,
    "terms": [
      "intelligence believes",
      "intelligence assessment says",
      "classified assessment"
    ],
    "requiresCorroboration": true,
    "why": "Leaked assessments can be selective and should be distinguished from observable facts."
  },
  {
    "id": "cl-025",
    "label": "False-flag allegation",
    "risk": 25,
    "terms": [
      "false flag",
      "staged attack",
      "fabricated incident"
    ],
    "requiresCorroboration": true,
    "why": "False-flag allegations are highly contestable and should carry a strong verification penalty."
  },
  {
    "id": "cl-026",
    "label": "Sabotage allegation",
    "risk": 18,
    "terms": [
      "sabotage suspected",
      "deliberate sabotage",
      "act of sabotage"
    ],
    "requiresCorroboration": true,
    "why": "Cause and attribution should be separated from confirmed infrastructure failure."
  },
  {
    "id": "cl-027",
    "label": "Undersea cable technical cause confirmed",
    "risk": -8,
    "terms": [
      "anchor damage confirmed",
      "technical fault confirmed",
      "repair operator confirmed"
    ],
    "requiresCorroboration": false,
    "why": "Technical findings can reduce speculative hybrid-attack narratives."
  },
  {
    "id": "cl-028",
    "label": "Mobilisation rumor",
    "risk": 19,
    "terms": [
      "rumors of mobilisation",
      "mobilization expected",
      "call-up reportedly planned"
    ],
    "requiresCorroboration": true,
    "why": "Mobilisation claims are politically and militarily consequential and should be tied to decrees or observed call-ups."
  },
  {
    "id": "cl-029",
    "label": "Mobilisation decree",
    "risk": -12,
    "terms": [
      "mobilisation decree",
      "mobilization decree",
      "official call-up order"
    ],
    "requiresCorroboration": false,
    "why": "A published decree is primary evidence of mobilisation policy."
  },
  {
    "id": "cl-030",
    "label": "Regime-collapse speculation",
    "risk": 21,
    "terms": [
      "regime may collapse",
      "leader could be ousted",
      "coup imminent"
    ],
    "requiresCorroboration": true,
    "why": "Elite politics speculation is noisy and should not dominate without observable institutional changes."
  },
  {
    "id": "cl-031",
    "label": "Coup claim",
    "risk": 24,
    "terms": [
      "coup underway",
      "military coup",
      "government overthrown"
    ],
    "requiresCorroboration": true,
    "why": "Coup claims require rapid multi-source confirmation because early reporting is often confused."
  },
  {
    "id": "cl-032",
    "label": "Election exit poll",
    "risk": 10,
    "terms": [
      "exit poll",
      "early projection"
    ],
    "requiresCorroboration": true,
    "why": "Exit polls are informative but should be clearly separated from official results."
  },
  {
    "id": "cl-033",
    "label": "Official election result",
    "risk": -10,
    "terms": [
      "official results",
      "electoral commission announced",
      "certified election result"
    ],
    "requiresCorroboration": false,
    "why": "Official results are primary for declared totals, though legal disputes can remain."
  },
  {
    "id": "cl-034",
    "label": "Bank insolvency rumor",
    "risk": 22,
    "terms": [
      "bank insolvent",
      "bank may fail",
      "bank run rumors"
    ],
    "requiresCorroboration": true,
    "why": "Bank rumors can become self-reinforcing; balance-sheet and regulator evidence is required."
  },
  {
    "id": "cl-035",
    "label": "Regulator bank action",
    "risk": -12,
    "terms": [
      "bank placed into receivership",
      "regulator closed bank",
      "resolution authority announced"
    ],
    "requiresCorroboration": false,
    "why": "Regulator action is authoritative for legal status."
  },
  {
    "id": "cl-036",
    "label": "Capital control rumor",
    "risk": 20,
    "terms": [
      "capital controls expected",
      "withdrawal limits rumored"
    ],
    "requiresCorroboration": true,
    "why": "Controls directly affect access and must be tied to official or bank instructions."
  },
  {
    "id": "cl-037",
    "label": "Capital controls official",
    "risk": -12,
    "terms": [
      "capital controls imposed",
      "mandatory FX conversion",
      "withdrawal limits announced"
    ],
    "requiresCorroboration": false,
    "why": "Published rules provide operational scope."
  },
  {
    "id": "cl-038",
    "label": "Commodity export-ban rumor",
    "risk": 18,
    "terms": [
      "export ban expected",
      "considering export ban",
      "exports may be banned"
    ],
    "requiresCorroboration": true,
    "why": "Physical effects depend on final products, dates, licences and customs enforcement."
  },
  {
    "id": "cl-039",
    "label": "Commodity export rule official",
    "risk": -11,
    "terms": [
      "export ban takes effect",
      "customs notice",
      "export license requirement announced"
    ],
    "requiresCorroboration": false,
    "why": "Official customs or ministry text provides scope and timing."
  },
  {
    "id": "cl-040",
    "label": "Large unsourced price target",
    "risk": 15,
    "terms": [
      "oil could hit $200",
      "gold to $5000",
      "market crash imminent"
    ],
    "requiresCorroboration": true,
    "why": "Sensational price targets without a transmission model are not intelligence."
  },
  {
    "id": "cl-041",
    "label": "Named analyst scenario",
    "risk": 4,
    "terms": [
      "analysts estimate",
      "strategists expect",
      "economists forecast"
    ],
    "requiresCorroboration": false,
    "why": "Forecasts can be useful context but should remain clearly labelled as analysis."
  },
  {
    "id": "cl-042",
    "label": "Historical analogy presented as prediction",
    "risk": 12,
    "terms": [
      "just like 2008",
      "repeat of 1973",
      "another 2020"
    ],
    "requiresCorroboration": true,
    "why": "Analogies can highlight mechanisms but are not evidence that outcomes will repeat."
  },
  {
    "id": "cl-043",
    "label": "Casualty number from neutral authority",
    "risk": -7,
    "terms": [
      "UN confirmed casualties",
      "health ministry confirmed",
      "emergency services confirmed"
    ],
    "requiresCorroboration": false,
    "why": "Named institutional sources improve confidence, though conflict-zone access limits still matter."
  },
  {
    "id": "cl-044",
    "label": "Shipping carrier operational decision",
    "risk": -12,
    "terms": [
      "Maersk suspended",
      "MSC suspended",
      "CMA CGM rerouted",
      "Hapag-Lloyd rerouted"
    ],
    "requiresCorroboration": false,
    "why": "Carrier decisions are direct operational evidence of route-risk economics."
  },
  {
    "id": "cl-045",
    "label": "Insurance market action",
    "risk": -8,
    "terms": [
      "war risk premium increased",
      "insurer withdrew cover",
      "insurance exclusion"
    ],
    "requiresCorroboration": false,
    "why": "Insurance pricing and coverage are direct economic consequences of perceived risk."
  },
  {
    "id": "cl-046",
    "label": "Refinery restart claim",
    "risk": 8,
    "terms": [
      "expected to restart",
      "restart planned",
      "may resume operations"
    ],
    "requiresCorroboration": true,
    "why": "Restart timelines frequently slip; actual unit operation or flows should confirm."
  },
  {
    "id": "cl-047",
    "label": "Refinery restart confirmed",
    "risk": -8,
    "terms": [
      "refinery restarted",
      "unit returned to service",
      "operations resumed"
    ],
    "requiresCorroboration": false,
    "why": "Operator-confirmed restart materially reduces outage uncertainty."
  },
  {
    "id": "cl-048",
    "label": "LNG force majeure",
    "risk": -8,
    "terms": [
      "declared force majeure",
      "force majeure declared"
    ],
    "requiresCorroboration": false,
    "why": "A declared contractual event is stronger evidence than market speculation about cargo loss."
  },
  {
    "id": "cl-049",
    "label": "Military exercise misread as invasion",
    "risk": 20,
    "terms": [
      "exercise could be cover for invasion",
      "drills may precede invasion"
    ],
    "requiresCorroboration": true,
    "why": "Exercise-to-war inference requires additional costly indicators such as logistics, mobilisation or exclusion zones."
  },
  {
    "id": "cl-050",
    "label": "Routine exercise officially scheduled",
    "risk": -6,
    "terms": [
      "annual exercise",
      "pre-planned exercise",
      "scheduled drill"
    ],
    "requiresCorroboration": false,
    "why": "Pre-announced routine activity should receive less escalation weight unless scale/location changes."
  },
  {
    "id": "cl-051",
    "label": "Embassy evacuation official",
    "risk": -10,
    "terms": [
      "ordered departure",
      "embassy evacuation ordered",
      "citizens urged to leave immediately"
    ],
    "requiresCorroboration": false,
    "why": "Government evacuation is a costly revealed-preference security signal."
  },
  {
    "id": "cl-052",
    "label": "Travel-blog safety anecdote",
    "risk": 20,
    "terms": [
      "tourist says safe",
      "traveler reports everything normal",
      "influencer says safe"
    ],
    "requiresCorroboration": true,
    "why": "Anecdotal travel content is not a substitute for operational security evidence."
  },
  {
    "id": "cl-053",
    "label": "Airline cancellation confirmation",
    "risk": -8,
    "terms": [
      "airline cancelled flights",
      "carrier suspended service",
      "flights suspended until"
    ],
    "requiresCorroboration": false,
    "why": "Airline schedule action is direct evidence of operational risk."
  },
  {
    "id": "cl-054",
    "label": "Airspace reopening confirmation",
    "risk": -8,
    "terms": [
      "airspace reopened",
      "NOTAM cancelled",
      "flight restrictions lifted"
    ],
    "requiresCorroboration": false,
    "why": "Official reopening can reduce aviation risk if carriers also resume service."
  },
  {
    "id": "cl-055",
    "label": "Cyber attribution without impact",
    "risk": 14,
    "terms": [
      "hackers linked to",
      "cyber group blamed",
      "attributed to state"
    ],
    "requiresCorroboration": true,
    "why": "Customer impact should be based on confirmed outage/data compromise before attribution drama."
  },
  {
    "id": "cl-056",
    "label": "Cyber operational impact confirmed",
    "risk": -10,
    "terms": [
      "operations disrupted by cyberattack",
      "systems offline due cyber incident",
      "production stopped after ransomware"
    ],
    "requiresCorroboration": false,
    "why": "Confirmed operational impact is the relevant decision signal."
  },
  {
    "id": "cl-057",
    "label": "Deepfake/disinformation warning",
    "risk": 22,
    "terms": [
      "deepfake",
      "fabricated audio",
      "fake video",
      "disinformation campaign"
    ],
    "requiresCorroboration": true,
    "why": "Synthetic or manipulated media requires source/provenance verification before use."
  },
  {
    "id": "cl-058",
    "label": "Photo/video geolocation verified",
    "risk": -8,
    "terms": [
      "geolocated footage",
      "verified video",
      "verified imagery"
    ],
    "requiresCorroboration": false,
    "why": "Independent verification reduces but does not eliminate uncertainty about context and timing."
  },
  {
    "id": "cl-059",
    "label": "Commodity flow data",
    "risk": -10,
    "terms": [
      "pipeline flows fell",
      "loadings dropped",
      "exports declined according to data"
    ],
    "requiresCorroboration": false,
    "why": "Measured flow data is stronger evidence of physical market impact than commentary."
  },
  {
    "id": "cl-060",
    "label": "Unverified commodity shortage",
    "risk": 15,
    "terms": [
      "shortage feared",
      "could run out",
      "supplies may collapse"
    ],
    "requiresCorroboration": true,
    "why": "Shortage rhetoric should be tested against inventory, flow and substitution data."
  }
]);
