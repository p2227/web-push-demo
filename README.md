# web-push-demo
a demo for web push (service worker, pwa)


## web push (VAPID) data flow
* a VAPID includes a public key and a private key;
* server: check if there is already a VAPID, otherwise generates it;
* browser: check if there is already a subscription, otherwise get publickey from server;
* browser: subscribe to FCM, get endpoint info;
* browser: send endpoint info and other info (userid, for example) to the server;
* server: send endpoint info to the FCM and browser get a push;

## how to run
```
  git clone
  npm i
  npm start
```

## tips
* google service framework is needed if you want to run it in an Android devices;
* a scientifically network is needed. You should be able to access FCM; 

## reference
* [https://gauntface.github.io/simple-push-demo/](https://gauntface.github.io/simple-push-demo/)
* [google Docs](https://developers.google.com/web/fundamentals/push-notifications/)