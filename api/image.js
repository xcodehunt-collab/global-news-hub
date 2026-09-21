const ALLOWED_HOSTS = [
  'ichef.bbci.co.uk','news.bbcimg.co.uk','ichef.bbci.co.uk',
  'e3.365dm.com','e0.365dm.com','e1.365dm.com','e2.365dm.com',
  'cdn.arstechnica.net','cdn.arstechnica.com'
];
async function handler(event) {
  if(event.httpMethod!=='GET') return {statusCode:405,body:'Method not allowed'};
  const raw=event.queryStringParameters?.url||'';
  let url;
  try{url=new URL(raw)}catch{return {statusCode:400,body:'Invalid image URL'};}
  if(url.protocol!=='https:'||!ALLOWED_HOSTS.some(h=>url.hostname===h||url.hostname.endsWith('.'+h))){
    return {statusCode:403,body:'Image host not allowed'};
  }
  try{
    const r=await fetch(url,{redirect:'follow',headers:{accept:'image/avif,image/webp,image/*,*/*;q=0.8','user-agent':'GlobalNewsHub/1.0'}});
    if(!r.ok) return {statusCode:r.status,body:'Image unavailable'};
    const type=r.headers.get('content-type')||'';
    if(!type.startsWith('image/')) return {statusCode:415,body:'Not an image'};
    const buf=Buffer.from(await r.arrayBuffer());
    if(buf.length>6*1024*1024) return {statusCode:413,body:'Image too large'};
    return {statusCode:200,isBase64Encoded:true,headers:{'content-type':type,'cache-control':'public,max-age=3600,s-maxage=21600,stale-while-revalidate=86400','x-content-type-options':'nosniff'},body:buf.toString('base64')};
  }catch{return {statusCode:502,body:'Image fetch failed'};}
};

module.exports = async function(req,res){
  const url=new URL(req.url,'https://local.invalid');
  const event={httpMethod:req.method,queryStringParameters:Object.fromEntries(url.searchParams.entries())};
  const out=await handler(event);
  res.statusCode=out.statusCode||200;
  for(const [k,v] of Object.entries(out.headers||{})) res.setHeader(k,v);
  if(out.isBase64Encoded){res.end(Buffer.from(out.body||'','base64'));return;}
  res.end(out.body||'');
};
