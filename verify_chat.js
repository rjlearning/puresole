import http from 'http';

// Create a new conversation to get a valid ID
const createConvReq = http.request({
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
    console.log(`Create Conv Status: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 201) {
       try {
           const parsed = JSON.parse(data);
           console.log("Created Conversation:", parsed.conversation.id);
           testChat(parsed.conversation.id);
       } catch (e) {
           console.error("Parse error:", data);
       }
    } else {
        console.error("Failed to create conv:", data);
    }
  });
});

createConvReq.on('error', console.error);
createConvReq.write(JSON.stringify({ title: 'Test Conversation' }));
createConvReq.end();

function testChat(conversationId) {
    const chatReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai-companion/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`Chat Response Status: ${res.statusCode}`);
        console.log(`Chat Response Data: ${data}`);
      });
    });

    chatReq.on('error', console.error);
    chatReq.write(JSON.stringify({ conversationId, message: 'Hello, I am testing the system.' }));
    chatReq.end();
}
