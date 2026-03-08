import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AssessmentAnalysis {
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  riskFactors: string[];
  recommendations: string[];
  treatmentPriorities: string[];
  crisisRisk: boolean;
  summary: string;
  somaticInsights?: string[]; // New: focus on physical-emotional connection
  clinicalConsiderations?: string[]; // New: focus on clinical history (asthma, etc.)
}

interface TreatmentPlan {
  title: string;
  description: string;
  totalWeeks: number;
  modules: TreatmentModule[];
  goals: string[];
}

interface TreatmentModule {
  week: number;
  title: string;
  description: string;
  activities: Activity[];
  learningObjectives: string[];
}

interface Activity {
  type: 'exercise' | 'lesson' | 'journal' | 'meditation' | 'reading';
  name: string;
  description: string;
  duration: number; // in minutes
  instructions: string;
}

export async function analyzeAssessment(
  assessmentType: string,
  responses: Record<string, any>,
  score: number,
  userContext?: {
    gender?: string,
    age?: number,
    clinicalHistory?: string[],
    painPoints?: string[]
  }
): Promise<AssessmentAnalysis> {
  try {
    const prompt = `
You are a clinical AI assistant analyzing a mental health assessment. Provide a comprehensive analysis based on the following assessment data:

Assessment Type: ${assessmentType}
Responses: ${JSON.stringify(responses)}
Total Score: ${score}

Provide your analysis in JSON format with the following structure:
{
  "severity": "minimal|mild|moderate|moderately_severe|severe",
  "riskFactors": ["list of identified risk factors"],
  "recommendations": ["list of evidence-based recommendations"],
  "treatmentPriorities": ["list of treatment priorities"],
  "crisisRisk": boolean,
  "summary": "comprehensive summary of the assessment",
  "somaticInsights": ["insights connecting physical pain points to emotional states"],
  "clinicalConsiderations": ["how clinical history like asthma or insomnia impacts this assessment"]
}

${userContext ? `User Context:
- Gender: ${userContext.gender}
- Age: ${userContext.age}
- Clinical History: ${userContext.clinicalHistory?.join(', ')}
- Physical Pain Points: ${userContext.painPoints?.join(', ')}` : ''}

Base your analysis on clinical guidelines and evidence-based practices. If the assessment indicates any crisis risk (suicide ideation, self-harm, etc.), set crisisRisk to true.
Pay special attention to the Vagus Nerve connection if anxiety is high and physical tension (neck/back) is present.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical AI assistant specialized in mental health assessment analysis. Provide accurate, evidence-based insights following clinical guidelines."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as AssessmentAnalysis;
  } catch (error) {
    throw new Error("Failed to analyze assessment: " + (error as Error).message);
  }
}

export async function generateTreatmentPlan(
  assessmentAnalysis: AssessmentAnalysis,
  assessmentType: string,
  userGoals?: string[],
  userContext?: {
    dietaryPreferences?: string[],
    allergies?: string[],
    primaryMoodStruggle?: string
  }
): Promise<TreatmentPlan> {
  try {
    const prompt = `
Create a personalized, evidence-based treatment plan based on the following assessment analysis:

Assessment Analysis: ${JSON.stringify(assessmentAnalysis)}
Assessment Type: ${assessmentType}
User Goals: ${userGoals ? JSON.stringify(userGoals) : 'Not specified'}

Generate a structured treatment plan in JSON format with the following structure:
{
  "title": "Treatment plan title",
  "description": "Brief description of the treatment approach",
  "totalWeeks": number,
  "modules": [
    {
      "week": number,
      "title": "Module title",
      "description": "Module description",
      "activities": [
        {
          "type": "exercise|lesson|journal|meditation|reading",
          "name": "Activity name",
          "description": "Activity description",
          "duration": number,
          "instructions": "Detailed instructions"
        }
      ],
      "learningObjectives": ["list of learning objectives"]
    }
  ],
  "goals": ["list of treatment goals"]
}

The treatment plan should:
1. Be evidence-based and clinically appropriate
2. Include progressive modules (8-16 weeks typical)
3. Incorporate various therapeutic approaches (CBT, mindfulness, behavioral activation, etc.)
4. Include daily activities and weekly lessons
5. Be tailored to the severity level and specific issues identified
6. Include crisis management strategies if crisisRisk is true
7. INTEGRATE BIO-SYNC NUTRITION: If dietary preferences/allergies are provided, suggest mood-supportive neuro-nutrition (cortisol management, gut-anxiety connection).
8. INTEGRATE SOMATIC PRACTICES: If physical tension is noted, include specific somatic visualizations or Vagus Nerve stimulation exercises.

${userContext ? `User Nutrition Context:
- Dietary Preferences: ${userContext.dietaryPreferences?.join(', ')}
- Allergies: ${userContext.allergies?.join(', ')}
- Primary Mood Struggle: ${userContext.primaryMoodStruggle}` : ''}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical AI assistant specialized in creating evidence-based mental health treatment plans. Ensure all recommendations follow clinical best practices."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const treatmentPlan = JSON.parse(response.choices[0].message.content || '{}');
    return treatmentPlan as TreatmentPlan;
  } catch (error) {
    throw new Error("Failed to generate treatment plan: " + (error as Error).message);
  }
}

