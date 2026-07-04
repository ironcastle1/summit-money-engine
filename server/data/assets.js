const assets = [
  { id:'BTC', label:'Bitcoin', type:'crypto', source:'binance', symbol:'BTCUSDT' },
  { id:'ETH', label:'Ethereum', type:'crypto', source:'binance', symbol:'ETHUSDT' },
  { id:'SOL', label:'Solana', type:'crypto', source:'binance', symbol:'SOLUSDT' },
  { id:'XRP', label:'XRP', type:'crypto', source:'binance', symbol:'XRPUSDT' },
  { id:'GLD', label:'Gold ETF', type:'etf', source:'yahoo', symbol:'GLD' },
  { id:'SLV', label:'Silver ETF', type:'etf', source:'yahoo', symbol:'SLV' },
  { id:'COPPER', label:'Copper', type:'commodity', source:'yahoo', symbol:'HG=F' },
  { id:'BRENT', label:'Brent Crude', type:'commodity', source:'yahoo', symbol:'BZ=F' },
  { id:'WTI', label:'WTI Crude', type:'commodity', source:'yahoo', symbol:'CL=F' },
  { id:'URA', label:'Uranium ETF', type:'etf', source:'yahoo', symbol:'URA' },
  { id:'VRT', label:'Vertiv', type:'stock', source:'yahoo', symbol:'VRT' },
  { id:'PWR', label:'Quanta Services', type:'stock', source:'yahoo', symbol:'PWR' },
  { id:'LMT', label:'Lockheed Martin', type:'stock', source:'yahoo', symbol:'LMT' },
  { id:'NOC', label:'Northrop', type:'stock', source:'yahoo', symbol:'NOC' },
  { id:'ZIM', label:'ZIM Shipping', type:'stock', source:'yahoo', symbol:'ZIM' },
  { id:'MATX', label:'Matson', type:'stock', source:'yahoo', symbol:'MATX' }
];
module.exports = { assets };
