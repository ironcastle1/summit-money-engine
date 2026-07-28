(async function(){
const $=id=>document.getElementById(id);
MoneyMap.init();
MoneyMap.legend();
$('panelClose').onclick=()=>$('panel').style.display='none';

const TEXT={
 en:{searchPlaceholder:'Search street, area, town or city',radius:'Radius',allSignals:'All signals',securityOnly:'Security only',crisisOnly:'Crisis only',movementOnly:'Movement only',moneyOnly:'Money only',scan:'SCAN',liveBrief:'LIVE BRIEF',cityRisk:'CITY RISK',crisis:'CRISIS',sources:'SOURCES',overlays:'OVERLAYS',refresh:'REFRESH',dotsOn:'DOTS ON',dotsOff:'DOTS OFF'},
 ar:{searchPlaceholder:'ابحث عن شارع أو منطقة أو مدينة',radius:'النطاق',allSignals:'كل الإشارات',securityOnly:'الأمن فقط',crisisOnly:'الأزمات فقط',movementOnly:'الحركة فقط',moneyOnly:'المال فقط',scan:'مسح',liveBrief:'موجز حي',cityRisk:'خطر المدينة',crisis:'أزمة',sources:'مصادر',overlays:'طبقات',refresh:'تحديث',dotsOn:'النقاط تعمل',dotsOff:'النقاط مطفأة'},
 uk:{searchPlaceholder:'Пошук вулиці, району, міста',radius:'Радіус',allSignals:'Усі сигнали',securityOnly:'Тільки безпека',crisisOnly:'Тільки криза',movementOnly:'Тільки рух',moneyOnly:'Тільки гроші',scan:'СКАН',liveBrief:'ЖИВИЙ ЗВІТ',cityRisk:'РИЗИК МІСТА',crisis:'КРИЗА',sources:'ДЖЕРЕЛА',overlays:'ШАРИ',refresh:'ОНОВИТИ',dotsOn:'ТОЧКИ УВІМК',dotsOff:'ТОЧКИ ВИМК'},
 es:{searchPlaceholder:'Buscar calle, zona, pueblo o ciudad',radius:'Radio',allSignals:'Todas las señales',securityOnly:'Solo seguridad',crisisOnly:'Solo crisis',movementOnly:'Solo movimiento',moneyOnly:'Solo dinero',scan:'ESCANEAR',liveBrief:'RESUMEN EN VIVO',cityRisk:'RIESGO CIUDAD',crisis:'CRISIS',sources:'FUENTES',overlays:'CAPAS',refresh:'ACTUALIZAR',dotsOn:'PUNTOS ON',dotsOff:'PUNTOS OFF'},
 ru:{searchPlaceholder:'Поиск улицы, района или города',radius:'Радиус',allSignals:'Все сигналы',securityOnly:'Только безопасность',crisisOnly:'Только кризис',movementOnly:'Только движение',moneyOnly:'Только деньги',scan:'СКАН',liveBrief:'СВОДКА',cityRisk:'РИСК ГОРОДА',crisis:'КРИЗИС',sources:'ИСТОЧНИКИ',overlays:'СЛОИ',refresh:'ОБНОВИТЬ',dotsOn:'ТОЧКИ ВКЛ',dotsOff:'ТОЧКИ ВЫКЛ'},
 fa:{searchPlaceholder:'جستجوی خیابان، منطقه یا شهر',radius:'شعاع',allSignals:'همه سیگنال‌ها',securityOnly:'فقط امنیت',crisisOnly:'فقط بحران',movementOnly:'فقط رفت‌وآمد',moneyOnly:'فقط پول',scan:'اسکن',liveBrief:'گزارش زنده',cityRisk:'ریسک شهر',crisis:'بحران',sources:'منابع',overlays:'لایه‌ها',refresh:'تازه‌سازی',dotsOn:'نقاط روشن',dotsOff:'نقاط خاموش'},
 tr:{searchPlaceholder:'Sokak, bölge, kasaba veya şehir ara',radius:'Yarıçap',allSignals:'Tüm sinyaller',securityOnly:'Sadece güvenlik',crisisOnly:'Sadece kriz',movementOnly:'Sadece hareket',moneyOnly:'Sadece para',scan:'TARA',liveBrief:'CANLI ÖZET',cityRisk:'ŞEHİR RİSKİ',crisis:'KRİZ',sources:'KAYNAKLAR',overlays:'KATMANLAR',refresh:'YENİLE',dotsOn:'NOKTALAR AÇIK',dotsOff:'NOKTALAR KAPALI'}
};
function applyLang(){
 const lang=$('languageSelect').value||'en';
 const t=TEXT[lang]||TEXT.en;
 document.documentElement.lang=lang;
 document.documentElement.dir='ltr';
 document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(t[k])el.textContent=t[k];});
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const k=el.dataset.i18nPlaceholder;if(t[k])el.placeholder=t[k];});
 if(window.MoneyMap&&MoneyMap.setLanguage)MoneyMap.setLanguage(t);
}
$('languageSelect').addEventListener('change',applyLang);
applyLang();

async function load(){
  const [s,m]=await Promise.all([API.state(),API.mapData()]);
  window.APP_STATE=s;
  window.MAP_DATA=m;
  MoneyMap.setData(m,s);
  Renderers.liveBrief(s.liveBrief);
}

try{await load();}catch(e){Renderers.panel('Load failed',`<div class="card"><h3>Backend failed</h3><p>${e.message}</p></div>`)}

document.querySelectorAll('#tabs button[data-tab]').forEach(btn=>btn.onclick=async()=>{
  const tab=btn.dataset.tab;
  const s=window.APP_STATE||await API.state();
  if(tab==='live')Renderers.liveBrief(s.liveBrief);
  else if(tab==='sources')Renderers.sources(await API.sources());
  else if(tab==='crisis')Renderers.crisis(s);
  else if(tab==='city')Renderers.cityRisk();
});

function scanInput(){
  return {
    query:String($('searchBox').value||'').trim(),
    radiusMiles:Number($('radiusMiles').value||5),
    filter:String($('scanFilter').value||'all')
  };
}
async function runAreaScan(input){
  const query=String(input.query||'').trim();
  if(!query)return;
  const radiusMiles=Number(input.radiusMiles||5);
  const filter=String(input.filter||'all');
  Renderers.panel('Area Scan',`<div class="card"><h3>Scanning ${query}</h3><div class="loader"><span></span></div><p class="plain">Checking radius intelligence, emergency infrastructure, events, weather and local data where available.</p></div>`);
  try{
    const result=await API.areaScan({query,radiusMiles,filter});
    if(result.ok&&result.target&&window.MoneyMap&&MoneyMap.drawAreaScan)MoneyMap.drawAreaScan(result);
    Renderers.areaScanResult(result);
  }catch(e){
    Renderers.panel('Area Scan failed',`<div class="card"><h3>Scan failed</h3><p class="plain">${e.message}</p></div>`);
  }
}

$('searchBtn').onclick=async()=>runAreaScan(scanInput());
$('searchBox').addEventListener('keydown', async e=>{if(e.key==='Enter'){e.preventDefault();await runAreaScan(scanInput());}});

const ev=new EventSource('/api/stream');
ev.onmessage=msg=>{try{const p=JSON.parse(msg.data);if(p.state){window.APP_STATE=p.state;API.mapData().then(m=>{window.MAP_DATA=m;MoneyMap.setData(m,p.state);});}}catch{}};
})();