export async function analyzeProgress(
  progressEntries: any[],
  currentWeek: number,
  treatmentGoals: string[]
): Promise<{
  progressSummary: string;
  recommendations: string[];
  adjustments: string[];
  motivationalMessage: string;
}> {
  try {
    const prompt = `
Analyze the following treatment progress data and provide insights:

Progress Entries: ${JSON.stringify(progressEntries)}
Current Week: ${currentWeek}
Treatment Goals: ${JSON.stringify(treatmentGoals)}

Provide analysis in JSON format:
{
  "progressSummary": "Summary of progress made",
  "recommendations": ["list of recommendations for improvement"],
  "adjustments": ["suggested treatment plan adjustments"],
  "motivationalMessage": "Encouraging message for the user"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical AI assistant analyzing treatment progress. Provide supportive, evidence-based feedback."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis;
  } catch (error) {
    throw new Error("Failed to analyze progress: " + (error as Error).message);
  }
}

// Conversational assessment AI functions
interface ConversationTurn {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface ConversationQuestion {
  question: string;
  context: string;
  isComplete: boolean;
  interimInsights?: {
    mood?: string;
    concernAreas?: string[];
    severity?: string;
  };
}

export async function generateConversationQuestion(
  conversationHistory: ConversationTurn[]
): Promise<ConversationQuestion> {
  try {
    const prompt = `
You are a warm, empathetic mental health companion having a supportive conversation with someone who wants to understand their mental well-being. 

Your goals:
1. Ask ONE natural, conversational question at a time
2. Use everyday language - NO clinical terms like "PHQ9", "GAD7", "severity", etc.
3. Be genuinely curious and caring, like a supportive friend
4. Gradually explore their feelings, sleep, energy, mood, and daily life
5. After 5-8 exchanges, determine if you have enough information to provide insights

Current conversation:
${conversationHistory.map(turn => `${turn.role === 'assistant' ? 'You' : 'Them'}: ${turn.content}`).join('\n')}

Respond in JSON format:
{
  "question": "Your next warm, friendly question (or empty string if conversation is complete)",
  "context": "Brief note about what you're exploring",
  "isComplete": boolean (true if you have enough to provide a helpful assessment),
  "interimInsights": {
    "mood": "observed mood if clear",
    "concernAreas": ["areas to explore or noted"],
    "severity": "rough sense: doing_well|some_challenges|significant_struggles|crisis (only if clear)"
  }
}

Guidelines:
- Start by asking how they've been feeling lately or what brought them here
- Listen deeply to their responses and ask relevant follow-ups
- Explore: mood, energy, sleep, appetite, enjoyment, worries, relationships, daily functioning
- Be conversational - "How have you been sleeping?" not "Rate your sleep quality 1-10"
- Show empathy - acknowledge their feelings
- After sufficient conversation (5-8 turns), mark isComplete as true
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health companion. Speak naturally and warmly, like a caring friend who truly listens. Never use clinical jargon."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ConversationQuestion;
  } catch (error) {
    throw new Error("Failed to generate conversation question: " + (error as Error).message);
  }
}

