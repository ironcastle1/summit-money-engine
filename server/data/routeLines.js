const routeLines = [
  { id:'sea-asia-eu', type:'shipping', label:'Asia → Suez → Europe containers', color:'#00d9ff', coords:[[31.2,121.5],[22.3,114.1],[1.29,103.8],[6.0,95.0],[12.7,43.2],[30.6,32.3],[35.9,14.5],[51.9,4.3]] },
  { id:'sea-us-eu', type:'shipping', label:'US East Coast → Europe', color:'#00b7ff', coords:[[40.7,-74.0],[42.3,-66.0],[50.0,-20.0],[51.9,4.3]] },
  { id:'sea-lng-qatar-eu', type:'shipping', label:'Qatar LNG → Europe', color:'#37e7ff', coords:[[25.3,51.5],[26.6,56.3],[12.7,43.2],[30.6,32.3],[37.9,23.7],[45.5,12.2]] },
  { id:'sea-brazil-china', type:'shipping', label:'Brazil bulk commodities → China', color:'#2bcfff', coords:[[-23.9,-46.3],[-34.6,18.4],[-20.0,60.0],[1.29,103.8],[31.2,121.5]] },
  { id:'land-eu-corridor', type:'land', label:'Rotterdam → Rhine/Ruhr → Central Europe', color:'#ffd447', coords:[[51.9,4.3],[51.4,6.8],[50.1,8.6],[48.2,16.3],[47.5,19.0]] },
  { id:'land-china-eu', type:'land', label:'China → Kazakhstan → Europe rail', color:'#f4d35e', coords:[[31.2,121.5],[43.2,76.8],[51.1,71.4],[52.2,21.0],[52.5,13.4]] },
  { id:'land-us-ai', type:'land', label:'US data-centre power belt', color:'#d8f465', coords:[[39.0,-77.5],[37.5,-79.0],[35.8,-78.6],[33.7,-84.4],[32.8,-96.8]] },
  { id:'land-india-me', type:'land', label:'India → Gulf logistics link', color:'#ffe66d', coords:[[19.0,72.8],[24.4,54.4],[25.3,51.5],[26.2,50.6]] }
];
module.exports = { routeLines };
