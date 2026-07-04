const ruleBook = [
  {
    id: 'red-sea-shipping',
    name: 'Red Sea / Suez route pressure',
    themes: ['shipping','oil','war','freight'],
    assets: ['BRENT','WTI','GOLD','IYT','ITA','LMT'],
    trigger: 'News or prediction markets show route-risk / escalation and Brent or freight-sensitive names confirm.',
    action: 'Watch shipping, oil and defence proxies after confirmation. Avoid blind headline chasing.',
    verify: ['Brent/WTI green on the session','shipping/freight headline from credible source','defence ETF or relevant equity confirms'],
    risk: 'high'
  },
  {
    id: 'ai-power-grid',
    name: 'AI power and grid bottleneck',
    themes: ['ai-power','grid','copper','data-centres','tech'],
    assets: ['VRT','PWR','ETN','COPPER','URA'],
    trigger: 'AI data-centre capex + power constraint headlines and grid/copper proxy strength.',
    action: 'Watch grid equipment, cooling, copper and uranium proxies.',
    verify: ['VRT/PWR/ETN trend positive','Copper not breaking down','headline points to power/cooling/capacity not vague AI hype'],
    risk: 'medium'
  },
  {
    id: 'defence-capex',
    name: 'Defence procurement cycle',
    themes: ['defence','war','security','government-capex'],
    assets: ['LMT','RTX','ITA','GOLD'],
    trigger: 'Security risk + procurement or budget language, not just fear headlines.',
    action: 'Watch defence primes/ETF and safe-haven confirmation.',
    verify: ['LMT/RTX/ITA green vs market','procurement language present','broad market not selling indiscriminately'],
    risk: 'medium'
  },
  {
    id: 'copper-electrification',
    name: 'Copper electrification squeeze',
    themes: ['copper','grid','construction','ai-power'],
    assets: ['COPPER','PWR','ETN','VRT'],
    trigger: 'Copper strength coincides with grid/data-centre/infrastructure pressure.',
    action: 'Watch copper and grid equipment names, avoid if dollar/rates crush metals.',
    verify: ['Copper trend positive','dollar not aggressively bid','grid/AI capex news active'],
    risk: 'medium'
  },
  {
    id: 'oil-energy-risk',
    name: 'Oil risk premium',
    themes: ['oil','energy','iran','war','shipping'],
    assets: ['BRENT','WTI','XLE','GOLD'],
    trigger: 'Geopolitical event risk plus oil futures reaction.',
    action: 'Watch energy ETF and oil futures confirmation.',
    verify: ['Brent or WTI green','XLE not weak','event is supply-route relevant'],
    risk: 'high'
  },
  {
    id: 'prediction-market-misalignment',
    name: 'Prediction market volatility watch',
    themes: ['election','fed','rate','crypto','war','weather'],
    assets: ['BTC','GOLD','TLT','QQQ'],
    trigger: 'High-volume Polymarket odds move before liquid markets price it.',
    action: 'Use prediction markets as an early warning, then confirm in liquid assets.',
    verify: ['Polymarket volume/liquidity high','odds moved materially','related asset confirms'],
    risk: 'high'
  }
];
module.exports = { ruleBook };
