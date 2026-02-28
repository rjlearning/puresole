import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const baseUrl = 'http://localhost:5000';

        console.log("=== Testing AI Companion End-to-End ===");

        // 1. Prepare Auth
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
        await page.evaluate(() => { window.localStorage.setItem('isAuthenticated', 'true'); });

        // 2. Head to AI Companion
        await page.goto(baseUrl + '/companion', { waitUntil: 'networkidle0' });

        console.log("-> Looking for 'New Conversation' Button...");
        await new Promise(r => setTimeout(r, 1000));

        const clickedNew = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const newBtn = btns.find(b => b.innerText.includes('New Conversation'));
            if (newBtn) {
                newBtn.click();
                return true;
            }
            return false;
        });

        if (clickedNew) {
            console.log("   ✅ Clicked 'New Conversation'. Waiting for DB...");
            await new Promise(r => setTimeout(r, 2000));

            // Let's try to type a message
            const typed = await page.evaluate(() => {
                const textarea = document.querySelector('textarea');
                const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Send'));

                if (textarea && sendBtn && !sendBtn.disabled) {
                    // React needs special handling to trigger onChange on textareas
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    nativeInputValueSetter.call(textarea, 'Hello, I feel a bit anxious today.');
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);

                    setTimeout(() => sendBtn.click(), 500);
                    return true;
                }
                return false;
            });

            if (typed) {
                console.log("   ✅ Typed message. Sent to AI backend.");
                console.log("   ⏳ Waiting for OpenAI stream...");
                await new Promise(r => setTimeout(r, 5000));

                const replies = await page.evaluate(() => {
                    const bubbles = Array.from(document.querySelectorAll('div.flex-1.overflow-y-auto p'));
                    return bubbles.map(b => b.innerText);
                });
                console.log("   💬 Chat History:");
                replies.forEach((r, i) => console.log(`      [${i}]: ${r.substring(0, 60)}...`));

                if (replies.length > 1) {
                    console.log("✅ SUCCESS. AI Companion replied natively.");
                } else {
                    console.log("❌ FAILED. AI Companion did not reply.");
                }
            } else {
                console.log("❌ Could not find active chat input or it was disabled (Likely backend 500 on creation).");
            }
        } else {
            console.log("❌ Could not trigger New Conversation click.");
        }

    } catch (error) {
        console.error("❌ Fatal Error during testing:", error);
    } finally {
        if (browser) await browser.close();
    }
})();
