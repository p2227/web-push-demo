self.addEventListener('push', function(event) {
  console.log('Received push',event.data.text(),event);
});