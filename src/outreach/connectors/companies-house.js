const BASE='https://api.company-information.service.gov.uk';
function auth(){const key=process.env.COMPANIES_HOUSE_API_KEY;if(!key)return null;return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;}
function norm(v){return String(v||'').toLowerCase().replace(/\b(limited|ltd|plc|llp|the)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
export function companiesHouseConfigured(){return Boolean(auth());}
export async function lookupCompany(name,postcode=null){
  const authorization=auth();if(!authorization)return {configured:false,match:null};
  const q=new URL(`${BASE}/search/companies`);q.searchParams.set('q',name);q.searchParams.set('items_per_page','10');
  const r=await fetch(q,{headers:{authorization,accept:'application/json'}});if(!r.ok)throw new Error(`Companies House ${r.status}`);const data=await r.json();
  const target=norm(name),pc=String(postcode||'').replace(/\s+/g,'').toUpperCase();
  const rows=(data.items||[]).map(x=>{const n=norm(x.title);let points=n===target?3:n.includes(target)||target.includes(n)?2:0;const rpc=String(x.address?.postal_code||'').replace(/\s+/g,'').toUpperCase();if(pc&&rpc&&pc===rpc)points+=3;return {...x,_points:points};}).sort((a,b)=>b._points-a._points);
  const best=rows[0];if(!best||best._points<2)return {configured:true,match:null};
  return {configured:true,match:{company_number:best.company_number,name:best.title,status:best.company_status,company_type:best.company_type,address:best.address,score_reason:best._points>=5?'name and postcode':'name'}};
}
