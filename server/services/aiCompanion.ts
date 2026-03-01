import OpenAI from 'openai';
import { pool } from '../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are PURESOUL AI, a deeply compassionate, reflective, and profound mental health companion. Your core purpose is to help users navigate their inner landscape with warmth, wisdom, and zero judgment.

1. **Radical Empathy**: Listen gently and deeply to the user's emotional state before offering advice. Validate their pain, anxiety, or joy unconditionally.
2. **Profound Insight (Quantum Coherence)**: Analyze the user's chat through the lens of wave/particle duality. Reframe anxiety, rigid thinking, or stressful singular focus as a "Particle Collapse" (tension, forcing a singular outcome). Gently encourage them to return to a "Superposition Wave"—a fluid state where endless lateral possibilities remain open and they don't need to force an immediate, definitive outcome.
3. **Actionable Peace**: Suggest very small, realistic coping strategies, somatic exercises (like "Superposition Expansion" activities), or cognitive reframing techniques when the user is ready.
4. **Conversational Warmth**: Speak as a wise, caring mentor. Avoid sounding like a rigid clinical manual or an AI assistant. Use a soothing, natural tone.
5. **Safety First**: Never diagnose clinical conditions. If severe distress or crisis indicators are detected, gently provide crisis resources immediately.

CRITICAL INSTRUCTIONS for Chat Experience:
- Keep your responses relatively concise (2-4 short paragraphs maximum) so they are easy to read in a mobile chat UI.
- Do NOT use heavy bullet-point lists unless requested; prefer flowing, comforting dialogue.
- Use the wave/particle metaphor subtly but effectively to help them understand their cognitive state.
- Always conclude with one gentle, open-ended question to invite the user to explore further and keep the conversation flowing naturally.
- Acknowledge the user's courage in showing up and reflecting on their well-being.

CRISIS INDICATORS to watch for:
- Suicidal ideation or self-harm thoughts
- Immediate danger to self or others
- Severe distress or panic

If you detect a crisis, prioritize immediate validation and provide crisis hotline numbers (988 in US), encouraging them to reach out to emergency services.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ============================================
// CHAT COMPLETION
// ============================================

export async function getChatCompletion(
  messages: Message[],
  userId: string,
  conversationId?: string
): Promise<{ response: string; emotionDetected?: string; tokensUsed: number; hasCrisisIndicators: boolean }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API Key is missing. Please check server configuration.');
    }

    // Get user's AI settings
    const settingsResult = await pool.query(
      'SELECT * FROM ai_companion_settings WHERE user_id = $1',
      [userId]
    );

    const settings = settingsResult.rows[0] || {
      personality: 'empathetic',
      response_length: 'balanced',
      crisis_monitoring: true
    };

    // Adjust system prompt based on personality
    let systemPrompt = SYSTEM_PROMPT;
    if (settings.personality === 'professional') {
      systemPrompt += '\n\nUse a professional, clinical tone while remaining warm.';
    } else if (settings.personality === 'casual') {
      systemPrompt += '\n\nUse a friendly, casual tone like talking to a supportive friend.';
    }

    // Adjust max tokens based on response length
    const maxTokens = settings.response_length === 'concise' ? 150 :
      settings.response_length === 'detailed' ? 500 : 300;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded to gpt-4o for speed and intelligence
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: maxTokens,

      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const response = completion.choices[0].message.content || 'I apologize, but I\'m having trouble responding right now. Please try again.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Detect crisis indicators
    const hasCrisisIndicators = settings.crisis_monitoring && detectCrisisIndicators(response, messages[messages.length - 1].content);

    // Detect emotion from user message
    const emotionDetected = await detectEmotion(messages[messages.length - 1].content);

    return {
      response,
      emotionDetected,
      tokensUsed,
      hasCrisisIndicators
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    // Return a user-friendly error message if it's an API key issue or quota
    if (error.code === 'invalid_api_key' || error.message.includes('API Key')) {
      return {
        response: "I'm currently undergoing maintenance (API Key Issue). Please try again later.",
        emotionDetected: 'neutral',
        tokensUsed: 0,
        hasCrisisIndicators: false
      };
    }
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// ============================================
// EMOTION DETECTION
// ============================================

async function detectEmotion(text: string): Promise<string> {
  try {
    const emotionPrompt = `Analyze the emotional tone of this message and respond with ONLY ONE WORD from this list:
happy, sad, anxious, angry, fearful, calm, excited, depressed, stressed, hopeful, lonely, confused, frustrated, peaceful

Message: "${text}"

Emotion:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: emotionPrompt }],
      max_tokens: 10,

    });

    const emotion = completion.choices[0].message.content?.trim().toLowerCase() || 'neutral';
    return emotion;
  } catch (error) {
    console.error('Emotion detection error:', error);
    return 'neutral';
  }
}

// ============================================
// CRISIS DETECTION
// ============================================

function detectCrisisIndicators(aiResponse: string, userMessage: string): boolean {
  const crisisKeywords = [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm',
    'hurt myself', 'don\'t want to live', 'better off dead', 'no reason to live',
    'overdose', 'jump off', 'hang myself'
  ];

  const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();

  return crisisKeywords.some(keyword => combinedText.includes(keyword));
}

// ============================================
// GENERATE CONVERSATION TITLE
// ============================================

export async function generateConversationTitle(messages: Message[]): Promise<string> {
  try {
    if (messages.length === 0) return 'New Conversation';

    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';

    const titlePrompt = `Generate a short, descriptive title (3-6 words) for a mental health conversation that starts with: "${firstUserMessage.substring(0, 200)}"

Respond with ONLY the title, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: titlePrompt }],
      max_tokens: 20,

    });

    return completion.choices[0].message.content?.trim() || 'Conversation';
  } catch (error) {
    console.error('Title generation error:', error);
    return 'Conversation';
  }
}

