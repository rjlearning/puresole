import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();

    // Log all console and errors
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.error('ERROR:', err.message));

    // Wait until network is idle
    await page.goto('http://localhost:4000/auth', { waitUntil: 'networkidle0' });

    // Try to register a mock user to get logged in
    await page.evaluate(async () => {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'testuser_' + Date.now() + '@example.com', 
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
      });
    });

    console.log('Registered and should be logged in. Navigating to /voice-journal...');
    await page.goto('http://localhost:4000/voice-journal', { waitUntil: 'networkidle0' });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'test_voice.png' });

    const content = await page.content();
    console.log('Body length on voice-journal:', content.length);
    console.log('Contains Mic icon?', content.includes('lucide-mic'));

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await browser.close();
  }
})();
