const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
export function tag(xml,name){ const m=String(xml).match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i')); return m?decode(m[1]):''; }
export function attr(xml,name,attribute){ const m=String(xml).match(new RegExp(`<${name}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`,'i')); return m?decode(m[1]):''; }
export function parseFeed(xml){
  const body=String(xml||''); const atom=/<feed[\s>]/i.test(body); const chunks=atom?(body.match(/<entry\b[\s\S]*?<\/entry>/gi)||[]):(body.match(/<item\b[\s\S]*?<\/item>/gi)||[]);
  return chunks.map((chunk,index)=>({
    index,
    title:tag(chunk,'title'),
    summary:tag(chunk,atom?'summary':'description')||tag(chunk,'content:encoded')||tag(chunk,'content'),
    url:atom?(attr(chunk,'link','href')||tag(chunk,'link')):tag(chunk,'link'),
    publishedAt:tag(chunk,atom?'published':'pubDate')||tag(chunk,'updated')||tag(chunk,'dc:date')
  })).filter(x=>x.title&&x.url);
}
