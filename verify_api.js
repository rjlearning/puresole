import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/sleep/generate-story',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({ theme: 'Enchanted Forest' }));
req.end();
