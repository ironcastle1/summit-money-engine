export const escLive=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const liveState=value=>String(value||'UNKNOWN').toLowerCase().replace(/[^a-z0-9]+/g,'-');
export const liveNumber=value=>Number.isFinite(Number(value))?Number(value).toLocaleString():'—';
