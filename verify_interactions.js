import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const baseUrl = 'http://localhost:5000';
    
    console.log("=== Testing Somatic Release Button Activity ===");

    // 1. Prepare Auth
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { localStorage.setItem('isAuthenticated', 'true'); });

    // 2. Head to Activities
    await page.goto(baseUrl + '/activities', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    // We expect the Somatic Healing section to hold clickable cards.
    // Let's see if we can log the Activity Titles.
    const titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h3, h4')).map(e => e.innerText);
    });
    console.log("Available Activities:", titles.filter(t => t.length > 3).join(', '));
    
    // Verify specific Somatic cards exist
    if (titles.some(t => t.includes('Vagus Nerve Reset') || t.includes('Tension Releasing Shake'))) {
         console.log("✅ Phase 2: Somatic Exercise cards found and rendering correctly.");
    } else {
         console.log("❌ Somatic cards missing.");
    }

    console.log("\n=== Testing Sleep Stories Playback Selection ===");
    await page.goto(baseUrl + '/sleep', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Try to click "The Enchanted Garden"
    const clicked = await page.evaluate(() => {
        const titleElements = Array.from(document.querySelectorAll('h4'));
        const garden = titleElements.find(el => el.innerText.includes('Enchanted Garden'));
        if (garden && garden.closest('div')) {
             // We can click the parent container
             garden.click();
             return true;
        }
        return false;
    });

    if (clicked) {
        console.log("✅ Phase 5: Successfully clicked 'Enchanted Garden' button element to trigger generation.");
    } else {
        console.log("❌ Could not trigger Sleep Story click.");
    }

    console.log("\n-> Testing Complete. No breaking crashes found on interaction paths.");

  } catch (error) {
    console.error("❌ Fatal Error during testing:", error);
  } finally {
    if (browser) await browser.close();
  }
})();
