import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/ai-companion/conversations',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response body: ${data}`);
  });
});

req.on('error', console.error);
req.write(JSON.stringify({ title: 'Test Conversation' }));
req.end();
