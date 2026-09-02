function parseRow(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;}
function norm(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
export function parseCsv(text){const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());if(!lines.length)return [];const headers=parseRow(lines[0]).map(norm);return lines.slice(1).map(line=>{const vals=parseRow(line),o={};headers.forEach((h,i)=>o[h]=vals[i]??'');return o;});}
function pick(o,names){for(const n of names){const k=Object.keys(o).find(k=>k===n||k.includes(n));if(k&&o[k]!==''&&o[k]!=null)return o[k];}return null;}
function money(v){if(v==null)return null;const n=Number(String(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null;}
function int(v,fb=1){const n=parseInt(String(v||''),10);return Number.isFinite(n)?n:fb;}
function parseDate(v){if(!v)return new Date().toISOString();const d=new Date(v);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function extractCode(...vals){const s=vals.filter(Boolean).join(' ');const m=s.match(/\b([A-Z0-9]{2,6}-\d{3,6})\b/i);return m?m[1].toUpperCase():null;}
export function normaliseStoreCsv(platform,rows){return rows.map((r,index)=>{
  const title=pick(r,['title','item_title','listing_title','product','item']);const sku=pick(r,['sku','custom_label','seller_sku','variation_sku']);const external=pick(r,['transaction_id','order_id','receipt_id','sales_record_number','record_number','item_id'])||`${platform}-row-${index+1}-${pick(r,['date','sale_date','order_date'])||''}-${title||''}`;
  const gross=money(pick(r,['gross_revenue','gross_amount','order_total','total','price','sale_price','transaction_price','amount']));
  const fees=money(pick(r,['fees','fee','transaction_fee','marketplace_fee','final_value_fee','etsy_fee']))||0;
  const shipping=money(pick(r,['shipping_cost','postage_cost','delivery_cost']))||0;const refund=money(pick(r,['refund','refunds']))||0;
  return {platform,external_id:String(external),title:title||null,sku:sku||null,product_code:extractCode(sku,title),quantity:int(pick(r,['quantity','qty']),1),gross_revenue:gross,fees,shipping_cost:shipping,refunds:refund,sold_at:parseDate(pick(r,['sale_date','order_date','date','created','transaction_date'])),raw:r};
});}
