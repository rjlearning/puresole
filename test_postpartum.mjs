// Using built-in fetch

async function testPostpartum() {
    const baseUrl = 'http://localhost:4000';
    const email = `postpartum_test_${Date.now()}@example.com`;
    const password = 'password123';

    console.log('--- TESTING POSTPARTUM API ---');

    try {
        // 1. Register
        console.log('Registering user...');
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName: 'Post',
                lastName: 'Tester'
            })
        });

        if (!regRes.ok) {
            throw new Error(`Registration failed: ${regRes.statusText}`);
        }
        console.log('Registered successfully.');
        const cookie = regRes.headers.get('set-cookie');

        // 2. Test Get User Metadata (Postpartum fields)
        console.log('Checking user metadata...');
        const userRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Cookie': cookie }
        });
        const userData = await userRes.json();
        console.log('User metadata retrieved:', {
            email: userData.email,
            postpartumDeliveryDate: userData.postpartumDeliveryDate
        });

        // 2.5 Onboarding
        console.log('Completing onboarding...');
        const onboardRes = await fetch(`${baseUrl}/api/postpartum/onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({
                deliveryDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
                deliveryType: 'vaginal',
                breastfeeding: 'yes',
                biomarkers: {
                    ferritin: '25',
                    vitaminD: '28',
                    tsh: '3.5',
                    glucose: '95'
                }
            })
        });
        if (!onboardRes.ok) {
            throw new Error(`Onboarding failed: ${onboardRes.statusText}`);
        }
        console.log('Onboarding completed.');

        // 3. Test Postpartum Routes
        const routes = [
            '/api/postpartum/context',
            '/api/postpartum/meal-plan',
            '/api/postpartum/biomarkers',
            '/api/postpartum/insights'
        ];

        console.log("Testing /api/postpartum/comprehensive-analysis...");
        const analysisRes = await fetch(`${baseUrl}/api/postpartum/comprehensive-analysis`, { headers: { 'Cookie': cookie } });
        if (analysisRes.ok) {
            const analysis = await analysisRes.json();
            console.log("✅ /api/postpartum/comprehensive-analysis responded with 200 OK");
            console.log("Recovery Score:", analysis.recoveryScore);
            console.log("Current Phase:", analysis.currentPhaseName);
        } else {
            console.log("❌ /api/postpartum/comprehensive-analysis FAILED:", analysisRes.status);
        }

        console.log("Testing /api/women/chat...");
        const chatRes = await fetch(`${baseUrl}/api/women/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ message: "I'm feeling very tired lately, why?", stage: 'trimester4' })
        });
        if (chatRes.ok) {
            const chat = await chatRes.json();
            console.log("✅ /api/women/chat responded with 200 OK");
            console.log("AI Reply snippet:", chat.reply.substring(0, 100) + "...");
        } else {
            console.log("❌ /api/women/chat FAILED:", chatRes.status);
        }

        console.log("Testing /api/women/chat CRISIS detection...");
        const crisisRes = await fetch(`${baseUrl}/api/women/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ message: "i want to hurt myself", stage: 'trimester4' })
        });
        if (crisisRes.ok) {
            const chat = await crisisRes.json();
            if (chat.isHighRisk && chat.reply.includes("1-833-943-5746")) {
                console.log("✅ /api/women/chat CRISIS detected and handled correctly");
            } else {
                console.log("❌ /api/women/chat CRISIS detection FAILED to return crisis response");
            }
        }

        for (const route of routes) {
            console.log(`Testing ${route}...`);
            const res = await fetch(`${baseUrl}${route}`, {
                headers: { 'Cookie': cookie }
            });
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ ${route} responded with 200 OK`);
                if (route === '/api/postpartum/nutrients-panel' || route === '/api/postpartum/meal-plan') {
                    console.log('Recovery Steps found:', data.recoverySteps);
                }
            } else {
                console.log(`❌ ${route} failed with ${res.status}`);
            }
        }

        console.log('--- POSTPARTUM API TEST COMPLETE ---');
    } catch (error) {
        console.error('--- POSTPARTUM API TEST FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

testPostpartum();
