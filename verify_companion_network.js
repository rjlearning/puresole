import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const baseUrl = 'http://localhost:5000';
    
    // Log API responses
    page.on('response', async (response) => {
        if (response.url().includes('/api/ai-companion/conversations') && response.request().method() === 'POST') {
            try {
                const body = await response.json();
                console.log(`\n🚨 Intercepted API Error Body (${response.status()}):`, JSON.stringify(body, null, 2));
            } catch (e) {}
        }
    });

    console.log("=== Testing AI Companion End-to-End ===");
    // Wait until DOM is fully loaded before doing anything
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.localStorage.setItem('isAuthenticated', 'true'); });
    
    await page.goto(baseUrl + '/companion', { waitUntil: 'networkidle0' });
    
    console.log("-> Looking for 'New Conversation' Button...");
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const newBtn = btns.find(b => b.innerText.includes('New Conversation'));
        if (newBtn) newBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log("Finished script.");
  } catch (error) {
    console.error("❌ Fatal Error:", error);
  } finally {
    if (browser) await browser.close();
  }
})();
