if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}

document.addEventListener('click',function(e){
  if(e.target.id === 'subscribe'){
    
    Promise.all([
      fetch('/publickey').then(resp=>resp.json()),
      new Promise((resolve, reject) => {
        if (Notification.permission === 'denied') {
          return reject(new Error('Push messages are blocked.'));
        }
  
        if (Notification.permission === 'granted') {
          return resolve();
        }
  
        if (Notification.permission === 'default') {
          Notification.requestPermission((result) => {
            if (result !== 'granted') {
              reject(new Error('Bad permission result'));
            }
  
            resolve();
          });
        }
      })
    ]).then(([resp])=>{
      return Promise.all([
        Promise.resolve(resp),
        navigator.serviceWorker.ready
        .then((serviceWorkerRegistration) => {
          return serviceWorkerRegistration.pushManager.subscribe(
            {
              userVisibleOnly: true,
              applicationServerKey: base64UrlToUint8Array(resp.publickey)
            }
          );
        })
      ])
    }).then(function([resp,subscription]){
      console.log(resp.userid);
      return fetch('/endpoints',{
        method:'post',
        headers:{
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          userid:resp.userid,
          subscription
        })
      })
    }).then(function(){
      console.log(arguments);
    });

  }
});

// Converts the URL-safe base64 encoded |base64UrlData| to an Uint8Array buffer.
function base64UrlToUint8Array(base64UrlData) {
  const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
  const base64 = (base64UrlData + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}