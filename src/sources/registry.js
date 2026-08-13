import { liveSourceCatalog } from '../catalog/live-sources.js';
import { runRss } from './rss.js';
import { runGdelt } from './gdelt.js';
import { runUsgs } from './usgs.js';
import { runReliefWeb } from './reliefweb.js';
import { runPolymarket } from './polymarket.js';
import { runCrypto, runFx, runStooq } from './markets.js';
import { runOfficialPage } from './official-page.js';

export function sourceCatalog(){return liveSourceCatalog();}
export function runnerFor(source){
  const map={rss:runRss,gdelt:runGdelt,usgs:runUsgs,reliefweb:runReliefWeb,polymarket:runPolymarket,crypto:runCrypto,fx:runFx,stooq:runStooq,'official-page':runOfficialPage};
  const fn=map[source.kind]; if(!fn)throw new Error(`unsupported_source_kind:${source.kind}`); return ()=>fn(source);
}
