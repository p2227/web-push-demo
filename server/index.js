const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const fetch = require('isomorphic-fetch');
const fastify = require('fastify')();
const crypto = require('crypto');

let store_base = 'https://www.jsonstore.io/';
let url = '';
let vapidKeys = {
  publicKey:'',
  privateKey:''
};

init();
start();

// generate store url and vapidKeys only once
async function init(){
  let config;
  try{
    config = require('./config.json');
  }catch(e){
    config = {};
  }
  let saveObj = null;
  if(config.store_url){
    url = config.store_url;
  }else{
    const token = await fetch(`${store_base}get-token`,{
      method:'GET'
    }).then(resp=>resp.json());
    console.log(token);
    const tokenConfig = {
      store_url: `${store_base}${token.token}`
    }
    saveObj = saveObj ? Object.assign(saveObj, tokenConfig) : tokenConfig;
  }

  if(config.vapidKeys){
    vapidKeys = config.vapidKeys;
  }else{
    vapidKeys = webpush.generateVAPIDKeys();
    console.log(vapidKeys);
    saveObj = saveObj ? Object.assign(saveObj, {vapidKeys}) : {vapidKeys};
  }

  if(saveObj){
    saveObj = Object.assign(config, saveObj);
    fs.writeFileSync(path.join(__dirname, './config.json'), JSON.stringify(saveObj,null,2),{ encoding:'utf8'});
  }

  webpush.setVapidDetails(
    'mailto:p2227@hotmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

async function start(){
  //static assets
  fastify.register(require('fastify-static'), {
    root: path.join(__dirname, '../public')
  });

  //user get public key
  fastify.get('/publickey', async (request ,reply)=>{
    const userid = 'u' + crypto.randomBytes(5).toString('hex');
    const publickey = vapidKeys.publicKey;
    return { userid, publickey };
  });

  //user send it's subscription info
  fastify.post('/endpoints',async (request, reply)=>{
    return fetch(`${url}/users/${request.body.userid}`,{
      method:'POST',
      headers:{
        'Content-type': 'application/json'
      },
      body:JSON.stringify(request.body.subscription)
    }).then(function(resp){
      reply
      .code(resp.status);
      return resp.statusText;
    });
  });

  //admin send push
  fastify.post('/push', async (request, reply)=>{
    return fetch(`${url}/users/`,{
      method:'GET'
    })
    .then(resp=>resp.json())
    .then(resp=>{
      return Promise.all(
        Object.keys(resp.result).forEach(key=>{
          let subscriptionObj = resp.result[key];
          subscriptionObj.expirationTime = null;
          return webpush.sendNotification( subscriptionObj, request.body.content ).catch(err=>{
            return fetch(`${url}/users/${key}`,{ method: 'DELETE' }).then(resp=>resp.json());
          });
        })
      )
    })
  });

  //start server (in fact you should start two diff server)
  try {
    await fastify.listen(3000);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}