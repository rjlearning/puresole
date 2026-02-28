// Using built-in fetch (Node.js 18+)

async function testAICompanion() {
    const baseUrl = 'http://localhost:4000';
    const email = `ai_test_${Date.now()}@example.com`;
    const password = 'password123';

    console.log('--- TESTING AI COMPANION ---');

    try {
        // 1. Register
        console.log('Registering user...');
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName: 'AI',
                lastName: 'Tester'
            })
        });

        if (!regRes.ok) {
            throw new Error(`Registration failed: ${regRes.statusText}`);
        }
        const regData = await regRes.json();
        console.log('Registered successfully.');

        // Get cookie
        const cookie = regRes.headers.get('set-cookie');

        // 2. Create conversation
        console.log('Creating conversation...');
        const convRes = await fetch(`${baseUrl}/api/ai-companion/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify({
                title: 'Test Conversation',
                moodBefore: 'happy'
            })
        });

        if (!convRes.ok) {
            const errorText = await convRes.text();
            throw new Error(`Create conversation failed: ${convRes.status} ${errorText}`);
        }
        const convData = await convRes.json();
        const conversationId = convData.conversation.id;
        console.log(`Conversation created with ID: ${conversationId}`);

        // 3. Send message
        console.log('Sending message...');
        const chatRes = await fetch(`${baseUrl}/api/ai-companion/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify({
                conversationId,
                message: 'Hello, how can you help me today?'
            })
        });

        if (!chatRes.ok) {
            const errorText = await chatRes.text();
            throw new Error(`Chat failed: ${chatRes.status} ${errorText}`);
        }
        const chatData = await chatRes.json();
        console.log('AI Response:', chatData.response);

        console.log('--- AI COMPANION TEST PASSED ---');
    } catch (error) {
        console.error('--- AI COMPANION TEST FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

testAICompanion();
