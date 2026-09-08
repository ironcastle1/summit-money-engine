import path from 'node:path';
import { analyseDxfText } from './analyse.js';
import { buildFusionR12Dxf } from './r12-writer.js';

const SUPPORTED = new Set(['LINE','LWPOLYLINE','POLYLINE','CIRCLE','ARC']);
const DIMENSION_TOLERANCE_MM = 0.08;

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
function validateGeneratedFile({output,expectedWidth,expectedHeight,sourceAnalysis,machine}){
  let parsed;
  try{
    // AutoCAD R12 has no standard $INSUNITS header variable. MERLIN writes
    // generated coordinates in millimetres and supplies that known unit here.
    parsed=analyseDxfText(output.toString('utf8'),machine,{unitOverride:'millimeters'});
  }catch(error){
    throw httpError(`MERLIN generated a DXF that failed its own parser check. No download was released. ${error.message}`,500,'DXF_OUTPUT_PARSE_FAILED');
  }
  if(!within(parsed.width_mm,expectedWidth)||!within(parsed.height_mm,expectedHeight)){
    throw httpError(`Generated DXF dimensions failed validation. Expected ${expectedWidth.toFixed(3)} × ${expectedHeight.toFixed(3)} mm but parsed ${Number(parsed.width_mm||0).toFixed(3)} × ${Number(parsed.height_mm||0).toFixed(3)} mm. No download was released.`,500,'DXF_OUTPUT_SIZE_MISMATCH');
  }
  if(Number(parsed.entity_count)!==Number(sourceAnalysis.entity_count)){
    throw httpError(`Generated DXF entity count failed validation (${parsed.entity_count} instead of ${sourceAnalysis.entity_count}). No download was released.`,500,'DXF_OUTPUT_ENTITY_MISMATCH');
  }
  if(Number(parsed.closed_path_count)!==Number(sourceAnalysis.closed_path_count)){
    throw httpError('Generated DXF contour closure changed during resizing. No download was released.',500,'DXF_OUTPUT_TOPOLOGY_MISMATCH');
  }
  if(Number(parsed.open_path_count)!==Number(sourceAnalysis.open_path_count)){
    throw httpError('Generated DXF open-contour state changed during resizing. No download was released.',500,'DXF_OUTPUT_TOPOLOGY_MISMATCH');
  }
  if(Number(parsed.unsupported_entity_count||0)!==0){
    throw httpError('Generated DXF contains an unsupported entity after rewriting. No download was released.',500,'DXF_OUTPUT_UNSUPPORTED');
  }
  return parsed;
}

export function resizeDxfBuffer({buffer,originalname='design.dxf',machine=null,unitOverride=null,targetWidthMm=null,targetHeightMm=null,fitMachine=false}){
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
  let output;
  try{output=buildFusionR12Dxf(source.entities||[],ctx,outWidth,outHeight);}
  catch(error){throw httpError(`MERLIN could not safely write this DXF: ${error.message}`,422,'DXF_OUTPUT_WRITE_FAILED');}

  // No file can reach the download directory until this validation returns successfully.
  const outputAnalysis=validateGeneratedFile({output,expectedWidth:outWidth,expectedHeight:outHeight,sourceAnalysis:source,machine});
  const base=path.basename(originalname,path.extname(originalname)).replace(/[^a-zA-Z0-9._-]+/g,'_')||'design';
  const outputName=`${base}_${Math.round(outputAnalysis.width_mm)}x${Math.round(outputAnalysis.height_mm)}mm_FUSION_R12.dxf`;
  const issues=(outputAnalysis.issues||[]).filter(i=>i.code!=='DXF_UNITS_UNKNOWN');
  return {
    buffer:output,
    outputName,
    source:{width_mm:source.width_mm,height_mm:source.height_mm,units:source.units.name,entity_count:source.entity_count,closed_path_count:source.closed_path_count,open_path_count:source.open_path_count},
    output:{width_mm:outputAnalysis.width_mm,height_mm:outputAnalysis.height_mm,entity_count:outputAnalysis.entity_count,closed_path_count:outputAnalysis.closed_path_count,open_path_count:outputAnalysis.open_path_count,fits_machine:outputAnalysis.fits_machine,validation_status:outputAnalysis.validation_status,issues,file_format:'AutoCAD R12 ASCII (AC1009)',round_trip_validated:true,coordinate_units:'millimetres'},
    scale:chosen.scale,
    scale_percent:chosen.scale*100,
    rotate_for_cut:Boolean(chosen.rotate_for_cut),
    scale_reason:chosen.reason
  };
}
