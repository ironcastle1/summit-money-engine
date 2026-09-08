import path from 'node:path';
import { analyseDxfText } from './analyse.js';
import { buildFusionR12Dxf } from './r12-writer.js';

const SUPPORTED = new Set(['LINE','LWPOLYLINE','POLYLINE','CIRCLE','ARC']);
const DIMENSION_TOLERANCE_MM = 0.08;
const AUTO_CLOSE_TOLERANCE_MM = 0.05;

function httpError(message,status=400,code='DXF_RESIZE_ERROR'){
  return Object.assign(new Error(message),{status,code});
}
function chooseScale({sourceWidth,sourceHeight,targetWidth,targetHeight,fitMachine,machine}){
  const tw=Number(targetWidth||0),th=Number(targetHeight||0);
  if(tw>0&&th>0)return {scale:Math.min(tw/sourceWidth,th/sourceHeight),reason:'bounding_box'};
  if(tw>0)return {scale:tw/sourceWidth,reason:'width'};
  if(th>0)return {scale:th/sourceHeight,reason:'height'};
  if(fitMachine){
    const mw=Number(machine?.working_width_mm||0),mh=Number(machine?.working_height_mm||0);
    if(!(mw>0&&mh>0))throw httpError('No active table dimensions are configured.');
    const normal=Math.min(mw/sourceWidth,mh/sourceHeight);
    const rotated=Math.min(mw/sourceHeight,mh/sourceWidth);
    return rotated>normal?{scale:rotated,reason:'machine',rotate_for_cut:true}:{scale:normal,reason:'machine',rotate_for_cut:false};
  }
  throw httpError('Enter a target width, target height, or choose Fit to current table.');
}
function within(actual,expected,tolerance=DIMENSION_TOLERANCE_MM){return Math.abs(Number(actual)-Number(expected))<=tolerance;}
function cloneEntities(entities){return JSON.parse(JSON.stringify(entities||[]));}
function distance(a,b){return Math.hypot(Number(a?.x||0)-Number(b?.x||0),Number(a?.y||0)-Number(b?.y||0));}
function isPolyline(e){return e?.type==='LWPOLYLINE'||e?.type==='POLYLINE';}
function nearlyZero(v){return Math.abs(Number(v||0))<1e-12;}

