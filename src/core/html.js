function decode(value){return String(value||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
export function extractLinks(html,baseUrl){
  const rows=[]; const re=/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while((m=re.exec(String(html||'')))){
    try{ const url=new URL(m[1],baseUrl).href; const title=decode(m[2]); if(title.length>=18)rows.push({url,title}); }catch{}
  }
  const seen=new Set(); return rows.filter(r=>!seen.has(r.url)&&(seen.add(r.url),true));
}
export function meta(html,name){ const re=new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,'i'); const rev=new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,'i'); return decode((String(html).match(re)||String(html).match(rev)||[])[1]); }
