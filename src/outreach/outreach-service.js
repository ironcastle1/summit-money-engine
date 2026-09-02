import { id } from '../util/id.js';
import { geocodePlace, scanBusinessesAround } from './connectors/osm.js';
import { enrichProspectWebsite, classifyEmail } from './connectors/enrich.js';
import { lookupCompany, companiesHouseConfigured } from './connectors/companies-house.js';
import { searchWeb } from '../market/connectors/duckduckgo.js';

function haversineKm(a,b,c,d){const R=6371,toRad=x=>x*Math.PI/180;const dlat=toRad(c-a),dlon=toRad(d-b);const x=Math.sin(dlat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function chooseEmail(emails,existing=null){if(existing)return existing;const generic=emails.find(e=>classifyEmail(e).email_type==='generic');return generic||emails[0]||null;}
function safeJson(v,f={}){try{return JSON.parse(v||JSON.stringify(f));}catch{return f;}}

function usefulWebsiteCandidate(businessName,rows){
  const words=String(businessName||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);const bad=/facebook\.com|instagram\.com|tripadvisor|yell\.com|yelp\.|192\.com|companieshouse|linkedin\.com|x\.com|twitter\.com/i;
  for(const r of rows||[]){if(!/^https?:/i.test(r.url||'')||bad.test(r.url))continue;const hay=`${r.title||''} ${r.snippet||''} ${r.url||''}`.toLowerCase();const hits=words.filter(w=>hay.includes(w)).length;if(words.length&&hits/words.length>=0.6)return r.url;}
  return null;
}

export async function runProspectScan(db,{location,radius_km=10,category='all',country_code='gb',limit=300,enrich_limit=35}={}){
  if(!location)throw new Error('location required');const origin=await geocodePlace(location,country_code);const scanId=id('PSCAN');
  db.prepare(`INSERT INTO prospect_scans (id,location_query,country_code,latitude,longitude,radius_km,category,status) VALUES (?,?,?,?,?,?,?,'running')`).run(scanId,location,country_code,origin.lat,origin.lon,Number(radius_km),category);
  try{
    const rows=await scanBusinessesAround({lat:origin.lat,lon:origin.lon,radiusMeters:Number(radius_km)*1000,category,limit});let created=0,updated=0;
    const find=db.prepare('SELECT * FROM prospects WHERE source=? AND source_external_id=?');
    const ins=db.prepare(`INSERT INTO prospects (id,business_name,category,address,town,postcode,country,country_code,latitude,longitude,distance_km,website,email,email_type,phone,source,source_external_id,compliance_status,contact_status,metadata_json,scan_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'not_contacted',?,?)`);
    const upd=db.prepare(`UPDATE prospects SET business_name=?,category=?,address=COALESCE(?,address),town=COALESCE(?,town),postcode=COALESCE(?,postcode),country=COALESCE(?,country),country_code=COALESCE(?,country_code),latitude=?,longitude=?,distance_km=?,website=COALESCE(?,website),email=COALESCE(?,email),email_type=COALESCE(?,email_type),phone=COALESCE(?,phone),metadata_json=?,scan_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`);
    const prospectIds=[];
    for(const r of rows){const distance=haversineKm(origin.lat,origin.lon,r.lat,r.lon);const emailType=classifyEmail(r.email).email_type;const compliance=country_code?.toLowerCase()==='gb'?'unknown_review':'legal_review_required';const meta=JSON.stringify({osm_tags:r.osm_tags||{},scan_origin:origin.display_name});const old=find.get(r.source,r.source_external_id);
      if(old){upd.run(r.business_name,r.category,r.address,r.town,r.postcode,r.country,country_code,r.lat,r.lon,distance,r.website,r.email,emailType,r.phone,meta,scanId,old.id);updated++;prospectIds.push(old.id);}else{const pid=id('PROS');ins.run(pid,r.business_name,r.category,r.address,r.town,r.postcode,r.country,country_code,r.lat,r.lon,distance,r.website,r.email,emailType,r.phone,r.source,r.source_external_id,compliance,meta,scanId);created++;prospectIds.push(pid);}}
    const enriched=0;
    db.prepare(`UPDATE prospect_scans SET status='success',result_count=?,created_count=?,updated_count=?,enriched_count=?,completed_at=CURRENT_TIMESTAMP WHERE id=?`).run(rows.length,created,updated,enriched,scanId);
    return {scan_id:scanId,origin,result_count:rows.length,created,updated,enriched,prospect_ids:prospectIds,enrich_requested:Math.max(0,Math.min(100,Number(enrich_limit)||0))};
  }catch(error){db.prepare(`UPDATE prospect_scans SET status='failed',error=?,completed_at=CURRENT_TIMESTAMP WHERE id=?`).run(error.message,scanId);throw error;}
}

export async function enrichProspect(db,prospectId,{companies_house=true}={}){
  const p=db.prepare('SELECT * FROM prospects WHERE id=?').get(prospectId);if(!p)throw new Error('Prospect not found');let email=p.email,phone=p.phone,website=p.website,emailType=p.email_type;
  if(!website){try{const found=await searchWeb(`${p.business_name} ${p.town||p.postcode||''} official website`,5);website=usefulWebsiteCandidate(p.business_name,found);}catch{}}
  if(website){try{const e=await enrichProspectWebsite(website);email=chooseEmail(e.emails,email);phone=phone||e.phones[0]||null;website=e.url||website;emailType=classifyEmail(email).email_type;}catch{}}
  let company=null,compliance=p.compliance_status;
  if((p.country_code||'').toLowerCase()==='gb'&&companies_house){try{const r=await lookupCompany(p.business_name,p.postcode);company=r.match;if(company){compliance='corporate_confirmed';}}catch{}}
  if((p.country_code||'').toLowerCase()==='gb'&&!company&&compliance!=='do_not_contact')compliance='unknown_review';
  db.prepare(`UPDATE prospects SET website=?,email=?,email_type=?,phone=?,company_number=COALESCE(?,company_number),legal_form=COALESCE(?,legal_form),compliance_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(website,email,emailType,phone,company?.company_number||null,company?.company_type||null,compliance,prospectId);
  return getProspect(db,prospectId);
}

export async function enrichProspectsBatch(db,prospectIds,{limit=35,scanId=null}={}){let enriched=0;for(const pid of (prospectIds||[]).slice(0,Math.max(0,Math.min(100,Number(limit)||0)))){try{await enrichProspect(db,pid,{companies_house:true});enriched++;if(scanId)db.prepare('UPDATE prospect_scans SET enriched_count=? WHERE id=?').run(enriched,scanId);}catch{}}return {enriched};}

export function getProspect(db,idv){const p=db.prepare('SELECT * FROM prospects WHERE id=?').get(idv);if(!p)return null;return {...p,metadata:safeJson(p.metadata_json,{})};}
export function listProspects(db,{status,category,country_code,search,limit=500}={}){const where=['1=1'],args=[];if(status){where.push('contact_status=?');args.push(status);}if(category){where.push('category LIKE ?');args.push(`%${category}%`);}if(country_code){where.push('country_code=?');args.push(country_code);}if(search){where.push('(business_name LIKE ? OR town LIKE ? OR postcode LIKE ? OR email LIKE ?)');for(let i=0;i<4;i++)args.push(`%${search}%`);}args.push(Math.min(2000,Math.max(1,Number(limit)||500)));return db.prepare(`SELECT * FROM prospects WHERE ${where.join(' AND ')} ORDER BY CASE compliance_status WHEN 'corporate_confirmed' THEN 0 WHEN 'unknown_review' THEN 1 ELSE 2 END,distance_km,business_name LIMIT ?`).all(...args);}

export function outreachStats(db){
  const today=db.prepare(`SELECT COUNT(*) n FROM outreach_events WHERE event_type='contacted' AND date(created_at)=date('now')`).get().n;
  const totals=db.prepare(`SELECT event_type,COUNT(*) n FROM outreach_events GROUP BY event_type`).all();const by={};for(const r of totals)by[r.event_type]=r.n;
  const prospects=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) with_email,SUM(CASE WHEN compliance_status='corporate_confirmed' THEN 1 ELSE 0 END) corporate,SUM(CASE WHEN contact_status='not_contacted' THEN 1 ELSE 0 END) uncontacted FROM prospects`).get();
  return {today_contacted:Number(today||0),daily_target:50,events:by,prospects};
}

export function createPitch(prospect,{offer='custom steel business sign',sender_name='Alessandro',business_name='MERLIN CNC'}={}){
  const industry=prospect.category||'business';const locality=prospect.town?` in ${prospect.town}`:'';
  const subject=`Custom steel signage for ${prospect.business_name}`;
  const body=`Hi,\n\nI manufacture custom CNC-cut steel signs and wall pieces in Devon. I came across ${prospect.business_name}${locality} and thought a ${offer} could suit your ${industry} premises.\n\nI can work from an existing logo or simple brief and produce a clean steel sign, logo panel or wall piece sized for the space. If useful, I can send a straightforward concept and price.\n\nRegards,\n${sender_name}\n${business_name}\n\nIf you would prefer not to receive further messages, just let me know.`;
  return {subject,body,offer};
}
export function recordOutreachEvent(db,prospectId,{event_type='contacted',channel='email',subject=null,pitch_body=null,notes=null}={}){
  const p=getProspect(db,prospectId);if(!p)throw new Error('Prospect not found');const eid=id('OUT');db.prepare(`INSERT INTO outreach_events (id,prospect_id,event_type,channel,subject,pitch_body,notes) VALUES (?,?,?,?,?,?,?)`).run(eid,prospectId,event_type,channel,subject,pitch_body,notes);
  const status=event_type==='contacted'?'contacted':event_type==='replied'?'replied':event_type==='quoted'?'quoted':event_type==='won'?'won':event_type==='lost'?'lost':event_type==='do_not_contact'?'do_not_contact':p.contact_status;
  db.prepare('UPDATE prospects SET contact_status=?,last_contacted_at=CASE WHEN ? IN (\'contacted\',\'replied\',\'quoted\',\'won\',\'lost\') THEN CURRENT_TIMESTAMP ELSE last_contacted_at END,compliance_status=CASE WHEN ?=\'do_not_contact\' THEN \'do_not_contact\' ELSE compliance_status END,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,event_type,event_type,prospectId);
  return db.prepare('SELECT * FROM outreach_events WHERE id=?').get(eid);
}
export { companiesHouseConfigured };
