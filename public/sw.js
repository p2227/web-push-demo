let version = '1.0';

let cacheNames = {
  'c': `c${version}`
};

self.addEventListener('push', function(event) {
  // console.log('Received push',event.data.text(),event);
  let data = event.data.json();

  if(data.type === 'update'){
    self.registration.update().then(()=>{
      self.clients.matchAll()
        .then(function (clients) {
            if (clients && clients.length) {
                clients.forEach(function (client) {
                    client.postMessage(JSON.stringify(data));
                })
            }
        })
    });
  }else if(data.type === 'show'){
    let title = 'web push demo';
    self.registration.showNotification(title, {
      body:''+data.content
    })
  }
});

self.addEventListener('fetch', function(event){
  event.respondWith(caches.match(cacheNames['c'], event.request.url)
  .then(function(resp){
    fetch(event.request).then(resp=>cache.put(event.request.url,resp));
    return resp;
  }).catch(function() {
    return fetch(event.request);
  }));
});

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(cacheNames['c']).then(function(cache){
      return cache.addAll([
        '/',
        '/app.js',
        '/push-log'
      ])
    })
  )
});