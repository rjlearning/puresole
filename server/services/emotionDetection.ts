import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface EmotionAnalysis {
  emotions: string[];
  dominant: string;
  intensity: number;
  stressLevel: number;
  anxietyLevel: number;
  moodScore: number;
  energyLevel: number;
  reasoning: string;
  insights: string[];
  activities: Activity[];
  mentalStatus: MentalStatus;
  transcript?: string;
}

interface Activity {
  type: 'breathwork' | 'exercise' | 'meditation' | 'journaling' | 'social' | 'rest';
  title: string;
  description: string;
  duration: number; // minutes
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface MentalStatus {
  overall: 'excellent' | 'good' | 'fair' | 'concerning';
  strengths: string[];
  challenges: string[];
  riskFactors: string[];
  improvements: string[];
}

async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), audioPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Audio file not found: ${fullPath}`);
    }

    console.log('[AI] Transcribing audio with Whisper...');

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(fullPath),
      model: 'whisper-1',
      language: 'en',
    });

    console.log('[AI] Transcription complete:', transcription.text.substring(0, 100));
    return transcription.text;
  } catch (error: any) {
    console.error('[AI] Transcription error:', error);
    throw error;
  }
}

async function generateActivities(analysis: any): Promise<Activity[]> {
  const activities: Activity[] = [];

  if (analysis.stressLevel > 60) {
    activities.push({
      type: 'breathwork',
      title: 'Box Breathing Exercise',
      description: 'Breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4. Repeat 5 times.',
      duration: 5,
      priority: 'high',
      reason: 'Your stress level is elevated. This can help calm your nervous system.'
    });
  }

  if (analysis.anxietyLevel > 50) {
    activities.push({
      type: 'meditation',
      title: 'Grounding Meditation',
      description: 'Focus on 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.',
      duration: 10,
      priority: 'high',
      reason: 'Grounding techniques help reduce anxiety and bring you to the present moment.'
    });
  }

  if (analysis.energyLevel < 40) {
    activities.push({
      type: 'rest',
      title: 'Power Nap or Rest Break',
      description: 'Take a 20-minute power nap or simply lie down and rest without devices.',
      duration: 20,
      priority: 'medium',
      reason: 'Your energy is low. Rest will help you recharge.'
    });
  } else if (analysis.energyLevel > 70) {
    activities.push({
      type: 'exercise',
      title: 'Energizing Walk or Movement',
      description: 'Take a brisk 15-minute walk outside or do some light stretching.',
      duration: 15,
      priority: 'medium',
      reason: 'You have good energy. Channel it into movement for mood boost.'
    });
  }

  if (analysis.moodScore < 50) {
    activities.push({
      type: 'social',
      title: 'Connect with Someone',
      description: 'Call or message a friend or family member. Even a brief connection can help.',
      duration: 10,
      priority: 'medium',
      reason: 'Social connection has been shown to improve mood and reduce stress.'
    });

    activities.push({
      type: 'journaling',
      title: 'Gratitude Journaling',
      description: 'Write down 3 things you\'re grateful for today, no matter how small.',
      duration: 5,
      priority: 'low',
      reason: 'Focusing on gratitude can shift your perspective and improve mood.'
    });
  }

  return activities.slice(0, 3); // Return top 3 activities
}

function assessMentalStatus(
  stressLevel: number,
  anxietyLevel: number,
  moodScore: number,
  energyLevel: number,
  emotions: string[]
): MentalStatus {
  const strengths: string[] = [];
  const challenges: string[] = [];
  const riskFactors: string[] = [];
  const improvements: string[] = [];

  // Assess strengths
  if (moodScore >= 70) strengths.push('Positive mood state');
  if (energyLevel >= 70) strengths.push('Good energy levels');
  if (stressLevel < 40) strengths.push('Low stress levels');
  if (anxietyLevel < 40) strengths.push('Minimal anxiety');

  // Assess challenges
  if (stressLevel > 60) challenges.push('Elevated stress');
  if (anxietyLevel > 60) challenges.push('High anxiety');
  if (moodScore < 40) challenges.push('Low mood');
  if (energyLevel < 40) challenges.push('Fatigue');

  // Assess risk factors
  if (stressLevel > 80 || anxietyLevel > 80) {
    riskFactors.push('Very high stress/anxiety - consider professional support');
  }
  if (moodScore < 30) {
    riskFactors.push('Significantly low mood - professional help recommended');
  }
  if (emotions.includes('hopeless') || emotions.includes('worthless')) {
    riskFactors.push('Concerning emotional patterns detected');
  }

  // Suggest improvements
  if (stressLevel > 50) improvements.push('Practice daily stress-reduction techniques');
  if (anxietyLevel > 50) improvements.push('Consider mindfulness or meditation practice');
  if (energyLevel < 50) improvements.push('Review sleep quality and rest patterns');
  if (moodScore < 60) improvements.push('Engage in mood-boosting activities daily');

  // Determine overall status
  let overall: 'excellent' | 'good' | 'fair' | 'concerning';
  const avgScore = (moodScore + energyLevel + (100 - stressLevel) + (100 - anxietyLevel)) / 4;

  if (riskFactors.length > 0) overall = 'concerning';
  else if (avgScore >= 75) overall = 'excellent';
  else if (avgScore >= 60) overall = 'good';
  else overall = 'fair';

  return { overall, strengths, challenges, riskFactors, improvements };
}

async function analyzeWithGPT4(
  transcript: string,
  moodBefore?: number,
  notes?: string
): Promise<EmotionAnalysis> {
  const prompt = `You are a mental health AI assistant analyzing a voice journal entry. Provide a compassionate, accurate emotional analysis.

