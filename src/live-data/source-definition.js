import { ACCESS_CLASSES, DATA_DOMAINS } from './constants.js';
const ID=/^[a-z0-9][a-z0-9-]{1,63}$/;
export function sourceDefinition(input={}) {
  const id=String(input.id||'').trim().toLowerCase();
  if(!ID.test(id)) throw new TypeError(`Invalid live-data source id: ${id||'<empty>'}`);
  const domain=String(input.domain||'').trim().toUpperCase();
  if(!DATA_DOMAINS.includes(domain)) throw new TypeError(`Invalid live-data domain: ${domain}`);
  const access=String(input.access||ACCESS_CLASSES.PUBLIC_KEYLESS).toUpperCase();
  if(!Object.values(ACCESS_CLASSES).includes(access)) throw new TypeError(`Invalid access class: ${access}`);
  return Object.freeze({
    id, name:String(input.name||id).trim(), domain, access,
    authority:String(input.authority||input.name||id).trim(),
    homepage:String(input.homepage||''), endpoint:String(input.endpoint||''),
    attribution:String(input.attribution||input.authority||input.name||id).trim(),
    licence:String(input.licence||'Source terms apply'),
    commercialUse:input.commercialUse!==false,
    keyless:access===ACCESS_CLASSES.PUBLIC_KEYLESS,
    refreshMs:Math.max(30_000, Number(input.refreshMs)||300_000),
    staleMs:Math.max(60_000, Number(input.staleMs)||86_400_000),
    required:input.required!==false,
    notes:String(input.notes||'')
  });
}
