// Featherless AI adapter (OpenAI-compatible inference)

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'https://neurosync-care-server.onrender.com';
const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ─── Mock Responses for Demo Mode ───────────────────────────────────────────

const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default: "I understand your concern. Based on what you've described, here are some general wellness suggestions that may help:\n\n1. **Stay consistent with your medication schedule** as timing matters for neurological symptom management.\n2. **Monitor your symptoms** and track intensity, episode frequency, and sleep quality daily.\n3. **Stay hydrated and maintain regular meals** as this supports medication absorption and overall neurological health.\n4. **Gentle exercise** like walking or stretching can help with stiffness and cognitive function.\n\n*Note: This is informational support only. Always consult your healthcare provider for medical decisions.*",
  symptom: "Symptom management is an important part of daily life with a neurological condition. Some strategies that patients find helpful:\n\n1. **Stress reduction** as anxiety can increase symptom intensity across many neurological conditions.\n2. **Adequate sleep** as fatigue worsens both motor and cognitive symptoms.\n3. **Temperature awareness** as environmental factors can affect neurological symptoms.\n4. **Occupational therapy tools** and adaptive devices can help with daily activities.\n\n*This is general information, not medical advice. Please discuss any changes with your neurologist.*",
  medication: "Medication timing is critical for neurological condition management. Key points to remember:\n\n1. **Take medications at the same time daily** for consistent therapeutic levels.\n2. **Dietary interactions** can affect medication absorption, so discuss timing with your provider.\n3. **Never stop medications abruptly** as this can cause serious neurological complications.\n4. **Track symptom patterns** relative to medication timing to help your doctor optimize your regimen.\n\n*Always follow your prescriber's instructions. This is informational only.*",
  emergency: "In an emergency situation:\n\n1. **Stay calm** and follow your emergency action plan if you have one.\n2. **Contact your caregiver** using the emergency alert in this app.\n3. **If you fall**, assess for injury before trying to get up.\n4. **Keep your emergency card accessible** as it contains your diagnosis, medications, and emergency contacts.\n\n*Call 911 for any life-threatening emergency.*",
};

const MOCK_SUMMARY_STRUCTURED = `## Visit Summary: Structured Note

**Date:** ${new Date().toLocaleDateString()}

### Chief Complaint
Patient presents for routine follow-up. Reports changes in symptom frequency and intensity over the past week. Sleep quality has been variable.

### Assessment
Neurological condition management reviewed. Current medication regimen evaluated. Symptom tracking data reviewed from patient logs.

### Plan
1. Adjust medication timing based on symptom patterns
2. Continue symptom monitoring and logging
3. Consider therapy referral based on functional assessment
4. Follow-up in 4 weeks
5. Caregiver to monitor for any new or worsening symptoms`;

const MOCK_SUMMARY_PATIENT = `## Your Visit Summary (Easy to Understand)

**Your appointment on ${new Date().toLocaleDateString()}**

### What we talked about
We reviewed how your symptoms have been over the past few weeks and looked at the data you've been tracking in the app.

### What's changing
- **Your medication schedule** may be adjusted to better manage your symptoms throughout the day.
- **Therapy** may be recommended to help with specific functional challenges.
- **Additional monitoring** is being considered based on your recent symptom patterns.

### What you need to do
1. Follow your updated medication schedule as directed by your provider.
2. Keep tracking your symptoms in this app.
3. Have your caregiver watch for any new or unusual symptoms.
4. Come back in **4 weeks** for a follow-up.

### Questions?
Write down any questions before your next visit. You can use the chat feature in this app to get general information anytime.`;

// ─── API Functions ──────────────────────────────────────────────────────────

