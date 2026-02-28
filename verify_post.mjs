const baseUrl = 'http://localhost:5000/api';
let cookie = '';
const headers = {
  'Content-Type': 'application/json',
  'Origin': 'http://localhost:5000',
  'Referer': 'http://localhost:5000/companion',
  'User-Agent': 'Mozilla/5.0'
};

async function run() {
  const uniqueEmail = `test_ai_${Date.now()}@example.com`;
  console.log(`Registering test user ${uniqueEmail}...`);
  // 1. Register
  let regRes;
  try {
    regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
  } catch (e) {
    console.log("Fetch failed:", e);
    return;
  }

  if (regRes.status !== 200) {
    console.log("Already registered, trying login...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: 'test_ai_comp2@example.com', password: 'password123' })
    });
    cookie = loginRes.headers.get('set-cookie');
  } else {
    cookie = regRes.headers.get('set-cookie');
  }

  const sid = cookie ? cookie.split(';')[0] : '';
  console.log("Got Session Cookie:", sid);

  console.log("Triggering New Conversation...");
  const convRes = await fetch(`${baseUrl}/ai-companion/conversations`, {
    method: 'POST',
    headers: { ...headers, 'Cookie': sid },
    body: JSON.stringify({ title: 'New Conversation' })
  });

  const body = await convRes.text();
  console.log(`STATUS: ${convRes.status}`);
  console.log(`BODY:`, body);
}

run().catch(console.error);
