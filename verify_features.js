import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const baseUrl = 'http://localhost:5000';

        console.log("=== Starting PureSoul Feature Verification ===");

        // Go to landing page first to set localStorage
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Spoof authentication for the frontend so it doesn't redirect us
        await page.evaluate(() => {
            window.localStorage.setItem('isAuthenticated', 'true');
        });

        // 2. Check Sleep Stories
        console.log("-> Checking Phase 5: Generative Sleep Stories UI...");
        await page.goto(baseUrl + '/sleep', { waitUntil: 'networkidle0' });

        // Give react a moment to render
        await page.waitForTimeout(1000);

        const hasSleepStoriesTab = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(b => b.innerText.includes('Sleep Stories'));
        });
        console.log(`   Sleep Stories Tab Exists: ${hasSleepStoriesTab ? '✅' : '❌'}`);

        // 3. Check Somatic Healing Guides
        console.log("-> Checking Phase 2: Somatic Activities...");
        await page.goto(baseUrl + '/activities', { waitUntil: 'networkidle0' });

        await page.waitForTimeout(1000);

        const hasSomaticSection = await page.evaluate(() => document.body.innerText.includes('Somatic Healing'));
        console.log(`   Somatic Section Exists: ${hasSomaticSection ? '✅' : '❌'}`);

        console.log("=== Verification Complete! ===");

    } catch (error) {
        console.error("❌ Verification failed:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