function repairNearClosedPolylines(entities,mmPerSourceUnit){
  const toleranceUnits=AUTO_CLOSE_TOLERANCE_MM/Number(mmPerSourceUnit||1);
  const repaired=[];
  for(let index=0;index<entities.length;index++){
    const e=entities[index];
    if(!isPolyline(e)||e.shape||e.closed||!Array.isArray(e.vertices)||e.vertices.length<3)continue;
    const first=e.vertices[0],last=e.vertices.at(-1),gapUnits=distance(first,last),gapMm=gapUnits*mmPerSourceUnit;
    if(gapUnits>toleranceUnits)continue;
    // A final vertex that is effectively a duplicate of the first can be removed,
    // avoiding a zero-length closing segment in the released file. If the final
    // vertex carries bulge/width data, preserve it and simply set the closed flag.
    if(e.vertices.length>=4&&nearlyZero(last.bulge)&&nearlyZero(last.startWidth)&&nearlyZero(last.endWidth))e.vertices.pop();
    e.shape=true;e.closed=true;
    repaired.push({entity_index:index,gap_mm:gapMm,tolerance_mm:AUTO_CLOSE_TOLERANCE_MM});
  }
  return repaired;
}
function entityPointMm(v,ctx){return {x:(Number(v?.x||0)-ctx.minX)*ctx.unitScale*ctx.scale,y:(Number(v?.y||0)-ctx.minY)*ctx.unitScale*ctx.scale};}
function inversePointMm(p,ctx){return {x:Number(p.x)/(ctx.unitScale*ctx.scale)+ctx.minX,y:Number(p.y)/(ctx.unitScale*ctx.scale)+ctx.minY};}
function boundsOf(points){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of points){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
function polygonArea(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y;}return a/2;}
function pointInPolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const crosses=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/((b.y-a.y)||1e-12)+a.x);if(crosses)inside=!inside;}return inside;}
function arcPointsForBulge(a,b,bulge){
  const bb=Number(bulge||0);if(Math.abs(bb)<1e-12)return [b];
  const chord=distance(a,b);if(chord<1e-12)return [b];
  const theta=4*Math.atan(bb),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  const left={x:-(b.y-a.y)/chord,y:(b.x-a.x)/chord};
  const centerOffset=chord*(1-bb*bb)/(4*bb);
  const center={x:mx+left.x*centerOffset,y:my+left.y*centerOffset};
  const radius=distance(center,a),start=Math.atan2(a.y-center.y,a.x-center.x);
  const segments=Math.max(4,Math.min(48,Math.ceil(Math.abs(theta)/(Math.PI/18))));
  const points=[];for(let i=1;i<=segments;i++){const ang=start+theta*(i/segments);points.push({x:center.x+radius*Math.cos(ang),y:center.y+radius*Math.sin(ang)});}return points;
}
function flattenPolylineMm(e,ctx){
  const vertices=e.vertices||[];if(vertices.length<3)return null;
  const base=vertices.map(v=>({...entityPointMm(v,ctx),bulge:Number(v.bulge||0)}));
  const out=[{x:base[0].x,y:base[0].y}];
  const segmentCount=(e.shape||e.closed)?base.length:base.length-1;
  for(let i=0;i<segmentCount;i++){
    const a=base[i],b=base[(i+1)%base.length];
    out.push(...arcPointsForBulge(a,b,a.bulge));
  }
  if(out.length>1&&distance(out[0],out.at(-1))<1e-7)out.pop();
  return out;
}
function circlePolygonMm(e,ctx){
  const c=entityPointMm(e.center,ctx),r=Number(e.radius||0)*ctx.unitScale*ctx.scale,points=[];
  for(let i=0;i<64;i++){const a=2*Math.PI*i/64;points.push({x:c.x+r*Math.cos(a),y:c.y+r*Math.sin(a)});}return points;
}
function closedContoursMm(entities,ctx){
  const contours=[];
  for(const e of entities){
    let points=null;
    if(isPolyline(e)&&(e.shape||e.closed))points=flattenPolylineMm(e,ctx);
    else if(e.type==='CIRCLE')points=circlePolygonMm(e,ctx);
    if(!points||points.length<3)continue;
    const area=Math.abs(polygonArea(points));if(area<1e-6)continue;
    contours.push({points,bounds:boundsOf(points),area});
  }
  return contours;
}
function contourContains(contour,p){const b=contour.bounds;if(p.x<b.minX||p.x>b.maxX||p.y<b.minY||p.y>b.maxY)return false;return pointInPolygon(p,contour.points);}
function isRetainedSteelPoint(contours,p){let depth=0;for(const c of contours)if(contourContains(c,p))depth++;return depth%2===1;}
function holeCircleFits(contours,center,radius,clearance,width,height){
  const outerRadius=radius+clearance;
  if(center.x<outerRadius||center.y<outerRadius||center.x>width-outerRadius||center.y>height-outerRadius)return false;
  if(!isRetainedSteelPoint(contours,center))return false;
  for(const rr of [radius,outerRadius]){
    for(let i=0;i<32;i++){const a=2*Math.PI*i/32;const p={x:center.x+rr*Math.cos(a),y:center.y+rr*Math.sin(a)};if(!isRetainedSteelPoint(contours,p))return false;}
  }
  return true;
}
function tooCloseToPlaced(center,placed,radius,clearance){const min=2*(radius+clearance);return placed.some(p=>distance(center,p)<min);}
function nearestValidHolePosition({anchor,contours,radius,clearance,width,height,placed}){
  const step=Math.max(1.5,Math.min(4,Math.max(radius/2,clearance||1.5)));
  const maxRadius=Math.hypot(width,height);
  const tested=new Set();
  function tryPoint(p){
    const x=Math.round(p.x*1000)/1000,y=Math.round(p.y*1000)/1000,k=`${x},${y}`;if(tested.has(k))return null;tested.add(k);
    const c={x,y};if(tooCloseToPlaced(c,placed,radius,clearance))return null;return holeCircleFits(contours,c,radius,clearance,width,height)?c:null;
  }
  let hit=tryPoint(anchor);if(hit)return hit;
  for(let r=step;r<=maxRadius;r+=step){
    for(let dx=-r;dx<=r;dx+=step){hit=tryPoint({x:anchor.x+dx,y:anchor.y-r});if(hit)return hit;hit=tryPoint({x:anchor.x+dx,y:anchor.y+r});if(hit)return hit;}
    for(let dy=-r+step;dy<=r-step;dy+=step){hit=tryPoint({x:anchor.x-r,y:anchor.y+dy});if(hit)return hit;hit=tryPoint({x:anchor.x+r,y:anchor.y+dy});if(hit)return hit;}
  }
  return null;
}
function validateMountingRequest(mounting){
  if(!mounting?.enabled)return null;
  const count=Number(mounting.count),diameter=Number(mounting.diameter_mm),inset=Number(mounting.inset_mm),clearance=Number(mounting.clearance_mm);
  if(![2,4].includes(count))throw httpError('Fixing-hole count must be 2 or 4.',400,'MOUNTING_HOLE_COUNT');
  if(!(diameter>0))throw httpError('Enter the fixing-hole diameter in millimetres.',400,'MOUNTING_HOLE_DIAMETER');
  if(!(inset>=0))throw httpError('Enter the preferred fixing-hole edge inset in millimetres.',400,'MOUNTING_HOLE_INSET');
  if(!(clearance>=0))throw httpError('Enter the minimum amount of retained steel you want around each fixing hole.',400,'MOUNTING_HOLE_CLEARANCE');
  return {enabled:true,count,diameter_mm:diameter,inset_mm:inset,clearance_mm:clearance,layout:count===2?'two_top':'four_corners'};
}
function addMountingHoles({entities,ctx,width,height,mounting}){
  const req=validateMountingRequest(mounting);if(!req)return {entities,holes:[],request:null};
  const contours=closedContoursMm(entities,ctx);
  if(!contours.length)throw httpError('MERLIN cannot establish a closed retained-steel area in this DXF, so it will not guess where fixing holes belong.',422,'MOUNTING_HOLE_NO_SOLID_REGION');
  const r=req.diameter_mm/2,i=req.inset_mm;
  const anchors=req.count===2
    ?[{x:i,y:height-i,label:'top-left'},{x:width-i,y:height-i,label:'top-right'}]
    :[{x:i,y:i,label:'bottom-left'},{x:width-i,y:i,label:'bottom-right'},{x:width-i,y:height-i,label:'top-right'},{x:i,y:height-i,label:'top-left'}];
  const holes=[],placed=[];
  for(const anchor of anchors){
    const pos=nearestValidHolePosition({anchor,contours,radius:r,clearance:req.clearance_mm,width,height,placed});
    if(!pos)throw httpError(`MERLIN could not find enough retained steel for the requested ${req.count} fixing holes at ${req.diameter_mm} mm diameter with ${req.clearance_mm} mm surrounding steel. Try 2 holes, a smaller diameter, less surrounding steel, or a different design. No download was released.`,422,'MOUNTING_HOLE_PLACEMENT_FAILED');
    placed.push(pos);
    const src=inversePointMm(pos,ctx),srcRadius=r/(ctx.unitScale*ctx.scale);
    holes.push({label:anchor.label,x_mm:pos.x,y_mm:pos.y,requested_x_mm:anchor.x,requested_y_mm:anchor.y,moved_mm:distance(pos,anchor),diameter_mm:req.diameter_mm,clearance_mm:req.clearance_mm});
    entities.push({type:'CIRCLE',layer:'MERLIN_MOUNTING_HOLES',center:{x:src.x,y:src.y,z:0},radius:srcRadius});
  }
  return {entities,holes,request:req};
}
function validateGeneratedFile({output,expectedWidth,expectedHeight,expectedEntityCount,expectedClosedPaths,expectedOpenPaths,machine}){
  let parsed;
  try{
    parsed=analyseDxfText(output.toString('utf8'),machine,{unitOverride:'millimeters'});
  }catch(error){
    throw httpError(`MERLIN generated a DXF that failed its own parser check. No download was released. ${error.message}`,500,'DXF_OUTPUT_PARSE_FAILED');
  }
  if(!within(parsed.width_mm,expectedWidth)||!within(parsed.height_mm,expectedHeight)){
    throw httpError(`Generated DXF dimensions failed validation. Expected ${expectedWidth.toFixed(3)} × ${expectedHeight.toFixed(3)} mm but parsed ${Number(parsed.width_mm||0).toFixed(3)} × ${Number(parsed.height_mm||0).toFixed(3)} mm. No download was released.`,500,'DXF_OUTPUT_SIZE_MISMATCH');
  }
  if(Number(parsed.entity_count)!==Number(expectedEntityCount))throw httpError(`Generated DXF entity count failed validation (${parsed.entity_count} instead of ${expectedEntityCount}). No download was released.`,500,'DXF_OUTPUT_ENTITY_MISMATCH');
  if(Number(parsed.closed_path_count)!==Number(expectedClosedPaths))throw httpError(`Generated DXF closed-contour count failed validation (${parsed.closed_path_count} instead of ${expectedClosedPaths}). No download was released.`,500,'DXF_OUTPUT_TOPOLOGY_MISMATCH');
  if(Number(parsed.open_path_count)!==Number(expectedOpenPaths))throw httpError(`Generated DXF open-contour state failed validation (${parsed.open_path_count} instead of ${expectedOpenPaths}). No download was released.`,500,'DXF_OUTPUT_TOPOLOGY_MISMATCH');
  if(Number(parsed.unsupported_entity_count||0)!==0)throw httpError('Generated DXF contains an unsupported entity after rewriting. No download was released.',500,'DXF_OUTPUT_UNSUPPORTED');
  return parsed;
}

