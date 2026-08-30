const API = (window.MERLIN_CONFIG?.API_BASE || '').replace(/\/$/, '');
const $ = (s) => document.querySelector(s);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (v,c='GBP') => v == null ? '—' : new Intl.NumberFormat('en-GB',{style:'currency',currency:c}).format(v);

async function api(path, options={}) {
  const r = await fetch(`${API}${path}`, options);
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!r.ok) throw new Error(body?.error || `${r.status} ${r.statusText}`);
  return body;
}

function chat(role, text) {
  const div = document.createElement('div');
  div.className = `chat ${role}`;
  div.innerHTML = `<strong>${role === 'user' ? 'YOU' : 'MERLIN'}</strong><div>${esc(text).replace(/\n/g,'<br>')}</div>`;
  $('#chat-log').append(div);
  $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
}

async function refresh() {
  const [health,dash,state,products,inventory] = await Promise.all([
    api('/api/health'), api('/api/dashboard'), api('/api/state'), api('/api/products'), api('/api/inventory')
  ]);
  $('#health').textContent = health.ok ? 'LIVE' : 'OFFLINE';
  $('#health').className = `health ${health.ok ? 'ok' : ''}`;

  $('#metrics').innerHTML = [
    ['Products', dash.products],
    ['Validated revisions', dash.validated],
    ['Inventory lines', inventory.length],
    ['Current capabilities', state.capabilities.length]
  ].map(([k,v])=>`<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');

  $('#products').innerHTML = products.length ? products.map(p=>`<tr>
    <td class="mono">${esc(p.product_code)}</td><td>${esc(p.name)}</td><td>${esc(p.category||'—')}</td>
    <td>${p.width_mm == null ? '—' : `${p.width_mm.toFixed(1)} × ${p.height_mm.toFixed(1)} mm`}</td>
    <td><span class="pill ${esc(p.validation_status)}">${esc(p.validation_status||'—')}</span></td><td>${esc(p.status)}</td>
  </tr>`).join('') : `<tr><td colspan="6" class="empty">No products ingested yet.</td></tr>`;

  $('#inventory').innerHTML = inventory.length ? inventory.map(i=>`<tr><td>${esc(i.kind)}</td><td>${esc(i.name)}</td><td>${esc(i.quantity_on_hand)} ${esc(i.unit)}</td><td>${money(i.unit_cost,i.currency)}</td><td>${esc(i.location||'—')}</td></tr>`).join('') : `<tr><td colspan="5" class="empty">Inventory is empty. Add only what you actually have.</td></tr>`;

  $('#observations').innerHTML = dash.observations.length ? dash.observations.map(o=>`<div class="observation">
    <h3>${esc(o.topic)}</h3><p>${esc(o.observation)}</p>
    ${o.why_valuable ? `<p><strong>Why it matters:</strong> ${esc(o.why_valuable)}</p>`:''}
    ${(o.direct_evidence||[]).length ? `<details><summary>Direct evidence</summary><ul>${o.direct_evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${(o.unknowns||[]).length ? `<details><summary>Unknowns</summary><ul>${o.unknowns.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${(o.sources||[]).length ? `<details><summary>Sources</summary><ul>${o.sources.map(s=>`<li><a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.title||s.url)}</a></li>`).join('')}</ul></details>`:''}
    ${o.suggested_test ? `<p><strong>Test:</strong> ${esc(o.suggested_test)}</p>`:''}
  </div>`).join('') : '<div class="empty">No market research stored yet.</div>';

  $('#capabilities').innerHTML = state.capabilities.map(c=>`<div class="card"><strong>${esc(c.name)}</strong><span>${esc(c.status)}</span></div>`).join('');
  $('#upgrades').innerHTML = dash.upgrades.length ? dash.upgrades.map(u=>`<div class="card"><strong>${esc(u.trigger)}</strong><p>${esc(u.reason)}</p><ul>${(u.requested_changes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('') : '<div class="empty">No software evolution requested. MERLIN remains focused on the current setup.</div>';
}

$('#refresh').addEventListener('click', ()=>refresh().catch(e=>alert(e.message)));

$('#chat-form').addEventListener('submit', async (e)=>{
  e.preventDefault(); const input=$('#chat-input'); const msg=input.value.trim(); if(!msg)return;
  chat('user',msg); input.value='';
  try { const r=await api('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})}); chat('merlin',r.text); await refresh(); }
  catch(err){ chat('merlin',`ERROR: ${err.message}`); }
});

$('#dxf-form').addEventListener('submit', async (e)=>{
  e.preventDefault(); const f=$('#dxf-file').files[0]; if(!f)return;
  const fd=new FormData(); fd.append('file',f); fd.append('name',$('#dxf-name').value); fd.append('category',$('#dxf-category').value); fd.append('subcategory',$('#dxf-subcategory').value); fd.append('language',$('#dxf-language').value); fd.append('legal_status',$('#dxf-legal').value);
  $('#dxf-result').textContent='Analysing actual DXF geometry…';
  try { const p=await api('/api/products/upload-dxf',{method:'POST',body:fd}); const r=p.revisions[0]; $('#dxf-result').innerHTML=`<strong>${esc(p.product_code)}</strong><br>${r.width_mm.toFixed(1)} × ${r.height_mm.toFixed(1)} mm<br>${r.entity_count} entities<br>Validation: ${esc(r.validation_status)}<br><a target="_blank" href="${API}/api/products/${encodeURIComponent(p.id)}/preview">Open geometry preview</a>`; await refresh(); }
  catch(err){ $('#dxf-result').textContent=`ERROR: ${err.message}`; }
});

$('#inventory-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body={kind:$('#inv-kind').value,name:$('#inv-name').value,unit:$('#inv-unit').value,quantity_on_hand:Number($('#inv-qty').value||0),unit_cost:$('#inv-cost').value?Number($('#inv-cost').value):null,currency:'GBP'};
  try { await api('/api/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); e.target.reset(); await refresh(); }
  catch(err){ alert(err.message); }
});

refresh().catch(err=>{ $('#health').textContent='OFFLINE'; chat('merlin',`Cannot connect to backend: ${err.message}`); });
