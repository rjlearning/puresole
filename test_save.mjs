import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testSave() {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test12345@test.com', password: 'password123' })
    });

    const cookie = loginRes.headers.raw()['set-cookie']?.join('; ');

    const form = new FormData();
    form.append('audio', Buffer.from('fake audio data'), {
        filename: 'voice-entry.webm',
        contentType: 'audio/webm',
    });
    form.append('duration', '15');
    form.append('moodBefore', '7');

    const saveRes = await fetch('http://localhost:4000/api/voice-entries', {
        method: 'POST',
        headers: {
            cookie: cookie || '',
            ...form.getHeaders()
        },
        body: form
    });

    console.log('Save status:', saveRes.status);
    const text = await saveRes.text();
    console.log('Save response:', text);
}

testSave().catch(console.error);
