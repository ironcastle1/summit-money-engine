import * as cheerio from 'cheerio';
import { respectfulFetch } from './http.js';
import { robotsAllowed } from './robots.js';

function priceFromText(text){
  const s=String(text||'');
  const patterns=[
    {re:/£\s?([0-9]+(?:[,.][0-9]{1,2})?)/,currency:'GBP'},
    {re:/€\s?([0-9]+(?:[,.][0-9]{1,2})?)/,currency:'EUR'},
    {re:/\$\s?([0-9]+(?:[,.][0-9]{1,2})?)/,currency:'USD'},
    {re:/\bAED\s?([0-9]+(?:[,.][0-9]{1,2})?)/i,currency:'AED'},
    {re:/\bSAR\s?([0-9]+(?:[,.][0-9]{1,2})?)/i,currency:'SAR'},
    {re:/\bQAR\s?([0-9]+(?:[,.][0-9]{1,2})?)/i,currency:'QAR'},
    {re:/¥\s?([0-9]+(?:[,.][0-9]{1,2})?)/,currency:'JPY'},
    {re:/₹\s?([0-9]+(?:[,.][0-9]{1,2})?)/,currency:'INR'}
  ];
  for(const p of patterns){const m=s.match(p.re);if(m){const n=Number(m[1].replace(/,/g,''));if(Number.isFinite(n))return {price:n,currency:p.currency};}}
  return {price:null,currency:null};
}
function findOffer(node){if(!node||typeof node!=='object')return null;if(node.offers)return node.offers;if(Array.isArray(node['@graph'])){for(const x of node['@graph']){const o=findOffer(x);if(o)return o;}}return null;}
export async function enrichPublicPage(item){
  try{
    if(!(await robotsAllowed(item.url)))return {...item,page_enriched:false,enrichment_error:'robots.txt disallows automated retrieval of this page'};
    const {text,url}=await respectfulFetch(item.url,{minHostGapMs:1800,timeoutMs:15000});const $=cheerio.load(text);
    const title=$('meta[property="og:title"]').attr('content')||$('title').text().trim()||item.title;
    const desc=$('meta[property="og:description"]').attr('content')||$('meta[name="description"]').attr('content')||item.snippet;
    let jsonPrice=null,jsonCurrency=null;
    $('script[type="application/ld+json"]').each((_,el)=>{if(jsonPrice!=null)return;try{const data=JSON.parse($(el).text()),nodes=Array.isArray(data)?data:[data];for(const n of nodes){const offer=findOffer(n),offers=Array.isArray(offer)?offer[0]:offer,p=offers?.price??offers?.lowPrice;if(p!=null&&Number.isFinite(Number(p))){jsonPrice=Number(p);jsonCurrency=offers?.priceCurrency||n?.priceCurrency||null;break;}}}catch{}});
    const textPrice=priceFromText(`${title} ${desc}`);
    return {...item,url,title,snippet:String(desc||'').replace(/\s+/g,' ').trim().slice(0,700),observed_price:jsonPrice??textPrice.price,currency:jsonCurrency||textPrice.currency||null,page_enriched:true};
  }catch(error){return {...item,page_enriched:false,enrichment_error:error.message};}
}
