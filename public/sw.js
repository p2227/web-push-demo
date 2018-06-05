self.addEventListener('push', function(event) {
  // console.log('Received push',event.data.text(),event);
  let title = 'web push demo';
  self.registration.showNotification(title, {
    body:event.data.text()
  })
});