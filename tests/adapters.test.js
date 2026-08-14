import test from 'node:test';
import assert from 'node:assert/strict';
import {runGdelt} from '../src/adapters/gdelt.js';
import {runRss} from '../src/adapters/rss.js';
import {runJson} from '../src/adapters/json.js';
import {runMarket} from '../src/adapters/market.js';
import {runPool} from '../src/core/http.js';

async function withFetch(body,fn,{contentType='application/json'}={}){
  const old=globalThis.fetch;
  globalThis.fetch=async()=>new Response(body,{status:200,headers:{'content-type':contentType}});
  try{return await fn();}finally{globalThis.fetch=old;}
}

test('GDELT adapter turns ArticleList JSON into public records',async()=>{
  const data={articles:[{title:'Port closure disrupts shipping',url:'https://example.net/a',seendate:'20260813T120000Z',domain:'example.net',language:'English'}]};
  const out=await withFetch(JSON.stringify(data),()=>runGdelt({id:'g',name:'GDELT test',query:'shipping disruption',region:'world'}));
  assert.equal(out.records.length,1);
  assert.equal(out.records[0].sourceDomain,'example.net');
  assert.match(out.records[0].title,/Port closure/);
});

test('RSS adapter parses feed items and preserves publisher identity',async()=>{
  const xml=`<?xml version="1.0"?><rss><channel><item><title>Central bank update</title><link>https://publisher.example/x</link><description>Policy changed.</description><pubDate>Thu, 13 Aug 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
  const out=await withFetch(xml,()=>runRss({id:'r',name:'Official feed',url:'https://publisher.example/rss',region:'europe'}),{contentType:'application/rss+xml'});
  assert.equal(out.records.length,1);
  assert.equal(out.records[0].sourceName,'Official feed');
  assert.equal(out.records[0].sourceDomain,'publisher.example');
});

test('Coinbase market adapter computes 24h change',async()=>{
  const out=await withFetch(JSON.stringify({last:'105',open:'100',high:'108',low:'98',volume:'20'}),()=>runMarket({adapter:'coinbase',url:'https://api.exchange.coinbase.com/products/BTC-USD/stats',symbol:'BTC/USD',type:'crypto'}));
  assert.equal(out.markets[0].price,105);
  assert.equal(out.markets[0].change24h,5);
});

test('Stooq market adapter parses CSV quote',async()=>{
  const csv='Symbol,Date,Time,Open,High,Low,Close,Volume\nSPY.US,2026-08-13,12:00:00,100,103,99,102,1234\n';
  const out=await withFetch(csv,()=>runMarket({adapter:'stooq',url:'https://stooq.com/x',symbol:'SPY',type:'equity'}),{contentType:'text/csv'});
  assert.equal(out.markets[0].price,102);
  assert.equal(out.markets[0].change24h,2);
});

test('CISA adapter exposes KEV items as cyber records',async()=>{
  const data={vulnerabilities:[{cveID:'CVE-2026-0001',vulnerabilityName:'Example flaw',vendorProject:'Vendor',product:'Product',shortDescription:'Actively exploited.',requiredAction:'Patch',dateAdded:'2026-08-13'}]};
  const out=await withFetch(JSON.stringify(data),()=>runJson({id:'c',adapter:'cisa',url:'https://cisa.gov/test'}));
  assert.equal(out.records.length,1);
  assert.equal(out.records[0].presetCategory,'cyber');
  assert.match(out.records[0].title,/CVE-2026-0001/);
});

test('source pool isolates a failing upstream instead of failing the refresh',async()=>{
  const rows=await runPool([async()=>1,async()=>{throw new Error('publisher down');},async()=>3],2);
  assert.deepEqual(rows.map(x=>x.ok),[true,false,true]);
  assert.equal(rows[1].error.message,'publisher down');
});
