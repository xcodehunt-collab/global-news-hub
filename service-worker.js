const CACHE_NAME='global-news-hub-v11-loading-fix';
const STATIC_ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./logo.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  const isStatic=url.origin===self.location.origin;
  if(url.origin===self.location.origin && url.pathname.startsWith('/api/')){
    event.respondWith(fetch(event.request));
    return;
  }
  if(!isStatic){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
  );
});

self.addEventListener('push',event=>{
  let data={title:'Global News Hub',body:'A new story is available.',url:'./'};
  if(event.data){ try{ data={...data,...event.data.json()}; }catch{ data.body=event.data.text(); } }
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'./logo.svg',data:{url:data.url},tag:'global-news-hub-push'}));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const rawTarget=event.notification.data && event.notification.data.url ? event.notification.data.url : self.registration.scope;
  let target;
  try{ const u=new URL(rawTarget,self.registration.scope); target=['http:','https:'].includes(u.protocol)?u.href:self.registration.scope; }catch{ target=self.registration.scope; }
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(client.url===target && 'focus' in client) return client.focus();
    }
    if(clients.openWindow) return clients.openWindow(target);
  })());
});
