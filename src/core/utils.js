import crypto from 'node:crypto';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
export const tokens=s=>clean(s).toLowerCase().replace(/[^a-z0-9%+.$-]+/g,' ').split(/\s+/).filter(Boolean);
export const idFor=(...v)=>crypto.createHash('sha1').update(v.join('|')).digest('hex').slice(0,16);
export function domainOf(url){try{return new URL(url).hostname.replace(/^www\./,'').toLowerCase();}catch{return'';}}
export function parseDate(v,fallback=Date.now()){const t=Date.parse(v);return new Date(Number.isFinite(t)?t:fallback).toISOString();}
