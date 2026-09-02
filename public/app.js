const API=(window.MERLIN_CONFIG&&window.MERLIN_CONFIG.API_BASE_URL)||'';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cache={health:null,dashboard:null,inventory:[],products:[],alerts:[],activity:[],observations:[],evidence:[],opportunities:[],intake:[],currentDraft:null,inventoryFilter:'all'};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v,c='GBP'){if(v==null||v==='')return '—';try{return new Intl.NumberFormat('en-GB',{style:'currency',currency:c||'GBP'}).format(Number(v));}catch{return `£${Number(v).toFixed(2)}`;}}
function num(v,d=1){return v==null||v===''?'—':Number(v).toLocaleString('en-GB',{maximumFractionDigits:d});}
function label(v){return String(v??'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());}
function date(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function jsonHeaders(){return {'content-type':'application/json'};}
async function api(path,opts={}){const r=await fetch(`${API}${path}`,opts);const text=await r.text();let body;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}if(!r.ok)throw new Error(body?.error||body?.message||`${r.status} ${r.statusText}`);return body;}
function available(i){return Number(i.quantity_on_hand||0)-Number(i.quantity_reserved||0);}
function matSize(i){const parts=[];if(i.thickness_mm!=null)parts.push(`${num(i.thickness_mm,2)}mm`);if(i.width_mm!=null&&i.height_mm!=null)parts.push(`${num(i.width_mm,1)}×${num(i.height_mm,1)}mm`);if(i.length_mm!=null)parts.push(`${num(i.length_mm,1)}mm long`);return parts.join(' · ')||'—';}
function seconds(v){if(v==null)return '—';const s=Number(v);if(s<60)return `${num(s,0)}s`;return `${num(s/60,1)}m`;}
function productNumber(code){const m=String(code||'').match(/(\d+)$/);return m?Number(m[1]):999999;}
function pill(text,kind='info'){return `<span class="pill ${kind}">${esc(text)}</span>`;}

async function loadAll(){
  const [health,dashboard,inventory,products,alerts,activity,observations,evidence,opportunities,intake]=await Promise.all([
    api('/api/health'),api('/api/dashboard'),api('/api/inventory'),api('/api/products'),api('/api/inventory/alerts'),api('/api/activity?limit=50'),api('/api/market/observations'),api('/api/market/evidence?limit=60'),api('/api/market/opportunities?limit=18'),api('/api/intake?limit=25')
  ]);
  Object.assign(cache,{health,dashboard,inventory,products,alerts,activity,observations,evidence,opportunities,intake});
  render();
}
function render(){renderHealth();renderMetrics();renderProducts();renderInventory();renderMarket();renderIntake();renderPerformance();renderFinance();renderActivity();populateSelects();}

function renderHealth(){
  $('#health').textContent='LIVE';$('#health').className='status-pill good';
  $('#input-pill').textContent='INPUT READY';$('#input-pill').className='status-pill good';
  const rs=cache.health?.research||{};$('#market-pill').textContent=rs.evidence_count?`MARKET ${rs.evidence_count}`:'MARKET EMPTY';$('#market-pill').className=`status-pill ${rs.evidence_count?'good':'warn'}`;
  if(rs.last_error){$('#system-banner').className='system-banner';$('#system-banner').textContent=`Market collector warning: ${rs.last_error}`;}else $('#system-banner').className='system-banner hidden';
}
function renderMetrics(){
  const d=cache.dashboard||{};
  const metal=cache.inventory.filter(i=>['raw_material','offcut'].includes(i.kind));
  const totalStockValue=cache.inventory.reduce((a,i)=>a+Number(i.quantity_on_hand||0)*Number(i.unit_cost||0),0);
  const data=[
    ['Products',d.products||cache.products.length,'DXF-backed product lines'],
    ['Units sold MTD',d.units_sold_mtd||0,`${d.sale_events_mtd||0} completed sale records`],
    ['Revenue MTD',money(d.revenue_mtd),'recorded completed sales'],
    ['Inventory value',money(totalStockValue),'recorded unit costs only'],
    ['Metal lines',metal.length,`${metal.reduce((a,i)=>a+available(i),0)} recorded units`],
    ['Low stock',d.low_stock_count||0,(d.low_stock_count||0)?'needs attention':'no current alerts']
  ];
  $('#metrics').innerHTML=data.map(([a,b,c])=>`<div class="metric"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c)}</small></div>`).join('');
}

function dxfCheck(p){
  const issues=[];
  if(!Number(p.units_confirmed))issues.push(['Units unknown','warn']);
  if(Number(p.open_path_count||0)>0)issues.push([`${p.open_path_count} open endpoint${Number(p.open_path_count)===1?'':'s'}`,'bad']);
  if(Number(p.unsupported_entity_count||0)>0)issues.push([`${p.unsupported_entity_count} unsupported entit${Number(p.unsupported_entity_count)===1?'y':'ies'}`,'warn']);
  if(Number(p.duplicate_entity_count||0)>0)issues.push([`${p.duplicate_entity_count} duplicate entit${Number(p.duplicate_entity_count)===1?'y':'ies'}`,'warn']);
  if(p.fits_machine===0)issues.push(['Exceeds table envelope','bad']);
  if(!issues.length)return pill('Basic checks clear','good');
  return issues.map(([t,k])=>pill(t,k)).join(' ');
}
function filteredProducts(){
  let rows=[...(cache.products||[])];
  const q=$('#product-search')?.value.trim().toLowerCase()||'';
  const cat=$('#product-category-filter')?.value||'';
  if(q)rows=rows.filter(p=>[p.product_code,p.name,p.category,p.primary_material_name].some(v=>String(v||'').toLowerCase().includes(q)));
  if(cat)rows=rows.filter(p=>String(p.category||'')===cat);
  const sort=$('#product-sort')?.value||'created';
  if(sort==='name')rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  else if(sort==='sales')rows.sort((a,b)=>Number(b.units_sold||0)-Number(a.units_sold||0)||productNumber(a.product_code)-productNumber(b.product_code));
  else if(sort==='revenue')rows.sort((a,b)=>Number(b.gross_revenue||0)-Number(a.gross_revenue||0)||productNumber(a.product_code)-productNumber(b.product_code));
  else if(sort==='cut')rows.sort((a,b)=>(a.avg_cut_seconds==null?Infinity:Number(a.avg_cut_seconds))-(b.avg_cut_seconds==null?Infinity:Number(b.avg_cut_seconds)));
  else rows.sort((a,b)=>productNumber(a.product_code)-productNumber(b.product_code));
  return rows;
}
function renderProducts(){
  const categories=[...new Set((cache.products||[]).map(p=>p.category).filter(Boolean))].sort();
  const select=$('#product-category-filter');const current=select.value;select.innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');if(categories.includes(current))select.value=current;
  const rows=filteredProducts();
  $('#products-body').innerHTML=rows.length?rows.map(p=>{
    const prodSize=p.target_width_mm&&p.target_height_mm?`${num(p.target_width_mm,1)}×${num(p.target_height_mm,1)}mm`:(p.units_confirmed&&p.width_mm!=null?`${num(p.width_mm,1)}×${num(p.height_mm,1)}mm`:'Not set');
    return `<tr><td><input class="product-select" type="checkbox" value="${esc(p.id)}"></td><td><button class="product-link mono" data-product-id="${esc(p.id)}">${esc(p.product_code)}</button></td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category||'—')}</td><td>${esc(p.primary_material_name||'—')}</td><td>${esc(prodSize)}</td><td>R${esc(p.revision_number||1)}</td><td class="dxf-check">${dxfCheck(p)}</td><td>${seconds(p.avg_cut_seconds)}</td><td>${num(p.units_sold,0)}</td><td>${money(p.gross_revenue)}</td></tr>`;
  }).join(''):`<tr><td colspan="11" class="empty">No products match the current filter.</td></tr>`;
}

function inventoryMatches(i,filter){
  if(filter==='all')return true;
  if(filter==='metal')return ['raw_material'].includes(i.kind);
  return i.kind===filter;
}
function renderInventory(){
  const rows=(cache.inventory||[]).filter(i=>inventoryMatches(i,cache.inventoryFilter));
  $('#inventory-body').innerHTML=rows.length?rows.map(i=>{
    const val=Number(i.quantity_on_hand||0)*Number(i.unit_cost||0);
    return `<tr><td><button class="inventory-link" data-inventory-id="${esc(i.id)}">${esc(i.name)}</button></td><td>${esc(i.kind==='raw_material'?'Metal / raw material':label(i.kind))}</td><td>${esc(matSize(i))}</td><td>${num(i.quantity_on_hand,2)} ${esc(i.unit)}</td><td>${money(i.unit_cost,i.currency)}</td><td>${i.unit_cost==null?'—':money(val,i.currency)}</td><td>${i.reorder_point==null?'—':`${num(i.reorder_point,2)} ${esc(i.unit)}`}</td></tr>`;
  }).join(''):`<tr><td colspan="7" class="empty">No inventory in this view.</td></tr>`;
  $('#low-stock').innerHTML=(cache.alerts||[]).length?cache.alerts.map(a=>`<div class="alert-row"><strong>${esc(a.name)}</strong><span>${num(a.available_quantity,2)} ${esc(a.unit)} available · reorder point ${num(a.reorder_point,2)}</span></div>`).join(''):'';
  $$('.inventory-filter').forEach(b=>b.classList.toggle('active',b.dataset.kind===cache.inventoryFilter));
}

function renderMarket(){
  const rs=cache.health?.research||{};
  $('#research-status').className=`inline-status ${rs.last_status==='failed'?'bad':rs.evidence_count?'good':'warn'}`;
  $('#research-status').textContent=rs.last_status==='running'?'Market scan running…':rs.last_error?`Last scan error: ${rs.last_error}`:rs.evidence_count?`${rs.evidence_count} raw evidence items stored · ${rs.observation_count} evidence summaries · last scan ${date(rs.last_run_at)}`:'No market evidence stored yet. Press Scan now.';
  const rows=(cache.opportunities?.length?cache.opportunities:cache.observations)||[];
  $('#observations').innerHTML=rows.length?rows.slice(0,12).map(o=>`<div class="observation"><h3>${esc(o.topic)}</h3><p>${esc(o.observation)}</p>${o.why_valuable?`<p class="why"><strong>Why it may be useful now:</strong> ${esc(o.why_valuable)}</p>`:''}<details><summary>Evidence and unknowns</summary><div><strong>Observed examples</strong><ul>${(o.direct_evidence||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>None recorded</li>'}</ul><strong>Still unknown</strong><ul>${(o.unknowns||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>None stated</li>'}</ul>${o.suggested_test?`<p><strong>Possible validation:</strong> ${esc(o.suggested_test)}</p>`:''}</div></details><div class="source-list">${(o.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.publisher||s.title||'Source')}</a>`).join('')}</div></div>`).join(''):`<div class="empty">No market opportunities stored yet. MERLIN leaves this empty rather than inventing one.</div>`;
  $('#market-evidence').innerHTML=(cache.evidence||[]).length?cache.evidence.slice(0,50).map(e=>`<div class="evidence-item"><strong>${esc(e.title||e.query)}</strong><span>${esc(e.publisher||'')} · ${date(e.collected_at)}${e.observed_price!=null?` · ${money(e.observed_price,e.currency||'GBP')}`:''}</span><span>${esc(e.snippet||'')}</span>${/^https?:/.test(e.url)?`<a href="${esc(e.url)}" target="_blank" rel="noreferrer">Open source</a>`:''}</div>`).join(''):`<div class="empty">No raw market evidence yet.</div>`;
}

function fieldLabel(k){return label(k.replace(/^source_text$/,'original statement'));}
function renderIntake(){const rows=cache.intake||[];$('#intake-history').innerHTML=rows.length?rows.slice(0,10).map(r=>`<div class="intake-history-row"><span>${date(r.created_at)}</span><strong>${esc(label(r.action))}</strong><em>${esc(label(r.status))}</em></div>`).join(''):'<div class="empty">No statements processed yet.</div>';}
function showIntakeDraft(d){cache.currentDraft=d;const fields=Object.entries(d.fields||{}).filter(([k,v])=>k!=='source_text'&&v!=null&&v!=='');$('#intake-preview').innerHTML=`<div class="intake-draft ${d.can_commit?'ready':'needs-input'}"><div class="intake-title"><strong>${esc(d.title)}</strong>${d.can_commit?pill('Ready to record','good'):pill('Needs clarification','warn')}</div><div class="intake-fields">${fields.map(([k,v])=>`<div><span>${esc(fieldLabel(k))}</span><strong>${esc(typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('')}</div>${(d.missing_fields||[]).length?`<p><strong>Not recorded.</strong> Missing: ${esc(d.missing_fields.map(label).join(', '))}</p>`:''}${(d.notes||[]).map(n=>`<p class="muted">${esc(n)}</p>`).join('')}<div class="intake-actions">${d.can_commit?`<button data-intake-commit="${esc(d.intake_id)}">Record this</button>`:''}<button class="secondary" data-intake-clear type="button">Clear</button></div></div>`;}
function clearIntakeDraft(){cache.currentDraft=null;$('#intake-preview').innerHTML='<div class="empty">Nothing is written until you confirm it.</div>';}

function renderPerformance(){
  const rows=[...(cache.products||[])].sort((a,b)=>Number(b.gross_revenue||0)-Number(a.gross_revenue||0)||Number(b.units_sold||0)-Number(a.units_sold||0));
  $('#performance-body').innerHTML=rows.length?rows.map(p=>`<tr><td><button class="product-link mono" data-product-id="${esc(p.id)}">${esc(p.product_code)}</button></td><td>${esc(p.name)}</td><td>${num(p.units_sold,0)}</td><td>${money(p.gross_revenue)}</td><td>${seconds(p.avg_cut_seconds)}</td><td>${seconds(p.avg_cleanup_seconds)}</td></tr>`).join(''):`<tr><td colspan="6" class="empty">No products yet.</td></tr>`;
}
function renderFinance(){const d=cache.dashboard||{};$('#finance-summary').innerHTML=`<div class="finance-box"><span>Revenue MTD</span><strong>${money(d.revenue_mtd)}</strong></div><div class="finance-box"><span>Sales fees/shipping MTD</span><strong>${money(d.sales_costs_mtd)}</strong></div><div class="finance-box"><span>Other expenses MTD</span><strong>${money(d.expenses_mtd)}</strong></div><div class="finance-box"><span>Recorded net before material/labour allocation</span><strong>${money(Number(d.revenue_mtd||0)-Number(d.sales_costs_mtd||0)-Number(d.expenses_mtd||0))}</strong></div>`;}
function renderActivity(){const rows=cache.activity||[];$('#activity-list').innerHTML=rows.length?rows.slice(0,35).map(e=>`<div class="activity-row"><time>${date(e.created_at)}</time><div><strong>${esc(e.title||label(e.type))}</strong><span>${esc(e.detail||'')}</span></div></div>`).join(''):`<div class="empty">No activity recorded.</div>`;}
function populateSelects(){
  const raw=cache.inventory.filter(i=>i.kind==='raw_material');const products=cache.products||[];
  const material=$('#dxf-material'),sale=$('#sale-product');const mv=material.value,sv=sale.value;
  material.innerHTML='<option value="">Not assigned</option>'+raw.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(matSize(i))}</option>`).join('');
  sale.innerHTML='<option value="">Select product</option>'+products.map(p=>`<option value="${esc(p.id)}">${esc(p.product_code)} — ${esc(p.name)}</option>`).join('');
  if([...material.options].some(o=>o.value===mv))material.value=mv;if([...sale.options].some(o=>o.value===sv))sale.value=sv;
}

async function refresh(){await loadAll();}

async function loadLayout(){try{const p=await api('/api/preferences/dashboard-layout');const grid=$('#dashboard-grid');for(const id of p.order||[]){const el=grid.querySelector(`[data-widget-id="${CSS.escape(id)}"]`);if(el)grid.appendChild(el);}for(const el of $$('.widget')){const span=p.spans?.[el.dataset.widgetId]||Number(el.dataset.span||1);el.dataset.span=span;el.classList.toggle('span-2',Number(span)===2);}}catch{}}
async function saveLayout(){const widgets=$$('#dashboard-grid .widget');const order=widgets.map(e=>e.dataset.widgetId),spans=Object.fromEntries(widgets.map(e=>[e.dataset.widgetId,Number(e.dataset.span||1)]));await api('/api/preferences/dashboard-layout',{method:'PUT',headers:jsonHeaders(),body:JSON.stringify({order,spans})});}
function enableDragLayout(){
  const grid=$('#dashboard-grid');let state=null;
  for(const handle of $$('.drag-handle')){
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();const widget=handle.closest('.widget');state={widget,handle,pointerId:e.pointerId};handle.setPointerCapture(e.pointerId);widget.classList.add('dragging');document.body.classList.add('dashboard-dragging');
    });
    handle.addEventListener('pointermove',e=>{
      if(!state||state.pointerId!==e.pointerId)return;
      const candidates=document.elementsFromPoint(e.clientX,e.clientY).map(el=>el.closest?.('.widget')).filter(Boolean).filter((w,i,a)=>w!==state.widget&&a.indexOf(w)===i&&w.parentElement===grid);
      const target=candidates[0];if(!target)return;
      const rect=target.getBoundingClientRect();const before=e.clientY<rect.top+rect.height/2;
      grid.insertBefore(state.widget,before?target:target.nextSibling);
    });
    const finish=e=>{if(!state||state.pointerId!==e.pointerId)return;try{handle.releasePointerCapture(e.pointerId);}catch{}state.widget.classList.remove('dragging');document.body.classList.remove('dashboard-dragging');state=null;saveLayout().catch(()=>{});};
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('.span-toggle');if(!b)return;const w=b.closest('.widget');w.dataset.span=Number(w.dataset.span||1)===2?1:2;w.classList.toggle('span-2',Number(w.dataset.span)===2);saveLayout().catch(()=>{});});
}

function productIssueList(r){
  const rows=[];
  if(!Number(r.units_confirmed))rows.push('DXF physical units are not confirmed.');
  if(Number(r.open_path_count||0)>0)rows.push(`${r.open_path_count} unmatched/open endpoints detected.`);
  if(Number(r.unsupported_entity_count||0)>0)rows.push(`${r.unsupported_entity_count} unsupported DXF entities detected.`);
  if(Number(r.duplicate_entity_count||0)>0)rows.push(`${r.duplicate_entity_count} duplicate entities detected.`);
  if(r.fits_machine===0)rows.push('The confirmed DXF dimensions exceed the active table envelope in both orientations.');
  return rows;
}
async function openProduct(pid){
  const p=await api(`/api/products/${encodeURIComponent(pid)}`);const r=p.revisions?.[0]||{};$('#dialog-code').textContent=p.product_code;$('#dialog-name').textContent=p.name;
  const issues=productIssueList(r);const perf=p.performance||{},prod=p.production_summary||{};
  $('#product-detail').innerHTML=`
    <div class="detail-grid"><div class="detail-item"><span>ID</span><strong>${esc(p.product_code)}</strong></div><div class="detail-item"><span>Title</span><strong>${esc(p.name)}</strong></div><div class="detail-item"><span>Material</span><strong>${esc(p.primary_material_name||'Not assigned')}</strong></div><div class="detail-item"><span>Revision</span><strong>R${esc(r.revision_number||1)}</strong></div><div class="detail-item"><span>Units sold</span><strong>${num(perf.units_sold,0)}</strong></div><div class="detail-item"><span>Revenue</span><strong>${money(perf.gross_revenue)}</strong></div><div class="detail-item"><span>Average cut</span><strong>${seconds(prod.avg_cut_seconds)}</strong></div><div class="detail-item"><span>Average cleanup</span><strong>${seconds(prod.avg_cleanup_seconds)}</strong></div></div>
    <div class="geometry-summary"><h3>DXF analysis</h3>${issues.length?`<ul>${issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Basic deterministic checks found no open paths, unsupported entities, duplicates or confirmed table-size failure. This is not a guarantee of plasma cuttability.</p>'}<p><a class="button-link" target="_blank" href="${API}/api/products/${encodeURIComponent(p.id)}/preview">Open geometry preview</a></p></div>
    <form id="product-update-form" class="quick-form"><h3>Product details</h3><div class="form-grid"><label>Short ID<input id="pd-code" value="${esc(p.product_code)}"></label><label>Title<input id="pd-name" value="${esc(p.name)}"></label><label>Category<input id="pd-category" value="${esc(p.category||'')}"></label><label>Selling price £<input id="pd-price" type="number" step="0.01" value="${p.selling_price??''}"></label><label>Target width mm<input id="pd-width" type="number" step="0.1" value="${p.target_width_mm??''}"></label><label>Target height mm<input id="pd-height" type="number" step="0.1" value="${p.target_height_mm??''}"></label><label>Primary material<select id="pd-material"><option value="">Not assigned</option>${cache.inventory.filter(i=>i.kind==='raw_material').map(i=>`<option value="${esc(i.id)}" ${i.id===p.primary_material_inventory_item_id?'selected':''}>${esc(i.name)} · ${esc(matSize(i))}</option>`).join('')}</select></label><label>Material units per product<input id="pd-material-qty" type="number" min="0" step="0.0001" value="${(p.bom||[]).find(x=>x.inventory_item_id===p.primary_material_inventory_item_id)?.quantity_per_unit??''}" placeholder="e.g. 0.25 sheet"></label></div><button type="submit">Save product</button></form>
    ${!Number(r.units_confirmed)?`<form id="unit-form" class="quick-form"><h3>Confirm DXF units</h3><div class="form-grid"><label>Source units<select id="revision-units"><option value="millimeters">Millimetres</option><option value="inches">Inches</option><option value="centimeters">Centimetres</option><option value="meters">Metres</option></select></label></div><button type="submit">Confirm and recalculate</button></form>`:''}
    <form id="production-run-form" class="quick-form"><h3>Record completed production run</h3><div class="form-grid"><label>Quantity<input id="run-qty" type="number" min="1" value="1"></label><label>Cut minutes<input id="run-cut" type="number" min="0" step="0.01"></label><label>Cleanup minutes<input id="run-clean" type="number" min="0" step="0.01"></label><label>Finishing minutes<input id="run-finish" type="number" min="0" step="0.01"></label><label>Packaging minutes<input id="run-pack" type="number" min="0" step="0.01"></label><label>Successful?<select id="run-success"><option value="1">Yes</option><option value="0">No</option></select></label></div><button type="submit">Record production</button></form>
    <form id="revision-form" class="quick-form"><h3>Add revised DXF to this product</h3><div class="form-grid"><label>DXF<input id="revision-file" type="file" accept=".dxf" required></label><label>Units if known<select id="revision-upload-units"><option value="">Use file / unknown</option><option value="millimeters">Millimetres</option><option value="inches">Inches</option></select></label></div><button type="submit">Add revision</button></form>
    <form id="asset-form" class="quick-form"><h3>Attach files to ${esc(p.product_code)}</h3><p class="muted">Images are filed under photos, text/CSV under listings, office/PDF files under documents, and other files under assets.</p><div class="form-grid"><label>Files<input id="asset-files" type="file" multiple required></label></div><button type="submit">Store product files</button></form>
    <div class="quick-form"><h3>Stored product files</h3><div class="asset-list">${(p.assets||[]).length?(p.assets||[]).map(a=>`<div class="asset-row"><div><strong>${esc(a.original_filename)}</strong><span>${esc(label(a.asset_kind))}</span></div><a href="${API}/api/product-assets/${encodeURIComponent(a.id)}/file" target="_blank">Open</a></div>`).join(''):'<div class="empty">No additional files stored for this product.</div>'}</div></div>`;
  $('#product-dialog').showModal();
  $('#product-update-form').addEventListener('submit',async e=>{e.preventDefault();const material=$('#pd-material').value||null;await api(`/api/products/${encodeURIComponent(p.id)}`,{method:'PATCH',headers:jsonHeaders(),body:JSON.stringify({product_code:$('#pd-code').value,name:$('#pd-name').value,category:$('#pd-category').value||null,selling_price:$('#pd-price').value?Number($('#pd-price').value):null,target_width_mm:$('#pd-width').value?Number($('#pd-width').value):null,target_height_mm:$('#pd-height').value?Number($('#pd-height').value):null,primary_material_inventory_item_id:material})});if(material&&$('#pd-material-qty').value){await api(`/api/products/${encodeURIComponent(p.id)}/bom`,{method:'POST',headers:jsonHeaders(),body:JSON.stringify({inventory_item_id:material,quantity_per_unit:Number($('#pd-material-qty').value),notes:'Primary material usage per finished product'})});}$('#product-dialog').close();await refresh();});
  $('#unit-form')?.addEventListener('submit',async e=>{e.preventDefault();await api(`/api/revisions/${encodeURIComponent(r.id)}/units`,{method:'POST',headers:jsonHeaders(),body:JSON.stringify({unit:$('#revision-units').value})});$('#product-dialog').close();await refresh();await openProduct(p.id);});
  $('#production-run-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/production-runs',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({product_id:p.id,revision_id:p.active_revision_id,quantity:Number($('#run-qty').value||1),cut_seconds:$('#run-cut').value?Number($('#run-cut').value)*60:null,cleanup_seconds:$('#run-clean').value?Number($('#run-clean').value)*60:null,finishing_seconds:$('#run-finish').value?Number($('#run-finish').value)*60:null,packaging_seconds:$('#run-pack').value?Number($('#run-pack').value)*60:null,success:$('#run-success').value==='1'})});$('#product-dialog').close();await refresh();});
  $('#revision-form').addEventListener('submit',async e=>{e.preventDefault();const f=$('#revision-file').files[0];if(!f)return;const fd=new FormData();fd.append('file',f);if($('#revision-upload-units').value)fd.append('unit_override',$('#revision-upload-units').value);await api(`/api/products/${encodeURIComponent(p.id)}/revisions`,{method:'POST',body:fd});$('#product-dialog').close();await refresh();await openProduct(p.id);});
  $('#asset-form').addEventListener('submit',async e=>{e.preventDefault();const files=[...$('#asset-files').files];if(!files.length)return;const fd=new FormData();for(const f of files)fd.append('files',f);await api(`/api/products/${encodeURIComponent(p.id)}/assets`,{method:'POST',body:fd});$('#product-dialog').close();await refresh();await openProduct(p.id);});
}
async function openInventory(iid){
  const i=await api(`/api/inventory/${encodeURIComponent(iid)}`);$('#inv-dialog-name').textContent=i.name;$('#inventory-detail').innerHTML=`<div class="detail-grid"><div class="detail-item"><span>Type</span><strong>${esc(label(i.kind))}</strong></div><div class="detail-item"><span>On hand</span><strong>${num(i.quantity_on_hand,2)} ${esc(i.unit)}</strong></div><div class="detail-item"><span>Specification</span><strong>${esc(matSize(i))}</strong></div><div class="detail-item"><span>Unit cost</span><strong>${money(i.unit_cost,i.currency)}</strong></div><div class="detail-item"><span>Location</span><strong>${esc(i.location||'—')}</strong></div></div><form id="inventory-update-form" class="quick-form"><div class="form-grid"><label>Count on hand<input id="iu-qty" type="number" step="any" value="${i.quantity_on_hand}"></label><label>Unit cost £<input id="iu-cost" type="number" step="0.01" value="${i.unit_cost??''}"></label><label>Reorder at<input id="iu-reorder" type="number" step="any" value="${i.reorder_point??''}"></label><label>Location<input id="iu-location" value="${esc(i.location||'')}"></label></div><button type="submit">Save stocktake</button></form>`;$('#inventory-dialog').showModal();$('#inventory-update-form').addEventListener('submit',async e=>{e.preventDefault();await api(`/api/inventory/${encodeURIComponent(i.id)}`,{method:'PATCH',headers:jsonHeaders(),body:JSON.stringify({unit_cost:$('#iu-cost').value?Number($('#iu-cost').value):null,reorder_point:$('#iu-reorder').value?Number($('#iu-reorder').value):null,location:$('#iu-location').value||null})});const delta=Number($('#iu-qty').value)-Number(i.quantity_on_hand||0);if(delta!==0)await api('/api/inventory/movements',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({inventory_item_id:i.id,movement_type:'adjust',quantity:delta,notes:'Owner stocktake correction'})});$('#inventory-dialog').close();await refresh();});
}

