export function json(res,status,payload,headers={}){
  const body=JSON.stringify(payload);
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff',...headers});
  res.end(body);
}
export function text(res,status,body,headers={}){
  body=String(body??'');
  res.writeHead(status,{'content-type':'text/plain; charset=utf-8','content-length':Buffer.byteLength(body),'x-content-type-options':'nosniff',...headers});
  res.end(body);
}
