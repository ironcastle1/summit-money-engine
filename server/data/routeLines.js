const routeLines = [
  { id:'asia-europe-north', label:'Asia → Europe container route', type:'shipping', color:'#00d9ff', coords:[[31.23,121.47],[1.29,103.85],[26.56,56.25],[30.58,32.30],[51.95,4.14]] },
  { id:'cape-reroute', label:'Asia → Europe Cape reroute', type:'shipping', color:'#00a8ff', coords:[[1.29,103.85],[-33.92,18.42],[36.14,-5.35],[51.95,4.14]] },
  { id:'us-asia-import', label:'Asia → US West Coast import route', type:'shipping', color:'#39cfff', coords:[[31.23,121.47],[35.68,139.76],[33.74,-118.26]] },
  { id:'panama-atlantic', label:'US Gulf/East Coast → Pacific canal route', type:'shipping', color:'#0bbbd6', coords:[[29.76,-95.37],[9.08,-79.68],[33.74,-118.26]] },
  { id:'belt-road-central', label:'China → Central Asia → Europe land corridor', type:'land', color:'#f4d35e', coords:[[31.23,121.47],[43.25,76.95],[41.31,69.24],[50.45,30.52],[52.23,21.01],[53.54,9.99]] },
  { id:'eu-land-freight', label:'Rotterdam → Germany → Poland industrial land freight', type:'land', color:'#f6c85f', coords:[[51.95,4.14],[51.22,6.77],[52.52,13.40],[52.23,21.01]] },
  { id:'middle-east-energy', label:'Gulf energy route into Europe', type:'shipping', color:'#00d9ff', coords:[[26.56,56.25],[30.58,32.30],[36.14,-5.35],[51.95,4.14]] },
  { id:'copper-grid-land', label:'Copper → grid equipment industrial path', type:'land', color:'#f4d35e', coords:[[-33.45,-70.66],[-12.05,-77.04],[29.76,-95.37],[39.04,-77.49]] }
];
module.exports = { routeLines };
