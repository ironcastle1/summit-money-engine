import {runGdelt} from './gdelt.js';import {runRss} from './rss.js';import {runJson} from './json.js';import {runMarket} from './market.js';
export async function runner(s){if(s.kind==='gdelt')return runGdelt(s);if(s.kind==='rss')return runRss(s);if(s.kind==='json')return runJson(s);if(s.kind==='market')return runMarket(s);throw new Error(`unsupported source ${s.kind}`);}
