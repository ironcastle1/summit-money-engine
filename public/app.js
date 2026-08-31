const API=(window.MERLIN_CONFIG&&window.MERLIN_CONFIG.API_BASE_URL)||'';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cache={health:null,dashboard:null,orders:[],inventory:[],products:[],activity:[],observations:[],evidence:[],priorities:[],intake:[],opportunities:[],currentDraft:null};
const stages=['new','confirmed','queued','cutting','deburring','surface_prep','painting','curing','qc','packing','ready','dispatched','cancelled'];
const productionStages=['new','confirmed','queued','cutting','deburring','surface_prep','painting','curing','qc','packing','ready'];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v,c='GBP'){if(v==null||v==='')return '—';try{return new Intl.NumberFormat('en-GB',{style:'currency',currency:c||'GBP'}).format(Number(v));}catch{return `£${Number(v).toFixed(2)}`;}}
function num(v,d=1){return v==null||v===''?'—':Number(v).toLocaleString('en-GB',{maximumFractionDigits:d});}
function label(v){return String(v??'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());}
function date(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function jsonHeaders(){return {'content-type':'application/json'};}
async function api(path,opts={}){const r=await fetch(`${API}${path}`,opts);const text=await r.text();let body;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}if(!r.ok)throw new Error(body?.error||body?.message||`${r.status} ${r.statusText}`);return body;}
function pill(text,kind='info'){return `<span class="pill ${kind}">${esc(text)}</span>`;}
function statusKind(v){if(['validated','ready','dispatched','success'].includes(v))return 'good';if(['review_required','queued','painting','curing','packing'].includes(v))return 'warn';if(['failed','cancelled','overdue'].includes(v))return 'bad';return 'info';}
function matSize(i){const parts=[];if(i.thickness_mm!=null)parts.push(`${num(i.thickness_mm,2)}mm`);if(i.width_mm!=null&&i.height_mm!=null)parts.push(`${num(i.width_mm,1)}×${num(i.height_mm,1)}mm`);if(i.length_mm!=null)parts.push(`${num(i.length_mm,1)}mm long`);return parts.join(' · ')||'—';}
function available(i){return Number(i.quantity_on_hand||0)-Number(i.quantity_reserved||0);}

async function loadAll(){
  const [health,dashboard,orders,inventory,products,alerts,activity,observations,evidence,priorities,intake,opportunities]=await Promise.all([
    api('/api/health'),api('/api/dashboard'),api('/api/orders?active=1'),api('/api/inventory'),api('/api/products'),api('/api/inventory/alerts'),api('/api/activity?limit=40'),api('/api/market/observations'),api('/api/market/evidence?limit=50'),api('/api/priorities?limit=14'),api('/api/intake?limit=25'),api('/api/market/opportunities?limit=16')
  ]);
  Object.assign(cache,{health,dashboard,orders,inventory,products,alerts,activity,observations,evidence,priorities,intake,opportunities});
  render();
}

function render(){renderHealth();renderMetrics();renderIntake();renderPriorities();renderOrders();renderProduction();renderInventory();renderProducts();renderFinance();renderActivity();renderMarket();populateSelects();}

function renderHealth(){
  $('#health').textContent='LIVE';$('#health').className='status-pill good';
  $('#input-pill').textContent='INPUT READY';$('#input-pill').className='status-pill good';
  const rs=cache.health?.research||{};$('#market-pill').textContent=rs.evidence_count?`MARKET ${rs.evidence_count}`:'MARKET EMPTY';$('#market-pill').className=`status-pill ${rs.evidence_count?'good':'warn'}`;
  if(rs.last_error){$('#system-banner').className='system-banner';$('#system-banner').textContent=`Market collector warning: ${rs.last_error}`;}
  else $('#system-banner').className='system-banner hidden';
}
function renderMetrics(){const d=cache.dashboard||{};const raw=cache.inventory.filter(i=>['raw_material','offcut'].includes(i.kind));const supply=cache.inventory.filter(i=>['consumable','hardware','packaging'].includes(i.kind));const finished=cache.inventory.filter(i=>i.kind==='finished_product');const data=[['Open orders',d.open_order_count||0,money(d.open_order_value),''],['Due today',d.due_today_count||0,'customer jobs',d.due_today_count?'warn':''],['Overdue',d.overdue_order_count||0,'need attention',d.overdue_order_count?'bad':''],['Revenue MTD',money(d.revenue_mtd),'recorded sales',''],['Expenses MTD',money(d.expenses_mtd),'recorded expenses',''],['Raw stock',raw.length,`${raw.reduce((a,i)=>a+available(i),0)} units/lines`,''],['Supplies',supply.length,`${d.low_stock_count||0} low stock`,d.low_stock_count?'warn':''],['Finished stock',finished.reduce((a,i)=>a+available(i),0),'available units','']];$('#metrics').innerHTML=data.map(([a,b,c,k])=>`<div class="metric ${k}"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c)}</small></div>`).join('');}

function renderPriorities(){const rows=cache.priorities||[];$('#priority-list').innerHTML=rows.length?rows.map(p=>`<div class="priority-row ${p.kind==='overdue_order'?'urgent':p.kind==='low_stock'||p.kind==='due_today'?'warn':''}"><strong>${esc(p.title)}</strong><span>${esc(p.reason)}</span></div>`).join(''):`<div class="empty">No immediate rule-based priority is being triggered by recorded data.</div>`;}

function renderOrders(){const rows=cache.orders||[];$('#orders-body').innerHTML=rows.length?rows.map(o=>{const lines=o.line_summary||o.lines||[];const item=lines.map(l=>l.product_name||l.description||l.product_code||'Unspecified').join(', ')||'—';const qty=lines.reduce((a,l)=>a+Number(l.quantity||0),0)||'—';return `<tr><td class="mono">${esc(o.external_order_id||o.id)}</td><td>${esc(item)}</td><td>${esc(qty)}</td><td>${esc(o.customer_reference||'—')}</td><td>${o.is_overdue?pill(date(o.due_at),'bad'):esc(date(o.due_at))}</td><td><select class="status-select order-status-select" data-order-id="${esc(o.id)}">${stages.map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${label(s)}</option>`).join('')}</select></td><td>${money(o.gross_total,o.currency)}</td></tr>`;}).join(''):`<tr><td colspan="7" class="empty">No open orders recorded.</td></tr>`;}
function renderProduction(){const groups=new Map(productionStages.map(s=>[s,[]]));for(const o of cache.orders||[])if(groups.has(o.status))groups.get(o.status).push(o);$('#production-board').innerHTML=[...groups].map(([stage,rows])=>`<div class="stage-column"><h4>${label(stage)} <span class="stage-count">${rows.length}</span></h4>${rows.length?rows.map(o=>`<div class="job-card"><strong>${esc(o.external_order_id||o.id)}</strong><span>${esc((o.line_summary||[]).map(l=>l.product_name||l.description).filter(Boolean).join(', ')||'Order')}</span><span>${o.due_at?`Due ${date(o.due_at)}`:'No due date'}</span></div>`).join(''):'<div class="muted">None</div>'}</div>`).join('');}
function renderInventory(){const raw=cache.inventory.filter(i=>['raw_material','offcut'].includes(i.kind));const supply=cache.inventory.filter(i=>['consumable','hardware','packaging','other'].includes(i.kind));const finished=cache.inventory.filter(i=>i.kind==='finished_product');$('#raw-inventory').innerHTML=raw.length?raw.map(i=>`<tr><td><button class="inventory-link" data-inventory-id="${esc(i.id)}">${esc(i.name)}</button></td><td>${esc(matSize(i))}</td><td>${num(available(i),2)} ${esc(i.unit)}</td><td>${money(i.unit_cost,i.currency)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">No raw material recorded.</td></tr>`;$('#supply-inventory').innerHTML=supply.length?supply.map(i=>`<tr><td><button class="inventory-link" data-inventory-id="${esc(i.id)}">${esc(i.name)}</button></td><td>${label(i.kind)}</td><td>${num(available(i),2)} ${esc(i.unit)}</td><td>${i.reorder_point==null?'—':`${num(i.reorder_point,2)} ${esc(i.unit)}`}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">No supplies recorded.</td></tr>`;$('#finished-inventory').innerHTML=finished.length?finished.map(i=>`<tr><td>${esc(i.name)}</td><td>${num(i.quantity_on_hand,2)}</td><td>${num(i.quantity_reserved,2)}</td><td>${num(available(i),2)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">No finished stock recorded.</td></tr>`;$('#low-stock').innerHTML=(cache.alerts||[]).length?cache.alerts.map(a=>`<div class="alert-row"><span>${esc(a.name)}</span><span>${num(a.available_quantity,2)} ${esc(a.unit)} available</span></div>`).join(''):'';}
function renderProducts(){const rows=cache.products||[];$('#products-body').innerHTML=rows.length?rows.map(p=>{const r=p;const prodSize=p.target_width_mm&&p.target_height_mm?`${num(p.target_width_mm,1)}×${num(p.target_height_mm,1)} mm`:'Not set';return `<tr><td><button class="product-link" data-product-id="${esc(p.id)}">${esc(p.product_code)}</button></td><td>${esc(p.name)}</td><td>${esc(p.category||'—')}</td><td>${esc(p.primary_material_name||'Not assigned')}</td><td>${esc(prodSize)}</td><td>${pill(label(r.validation_status||p.validation_status||'review_required'),statusKind(r.validation_status||p.validation_status))}</td><td>${esc(label(p.status))}</td><td>${money(p.selling_price)}</td></tr>`}).join(''):`<tr><td colspan="8" class="empty">No products yet. Upload a DXF below this section.</td></tr>`;}
function renderFinance(){const d=cache.dashboard||{};$('#finance-summary').innerHTML=`<div class="finance-box"><span>Revenue this month</span><strong>${money(d.revenue_mtd)}</strong></div><div class="finance-box"><span>Expenses this month</span><strong>${money(d.expenses_mtd)}</strong></div><div class="finance-box"><span>Sales fees/shipping</span><strong>${money(d.sales_costs_mtd)}</strong></div><div class="finance-box"><span>Open order value</span><strong>${money(d.open_order_value)}</strong></div>`;}
function renderActivity(){const rows=cache.activity||[];$('#activity-list').innerHTML=rows.length?rows.slice(0,30).map(e=>`<div class="activity-row"><time>${date(e.created_at)}</time><div><strong>${esc(e.title||label(e.type))}</strong><span>${esc(e.detail||'')}</span></div></div>`).join(''):`<div class="empty">No activity recorded.</div>`;}
function renderMarket(){
  const rs=cache.health?.research||{};
  $('#research-status').className=`inline-status ${rs.last_status==='failed'?'bad':rs.evidence_count?'good':'warn'}`;
  $('#research-status').textContent=rs.last_status==='running'?'Market scan running…':rs.last_error?`Last scan error: ${rs.last_error}`:rs.evidence_count?`${rs.evidence_count} raw evidence items stored · ${rs.observation_count} evidence summaries · last scan ${date(rs.last_run_at)}`:'No market evidence stored yet. Press Scan now or leave MERLIN online for scheduled collection.';
  const rows=(cache.opportunities?.length?cache.opportunities:cache.observations)||[];
  $('#observations').innerHTML=rows.length?rows.slice(0,12).map(o=>`<div class="observation"><h3>${esc(o.topic)}</h3>${o.domain_count!=null?`<div class="observation-meta">${esc(o.domain_count)} source domain${Number(o.domain_count)===1?'':'s'}${o.price_evidence_count?` · ${esc(o.price_evidence_count)} result${Number(o.price_evidence_count)===1?'':'s'} with observed price evidence`:''}</div>`:''}<p>${esc(o.observation)}</p>${o.why_valuable?`<p class="why"><strong>Why inspect it:</strong> ${esc(o.why_valuable)}</p>`:''}<details><summary>Evidence, unknowns and sources</summary><div><strong>Direct evidence</strong><ul>${(o.direct_evidence||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>None recorded</li>'}</ul><strong>Unknowns</strong><ul>${(o.unknowns||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>None stated</li>'}</ul>${o.suggested_test?`<p><strong>Validation:</strong> ${esc(o.suggested_test)}</p>`:''}</div></details><div class="source-list">${(o.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.publisher||s.title||'Source')}</a>`).join('')}</div></div>`).join(''):`<div class="empty">No opportunity evidence yet. MERLIN will leave this empty rather than invent conclusions.</div>`;
  $('#market-evidence').innerHTML=(cache.evidence||[]).length?cache.evidence.slice(0,40).map(e=>`<div class="evidence-item"><strong>${esc(e.title||e.query)}</strong><span>${esc(e.publisher||'')} · ${date(e.collected_at)}${e.observed_price!=null?` · ${money(e.observed_price,e.currency||'GBP')}`:''}</span><span>${esc(e.snippet||'')}</span>${/^https?:/.test(e.url)?`<a href="${esc(e.url)}" target="_blank" rel="noreferrer">Open source</a>`:''}</div>`).join(''):`<div class="empty">No raw market evidence yet.</div>`;
}
function fieldLabel(k){return label(k.replace(/^source_text$/,'original statement'));}
function renderIntake(){
  const list=$('#intake-history');
  const rows=cache.intake||[];
  list.innerHTML=rows.length?rows.slice(0,10).map(r=>`<div class="intake-history-row"><span>${date(r.created_at)}</span><strong>${esc(label(r.action))}</strong><em class="${r.status==='committed'?'good-text':r.status==='ready'?'warn-text':'muted'}">${esc(label(r.status))}</em></div>`).join(''):'<div class="empty">No statements processed yet.</div>';
}
function showIntakeDraft(d){
  cache.currentDraft=d;const box=$('#intake-preview');
  const fields=Object.entries(d.fields||{}).filter(([k,v])=>k!=='source_text'&&v!=null&&v!=='');
  const missing=d.missing_fields||[];
  box.innerHTML=`<div class="intake-draft ${d.can_commit?'ready':'needs-input'}"><div class="intake-title"><strong>${esc(d.title)}</strong>${d.can_commit?pill('Ready to record','good'):pill('Needs clarification','warn')}</div><div class="intake-fields">${fields.map(([k,v])=>`<div><span>${esc(fieldLabel(k))}</span><strong>${esc(typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('')}</div>${missing.length?`<p class="intake-missing"><strong>Not recorded yet.</strong> Missing: ${esc(missing.map(label).join(', '))}</p>`:''}${(d.notes||[]).map(n=>`<p class="muted">${esc(n)}</p>`).join('')}<div class="intake-actions">${d.can_commit?`<button data-intake-commit="${esc(d.intake_id)}">Record this</button>`:''}<button class="secondary" data-intake-clear>Clear</button></div></div>`;
}
function clearIntakeDraft(){cache.currentDraft=null;$('#intake-preview').innerHTML='<div class="empty">Type a concrete business statement. MERLIN will show exactly what it understood before anything is written.</div>';}
function populateSelects(){const products=cache.products||[],raw=cache.inventory.filter(i=>i.kind==='raw_material');const order=$('#order-product'),material=$('#dxf-material'),sale=$('#sale-product');const ov=order.value,mv=material.value,sv=sale.value;order.innerHTML='<option value="">Custom / unlinked</option>'+products.map(p=>`<option value="${esc(p.id)}">${esc(p.product_code)} — ${esc(p.name)}</option>`).join('');material.innerHTML='<option value="">Not assigned</option>'+raw.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(matSize(i))}</option>`).join('');sale.innerHTML='<option value="">Unlinked</option>'+products.map(p=>`<option value="${esc(p.id)}">${esc(p.product_code)} — ${esc(p.name)}</option>`).join('');if([...order.options].some(o=>o.value===ov))order.value=ov;if([...material.options].some(o=>o.value===mv))material.value=mv;if([...sale.options].some(o=>o.value===sv))sale.value=sv;}

async function refresh(){await loadAll();}

// Persistent dashboard layout
async function loadLayout(){try{const p=await api('/api/preferences/dashboard-layout');const grid=$('#dashboard-grid');for(const id of p.order||[]){const el=grid.querySelector(`[data-widget-id="${CSS.escape(id)}"]`);if(el)grid.appendChild(el);}for(const el of $$('.widget')){const span=p.spans?.[el.dataset.widgetId]||Number(el.dataset.span||1);el.dataset.span=span;el.classList.toggle('span-2',Number(span)===2);}}catch{}}
async function saveLayout(){const order=$$('.widget').map(e=>e.dataset.widgetId),spans=Object.fromEntries($$('.widget').map(e=>[e.dataset.widgetId,Number(e.dataset.span||1)]));await api('/api/preferences/dashboard-layout',{method:'PUT',headers:jsonHeaders(),body:JSON.stringify({order,spans})});}
function enableDragLayout(){let dragging=null;for(const w of $$('.widget')){w.draggable=true;w.addEventListener('dragstart',e=>{if(!e.target.closest('.drag-handle')){e.preventDefault();return;}dragging=w;w.classList.add('dragging');});w.addEventListener('dragend',()=>{w.classList.remove('dragging');dragging=null;$$('.widget').forEach(x=>x.classList.remove('drag-over'));saveLayout().catch(()=>{});});w.addEventListener('dragover',e=>{if(!dragging||dragging===w)return;e.preventDefault();w.classList.add('drag-over');});w.addEventListener('dragleave',()=>w.classList.remove('drag-over'));w.addEventListener('drop',e=>{e.preventDefault();w.classList.remove('drag-over');if(!dragging||dragging===w)return;const grid=$('#dashboard-grid');const rect=w.getBoundingClientRect();grid.insertBefore(dragging,e.clientY<rect.top+rect.height/2?w:w.nextSibling);});}
  document.addEventListener('click',e=>{const b=e.target.closest('.span-toggle');if(!b)return;const w=b.closest('.widget');w.dataset.span=Number(w.dataset.span||1)===2?1:2;w.classList.toggle('span-2',Number(w.dataset.span)===2);saveLayout().catch(()=>{});});}

async function openProduct(pid){
  const p=await api(`/api/products/${encodeURIComponent(pid)}`);
  const r=p.revisions?.[0]||{};
  $('#dialog-code').textContent=p.product_code;
  $('#dialog-name').textContent=p.name;
  let issues=[];
  try{issues=JSON.parse(r.validation_json||'{}').issues||[]}catch{}
  const invOptions=cache.inventory.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(i.unit)}</option>`).join('');
  const bomRows=(p.bom||[]).length?(p.bom||[]).map(x=>`<tr><td>${esc(x.inventory_name)}</td><td>${num(x.quantity_per_unit,4)} ${esc(x.inventory_unit)}</td><td>${x.inventory_unit_cost==null?'—':money(Number(x.inventory_unit_cost)*Number(x.quantity_per_unit),'GBP')}</td></tr>`).join(''):`<tr><td colspan="3" class="empty">No BOM lines recorded. Production can only auto-consume items that are recorded here or explicitly entered on a production run.</td></tr>`;
  $('#product-detail').innerHTML=`
    <div class="detail-grid">
      <div class="detail-item"><span>State</span><strong>${esc(label(p.status))}</strong></div>
      <div class="detail-item"><span>Material</span><strong>${esc(p.primary_material_name||'Not assigned')}</strong></div>
      <div class="detail-item"><span>Selling price</span><strong>${money(p.selling_price)}</strong></div>
      <div class="detail-item"><span>Production target</span><strong>${p.target_width_mm&&p.target_height_mm?`${num(p.target_width_mm,1)} × ${num(p.target_height_mm,1)} mm`:'Not set'}</strong></div>
      <div class="detail-item"><span>DXF source extent</span><strong>${num(r.drawing_width_units,2)} × ${num(r.drawing_height_units,2)} drawing units</strong></div>
      <div class="detail-item"><span>DXF units</span><strong>${r.units_confirmed?esc(r.unit_name||'confirmed'):'Not confirmed'}</strong></div>
      <div class="detail-item"><span>Entities</span><strong>${esc(r.entity_count??'—')}</strong></div>
      <div class="detail-item"><span>Open paths</span><strong>${esc(r.open_path_count??'—')}</strong></div>
      <div class="detail-item"><span>Machine fit</span><strong>${r.fits_machine==null?'Unknown':r.fits_machine?'Yes':'No'}</strong></div>
    </div>
    <p><a class="button-link" target="_blank" href="${API}/api/products/${encodeURIComponent(p.id)}/preview">Open actual geometry preview</a></p>
    <form id="product-update-form" class="quick-form">
      <h3>Production details</h3>
      <div class="form-grid">
        <label>Target width mm<input id="pd-width" type="number" step="0.1" value="${p.target_width_mm??''}"></label>
        <label>Target height mm<input id="pd-height" type="number" step="0.1" value="${p.target_height_mm??''}"></label>
        <label>Selling price £<input id="pd-price" type="number" step="0.01" value="${p.selling_price??''}"></label>
        <label>Primary material<select id="pd-material"><option value="">Not assigned</option>${cache.inventory.filter(i=>i.kind==='raw_material').map(i=>`<option value="${esc(i.id)}" ${i.id===p.primary_material_inventory_item_id?'selected':''}>${esc(i.name)} · ${esc(matSize(i))}</option>`).join('')}</select></label>
      </div>
      <button type="submit">Save details</button>
    </form>
    <form id="production-run-form" class="quick-form">
      <h3>Record production run</h3>
      <div class="form-grid">
        <label>Quantity<input id="run-qty" type="number" min="1" value="1" required></label>
        <label>Cut minutes<input id="run-cut" type="number" min="0" step="0.01"></label>
        <label>Cleanup minutes<input id="run-clean" type="number" min="0" step="0.01"></label>
        <label>Finishing minutes<input id="run-finish" type="number" min="0" step="0.01"></label>
        <label>Packaging minutes<input id="run-pack" type="number" min="0" step="0.01"></label>
        <label>Explicit raw material<select id="run-material"><option value="">Use BOM / none</option>${cache.inventory.filter(i=>['raw_material','offcut'].includes(i.kind)).map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(matSize(i))}</option>`).join('')}</select></label>
        <label>Material qty consumed<input id="run-material-qty" type="number" min="0" step="any"></label>
        <label>Result<select id="run-success"><option value="true">Successful</option><option value="false">Failed</option></select></label>
        <label>Notes<input id="run-notes"></label>
      </div>
      <button type="submit">Record run & update stock</button>
    </form>
    <section class="quick-form">
      <h3>Bill of materials</h3>
      <div class="table-wrap"><table><thead><tr><th>Inventory item</th><th>Qty per finished unit</th><th>Recorded input cost</th></tr></thead><tbody>${bomRows}</tbody></table></div>
      <form id="bom-form" class="form-grid">
        <label>Inventory item<select id="bom-item" required><option value="">Select</option>${invOptions}</select></label>
        <label>Quantity per product<input id="bom-qty" type="number" min="0.000001" step="any" required></label>
        <label>Notes<input id="bom-notes"></label>
        <label><span>&nbsp;</span><button type="submit">Add/update BOM line</button></label>
      </form>
    </section>
    ${r.id?`<form id="unit-confirm-form" class="quick-form"><h3>DXF source units</h3><div class="form-grid"><label>Confirm DXF units<select id="pd-units"><option value="millimeters">Millimetres</option><option value="inches">Inches</option><option value="centimeters">Centimetres</option><option value="meters">Metres</option></select></label></div><button type="submit">Recalculate DXF dimensions</button></form>`:''}
    <section class="quick-form"><h3>Product files</h3><p class="muted">Photos, listing documents and other files are automatically stored inside this product's permanent folder.</p><div class="asset-list">${(p.assets||[]).length?(p.assets||[]).map(a=>`<div class="asset-row"><a href="${API}/api/product-assets/${encodeURIComponent(a.id)}/file" target="_blank"><strong>${esc(a.original_filename)}</strong></a><span>${esc(label(a.asset_kind))} · ${date(a.created_at)}</span></div>`).join(''):'<div class="empty">No extra product files stored.</div>'}</div><form id="asset-form" class="form-grid"><label>Files<input id="asset-files" type="file" multiple required></label><label>Sort as<select id="asset-kind"><option value="">Automatic by file type</option><option value="photos">Photos</option><option value="listings">Listing files</option><option value="documents">Documents</option><option value="production">Production files</option><option value="costing">Costing files</option><option value="assets">Other assets</option></select></label><label><span>&nbsp;</span><button type="submit">Add files to product</button></label></form><form id="revision-form" class="form-grid"><label>New DXF revision<input id="revision-file" type="file" accept=".dxf" required></label><label>Units<select id="revision-units"><option value="">Use file / unknown</option><option value="millimeters">Millimetres</option><option value="inches">Inches</option><option value="centimeters">Centimetres</option><option value="meters">Metres</option></select></label><label><span>&nbsp;</span><button type="submit">Add DXF revision</button></label></form></section>
    <h3>Geometry review</h3>
    ${issues.length?issues.map(i=>`<div class="issue"><strong>${esc(i.code)}</strong> — ${esc(i.message)}</div>`).join(''):'<div class="empty">No parsed issues recorded.</div>'}
  `;
  $('#product-dialog').showModal();
  $('#product-update-form').addEventListener('submit',async e=>{
    e.preventDefault();
    await api(`/api/products/${encodeURIComponent(p.id)}`,{method:'PATCH',headers:jsonHeaders(),body:JSON.stringify({
      target_width_mm:$('#pd-width').value?Number($('#pd-width').value):null,
      target_height_mm:$('#pd-height').value?Number($('#pd-height').value):null,
      selling_price:$('#pd-price').value?Number($('#pd-price').value):null,
      primary_material_inventory_item_id:$('#pd-material').value||null
    })});
    $('#product-dialog').close();await refresh();
  });
  $('#production-run-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const mins=id=>$(id).value?Number($(id).value)*60:null;
    await api('/api/production-runs',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({
      product_id:p.id,
      revision_id:r.id||null,
      machine_id:'MACH-CROSSFIRE-2X2',
      quantity:Number($('#run-qty').value||1),
      material_inventory_item_id:$('#run-material').value||null,
      material_quantity_consumed:$('#run-material-qty').value?Number($('#run-material-qty').value):null,
      cut_seconds:mins('#run-cut'),cleanup_seconds:mins('#run-clean'),finishing_seconds:mins('#run-finish'),packaging_seconds:mins('#run-pack'),
      success:$('#run-success').value==='true',notes:$('#run-notes').value||null,consume_bom:true
    })});
    $('#product-dialog').close();await refresh();
  });
  $('#bom-form').addEventListener('submit',async e=>{
    e.preventDefault();
    await api(`/api/products/${encodeURIComponent(p.id)}/bom`,{method:'POST',headers:jsonHeaders(),body:JSON.stringify({inventory_item_id:$('#bom-item').value,quantity_per_unit:Number($('#bom-qty').value),notes:$('#bom-notes').value||null})});
    $('#product-dialog').close();await refresh();await openProduct(p.id);
  });
  $('#unit-confirm-form')?.addEventListener('submit',async e=>{
    e.preventDefault();
    await api(`/api/revisions/${encodeURIComponent(r.id)}/units`,{method:'POST',headers:jsonHeaders(),body:JSON.stringify({unit:$('#pd-units').value})});
    $('#product-dialog').close();await refresh();
  });
  $('#asset-form')?.addEventListener('submit',async e=>{e.preventDefault();const files=[...$('#asset-files').files];if(!files.length)return;const fd=new FormData();for(const f of files)fd.append('files',f);if($('#asset-kind').value)fd.append('kind',$('#asset-kind').value);await api(`/api/products/${encodeURIComponent(p.id)}/assets`,{method:'POST',body:fd});$('#product-dialog').close();await refresh();await openProduct(p.id);});
  $('#revision-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=$('#revision-file').files[0];if(!f)return;const fd=new FormData();fd.append('file',f);if($('#revision-units').value)fd.append('unit_override',$('#revision-units').value);await api(`/api/products/${encodeURIComponent(p.id)}/revisions`,{method:'POST',body:fd});$('#product-dialog').close();await refresh();await openProduct(p.id);});
}

async function openInventory(iid){const i=await api(`/api/inventory/${encodeURIComponent(iid)}`);$('#inv-dialog-name').textContent=i.name;$('#inventory-detail').innerHTML=`<div class="detail-grid"><div class="detail-item"><span>Type</span><strong>${esc(label(i.kind))}</strong></div><div class="detail-item"><span>On hand</span><strong>${num(i.quantity_on_hand,2)} ${esc(i.unit)}</strong></div><div class="detail-item"><span>Available</span><strong>${num(i.available_quantity,2)} ${esc(i.unit)}</strong></div><div class="detail-item"><span>Size</span><strong>${esc(matSize(i))}</strong></div><div class="detail-item"><span>Unit cost</span><strong>${money(i.unit_cost,i.currency)}</strong></div><div class="detail-item"><span>Location</span><strong>${esc(i.location||'—')}</strong></div></div><form id="inventory-update-form" class="quick-form"><div class="form-grid"><label>Count on hand<input id="iu-qty" type="number" step="any" value="${i.quantity_on_hand}"></label><label>Unit cost £<input id="iu-cost" type="number" step="0.01" value="${i.unit_cost??''}"></label><label>Reorder at<input id="iu-reorder" type="number" step="any" value="${i.reorder_point??''}"></label><label>Location<input id="iu-location" value="${esc(i.location||'')}"></label></div><button type="submit">Save stocktake</button></form>`;$('#inventory-dialog').showModal();$('#inventory-update-form').addEventListener('submit',async e=>{e.preventDefault();await api(`/api/inventory/${encodeURIComponent(i.id)}`,{method:'PATCH',headers:jsonHeaders(),body:JSON.stringify({unit_cost:$('#iu-cost').value?Number($('#iu-cost').value):null,reorder_point:$('#iu-reorder').value?Number($('#iu-reorder').value):null,location:$('#iu-location').value||null})});const delta=Number($('#iu-qty').value)-Number(i.quantity_on_hand||0);if(delta!==0)await api('/api/inventory/movements',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({inventory_item_id:i.id,movement_type:'adjust',quantity:delta,notes:'Owner stocktake correction'})});$('#inventory-dialog').close();await refresh();});}

$('#refresh').addEventListener('click',()=>refresh().catch(e=>alert(e.message)));$('#dialog-close').addEventListener('click',()=>$('#product-dialog').close());$('#inv-dialog-close').addEventListener('click',()=>$('#inventory-dialog').close());
document.addEventListener('click',e=>{const p=e.target.closest('[data-product-id]');if(p)openProduct(p.dataset.productId).catch(err=>alert(err.message));const i=e.target.closest('[data-inventory-id]');if(i)openInventory(i.dataset.inventoryId).catch(err=>alert(err.message));});
document.addEventListener('change',async e=>{if(e.target.matches('.order-status-select')){await api(`/api/orders/${encodeURIComponent(e.target.dataset.orderId)}`,{method:'PATCH',headers:jsonHeaders(),body:JSON.stringify({status:e.target.value})});await refresh();}});
$('#intake-form').addEventListener('submit',async e=>{e.preventDefault();const input=$('#intake-input'),text=input.value.trim();if(!text)return;$('#intake-preview').innerHTML='<div class="empty">Parsing statement…</div>';try{const d=await api('/api/intake/parse',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({text})});showIntakeDraft(d);await refresh();}catch(err){$('#intake-preview').innerHTML=`<div class="inline-status bad">${esc(err.message)}</div>`;}});
document.addEventListener('click',async e=>{const c=e.target.closest('[data-intake-commit]');if(c){c.disabled=true;try{const r=await api(`/api/intake/${encodeURIComponent(c.dataset.intakeCommit)}/commit`,{method:'POST'});$('#intake-input').value='';$('#intake-preview').innerHTML=`<div class="inline-status good">Recorded. ${esc(r.action?label(r.action):'Business data updated')}.</div>`;await refresh();}catch(err){c.disabled=false;alert(err.message);}}if(e.target.closest('[data-intake-clear]'))clearIntakeDraft();});
$('#market-scan').addEventListener('click',async()=>{const b=$('#market-scan');b.disabled=true;b.textContent='Starting…';try{await api('/api/market/research',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({focus:$('#market-focus').value.trim()||null})});await refresh();b.textContent='Scan running';setTimeout(()=>{b.disabled=false;b.textContent='Scan now';refresh().catch(()=>{});},15000);}catch(err){b.disabled=false;b.textContent='Scan now';alert(err.message);}});
$('#order-form').addEventListener('submit',async e=>{e.preventDefault();const product=$('#order-product').value||null,description=$('#order-description').value.trim()||null;if(!product&&!description)return alert('Select a product or enter a description.');const qty=Number($('#order-qty').value||1),unitPrice=$('#order-unit-price').value?Number($('#order-unit-price').value):null;await api('/api/orders',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({external_order_id:$('#order-external').value||null,channel:$('#order-channel').value||null,customer_reference:$('#order-customer').value||null,due_at:$('#order-due').value||null,gross_total:$('#order-total').value?Number($('#order-total').value):(unitPrice!=null?unitPrice*qty:null),status:'new',currency:'GBP',lines:[{product_id:product,description,quantity:qty,unit_price:unitPrice}]})});e.target.reset();$('#order-qty').value=1;await refresh();});
$('#raw-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/inventory',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({kind:'raw_material',name:$('#raw-name').value,quantity_on_hand:Number($('#raw-qty').value||0),unit:$('#raw-unit').value||'sheet',unit_cost:$('#raw-cost').value?Number($('#raw-cost').value):null,location:$('#raw-location').value||null,material_family:'Steel',form:'sheet',thickness_mm:$('#raw-thickness').value?Number($('#raw-thickness').value):null,width_mm:$('#raw-width').value?Number($('#raw-width').value):null,height_mm:$('#raw-height').value?Number($('#raw-height').value):null,currency:'GBP'})});e.target.reset();$('#raw-qty').value=1;$('#raw-unit').value='sheet';await refresh();});
$('#supply-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/inventory',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({kind:$('#supply-kind').value,name:$('#supply-name').value,quantity_on_hand:Number($('#supply-qty').value||0),unit:$('#supply-unit').value,unit_cost:$('#supply-cost').value?Number($('#supply-cost').value):null,reorder_point:$('#supply-reorder').value?Number($('#supply-reorder').value):null,currency:'GBP'})});e.target.reset();$('#supply-qty').value=1;await refresh();});
$('#sale-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/sales',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({product_id:$('#sale-product').value||null,channel:$('#sale-channel').value||null,quantity:Number($('#sale-qty').value||1),gross_revenue:Number($('#sale-revenue').value),fees:$('#sale-fees').value?Number($('#sale-fees').value):0,shipping_cost:$('#sale-shipping').value?Number($('#sale-shipping').value):0,refunds:$('#sale-refunds').value?Number($('#sale-refunds').value):0,currency:'GBP'})});e.target.reset();$('#sale-qty').value=1;await refresh();});
$('#expense-form').addEventListener('submit',async e=>{e.preventDefault();await api('/api/expenses',{method:'POST',headers:jsonHeaders(),body:JSON.stringify({category:$('#expense-category').value,description:$('#expense-description').value,amount:Number($('#expense-amount').value),occurred_at:$('#expense-date').value||null,currency:'GBP'})});e.target.reset();await refresh();});
$('#dxf-form').addEventListener('submit',async e=>{e.preventDefault();const files=[...$('#dxf-file').files];if(!files.length)return;const fd=new FormData();for(const f of files)fd.append(files.length===1?'file':'files',f);if(files.length===1)fd.append('name',$('#dxf-name').value);fd.append('category',$('#dxf-category').value);fd.append('subcategory',$('#dxf-subcategory').value);fd.append('language',$('#dxf-language').value);fd.append('legal_status',$('#dxf-legal').value);if($('#dxf-units').value)fd.append('unit_override',$('#dxf-units').value);if($('#dxf-material').value)fd.append('primary_material_inventory_item_id',$('#dxf-material').value);$('#dxf-result').textContent=`Analysing ${files.length} DXF${files.length===1?'':'s'} from actual vector geometry…`;try{if(files.length===1){const p=await api('/api/products/upload-dxf',{method:'POST',body:fd});const r=p.revisions?.[0]||{};const size=r.units_confirmed&&r.width_mm!=null?`${num(r.width_mm,1)} × ${num(r.height_mm,1)} mm`:`${num(r.drawing_width_units,2)} × ${num(r.drawing_height_units,2)} drawing units — physical units not confirmed`;$('#dxf-result').innerHTML=`Created <strong>${esc(p.product_code)}</strong> · ${esc(size)} · ${esc(r.entity_count)} entities. <a target="_blank" href="${API}/api/products/${encodeURIComponent(p.id)}/preview">Open geometry preview</a>`;}else{const r=await api('/api/products/upload-dxfs',{method:'POST',body:fd});$('#dxf-result').innerHTML=`Created <strong>${r.created}</strong> products · ${r.duplicates} exact duplicates skipped · ${r.errors} errors.<div class="bulk-results">${r.results.map(x=>`<div>${esc(x.filename)} — ${esc(x.status)}${x.product_code?` · ${esc(x.product_code)}`:''}${x.reason?` · ${esc(x.reason)}`:''}</div>`).join('')}</div>`;}e.target.reset();await refresh();}catch(err){$('#dxf-result').textContent=`ERROR: ${err.message}`;}});

(async()=>{await loadLayout();enableDragLayout();await refresh();setInterval(()=>refresh().catch(()=>{}),60000);})().catch(err=>{console.error(err);$('#health').textContent='OFFLINE';$('#health').className='status-pill bad';$('#system-banner').className='system-banner';$('#system-banner').textContent=`MERLIN backend unavailable: ${err.message}`;});