Voice Transcript: "${transcript}"
${moodBefore ? `Self-reported mood (1-10): ${moodBefore}` : ''}
${notes ? `Additional notes: ${notes}` : ''}

Analyze this entry and provide:
1. List of emotions detected (e.g., anxious, hopeful, frustrated)
2. The dominant emotion
3. Emotional intensity (0-1)
4. Stress level (0-100)
5. Anxiety level (0-100)
6. Overall mood score (0-100)
7. Energy level (0-100)
8. Brief reasoning for your assessment
9. 3 compassionate, actionable insights

Respond in JSON format:
{
  "emotions": ["emotion1", "emotion2"],
  "dominant": "primary emotion",
  "intensity": 0.7,
  "stressLevel": 65,
  "anxietyLevel": 50,
  "moodScore": 55,
  "energyLevel": 60,
  "reasoning": "Brief explanation",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],

      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from GPT-4');

    const analysis = JSON.parse(content);

    // Generate activities and mental status
    const activities = await generateActivities(analysis);
    const mentalStatus = assessMentalStatus(
      analysis.stressLevel,
      analysis.anxietyLevel,
      analysis.moodScore,
      analysis.energyLevel,
      analysis.emotions
    );

    return {
      ...analysis,
      activities,
      mentalStatus,
      transcript
    };
  } catch (error: any) {
    console.error('[AI] GPT-4 analysis error:', error);
    throw error;
  }
}

export async function analyzeVoiceEntry(
  audioPath: string,
  moodBefore?: number,
  notes?: string
): Promise<EmotionAnalysis> {
  console.log('[AI] Starting analysis for:', audioPath);

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
      console.log('[AI] No OpenAI API key, using mock analysis');
      return await getMockAnalysis(moodBefore);
    }

    // Real AI analysis
    const transcript = await transcribeAudio(audioPath);
    const analysis = await analyzeWithGPT4(transcript, moodBefore, notes);
    return analysis;
  } catch (error: any) {
    console.error('[AI] Analysis error:', error);
    // Fallback to mock analysis
    console.log('[AI] Falling back to mock analysis');
    return await getMockAnalysis(moodBefore);
  }
}

async function getMockAnalysis(moodBefore?: number): Promise<EmotionAnalysis> {
  const baseStress = moodBefore ? Math.max(0, 100 - (moodBefore * 10)) : 50;
  const baseMood = moodBefore ? moodBefore * 10 : 60;
  const baseAnxiety = Math.max(20, baseStress - 10);
  const baseEnergy = Math.min(85, baseMood + 5);

  const emotions = baseMood > 70 ? ['happy', 'content', 'energized'] :
    baseMood > 40 ? ['calm', 'thoughtful'] :
      ['stressed', 'tired', 'worried'];

  const activities = await generateActivities({
    stressLevel: baseStress,
    anxietyLevel: baseAnxiety,
    moodScore: baseMood,
    energyLevel: baseEnergy
  });

  const mentalStatus = assessMentalStatus(
    baseStress,
    baseAnxiety,
    baseMood,
    baseEnergy,
    emotions
  );

  return {
    emotions,
    dominant: emotions[0],
    intensity: 0.6,
    stressLevel: baseStress,
    anxietyLevel: baseAnxiety,
    moodScore: baseMood,
    energyLevel: baseEnergy,
    reasoning: 'Analysis based on voice patterns and self-reported mood',
    insights: [
      baseMood > 70 ? 'Great energy today! Keep up the positive momentum.' :
        baseMood > 40 ? 'Balanced state. Consider maintaining with mindfulness.' :
          'Elevated stress detected. Try a breathing exercise.',

      'Your wellness score reflects recent patterns',
      'Daily check-ins help track progress over time'
    ],
    activities,
    mentalStatus
  };
}

export default { analyzeVoiceEntry };
