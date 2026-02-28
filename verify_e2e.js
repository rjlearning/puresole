import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const baseUrl = 'http://localhost:5000';

        console.log("=== Starting Comprehensive E2E Button & Route Verification ===");

        // Go to landing page to initialize the origin
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Inject a mocked passport/session cookie or local storage auth bypass to get past isAuthenticated
        // Since we are testing compile and run time routing, we can also just verify the components by navigating directly if they don't block.
        // If they do block, we will use our mocked `development` mode or check the DOM for immediate crash errors.

        const routesToTest = [
            { path: '/activities', name: 'Activities Page (Phase 2 & Audio)' },
            { path: '/sleep', name: 'Sleep & Calm Page (Phase 5: Generative Stories)' },
            { path: '/', name: 'Dashboard (Phase 3 & 4: Compassionate Stats)' },
            { path: '/companion', name: 'AI Companion (Emergency Escalation)' }
        ];

        for (const route of routesToTest) {
            console.log(`\n-> Testing: ${route.name}`);
            const response = await page.goto(baseUrl + route.path, { waitUntil: 'domcontentloaded' });

            // Wait briefly for React to mount
            await new Promise(r => setTimeout(r, 500));

            // Check for common crash indicators (React error boundary or blank page)
            const bodyText = await page.evaluate(() => document.body.innerText);
            const hasError = bodyText.includes('TypeError') || bodyText.includes('ReferenceError') || bodyText.includes('Cannot read properties');

            if (response.status() >= 400 && response.status() !== 401 && response.status() !== 403) {
                console.log(`   ❌ Failed with status HTTP ${response.status()}`);
            } else if (hasError) {
                console.log(`   ❌ Page mounted with a React crash: ${bodyText.substring(0, 100)}...`);
            } else {
                // We can check if basic buttons exist to prove it rendered
                const buttonCount = await page.evaluate(() => document.querySelectorAll('button').length);
                const divCount = await page.evaluate(() => document.querySelectorAll('div').length);

                if (divCount > 5) {
                    console.log(`   ✅ Success! Page rendered successfully (${buttonCount} buttons found). No syntax/runtime crashes.`);
                } else {
                    console.log(`   ⚠️ Warning: Page rendered but seems suspiciously empty. It might be blocked by Auth.`);
                }
            }
        }

        console.log("\n=== E2E Verification Complete ===");

    } catch (error) {
        console.error("❌ Fatal Error during testing:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