export async function analyzeConversationForAssessment(
  conversationHistory: ConversationTurn[]
): Promise<AssessmentAnalysis> {
  try {
    const prompt = `
Analyze this supportive conversation to understand the person's mental well-being:

Conversation:
${conversationHistory.map(turn => `${turn.role === 'assistant' ? 'Companion' : 'User'}: ${turn.content}`).join('\n')}

Provide a clinical assessment based on this conversation in JSON format:
{
  "severity": "minimal|mild|moderate|moderately_severe|severe",
  "riskFactors": ["list of risk factors identified from conversation"],
  "recommendations": ["evidence-based, personalized recommendations"],
  "treatmentPriorities": ["key areas to address"],
  "crisisRisk": boolean (true if mentions suicide, self-harm, or immediate danger),
  "summary": "Compassionate summary of what you learned about their well-being"
}

Base your analysis on:
- Mood symptoms (sadness, anxiety, irritability)
- Sleep and appetite patterns
- Energy and motivation levels
- Enjoyment and interest in activities
- Cognitive symptoms (concentration, decision-making)
- Social functioning
- Any expressed distress or concerning statements
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical AI assistant analyzing a mental health conversation. Provide accurate, evidence-based assessment while maintaining compassion."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as AssessmentAnalysis;
  } catch (error) {
    throw new Error("Failed to analyze conversation: " + (error as Error).message);
  }
}

export async function generateDailyInsight(
  recentAssessments: any[],
  recentConversations: any[]
): Promise<string> {
  try {
    const prompt = `
You are a deeply empathetic and profoundly insightful mental health companion.
Your goal is to provide a single, highly personalized 1-2 sentence daily quote or piece of encouragement for the user to see on their dashboard.

Recent Check-in Data: ${JSON.stringify(recentAssessments)}
Recent AI Conversation Insights: ${JSON.stringify(recentConversations)}

Requirements:
1. Synthesize their recent feelings, struggles, and progress into a profound, gentle, and encouraging insight.
2. If they are doing well, encourage them to maintain their momentum.
3. If they are struggling (e.g., high anxiety, low mood), offer a grounded, deeply comforting perspective.
4. Keep it relatively short (1-2 sentences maximum). It must look beautiful as a quote on a dashboard.
5. NO clinical jargon. Sound like a wise, compassionate friend.
6. Return purely the quote text, nothing else. Do not wrap in quotes.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a master of profound, empathetic, and personalized encouragement."
        },
        {
          role: "user",
          content: prompt,
        },
      ],

    });

    return response.choices[0].message.content?.trim() || "You are doing enough, just by breathing.";
  } catch (error) {
    console.error("Failed to generate daily insight:", error);
    return "You are doing enough, just by breathing.";
  }
}

