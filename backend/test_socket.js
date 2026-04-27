
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'testing' },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('update-location', { vendorId: '5f5242db-bc05-4ebf-8840-55dbe4eb1127', lat: 7.065, lng: -73.84 });
});
socket.on('location-updated', (data) => {
  console.log('Success:', data);
  process.exit(0);
});
socket.on('location-error', (data) => {
  console.log('Error:', data);
  process.exit(1);
});
socket.on('connect_error', (err) => {
  console.log('Connect error:', err);
  process.exit(1);
});
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 5000);

