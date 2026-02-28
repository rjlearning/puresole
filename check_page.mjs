import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    page.on('requestfailed', request =>
      console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`)
    );

    console.log('Navigating to http://localhost:4000/voice-journal...');
    await page.goto('http://localhost:4000/voice-journal', { waitUntil: 'networkidle0', timeout: 15000 });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'test_screen.png' });

    const html = await page.content();
    console.log('Body length:', html.length);
    console.log('Has React root:', html.includes('id="root"'));

    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('Script Error:', err);
  }
})();
