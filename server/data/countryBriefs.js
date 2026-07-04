const briefs = {
  US: { code:'US', money:'Dollar, rates, mega-cap tech, defence and energy drive cross-asset flow.', watch:['SPY','QQQ','TLT','DXY','WTI','VRT','PWR'], avoid:'Do not treat headlines as entry. Demand asset confirmation.' },
  GB: { code:'GB', money:'Insurance, commodities, rates, sterling and global capital flows.', watch:['GBP','FTSE','GOLD','BRENT'], avoid:'Watch liquidity and sterling before UK-only equity plays.' },
  NL: { code:'NL', money:'European port, energy and chemical gateway.', watch:['BRENT','IYT','European importers'], avoid:'Confirm freight/port data before playing shipping headlines.' },
  SG: { code:'SG', money:'Asian logistics, finance, refining and FX node.', watch:['IYT','BRENT','USD/SGD'], avoid:'Respect regional market hours.' },
  CN: { code:'CN', money:'Manufacturing, exports, property, stimulus, copper and freight.', watch:['COPPER','FXI','IYT'], avoid:'Do not chase China headlines without commodity confirmation.' }
};
function getCountryBrief(code){ return briefs[code] || { code, money:'No country brief loaded yet.', watch:[], avoid:'Use asset confirmation before acting.' }; }
module.exports = { getCountryBrief };
