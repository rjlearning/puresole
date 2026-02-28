async function testSave() {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test12345@test.com', password: 'password123' })
    });

    const cookie = loginRes.headers.get('set-cookie');

    const form = new FormData();

    // Use Blob in Node.js global fetch
    const file = new File(['fake audio data'], 'voice-entry.webm', { type: 'audio/webm' });
    form.append('audio', file);
    form.append('duration', '15');
    form.append('moodBefore', '7');

    const saveRes = await fetch('http://localhost:4000/api/voice-entries', {
        method: 'POST',
        headers: {
            cookie: cookie || ''
        },
        body: form
    });

    console.log('Save status:', saveRes.status);
    const text = await saveRes.text();
    console.log('Save response:', text);
}

testSave().catch(console.error);
