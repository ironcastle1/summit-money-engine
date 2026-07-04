const assets = [
  { id:'BTC', name:'Bitcoin', label:'Bitcoin', type:'crypto', group:'crypto', source:'binance', symbol:'BTCUSDT' },
  { id:'ETH', name:'Ethereum', label:'Ethereum', type:'crypto', group:'crypto', source:'binance', symbol:'ETHUSDT' },
  { id:'SOL', name:'Solana', label:'Solana', type:'crypto', group:'crypto', source:'binance', symbol:'SOLUSDT' },
  { id:'XRP', name:'XRP', label:'XRP', type:'crypto', group:'crypto', source:'binance', symbol:'XRPUSDT' },
  { id:'GLD', name:'Gold ETF', label:'Gold ETF', type:'etf', group:'commodity', source:'yahoo', symbol:'GLD' },
  { id:'SLV', name:'Silver ETF', label:'Silver ETF', type:'etf', group:'commodity', source:'yahoo', symbol:'SLV' },
  { id:'COPPER', name:'Copper futures', label:'Copper', type:'commodity', group:'commodity', source:'yahoo', symbol:'HG=F' },
  { id:'BRENT', name:'Brent crude futures', label:'Brent Crude', type:'commodity', group:'commodity', source:'yahoo', symbol:'BZ=F' },
  { id:'WTI', name:'WTI crude futures', label:'WTI Crude', type:'commodity', group:'commodity', source:'yahoo', symbol:'CL=F' },
  { id:'URA', name:'Uranium ETF', label:'Uranium ETF', type:'etf', group:'commodity', source:'yahoo', symbol:'URA' },
  { id:'VRT', name:'Vertiv', label:'Vertiv', type:'stock', group:'ai', source:'yahoo', symbol:'VRT' },
  { id:'PWR', name:'Quanta Services', label:'Quanta Services', type:'stock', group:'ai', source:'yahoo', symbol:'PWR' },
  { id:'ETN', name:'Eaton', label:'Eaton', type:'stock', group:'ai', source:'yahoo', symbol:'ETN' },
  { id:'LMT', name:'Lockheed Martin', label:'Lockheed Martin', type:'stock', group:'defence', source:'yahoo', symbol:'LMT' },
  { id:'NOC', name:'Northrop Grumman', label:'Northrop', type:'stock', group:'defence', source:'yahoo', symbol:'NOC' },
  { id:'ZIM', name:'ZIM Shipping', label:'ZIM Shipping', type:'stock', group:'shipping', source:'yahoo', symbol:'ZIM' },
  { id:'MATX', name:'Matson', label:'Matson', type:'stock', group:'shipping', source:'yahoo', symbol:'MATX' }
];
module.exports = { assets };