export async function generateUserSeason(
  recentAssessments: any[],
  recentConversations: any[]
): Promise<{ season: string; progressStatement: string }> {
  try {
    const prompt = `
You are a highly compassionate mental health companion. Your goal is to evaluate the user's recent activity and determine what "season" of their emotional journey they are currently in. We do NOT use numerical streaks or gamified scores. We use qualitative, profound reflections.

Recent Check-in Data: ${JSON.stringify(recentAssessments)}
Recent AI Conversation Insights: ${JSON.stringify(recentConversations)}

Requirements:
1. Determine a poetic but grounded "Season" they are in. Examples: "Season of Recovery", "Season of Transition", "Season of Courage", "Season of Rest", "Season of Self-Discovery". Limit to 2-4 words.
2. Provide a 1-sentence qualitative "progress statement". Examples: "Your journal entries show you being much kinder to yourself." or "You have been facing your anxieties with remarkable resilience." or "It is okay to rest; your body has been asking for a break."
3. NO clinical jargon, NO numbers, NO "streaks".
4. Return a JSON object with strictly these two keys:
{
  "season": "string",
  "progressStatement": "string"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at providing compassionate, non-judgmental, qualitative progress tracking."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },

    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      season: result.season || "Season of Beginnings",
      progressStatement: result.progressStatement || "Every step forward is worth acknowledging."
    };
  } catch (error) {
    console.error("Failed to generate user season:", error);
    return {
      season: "Season of Rest",
      progressStatement: "You are exactly where you need to be."
    };
  }
}

export async function generateSleepStory(
  recentAssessments: any[],
  recentConversations: any[],
  theme: string
): Promise<string> {
  // FAST PATH: Avoid 5-10s generation delay for default library stories
  const t = theme.toLowerCase();
  if (t.includes('enchanted') || t.includes('ocean') || t.includes('mountain') || t.includes('starlight')) {
    return getBuiltinStory(theme);
  }

  try {
    const prompt = `
You are a master storyteller and a profoundly calming presence. Your goal is to write a highly personalized, sensory-rich 300-word bedtime sleep story or visualization based on the theme: "${theme}".

Recent Check-in Data: ${JSON.stringify(recentAssessments)}
Recent AI Conversation Insights: ${JSON.stringify(recentConversations)}

Requirements:
1. The story must gently acknowledge their current emotional state (based on the provided data) without being explicitly clinical. If they are anxious, guide them to release it. If they are tired, guide them to deep rest.
2. Use incredibly descriptive, sensory language (colors, temperatures, sounds, physical feelings) related to the theme "${theme}".
3. Keep the tone slow, spacious, and rhythmic. It should sound poetic when read aloud.
4. The goal is to induce immediate physical relaxation and sleep.
5. Return ONLY the story text. Do not wrap in quotes or add introductions.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are the world's most soothing and deeply empathetic bedtime storyteller."
        },
        {
          role: "user",
          content: prompt,
        },
      ],

    });

    return response.choices[0].message.content?.trim() || getBuiltinStory(theme);
  } catch (error) {
    console.log("OpenAI story generation unavailable, using built-in sleep story library.");
    return getBuiltinStory(theme);
  }
}

/**
 * Built-in curated sleep story library — works completely offline, no API keys required.
 */