export async function chatWithFeatherless(
  messages: ChatMessage[],
  isDemoMode: boolean = false,
): Promise<string> {
  if (isDemoMode) {
    return getMockChatResponse(messages);
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Chat API error ${response.status}: ${errorText}`);
      return getMockChatResponse(messages) + '\n\n*[Demo fallback: server unavailable]*';
    }

    const data = await response.json();
    return data.content || data.choices?.[0]?.message?.content || 'No response received.';
  } catch (error) {
    console.error('Chat request failed:', error);
    return getMockChatResponse(messages) + '\n\n*[Demo fallback: connection error]*';
  }
}

export async function summarizeVisitNotes(
  notes: string,
  format: 'structured' | 'patient-friendly',
  isDemoMode: boolean = false,
): Promise<string> {
  if (isDemoMode) {
    return format === 'structured' ? MOCK_SUMMARY_STRUCTURED : MOCK_SUMMARY_PATIENT;
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, format }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Summarize API error ${response.status}: ${errorText}`);
      return format === 'structured'
        ? MOCK_SUMMARY_STRUCTURED + '\n\n*[Demo fallback]*'
        : MOCK_SUMMARY_PATIENT + '\n\n*[Demo fallback]*';
    }

    const data = await response.json();
    return data.summary || 'No summary generated.';
  } catch (error) {
    console.error('Summarize request failed:', error);
    return format === 'structured'
      ? MOCK_SUMMARY_STRUCTURED + '\n\n*[Demo fallback: connection error]*'
      : MOCK_SUMMARY_PATIENT + '\n\n*[Demo fallback: connection error]*';
  }
}

export async function getRiskAssessment(
  isDemoMode: boolean = false,
  symptoms?: Record<string, number>,
): Promise<{
  score: number;
  level: 'low' | 'moderate' | 'elevated' | 'high';
  factors: string[];
  trend: number[];
}> {
  if (isDemoMode) {
    return getMockRiskAssessment(symptoms);
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });

    if (!response.ok) {
      return getMockRiskAssessment(symptoms);
    }

    return await response.json();
  } catch (error) {
    return getMockRiskAssessment(symptoms);
  }
}

// ─── Mock Helpers ───────────────────────────────────────────────────────────

function getMockChatResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  if (lastMessage.includes('tremor') || lastMessage.includes('shak') || lastMessage.includes('symptom') || lastMessage.includes('episode')) {
    return MOCK_CHAT_RESPONSES.symptom;
  }
  if (lastMessage.includes('medic') || lastMessage.includes('dose') || lastMessage.includes('pill') || lastMessage.includes('drug')) {
    return MOCK_CHAT_RESPONSES.medication;
  }
  if (lastMessage.includes('emergency') || lastMessage.includes('fall') || lastMessage.includes('help') || lastMessage.includes('911')) {
    return MOCK_CHAT_RESPONSES.emergency;
  }
  return MOCK_CHAT_RESPONSES.default;
}

function getMockRiskAssessment(symptoms?: Record<string, number>) {
  const baseScore = 0.42;
  let adjustedScore = baseScore;
  
  if (symptoms) {
    if (symptoms.tremor) adjustedScore += symptoms.tremor * 0.05;
    if (symptoms.freezing) adjustedScore += symptoms.freezing * 0.08;
    if (symptoms.sleep) adjustedScore += (1 - symptoms.sleep) * 0.04;
    if (symptoms.mood) adjustedScore += (1 - symptoms.mood) * 0.03;
  }
  
  adjustedScore = Math.min(Math.max(adjustedScore, 0), 1);
  
  const level: 'low' | 'moderate' | 'elevated' | 'high' =
    adjustedScore < 0.3 ? 'low' :
    adjustedScore < 0.5 ? 'moderate' :
    adjustedScore < 0.7 ? 'elevated' : 'high';

  return {
    score: Math.round(adjustedScore * 100) / 100,
    level,
    factors: [
      'Primary symptom intensity: moderate',
      'Episode frequency this week: variable',
      'Sleep quality: below average',
      'Medication adherence: tracking',
      'Last activity logged: recent',
    ],
    trend: [0.35, 0.38, 0.42, 0.40, 0.45, 0.42, adjustedScore],
  };
}

export default {
  chatWithFeatherless,
  summarizeVisitNotes,
  getRiskAssessment,
};
