import * as cheerio from 'cheerio';
import { respectfulFetch } from '../../market/connectors/http.js';

const EMAIL=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig;
const BAD_EMAIL=/\.(png|jpg|jpeg|gif|webp|svg)$/i;
const GENERIC=/^(info|hello|sales|contact|enquiries|enquiry|office|admin|reception|bookings|reservations|team|support|shop)@/i;

function unique(a){return [...new Set(a.filter(Boolean))];}
function cleanEmail(v){return String(v||'').trim().replace(/^mailto:/i,'').split('?')[0].toLowerCase();}
export function classifyEmail(email){if(!email)return {email_type:null};return {email_type:GENERIC.test(email)?'generic':'named'};}

export async function enrichProspectWebsite(website){
  if(!website)return {emails:[],phones:[],title:null};
  const {text,url}=await respectfulFetch(website,{timeoutMs:18000,minHostGapMs:1500});const $=cheerio.load(text);
  const emails=unique([
    ...String(text).match(EMAIL)||[],
    ...$('a[href^="mailto:"]').map((_,a)=>cleanEmail($(a).attr('href'))).get()
  ].map(cleanEmail).filter(e=>!BAD_EMAIL.test(e))).slice(0,15);
  const phones=unique($('a[href^="tel:"]').map((_,a)=>String($(a).attr('href')).replace(/^tel:/i,'').trim()).get()).slice(0,8);
  const title=$('meta[property="og:title"]').attr('content')||$('title').text().trim()||null;
  return {url,emails,phones,title,description:$('meta[name="description"]').attr('content')||null};
}
