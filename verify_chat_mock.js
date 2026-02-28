import { db } from './server/db.js';
import { chatConversations, chatMessages } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

// We just want to check if the DB tables exist and if OpenAI triggers correctly.
async function verify() {
  console.log("=== Testing Backend DB & AI Systems manually ===");
  try {
      console.log("1. Checking Database Tables...");
      // Let's just try to select 1 from conversations
      const convs = await db.select().from(chatConversations).limit(1);
      console.log("   ✅ Database tables connected. Convs found:", convs.length);

      console.log("2. Checking OpenAI Key...");
      const openai = new OpenAI();
      // Fast check
      const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Say 'OK'" }],
          max_tokens: 5
      });
      console.log("   ✅ OpenAI Responded:", response.choices[0].message.content);

      console.log("All mocked core systems passed.");
      process.exit(0);
  } catch(e) {
      console.error("   ❌ Crash:", e);
      process.exit(1);
  }
}
verify();