export function resizeDxfBuffer({buffer,originalname='design.dxf',machine=null,unitOverride=null,targetWidthMm=null,targetHeightMm=null,fitMachine=false,mountingHoles=null}){
  if(!buffer?.length)throw httpError('DXF file is empty.');
  let source;
  try{source=analyseDxfText(buffer.toString('utf8'),machine,{unitOverride});}
  catch(error){throw httpError(`The source DXF could not be parsed safely: ${error.message}`,422,'DXF_SOURCE_PARSE_FAILED');}
  if(!source.units?.mm_per_unit)throw httpError('MERLIN cannot determine this DXF\'s units. Choose the source units before resizing.',400,'DXF_UNITS_REQUIRED');
  if(!(source.width_mm>0&&source.height_mm>0)||!source.drawing_bounds)throw httpError('MERLIN could not determine usable DXF bounds.');
  const unsupported=[...new Set((source.entities||[]).map(e=>e.type).filter(t=>!SUPPORTED.has(t)))];
  if(unsupported.length)throw httpError(`This DXF contains entity types the safe resizer does not rewrite yet: ${unsupported.join(', ')}. The original file has not been changed.`,422,'DXF_RESIZE_UNSUPPORTED');

  const chosen=chooseScale({sourceWidth:source.width_mm,sourceHeight:source.height_mm,targetWidth:targetWidthMm,targetHeight:targetHeightMm,fitMachine,machine});
  if(!(chosen.scale>0&&Number.isFinite(chosen.scale)))throw httpError('Calculated scale is invalid.');
  const outWidth=source.width_mm*chosen.scale,outHeight=source.height_mm*chosen.scale;
  const ctx={minX:source.drawing_bounds.minX,minY:source.drawing_bounds.minY,unitScale:source.units.mm_per_unit,scale:chosen.scale};

  // Work on a clone only. The uploaded source bytes are never changed.
  let entities=cloneEntities(source.entities||[]);
  const autoClosed=repairNearClosedPolylines(entities,source.units.mm_per_unit);

  // Establish what the repaired source topology should look like before adding optional fixing holes.
  let preparedBuffer;
  try{preparedBuffer=buildFusionR12Dxf(entities,ctx,outWidth,outHeight);}catch(error){throw httpError(`MERLIN could not safely write this DXF: ${error.message}`,422,'DXF_OUTPUT_WRITE_FAILED');}
  let preparedAnalysis;
  try{preparedAnalysis=analyseDxfText(preparedBuffer.toString('utf8'),machine,{unitOverride:'millimeters'});}catch(error){throw httpError(`MERLIN could not validate the repaired geometry before final output: ${error.message}`,500,'DXF_PREPARED_PARSE_FAILED');}

  const mounted=addMountingHoles({entities,ctx,width:outWidth,height:outHeight,mounting:mountingHoles});
  entities=mounted.entities;
  let output;
  try{output=buildFusionR12Dxf(entities,ctx,outWidth,outHeight);}catch(error){throw httpError(`MERLIN could not safely write this DXF: ${error.message}`,422,'DXF_OUTPUT_WRITE_FAILED');}

  const expectedEntityCount=preparedAnalysis.entity_count+mounted.holes.length;
  const expectedClosedPaths=preparedAnalysis.closed_path_count+mounted.holes.length;
  const expectedOpenPaths=preparedAnalysis.open_path_count;
  const outputAnalysis=validateGeneratedFile({output,expectedWidth:outWidth,expectedHeight:outHeight,expectedEntityCount,expectedClosedPaths,expectedOpenPaths,machine});
  const base=path.basename(originalname,path.extname(originalname)).replace(/[^a-zA-Z0-9._-]+/g,'_')||'design';
  const holeSuffix=mounted.holes.length?`_${mounted.holes.length}HOLES`:'';
  const outputName=`${base}_${Math.round(outputAnalysis.width_mm)}x${Math.round(outputAnalysis.height_mm)}mm${holeSuffix}_FUSION_R12.dxf`;
  const issues=(outputAnalysis.issues||[]).filter(i=>i.code!=='DXF_UNITS_UNKNOWN');
  return {
    buffer:output,
    outputName,
    source:{width_mm:source.width_mm,height_mm:source.height_mm,units:source.units.name,entity_count:source.entity_count,closed_path_count:source.closed_path_count,open_path_count:source.open_path_count},
    output:{width_mm:outputAnalysis.width_mm,height_mm:outputAnalysis.height_mm,entity_count:outputAnalysis.entity_count,closed_path_count:outputAnalysis.closed_path_count,open_path_count:outputAnalysis.open_path_count,fits_machine:outputAnalysis.fits_machine,validation_status:outputAnalysis.validation_status,issues,file_format:'AutoCAD R12 ASCII (AC1009)',round_trip_validated:true,coordinate_units:'millimetres'},
    repairs:{auto_closed_polylines:autoClosed.length,auto_closed:autoClosed,tolerance_mm:AUTO_CLOSE_TOLERANCE_MM},
    mounting_holes:{enabled:Boolean(mounted.request),count:mounted.holes.length,request:mounted.request,holes:mounted.holes,validated_in_retained_steel:mounted.holes.length>0},
    scale:chosen.scale,
    scale_percent:chosen.scale*100,
    rotate_for_cut:Boolean(chosen.rotate_for_cut),
    scale_reason:chosen.reason
  };
}
