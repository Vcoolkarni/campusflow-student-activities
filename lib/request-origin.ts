export function publicRequestUrl(request:Request,url=new URL(request.url)){
  const host=(request.headers.get('x-forwarded-host')||request.headers.get('host')||url.host).split(',')[0].trim();
  const protocol=(request.headers.get('x-forwarded-proto')||url.protocol).split(',')[0].trim().replace(/:$/,'');
  if(!host||!['http','https'].includes(protocol))return url;
  return new URL(`${url.pathname}${url.search}`,`${protocol}://${host}`);
}

export function samePublicOrigin(request:Request,origin:string){
  try{return new URL(origin).origin===publicRequestUrl(request).origin}catch{return false}
}
