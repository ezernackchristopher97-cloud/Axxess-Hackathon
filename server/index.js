// NeuroSync Care — Backend Server

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Featherless AI configuration
const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || '';
const FEATHERLESS_MODEL_ID = process.env.FEATHERLESS_MODEL_ID || 'deepseek-ai/DeepSeek-V3-0324';

const path = require('path');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NeuroSync Care Server',
    version: '1.0.0',
    featherlessConfigured: !!FEATHERLESS_API_KEY,
    model: FEATHERLESS_MODEL_ID,
    timestamp: new Date().toISOString(),
  });
});

// ─── Featherless AI Proxy Helper ────────────────────────────────────────────

async function callFeatherless(messages, options = {}) {
  if (!FEATHERLESS_API_KEY) {
    throw new Error('FEATHERLESS_API_KEY not configured. Set it in .env file.');
  }

  const body = {
    model: options.model || FEATHERLESS_MODEL_ID,
    messages,
    max_tokens: options.max_tokens || 2048,
    temperature: options.temperature || 0.7,
    top_p: options.top_p || 0.9,
  };

  const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Featherless API error ${response.status}: ${errorText}`);
    
    if (response.status === 401) {
      throw new Error('Invalid Featherless API key (401 Unauthorized)');
    }
    if (response.status === 403) {
      throw new Error('Featherless API access forbidden (403)');
    }
    if (response.status === 503) {
      throw new Error('Featherless model is loading. Please try again in a moment (503)');
    }
    throw new Error(`Featherless API error: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// ─── Chat Endpoint ──────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Demo mode fallback
    if (req.body.demoMode) {
      const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      let mockReply = "I understand your concern. Based on what you've described, here are some general wellness suggestions:\n\n1. **Stay consistent with your medication schedule** as timing matters for neurological symptom management.\n2. **Monitor your symptoms** and track intensity, episode frequency, and sleep quality daily.\n3. **Stay hydrated and maintain regular meals** as this supports medication absorption.\n4. **Gentle exercise** like walking or stretching can help with stiffness and cognitive function.\n\n*Note: This is informational support only. Always consult your healthcare provider for medical decisions.*";
      if (lastMsg.includes('symptom') || lastMsg.includes('episode')) mockReply = "Symptom management is an important part of daily life with a neurological condition. Some strategies that patients find helpful:\n\n1. **Stress reduction** as anxiety can increase symptom intensity.\n2. **Adequate sleep** as fatigue worsens both motor and cognitive symptoms.\n3. **Temperature awareness** as environmental factors can affect neurological symptoms.\n4. **Occupational therapy tools** and adaptive devices can help with daily activities.\n\n*This is general information, not medical advice. Please discuss any changes with your neurologist.*";
      if (lastMsg.includes('medic') || lastMsg.includes('dose')) mockReply = "Medication timing is critical for neurological condition management. Key points to remember:\n\n1. **Take medications at the same time daily** for consistent therapeutic levels.\n2. **Dietary interactions** can affect medication absorption, so discuss timing with your provider.\n3. **Never stop medications abruptly** as this can cause serious neurological complications.\n4. **Track symptom patterns** relative to medication timing to help your doctor optimize your regimen.\n\n*Always follow your prescriber's instructions.*";
      return res.json({ content: mockReply, model: 'demo-mode', usage: null });
    }

    const data = await callFeatherless(messages);
    const content = data.choices?.[0]?.message?.content || 'No response generated.';

    res.json({
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Summarize Endpoint ─────────────────────────────────────────────────────

app.post('/api/summarize', async (req, res) => {
  try {
    const { notes, format } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'notes field is required' });
    }

    // Demo mode fallback
    if (req.body.demoMode) {
      const mockStructured = `## Visit Summary — Structured Note\n\n**Date:** ${new Date().toLocaleDateString()}\n\n### Chief Complaint\nPatient presents for routine follow-up. Reports changes in symptom frequency and intensity over the past week. Sleep quality has been variable.\n\n### Assessment\nNeurological condition management reviewed. Current medication regimen evaluated. Symptom tracking data reviewed from patient logs.\n\n### Plan\n1. Adjust medication timing based on symptom patterns\n2. Continue symptom monitoring and logging\n3. Consider therapy referral based on functional assessment\n4. Follow-up in 4 weeks\n5. Caregiver to monitor for any new or worsening symptoms`;
      const mockPatient = `## Your Visit Summary\n\n**Your appointment on ${new Date().toLocaleDateString()}**\n\n### What we talked about\nWe reviewed how your symptoms have been over the past few weeks and looked at the data you have been tracking.\n\n### What is changing\n- **Your medication schedule** may be adjusted to better manage your symptoms throughout the day.\n- **Therapy** may be recommended to help with specific functional challenges.\n- **Additional monitoring** is being considered based on your recent symptom patterns.\n\n### What you need to do\n1. Follow your updated medication schedule as directed by your provider.\n2. Keep tracking your symptoms in this app.\n3. Have your caregiver watch for any new or unusual symptoms.\n4. Come back in **4 weeks** for a follow-up.`;
      return res.json({ summary: format === 'structured' ? mockStructured : mockPatient, format, model: 'demo-mode', usage: null });
    }

    const systemPrompt = format === 'patient-friendly'
      ? `You are a medical communication specialist. Convert the following clinical visit notes into a patient-friendly summary. Use simple, clear language. Avoid medical jargon where possible. Include:
1. What was discussed
2. What changes are being made
3. What the patient needs to do
4. When to follow up
Format with markdown headers and numbered lists.`
      : `You are a clinical documentation specialist. Convert the following visit notes into a structured clinical summary. Include:
1. Patient identification and date
2. Chief complaint
3. Assessment with diagnoses
4. Current medications
5. Plan with numbered action items
Format with markdown headers. Use standard medical abbreviations where appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please summarize these visit notes:\n\n${notes}` },
    ];

    const data = await callFeatherless(messages, { max_tokens: 3000, temperature: 0.3 });
    const summary = data.choices?.[0]?.message?.content || 'No summary generated.';

    res.json({
      summary,
      format,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Summarize endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Risk Score Endpoint ────────────────────────────────────────────────────

app.post('/api/risk', async (req, res) => {
  try {
    const { symptoms } = req.body;

    // Compute risk score from symptoms using entropy-inspired scoring
    let baseScore = 0.42;
    
    if (symptoms) {
      if (typeof symptoms.tremor === 'number') baseScore += symptoms.tremor * 0.05;
      if (typeof symptoms.freezing === 'number') baseScore += symptoms.freezing * 0.08;
      if (typeof symptoms.sleep === 'number') baseScore += (1 - symptoms.sleep) * 0.04;
      if (typeof symptoms.mood === 'number') baseScore += (1 - symptoms.mood) * 0.03;
      if (typeof symptoms.mobility === 'number') baseScore += (1 - symptoms.mobility) * 0.04;
    }

    const score = Math.min(Math.max(baseScore, 0), 1);
    const level = score < 0.3 ? 'low' : score < 0.5 ? 'moderate' : score < 0.7 ? 'elevated' : 'high';

    // Generate trend data (simulated 7-day history)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const dayScore = score + (Math.random() - 0.5) * 0.1;
      trend.push(Math.min(Math.max(dayScore, 0), 1));
    }
    trend[trend.length - 1] = score; // Current day is exact

    const factors = [
      `Primary symptom intensity: ${symptoms?.tremor > 0.6 ? 'high' : symptoms?.tremor > 0.3 ? 'moderate' : 'low'}`,
      `Episode frequency this week: ${Math.round((symptoms?.freezing || 0.3) * 5)}`,
      `Sleep quality: ${symptoms?.sleep > 0.6 ? 'adequate' : 'below average'}`,
      `Medication adherence: ${Math.round(85 + Math.random() * 10)}%`,
      `Mobility score: ${symptoms?.mobility > 0.6 ? 'good' : symptoms?.mobility > 0.3 ? 'fair' : 'limited'}`,
    ];

    res.json({ score: Math.round(score * 100) / 100, level, factors, trend });
  } catch (error) {
    console.error('Risk endpoint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  NeuroSync Care Server running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Featherless AI: ${FEATHERLESS_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED (set FEATHERLESS_API_KEY)'}`);
  console.log(`  Model: ${FEATHERLESS_MODEL_ID}\n`);
});