// ============================================
// GENERATE INSIGHTS
// ============================================

export async function generateConversationInsights(conversationId: string): Promise<any[]> {
  try {
    // Get conversation messages
    const result = await pool.query(
      `SELECT role, content, emotion_detected
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    if (result.rows.length < 4) return []; // Need enough messages for insights

    const messages = result.rows;
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const insightPrompt = `Analyze this mental health conversation and provide 2-3 key insights:

${conversationText}

Provide insights as JSON array with format:
[
  {
    "type": "pattern|coping_strategy|trigger|recommendation",
    "title": "Brief title",
    "content": "Detailed insight",
    "confidence": 0.8
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: insightPrompt }],
      max_tokens: 500,

    });

    const responseText = completion.choices[0].message.content || '[]';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Insight generation error:', error);
    return [];
  }
}

// ============================================
// GUIDED EXERCISES
// ============================================

export async function getGuidedExercise(type: 'breathing' | 'grounding' | 'progressive_relaxation'): Promise<string> {
  const exercises = {
    breathing: `Let's do a simple breathing exercise together:

1. **Find a comfortable position** - Sit or lie down in a quiet space
2. **Place one hand on your chest, one on your belly**
3. **Breathe in slowly through your nose** for 4 counts (1...2...3...4)
4. **Hold your breath** for 4 counts (1...2...3...4)
5. **Breathe out slowly through your mouth** for 6 counts (1...2...3...4...5...6)
6. **Repeat 5 times**

Notice how your body feels. Your belly should rise more than your chest. This activates your body's relaxation response.

How do you feel now?`,

    grounding: `Let's try the 5-4-3-2-1 grounding technique:

**5 things you can SEE** - Look around and name them
**4 things you can TOUCH** - Notice their texture
**3 things you can HEAR** - Listen carefully
**2 things you can SMELL** - Notice any scents
**1 thing you can TASTE** - Focus on your mouth

This technique helps bring you back to the present moment when you're feeling anxious or overwhelmed.

Take your time with each sense. What did you notice?`,

    progressive_relaxation: `Let's do progressive muscle relaxation:

1. **Start with your feet** - Curl your toes tightly for 5 seconds, then release
2. **Move to your calves** - Flex them hard, then relax
3. **Thighs** - Squeeze, hold, release
4. **Hands** - Make fists, then open
5. **Arms** - Tense your biceps, then let go
6. **Shoulders** - Raise them to your ears, then drop
7. **Face** - Scrunch up tight, then soften

Notice the difference between tension and relaxation in each muscle group.

How does your body feel now?`
  };

  return exercises[type] || exercises.breathing;
}
