import path from 'node:path';
import { analyseDxfText } from './analyse.js';

const SUPPORTED = new Set(['LINE','LWPOLYLINE','POLYLINE','CIRCLE','ARC']);

function fmt(v){
  const n=Number(v);
  if(!Number.isFinite(n)) return '0';
  const s=n.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
  return s==='-0'?'0':s;
}
function safeLayer(v){return String(v||'0').replace(/[\r\n]/g,' ').slice(0,255)||'0';}
function mm(v, minRaw, mmPerUnit, scale){return (Number(v||0)-Number(minRaw||0))*mmPerUnit*scale;}
function point(v,minX,minY,unitScale,scale){return {x:mm(v?.x,minX,unitScale,scale),y:mm(v?.y,minY,unitScale,scale)};}

function lineEntity(e,ctx){
  const a=point(e.vertices?.[0],ctx.minX,ctx.minY,ctx.unitScale,ctx.scale);
  const b=point(e.vertices?.[1],ctx.minX,ctx.minY,ctx.unitScale,ctx.scale);
  return ['0','LINE','100','AcDbEntity','8',safeLayer(e.layer),'100','AcDbLine','10',fmt(a.x),'20',fmt(a.y),'30','0','11',fmt(b.x),'21',fmt(b.y),'31','0'].join('\n');
}
function polylineEntity(e,ctx){
  const vs=e.vertices||[];
  const closed=Boolean(e.shape||e.closed);
  const out=['0','LWPOLYLINE','100','AcDbEntity','8',safeLayer(e.layer),'100','AcDbPolyline','90',String(vs.length),'70',closed?'1':'0'];
  for(const v of vs){
    const p=point(v,ctx.minX,ctx.minY,ctx.unitScale,ctx.scale);
    out.push('10',fmt(p.x),'20',fmt(p.y));
    if(Number.isFinite(Number(v.bulge))&&Number(v.bulge)!==0)out.push('42',fmt(v.bulge));
    if(Number.isFinite(Number(v.startWidth))&&Number(v.startWidth)!==0)out.push('40',fmt(Number(v.startWidth)*ctx.unitScale*ctx.scale));
    if(Number.isFinite(Number(v.endWidth))&&Number(v.endWidth)!==0)out.push('41',fmt(Number(v.endWidth)*ctx.unitScale*ctx.scale));
  }
  return out.join('\n');
}
function circleEntity(e,ctx){
  const c=point(e.center,ctx.minX,ctx.minY,ctx.unitScale,ctx.scale);
  const r=Number(e.radius||0)*ctx.unitScale*ctx.scale;
  return ['0','CIRCLE','100','AcDbEntity','8',safeLayer(e.layer),'100','AcDbCircle','10',fmt(c.x),'20',fmt(c.y),'30','0','40',fmt(r)].join('\n');
}
function arcEntity(e,ctx){
  const c=point(e.center,ctx.minX,ctx.minY,ctx.unitScale,ctx.scale);
  const r=Number(e.radius||0)*ctx.unitScale*ctx.scale;
  return ['0','ARC','100','AcDbEntity','8',safeLayer(e.layer),'100','AcDbCircle','10',fmt(c.x),'20',fmt(c.y),'30','0','40',fmt(r),'100','AcDbArc','50',fmt(e.startAngle||0),'51',fmt(e.endAngle||0)].join('\n');
}
function entityToDxf(e,ctx){
  if(e.type==='LINE')return lineEntity(e,ctx);
  if(e.type==='LWPOLYLINE'||e.type==='POLYLINE')return polylineEntity(e,ctx);
  if(e.type==='CIRCLE')return circleEntity(e,ctx);
  if(e.type==='ARC')return arcEntity(e,ctx);
  throw new Error(`Unsupported DXF entity: ${e.type}`);
}
function buildDxf(entities,width,height){
  const header=[
    '0','SECTION','2','HEADER',
    '9','$ACADVER','1','AC1015',
    '9','$INSUNITS','70','4',
    '9','$EXTMIN','10','0','20','0','30','0',
    '9','$EXTMAX','10',fmt(width),'20',fmt(height),'30','0',
    '0','ENDSEC',
    '0','SECTION','2','ENTITIES'
  ];
  return Buffer.from([...header,...entities.flatMap(x=>x.split('\n')),'0','ENDSEC','0','EOF',''].join('\n'),'utf8');
}
function chooseScale({sourceWidth,sourceHeight,targetWidth,targetHeight,fitMachine,machine}){
  const tw=Number(targetWidth||0),th=Number(targetHeight||0);
  if(tw>0&&th>0)return {scale:Math.min(tw/sourceWidth,th/sourceHeight),reason:'bounding_box'};
  if(tw>0)return {scale:tw/sourceWidth,reason:'width'};
  if(th>0)return {scale:th/sourceHeight,reason:'height'};
  if(fitMachine){
    const mw=Number(machine?.working_width_mm||0),mh=Number(machine?.working_height_mm||0);
    if(!(mw>0&&mh>0))throw Object.assign(new Error('No active table dimensions are configured.'),{status:400});
    const normal=Math.min(mw/sourceWidth,mh/sourceHeight);
    const rotated=Math.min(mw/sourceHeight,mh/sourceWidth);
    return rotated>normal?{scale:rotated,reason:'machine',rotate_for_cut:true}:{scale:normal,reason:'machine',rotate_for_cut:false};
  }
  throw Object.assign(new Error('Enter a target width, target height, or choose Fit to current table.'),{status:400});
}