async function analyseProducts(ids){
  const box=$('#analysis-result');box.className='inline-status';box.textContent=`Analysing ${ids?.length||'all'} product DXF${ids?.length===1?'':'s'}…`;
  try{const r=await api('/api/products/analyse',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({product_ids:ids?.length?ids:null})});box.className=`inline-status ${r.errors?'warn':'good'}`;box.textContent=`Analysed ${r.analysed} product${r.analysed===1?'':'s'}${r.errors?` · ${r.errors} error${r.errors===1?'':'s'}`:''}.`;await refresh();}catch(err){box.className='inline-status bad';box.textContent=err.message;}
}

$('#refresh').addEventListener('click',()=>refresh().catch(e=>alert(e.message)));
$('#reset-layout').addEventListener('click',async()=>{await api('/api/preferences/dashboard-layout',{method:'PUT',headers:jsonHeaders(),body:JSON.stringify({order:['products','inventory','market','intake','performance','finance','activity'],spans:{products:2,inventory:2,market:2,intake:2,performance:2,finance:1,activity:1}})});location.reload();});
$('#dialog-close').addEventListener('click',()=>$('#product-dialog').close());$('#inv-dialog-close').addEventListener('click',()=>$('#inventory-dialog').close());
document.addEventListener('click',e=>{const p=e.target.closest('[data-product-id]');if(p)openProduct(p.dataset.productId).catch(err=>alert(err.message));const i=e.target.closest('[data-inventory-id]');if(i)openInventory(i.dataset.inventoryId).catch(err=>alert(err.message));const f=e.target.closest('.inventory-filter');if(f){cache.inventoryFilter=f.dataset.kind;renderInventory();}});
$('#product-search').addEventListener('input',renderProducts);$('#product-category-filter').addEventListener('change',renderProducts);$('#product-sort').addEventListener('change',renderProducts);
$('#select-all-products').addEventListener('change',e=>$$('.product-select').forEach(c=>c.checked=e.target.checked));
$('#analyse-all').addEventListener('click',()=>analyseProducts(null));$('#analyse-selected').addEventListener('click',()=>{const ids=$$('.product-select:checked').map(c=>c.value);if(!ids.length)return alert('Select one or more products first.');analyseProducts(ids);});
$('#intake-form').addEventListener('submit',async e=>{e.preventDefault();const text=$('#intake-input').value.trim();if(!text)return;$('#intake-preview').innerHTML='<div class="empty">Parsing…</div>';try{const d=await api('/api/intake/parse',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({text})});showIntakeDraft(d);await refresh();}catch(err){$('#intake-preview').innerHTML=`<div class="inline-status bad">${esc(err.message)}</div>`;}});
document.addEventListener('click',async e=>{const c=e.target.closest('[data-intake-commit]');if(c){c.disabled=true;try{const r=await api(`/api/intake/${encodeURIComponent(c.dataset.intakeCommit)}/commit`,{method:'POST'});$('#intake-input').value='';$('#intake-preview').innerHTML=`<div class="inline-status good">Recorded: ${esc(label(r.action))}.</div>`;await refresh();}catch(err){c.disabled=false;alert(err.message);}}if(e.target.closest('[data-intake-clear]'))clearIntakeDraft();});
$('#market-scan').addEventListener('click',async()=>{const b=$('#market-scan');b.disabled=true;b.textContent='Starting…';try{await api('/api/market/research',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({focus:$('#market-focus').value.trim()||null})});b.textContent='Scan running';setTimeout(()=>{b.disabled=false;b.textContent='Scan now';refresh().catch(()=>{});},15000);}catch(err){b.disabled=false;b.textContent='Scan now';alert(err.message);}});
$('#inventory-form').addEventListener('submit',async e=>{e.preventDefault();const kind=$('#inv-kind').value;await api('/api/inventory',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({kind,name:$('#inv-name').value,quantity_on_hand:Number($('#inv-qty').value||0),unit:$('#inv-unit').value||'each',unit_cost:$('#inv-cost').value?Number($('#inv-cost').value):null,reorder_point:$('#inv-reorder').value?Number($('#inv-reorder').value):null,location:$('#inv-location').value||null,material_family:kind==='raw_material'?'Steel':null,form:kind==='raw_material'?'sheet':null,thickness_mm:$('#inv-thickness').value?Number($('#inv-thickness').value):null,width_mm:$('#inv-width').value?Number($('#inv-width').value):null,height_mm:$('#inv-height').value?Number($('#inv-height').value):null,currency:'GBP'})});e.target.reset();$('#inv-qty').value=1;$('#inv-unit').value='sheet';await refresh();});
$('#sale-form').addEventListener('submit',async e=>{e.preventDefault();const product=$('#sale-product').value;if(!product)return alert('Select the product sold.');const sale=await api('/api/sales',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({product_id:product,channel:$('#sale-channel').value||null,quantity:Number($('#sale-qty').value||1),gross_revenue:Number($('#sale-revenue').value),fees:$('#sale-fees').value?Number($('#sale-fees').value):0,shipping_cost:$('#sale-shipping').value?Number($('#sale-shipping').value):0,refunds:$('#sale-refunds').value?Number($('#sale-refunds').value):0,currency:'GBP'})});$('#sale-result').textContent=sale.stock_warning||'Sale recorded.';e.target.reset();$('#sale-qty').value=1;await refresh();});
$('#expense-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/expenses',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({category:$('#expense-category').value,description:$('#expense-description').value,amount:Number($('#expense-amount').value),occurred_at:$('#expense-date').value||null,currency:'GBP'})});e.target.reset();await refresh();});
$('#dxf-form').addEventListener('submit',async e=>{e.preventDefault();const files=[...$('#dxf-file').files];if(!files.length)return;const fd=new FormData();for(const f of files)fd.append(files.length===1?'file':'files',f);if(files.length===1)fd.append('name',$('#dxf-name').value);fd.append('category',$('#dxf-category').value);fd.append('legal_status',$('#dxf-legal').value);if($('#dxf-units').value)fd.append('unit_override',$('#dxf-units').value);if($('#dxf-material').value)fd.append('primary_material_inventory_item_id',$('#dxf-material').value);$('#dxf-result').textContent=`Analysing ${files.length} DXF${files.length===1?'':'s'}…`;try{if(files.length===1){const p=await api('/api/products/upload-dxf',{method:'POST',body:fd});$('#dxf-result').innerHTML=`Created <strong>${esc(p.product_code)} — ${esc(p.name)}</strong>.`;}else{const r=await api('/api/products/upload-dxfs',{method:'POST',body:fd});$('#dxf-result').textContent=`Created ${r.created} product lines · ${r.duplicates} duplicates skipped · ${r.errors} errors.`;}e.target.reset();await refresh();}catch(err){$('#dxf-result').textContent=`ERROR: ${err.message}`;}});

(async()=>{await loadLayout();enableDragLayout();await refresh();setInterval(()=>refresh().catch(()=>{}),60000);})().catch(err=>{console.error(err);$('#health').textContent='OFFLINE';$('#health').className='status-pill bad';$('#system-banner').className='system-banner';$('#system-banner').textContent=`MERLIN backend unavailable: ${err.message}`;});
