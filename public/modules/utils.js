export const $=(q,root=document)=>root.querySelector(q),$$=(q,root=document)=>[...root.querySelectorAll(q)];
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const fmt=n=>Number.isFinite(Number(n))?Intl.NumberFormat('en-GB',{maximumFractionDigits:1,notation:Math.abs(Number(n))>=1e6?'compact':'standard'}).format(Number(n)):'—';
export function ago(value){const t=Date.parse(value||'');if(!Number.isFinite(t))return'—';const m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<60)return`${m}m`;const h=Math.round(m/60);if(h<48)return`${h}h`;return`${Math.round(h/24)}d`;}
export function money(n){return Number.isFinite(Number(n))?Intl.NumberFormat('en-GB',{notation:'compact',maximumFractionDigits:1}).format(Number(n)):'—';}
export function debounce(fn,ms=180){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}}
export function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200);}
export function pct(p){return Number.isFinite(Number(p))?`${Math.round(Number(p)*100)}%`:'—';}
