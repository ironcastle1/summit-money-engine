import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.resolve(here,'../../public/data');
const read=name=>JSON.parse(fs.readFileSync(path.join(dataDir,`${name}.json`),'utf8'));
const countriesDoc=read('countries'),citiesDoc=read('cities'),portsDoc=read('ports'),routesDoc=read('routes'),chokeDoc=read('chokepoints'),marketDoc=read('market-assets'),shippingDoc=read('shipping-commodities');
export const reference=Object.freeze({
  countries:countriesDoc.countries||countriesDoc,
  cities:citiesDoc.cities||citiesDoc,
  places:read('places'),
  ports:portsDoc.ports||portsDoc,
  routes:routesDoc.features||routesDoc,
  chokepoints:chokeDoc.chokepoints||chokeDoc,
  shippingCommodities:shippingDoc.commodities||shippingDoc,
  marketAssets:marketDoc.assets||marketDoc
});