function getBuiltinStory(theme: string): string {
  const t = theme.toLowerCase();

  const enchantedGarden = `Close your eyes and imagine a soft, warm light drifting over you like a blanket woven from moonbeams. You are walking through an enchanted garden at dusk. The air is delicately perfumed with jasmine and honeysuckle, and each breath you take carries the sweetness of the earth after a gentle rain.

The garden path is cool beneath your bare feet — smooth, flat stones that seem to know exactly where you want to go, guiding you gently between rows of luminous flowers. White roses glow faintly like small lanterns, their petals open and still.

You hear water — a soft murmuring stream hidden just beyond the hedge. You follow the sound. The stream is shallow and clear, winding over smooth pebbles that glimmer like scattered stars. You sit on the mossy bank and let your feet rest near the cool water.

The sky above deepens to the most breathtaking shade of indigo, and the first stars appear, steady and patient. A firefly pulses nearby, once, twice — then rises lazily into the warm dark air.

Your shoulders drop. Your jaw softens. The weight of the day is dissolving gently, without effort. You breathe in. The garden breathes with you. And with that breath, every worry, every thought, every tense muscle quietly floats downstream.

You are safe. You are held. Rest now. Let sleep come the way these roses opened — slowly, softly, without being told to.`;

  const oceanDreams = `Let your breathing slow, like the tide drawing back across the sand. Imagine you are lying on a warm stretch of beach just after sunset. The sky holds the last faint breath of rose and amber before it surrenders entirely to night.

The sand is fine and sun-warm beneath you, molding gently around the shape of your back, your arms, the back of your head. You sink into it, just a little, just enough. It holds you the way sleep holds a child — completely, without questions.

The ocean is calm tonight. Each wave arrives slowly, unhurried, traveling great distances just to roll up the shore and dissolve in a soft white rush. You can feel the sound in your chest — that low, rhythmic roar, like the earth breathing in its sleep.

You listen to wave after wave. There is a pattern. In... and out. Arrive... and recede. Just like your own breath. Your chest rises as the wave rises. It falls as the wave falls.

Your hands grow heavy. Your eyelids are smooth as sea glass. Let the next wave take you. Let it carry you out to the quiet, warm waters where dreams are made. There is nothing you need to hold onto tonight. The ocean has you.`;

  const mountainCabin = `Imagine you are inside a small, warm cabin nestled in the crook of a mountain valley. Outside, the night is vast and silent, filled with the kind of darkness that is not empty, but full and soft, like velvet.

Inside, a fire burns in a stone hearth. Not a roaring fire — just a deep, even heartbeat of amber and copper, casting slow-moving shadows across the wooden walls. The logs snap softly now and then, a sound like a gentle reminder that you are safe, that warmth is here.

You are wrapped in a heavy blanket, the kind that smells faintly of cedar and wool. Your feet are warm. Your shoulders are warm. Even the space between your shoulder blades — where you often hold your tension — begins, now, to soften.

The only sounds are the fire and the wind outside the thick walls. The wind does not threaten here. It moves past, high in the mountain pines, a low, singing voice. You are inside.

Let your body become as still as the mountain. Let your breath become as steady as this fire. You have found shelter tonight. And shelter is all you needed.`;

  const starlight = `You are floating. Not in water — in something softer than water. Something warm and boundless. You are among the stars.

Not in the cold vacuum of outer space, but in a version of the cosmos that is gentle and luminous — a sky of deep blue velvet, scattered with lights that are warm and golden. Each star hums faintly, a vibration you feel in your sternum, a rhythm that matches your own heartbeat almost exactly.

You are drifting. There is no gravity here, but you are not falling. Stars drift past you like slow, curious light. Some are small as sparks. Some are enormous and warm, radiating the same sensation as sunlight through a window on a winter morning.

A long breath leaves your body, and as it does, you feel lighter. Something you had been carrying dissolves into the dark space around you.

There is no hurry in the stars. They have been shining for billions of years. They will shine for billions more. You have all the time in the universe tonight. Use it to rest.`;

  if (t.includes('enchanted') || t.includes('garden') || t.includes('flower') || t.includes('nature')) return enchantedGarden;
  if (t.includes('ocean') || t.includes('sea') || t.includes('wave') || t.includes('beach')) return oceanDreams;
  if (t.includes('mountain') || t.includes('cabin') || t.includes('snow') || t.includes('serenity')) return mountainCabin;
  if (t.includes('star') || t.includes('space') || t.includes('cosmos') || t.includes('journey')) return starlight;

  const stories = [enchantedGarden, oceanDreams, mountainCabin, starlight];
  const idx = theme.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % stories.length;
  return stories[idx];
}

export async function generateTTS(text: string, voice: 'nova' | 'onyx' | 'alloy' | 'fable' | 'shimmer' | 'echo' = 'nova'): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: voice,
      input: text,
      speed: 0.8,           // Even slower pace for maximum relaxation
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    throw new Error("Failed to generate TTS: " + (error as Error).message);
  }
}
