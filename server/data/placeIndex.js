const places = [
  { key:'ukraine', label:'Ukraine', lat:49.0, lng:31.0, risk:'war' },
  { key:'russia', label:'Russia', lat:55.7, lng:37.6, risk:'war' },
  { key:'israel', label:'Israel', lat:31.8, lng:35.2, risk:'war' },
  { key:'iran', label:'Iran', lat:32.4, lng:53.7, risk:'war' },
  { key:'gaza', label:'Gaza', lat:31.5, lng:34.45, risk:'war' },
  { key:'red sea', label:'Red Sea', lat:18.5, lng:39.0, risk:'shipping' },
  { key:'suez', label:'Suez Canal', lat:30.6, lng:32.3, risk:'shipping' },
  { key:'taiwan', label:'Taiwan', lat:23.7, lng:121.0, risk:'semis' },
  { key:'china', label:'China', lat:35.8, lng:104.2, risk:'trade' },
  { key:'south china sea', label:'South China Sea', lat:12.0, lng:115.0, risk:'shipping' },
  { key:'panama canal', label:'Panama Canal', lat:9.1, lng:-79.7, risk:'shipping' },
  { key:'strait of hormuz', label:'Strait of Hormuz', lat:26.6, lng:56.3, risk:'energy' },
  { key:'rotterdam', label:'Rotterdam', lat:51.95, lng:4.14, risk:'port' },
  { key:'singapore', label:'Singapore', lat:1.35, lng:103.82, risk:'port' },
  { key:'shanghai', label:'Shanghai', lat:31.23, lng:121.47, risk:'port' },
  { key:'los angeles', label:'Los Angeles', lat:34.05, lng:-118.24, risk:'port' },
  { key:'long beach', label:'Long Beach', lat:33.77, lng:-118.19, risk:'port' },
  { key:'hurricane', label:'Atlantic Hurricane Risk', lat:25.0, lng:-75.0, risk:'disaster' },
  { key:'earthquake', label:'Earthquake Event', lat:35.6, lng:139.6, risk:'disaster' },
  { key:'wildfire', label:'Wildfire Risk', lat:37.2, lng:-119.5, risk:'disaster' },
  { key:'election', label:'Election Risk', lat:38.9, lng:-77.0, risk:'politics' },
  { key:'nvidia', label:'AI/Semiconductor Demand', lat:37.37, lng:-121.92, risk:'tech' },
  { key:'data centre', label:'Data Centre Power Demand', lat:39.0, lng:-77.5, risk:'grid' },
  { key:'data center', label:'Data Center Power Demand', lat:39.0, lng:-77.5, risk:'grid' },
  { key:'copper', label:'Copper Supply Chain', lat:-20.0, lng:-69.0, risk:'commodity' },
  { key:'uranium', label:'Uranium/Nuclear Supply Chain', lat:48.0, lng:67.0, risk:'commodity' },
  { key:'oil', label:'Oil Market Event', lat:26.6, lng:56.3, risk:'energy' },
  { key:'strike', label:'Labour/Port Strike', lat:51.95, lng:4.14, risk:'logistics' },
  { key:'tariff', label:'Tariff/Trade Policy', lat:38.9, lng:-77.0, risk:'trade' },
  { key:'sanction', label:'Sanctions Risk', lat:50.0, lng:14.4, risk:'trade' }
];
function matchPlace(text=''){
  const lower = String(text).toLowerCase();
  return places.find(p => lower.includes(p.key)) || null;
}
module.exports = { places, matchPlace };
