function fmt(v){
  const n=Number(v);
  if(!Number.isFinite(n)) return '0';
  const s=n.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
  return s==='-0'?'0':s;
}
function safeLayer(v){return String(v||'0').replace(/[\r\n]/g,' ').slice(0,255)||'0';}
function gc(out,code,value){out.push(String(code),String(value));}
function entityPoint(v,ctx){
  return {
    x:(Number(v?.x||0)-Number(ctx.minX||0))*Number(ctx.unitScale)*Number(ctx.scale),
    y:(Number(v?.y||0)-Number(ctx.minY||0))*Number(ctx.unitScale)*Number(ctx.scale)
  };
}
function lineEntity(e,ctx){
  const a=entityPoint(e.vertices?.[0],ctx),b=entityPoint(e.vertices?.[1],ctx),out=[];
  gc(out,0,'LINE');gc(out,8,safeLayer(e.layer));
  gc(out,10,fmt(a.x));gc(out,20,fmt(a.y));gc(out,30,'0');
  gc(out,11,fmt(b.x));gc(out,21,fmt(b.y));gc(out,31,'0');
  return out;
}
function polylineEntity(e,ctx){
  const vs=e.vertices||[];
  if(vs.length<2)throw new Error('Polyline has fewer than two vertices.');
  const layer=safeLayer(e.layer),closed=Boolean(e.shape||e.closed),out=[];
  gc(out,0,'POLYLINE');gc(out,8,layer);gc(out,66,'1');
  gc(out,10,'0');gc(out,20,'0');gc(out,30,'0');gc(out,70,closed?'1':'0');
  for(const v of vs){
    const p=entityPoint(v,ctx);
    gc(out,0,'VERTEX');gc(out,8,layer);
    gc(out,10,fmt(p.x));gc(out,20,fmt(p.y));gc(out,30,'0');
    if(Number.isFinite(Number(v.startWidth))&&Number(v.startWidth)!==0)gc(out,40,fmt(Number(v.startWidth)*ctx.unitScale*ctx.scale));
    if(Number.isFinite(Number(v.endWidth))&&Number(v.endWidth)!==0)gc(out,41,fmt(Number(v.endWidth)*ctx.unitScale*ctx.scale));
    if(Number.isFinite(Number(v.bulge))&&Number(v.bulge)!==0)gc(out,42,fmt(v.bulge));
  }
  gc(out,0,'SEQEND');gc(out,8,layer);
  return out;
}
function circleEntity(e,ctx){
  const c=entityPoint(e.center,ctx),r=Number(e.radius||0)*ctx.unitScale*ctx.scale,out=[];
  gc(out,0,'CIRCLE');gc(out,8,safeLayer(e.layer));
  gc(out,10,fmt(c.x));gc(out,20,fmt(c.y));gc(out,30,'0');gc(out,40,fmt(r));
  return out;
}
function arcEntity(e,ctx){
  const c=entityPoint(e.center,ctx),r=Number(e.radius||0)*ctx.unitScale*ctx.scale,out=[];
  gc(out,0,'ARC');gc(out,8,safeLayer(e.layer));
  gc(out,10,fmt(c.x));gc(out,20,fmt(c.y));gc(out,30,'0');gc(out,40,fmt(r));
  const startDeg=Number(e.startAngle||0)*180/Math.PI,endDeg=Number(e.endAngle||0)*180/Math.PI;
  gc(out,50,fmt(startDeg));gc(out,51,fmt(endDeg));
  return out;
}
function entityToDxf(e,ctx){
  if(e.type==='LINE')return lineEntity(e,ctx);
  if(e.type==='LWPOLYLINE'||e.type==='POLYLINE')return polylineEntity(e,ctx);
  if(e.type==='CIRCLE')return circleEntity(e,ctx);
  if(e.type==='ARC')return arcEntity(e,ctx);
  throw new Error(`Unsupported DXF entity: ${e.type}`);
}
function uniqueLayers(entities){
  const seen=new Set(['0']);
  for(const e of entities||[])seen.add(safeLayer(e.layer));
  return [...seen];
}

export function buildFusionR12Dxf(sourceEntities,ctx,width,height){
  const out=[];
  gc(out,0,'SECTION');gc(out,2,'HEADER');
  gc(out,9,'$ACADVER');gc(out,1,'AC1009');
  gc(out,9,'$DWGCODEPAGE');gc(out,3,'ANSI_1252');
  gc(out,9,'$INSBASE');gc(out,10,'0');gc(out,20,'0');gc(out,30,'0');
  gc(out,9,'$EXTMIN');gc(out,10,'0');gc(out,20,'0');gc(out,30,'0');
  gc(out,9,'$EXTMAX');gc(out,10,fmt(width));gc(out,20,fmt(height));gc(out,30,'0');
  gc(out,9,'$MEASUREMENT');gc(out,70,'1');
  gc(out,0,'ENDSEC');

  const layers=uniqueLayers(sourceEntities);
  gc(out,0,'SECTION');gc(out,2,'TABLES');
  gc(out,0,'TABLE');gc(out,2,'LTYPE');gc(out,70,'1');
  gc(out,0,'LTYPE');gc(out,2,'CONTINUOUS');gc(out,70,'0');gc(out,3,'Solid line');gc(out,72,'65');gc(out,73,'0');gc(out,40,'0');
  gc(out,0,'ENDTAB');
  gc(out,0,'TABLE');gc(out,2,'LAYER');gc(out,70,String(layers.length));
  for(const layer of layers){gc(out,0,'LAYER');gc(out,2,layer);gc(out,70,'0');gc(out,62,'7');gc(out,6,'CONTINUOUS');}
  gc(out,0,'ENDTAB');gc(out,0,'ENDSEC');

  gc(out,0,'SECTION');gc(out,2,'BLOCKS');gc(out,0,'ENDSEC');
  gc(out,0,'SECTION');gc(out,2,'ENTITIES');
  for(const e of sourceEntities)out.push(...entityToDxf(e,ctx));
  gc(out,0,'ENDSEC');gc(out,0,'EOF');
  return Buffer.from(`${out.join('\n')}\n`,'utf8');
}
