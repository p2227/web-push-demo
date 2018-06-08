if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}

document.addEventListener('click',function(e){
  if(e.target.id === 'subscribe'){

    getSubscription().then(subscription=>{
      if(subscription){
        return {
          type:'1',subscription
        }
      }else{
        return Promise.all([
          getPublickey(),getNotificationPermission()
        ]).then(([resp])=>{
          return doSubscribe(resp.publickey)
          .then(subscription=>recordEndpoints(resp.userid,subscription))
          .then(subscription=>{
            return { type:'0', subscription }
          })
        })
      }
    }).then((subInfo)=>{
      const tip = ['successfully subscribe','already subscribe'][subInfo.type]
      console.log(tip, subInfo.subscription);
    }).catch(err=>{
      console.error(err);
    })
  }
});

function getSubscription(){
  return navigator.serviceWorker.ready.then((serviceWorkerRegistration)=>{
    return serviceWorkerRegistration.pushManager.getSubscription()
  })
}

function getPublickey(){
  return fetch('/publickey').then(resp=>resp.json());
}

function getNotificationPermission(){
  return new Promise((resolve, reject) => {
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
}

function doSubscribe(publickey){
  return navigator.serviceWorker.ready
  .then((serviceWorkerRegistration) => {
    return serviceWorkerRegistration.pushManager.subscribe(
      {
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publickey)
      }
    );
  })
}

function recordEndpoints(userid, subscription){
  return fetch('/endpoints',{
    method:'post',
    headers:{
      'Content-type': 'application/json'
    },
    body:JSON.stringify({
      userid:userid,
      subscription
    })
  }).then(resp=>subscription)
}

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

let board = document.getElementById('page-message');

navigator.serviceWorker.addEventListener('message', function (event) {
  let data = JSON.parse(event.data);
  if (data.type === 'update') {
    fetch('/push-log',{
      method:'GET'
    })
    .then(resp=>resp.json())
    .then(json=>board.innerHTML = JSON.stringify(json,null,2));
  }
});