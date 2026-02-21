// Featherless AI adapter — OpenAI-compatible inference

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
  default: "I understand your concern. Based on what you've described, here are some general wellness suggestions that may help:\n\n1. **Stay consistent with your medication schedule** — timing matters for dopamine management.\n2. **Monitor your symptoms** — track tremor intensity, freeze episodes, and sleep quality daily.\n3. **Stay hydrated and maintain regular meals** — this supports medication absorption.\n4. **Gentle exercise** like walking or stretching can help with stiffness.\n\n*Note: This is informational support only. Always consult your healthcare provider for medical decisions.*",
  tremor: "Tremor management is an important part of daily life with Parkinson's. Some strategies that patients find helpful:\n\n1. **Stress reduction** — anxiety can increase tremor intensity.\n2. **Adequate sleep** — fatigue worsens motor symptoms.\n3. **Temperature awareness** — cold environments may increase stiffness and tremor.\n4. **Occupational therapy tools** — weighted utensils and adaptive devices can help.\n\n*This is general information, not medical advice. Please discuss any changes with your neurologist.*",
  medication: "Medication timing is critical for Parkinson's management. Key points to remember:\n\n1. **Take medications at the same time daily** for consistent dopamine levels.\n2. **Protein intake** can affect levodopa absorption — some patients benefit from timing protein away from medication.\n3. **Never stop medications abruptly** — this can cause serious complications.\n4. **Track 'on' and 'off' periods** to help your doctor optimize your regimen.\n\n*Always follow your prescriber's instructions. This is informational only.*",
  emergency: "In an emergency situation:\n\n1. **Stay calm** — if you're experiencing a freeze episode, try counting or stepping over an imaginary line.\n2. **Contact your caregiver** using the emergency alert in this app.\n3. **If you fall**, assess for injury before trying to get up.\n4. **Keep your emergency card accessible** — it contains your diagnosis, medications, and emergency contacts.\n\n*Call 911 for any life-threatening emergency.*",
};

const MOCK_SUMMARY_STRUCTURED = `## Visit Summary — Structured Note

**Patient:** Christopher Ezernack
**Date:** ${new Date().toLocaleDateString()}
**Provider:** Dr. Sarah Chen, MD — Neurology

### Chief Complaint
Patient reports increased tremor frequency over the past week, particularly in the morning before first medication dose. Reports two freeze episodes this week, both occurring during transitions (doorways).

### Assessment
- Parkinson's Disease, Stage 2 — progression noted
- Dystonia — intermittent, cold-weather exacerbated
- Sleep disturbance — REM behavior disorder symptoms

### Current Medications
1. Carbidopa-Levodopa 25/100 — TID
2. Pramipexole 0.5mg — BID
3. Amantadine 100mg — QD

### Plan
1. Increase Carbidopa-Levodopa to QID with earlier first dose
2. Continue monitoring freeze episodes — consider PT referral
3. Sleep study recommended for REM behavior assessment
4. Follow-up in 4 weeks
5. Caregiver to monitor for dyskinesia with dose increase`;

const MOCK_SUMMARY_PATIENT = `## Your Visit Summary — Easy to Understand

**Your appointment on ${new Date().toLocaleDateString()}**

### What we talked about
Your tremors have been happening more often, especially in the mornings. You also had two episodes where your feet felt "stuck" when walking through doorways this week.

### What's changing
- **Your morning medication** will now be taken earlier and you'll take one extra dose during the day. This should help with the morning tremors.
- **Physical therapy** may be recommended to help with the freezing episodes.
- **A sleep study** is being considered because of your sleep difficulties.

### What you need to do
1. Take your Carbidopa-Levodopa **four times a day** instead of three (your doctor will give you the new schedule).
2. Keep tracking your symptoms in this app.
3. Have your caregiver watch for any unusual involuntary movements.
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
      return getMockChatResponse(messages) + '\n\n*[Demo fallback — server unavailable]*';
    }

    const data = await response.json();
    return data.content || data.choices?.[0]?.message?.content || 'No response received.';
  } catch (error) {
    console.error('Chat request failed:', error);
    return getMockChatResponse(messages) + '\n\n*[Demo fallback — connection error]*';
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
      ? MOCK_SUMMARY_STRUCTURED + '\n\n*[Demo fallback — connection error]*'
      : MOCK_SUMMARY_PATIENT + '\n\n*[Demo fallback — connection error]*';
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
  
  if (lastMessage.includes('tremor') || lastMessage.includes('shak')) {
    return MOCK_CHAT_RESPONSES.tremor;
  }
  if (lastMessage.includes('medic') || lastMessage.includes('dose') || lastMessage.includes('pill')) {
    return MOCK_CHAT_RESPONSES.medication;
  }
  if (lastMessage.includes('emergency') || lastMessage.includes('fall') || lastMessage.includes('freeze')) {
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
      'Morning tremor intensity: moderate',
      'Freeze episodes this week: 2',
      'Sleep quality: below average',
      'Medication adherence: 92%',
      'Last exercise: 2 days ago',
    ],
    trend: [0.35, 0.38, 0.42, 0.40, 0.45, 0.42, adjustedScore],
  };
}

export default {
  chatWithFeatherless,
  summarizeVisitNotes,
  getRiskAssessment,
};
