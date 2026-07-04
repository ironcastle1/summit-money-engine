const mapNodes = [
  { id:'rotterdam', kind:'port', name:'Rotterdam', lat:51.95,lng:4.14, watch:['BRENT','WTI','ZIM'], note:'Europe container and energy gateway.' },
  { id:'antwerp', kind:'port', name:'Antwerp-Bruges', lat:51.26,lng:4.40, watch:['ZIM','MATX'], note:'Chemicals, containers, inland Europe access.' },
  { id:'gibraltar', kind:'shipping', name:'Gibraltar', lat:36.14,lng:-5.35, watch:['BRENT','WTI'], note:'Mediterranean choke and bunkering.' },
  { id:'suez', kind:'shipping', name:'Suez Canal', lat:30.05,lng:32.56, watch:['BRENT','ZIM','MATX','GLD'], note:'Asia-Europe routing risk.' },
  { id:'bab', kind:'shipping', name:'Bab el-Mandeb', lat:12.61,lng:43.33, watch:['BRENT','ZIM','GLD'], note:'Red Sea risk point.' },
  { id:'hormuz', kind:'energy', name:'Strait of Hormuz', lat:26.57,lng:56.25, watch:['BRENT','WTI','GLD'], note:'Oil and LNG choke.' },
  { id:'singapore', kind:'port', name:'Singapore', lat:1.29,lng:103.85, watch:['ZIM','BRENT'], note:'Asia transshipment and bunkering.' },
  { id:'shanghai', kind:'port', name:'Shanghai', lat:31.23,lng:121.47, watch:['COPPER','ZIM'], note:'Export signal and shipping volume.' },
  { id:'shenzhen', kind:'tech', name:'Shenzhen', lat:22.54,lng:114.06, watch:['COPPER','VRT'], note:'Electronics manufacturing.' },
  { id:'taiwan', kind:'tech', name:'Taiwan semiconductor belt', lat:24.80,lng:120.97, watch:['VRT','PWR','GLD'], note:'Semiconductor supply-chain risk.' },
  { id:'tokyo', kind:'finance', name:'Tokyo', lat:35.68,lng:139.76, watch:['BTC','ETH'], note:'Asia risk and FX session.' },
  { id:'dubai', kind:'finance', name:'Dubai', lat:25.20,lng:55.27, watch:['GLD','BTC'], note:'Gold, crypto, regional capital.' },
  { id:'london', kind:'finance', name:'London', lat:51.51,lng:-0.13, watch:['GLD','BRENT'], note:'FX, gold, insurance, energy finance.' },
  { id:'nyc', kind:'finance', name:'New York', lat:40.71,lng:-74.01, watch:['BTC','GLD','VRT'], note:'US risk session.' },
  { id:'la', kind:'port', name:'LA / Long Beach', lat:33.75,lng:-118.20, watch:['ZIM','MATX'], note:'US import gateway.' },
  { id:'panama', kind:'shipping', name:'Panama Canal', lat:9.08,lng:-79.68, watch:['ZIM','MATX'], note:'Americas canal throughput risk.' },
  { id:'houston', kind:'energy', name:'Houston', lat:29.76,lng:-95.37, watch:['WTI','BRENT'], note:'US oil and gas hub.' },
  { id:'chile', kind:'commodity', name:'Chile copper belt', lat:-22.90,lng:-68.20, watch:['COPPER'], note:'Copper supply shock zone.' },
  { id:'drc', kind:'commodity', name:'DRC copper/cobalt', lat:-11.66,lng:27.48, watch:['COPPER','VRT'], note:'Battery/grid metal supply.' },
  { id:'niger', kind:'commodity', name:'Niger uranium', lat:17.61,lng:8.08, watch:['URA'], note:'Uranium supply risk.' },
  { id:'ukraine', kind:'war', name:'Ukraine front risk', lat:48.75,lng:37.60, watch:['LMT','NOC','GLD'], note:'Defence and energy risk.' },
  { id:'israel', kind:'war', name:'Israel / Levant risk', lat:31.78,lng:35.21, watch:['BRENT','GLD','LMT'], note:'Middle East escalation risk.' },
  { id:'korea', kind:'war', name:'Korean peninsula', lat:37.56,lng:126.98, watch:['GLD','VRT'], note:'Asia risk-off trigger.' },
  { id:'california-fire', kind:'disaster', name:'California wildfire belt', lat:36.77,lng:-119.42, watch:['PWR'], note:'Grid hardening and insurance risk.' },
  { id:'florida-storm', kind:'disaster', name:'Florida hurricane belt', lat:27.99,lng:-81.76, watch:['PWR'], note:'Storm rebuild and insurance claims.' },
  { id:'japan-quake', kind:'disaster', name:'Japan quake risk', lat:36.20,lng:138.25, watch:['GLD'], note:'Earthquake supply-chain risk.' }
];
const routes = [
  { id:'asia-europe-sea', type:'sea', name:'Asia to Europe container route', color:'#00d6ff', flow:'east-west', goods:'containers, electronics, machinery, apparel', watch:['ZIM','MATX','BRENT'], points:[[31.23,121.47],[1.29,103.85],[12.61,43.33],[30.05,32.56],[36.14,-5.35],[51.95,4.14]] },
  { id:'gulf-oil', type:'sea', name:'Gulf oil to Europe/Asia', color:'#23ffab', flow:'gulf-out', goods:'crude oil, LNG, refined products', watch:['BRENT','WTI','GLD'], points:[[26.57,56.25],[12.61,43.33],[30.05,32.56],[36.14,-5.35],[51.51,-0.13]] },
  { id:'pacific-imports', type:'sea', name:'China to US West Coast', color:'#b878ff', flow:'west-east', goods:'consumer goods, electronics, furniture, parts', watch:['ZIM','MATX','COPPER'], points:[[31.23,121.47],[35.68,139.76],[33.75,-118.20],[40.71,-74.01]] },
  { id:'copper-supply', type:'land', name:'Copper/mining to manufacturing chain', color:'#ffd54d', flow:'mine-factory', goods:'copper, cobalt, grid metals', watch:['COPPER','VRT','PWR'], points:[[-22.90,-68.20],[-11.66,27.48],[22.54,114.06],[24.80,120.97]] },
  { id:'eurasia-land', type:'land', name:'Eurasia rail and road corridor', color:'#ff5c93', flow:'east-west', goods:'machinery, autos, industrial parts', watch:['COPPER','GLD'], points:[[31.23,121.47],[43.23,76.89],[41.30,69.24],[40.18,44.51],[41.01,28.97],[51.51,-0.13]] }
];
const countries = [
  { name:'United Kingdom', lat:54.0,lng:-2.0, summary:'Services, energy trading, insurance, defence procurement, election and rates sensitivity.', watches:['GBP rates','BRENT','GLD','defence'] },
  { name:'United States', lat:39.8,lng:-98.6, summary:'Dollar liquidity, Fed path, defence capex, AI power grid, ports, hurricanes.', watches:['BTC','GLD','VRT','PWR','LMT'] },
  { name:'China', lat:35.0,lng:103.8, summary:'Export cycle, property stress, copper demand, shipping volume, Taiwan risk.', watches:['COPPER','ZIM','GLD'] },
  { name:'Germany', lat:51.2,lng:10.4, summary:'Manufacturing cycle, gas/power prices, autos, defence rearmament.', watches:['BRENT','COPPER','defence'] },
  { name:'Turkey', lat:39.0,lng:35.0, summary:'Bosphorus, inflation, regional logistics, Black Sea exposure.', watches:['GLD','BRENT'] },
  { name:'Israel', lat:31.5,lng:34.8, summary:'Regional escalation, defence, cyber, oil-risk premium.', watches:['LMT','GLD','BRENT'] },
  { name:'India', lat:22.6,lng:78.9, summary:'Election cycle, energy imports, tech services, monsoon/agriculture risk.', watches:['BRENT','GLD','IT services'] },
  { name:'Japan', lat:36.2,lng:138.2, summary:'Yen carry trade, quake risk, semiconductors, energy import sensitivity.', watches:['JPY','GLD','VRT'] },
  { name:'Brazil', lat:-14.2,lng:-51.9, summary:'Agriculture, iron ore, elections, currency swings, drought/flood risk.', watches:['commodities','BRL'] },
  { name:'South Africa', lat:-30.6,lng:22.9, summary:'Gold, platinum, coal logistics, power cuts, political coalition risk.', watches:['GLD','energy'] }
];
module.exports = { mapNodes, routes, countries };
