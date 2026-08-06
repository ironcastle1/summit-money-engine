import { ACCESS_CLASSES } from './constants.js';
export function licenceDecision(source,{hasCredential=false,commercialDeployment=true}={}){
  if(!source) return Object.freeze({allowed:false,state:'UNKNOWN_SOURCE',reason:'Source is not in the approved catalogue'});
  if(source.access===ACCESS_CLASSES.COMMERCIAL_LICENSE&&!hasCredential) return Object.freeze({allowed:false,state:'LICENSE_REQUIRED',reason:'Commercial provider credentials or a data licence are required'});
  if(source.access===ACCESS_CLASSES.OPTIONAL_KEY&&!hasCredential) return Object.freeze({allowed:false,state:'OPTIONAL_NOT_CONFIGURED',reason:'Optional credential is not configured'});
  if(source.access===ACCESS_CLASSES.PUBLIC_REGISTRATION&&!hasCredential) return Object.freeze({allowed:false,state:'REGISTRATION_REQUIRED',reason:'Free registration or approved application identifier is required'});
  if(commercialDeployment&&source.commercialUse===false) return Object.freeze({allowed:false,state:'COMMERCIAL_USE_RESTRICTED',reason:'Source is not approved for commercial deployment'});
  return Object.freeze({allowed:true,state:'ALLOWED',reason:source.keyless?'Public keyless source':'Configured source'});
}