export function resizeDxfBuffer({buffer,originalname='design.dxf',machine=null,unitOverride=null,targetWidthMm=null,targetHeightMm=null,fitMachine=false}){
  if(!buffer?.length)throw Object.assign(new Error('DXF file is empty.'),{status:400});
  const text=buffer.toString('utf8');
  const source=analyseDxfText(text,machine,{unitOverride});
  if(!source.units?.mm_per_unit){
    throw Object.assign(new Error('MERLIN cannot determine this DXF\'s units. Choose the source units before resizing.'),{status:400,code:'DXF_UNITS_REQUIRED'});
  }
  if(!(source.width_mm>0&&source.height_mm>0)||!source.drawing_bounds){
    throw Object.assign(new Error('MERLIN could not determine usable DXF bounds.'),{status:400});
  }
  const unsupported=[...new Set((source.entities||[]).map(e=>e.type).filter(t=>!SUPPORTED.has(t)))];
  if(unsupported.length){
    throw Object.assign(new Error(`This DXF contains entity types the safe resizer does not rewrite yet: ${unsupported.join(', ')}. The original file has not been changed.`),{status:422,code:'DXF_RESIZE_UNSUPPORTED'});
  }
  const chosen=chooseScale({sourceWidth:source.width_mm,sourceHeight:source.height_mm,targetWidth:targetWidthMm,targetHeight:targetHeightMm,fitMachine,machine});
  if(!(chosen.scale>0&&Number.isFinite(chosen.scale)))throw Object.assign(new Error('Calculated scale is invalid.'),{status:400});
  const outWidth=source.width_mm*chosen.scale,outHeight=source.height_mm*chosen.scale;
  const ctx={minX:source.drawing_bounds.minX,minY:source.drawing_bounds.minY,unitScale:source.units.mm_per_unit,scale:chosen.scale};
  const entities=(source.entities||[]).map(e=>entityToDxf(e,ctx));
  const output=buildDxf(entities,outWidth,outHeight);
  const outputAnalysis=analyseDxfText(output.toString('utf8'),machine,{});
  const base=path.basename(originalname,path.extname(originalname)).replace(/[^a-zA-Z0-9._-]+/g,'_')||'design';
  const outputName=`${base}_${Math.round(outputAnalysis.width_mm)}x${Math.round(outputAnalysis.height_mm)}mm.dxf`;
  return {
    buffer:output,
    outputName,
    source:{width_mm:source.width_mm,height_mm:source.height_mm,units:source.units.name,entity_count:source.entity_count},
    output:{width_mm:outputAnalysis.width_mm,height_mm:outputAnalysis.height_mm,entity_count:outputAnalysis.entity_count,fits_machine:outputAnalysis.fits_machine,validation_status:outputAnalysis.validation_status,issues:outputAnalysis.issues},
    scale:chosen.scale,
    scale_percent:chosen.scale*100,
    rotate_for_cut:Boolean(chosen.rotate_for_cut),
    scale_reason:chosen.reason
  };
}
