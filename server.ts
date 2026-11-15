import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface AnalyzeChildBody {
  childName: string;
  ageMonths: number;
  gender: string;
  motherName: string;
  weightKg: number;
  prevWeightKg: number;
  muacMm: number;
  attendanceDays: number;
  totalDays: number;
  rationStatus: 'collected' | 'partial' | 'missed';
  recentIllness: string[];
  householdFactors: string[];
  immunizationUpToDate: boolean;
  riskLevel: 'high' | 'rising' | 'normal';
  language?: 'hi' | 'bho' | 'en';
}

app.post('/api/analyze-child', async (req, res) => {
  const body = req.body as AnalyzeChildBody;

  if (!body || !body.childName) {
    res.status(400).json({ error: 'Child details are required.' });
    return;
  }

  if (!aiClient) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  const lang =
    body.language === 'en'
      ? 'English'
      : body.language === 'bho'
      ? 'pure, authentic conversational Bhojpuri (शुद्ध भोजपुरी in Devanagari script, e.g., बा, नइखे, रउआ, घरे जाईं, खियाईं)'
      : 'simple conversational Hindi (Devanagari script)';
  const weightDiff = Number((body.weightKg - body.prevWeightKg).toFixed(2));

  const prompt = `
You are Poshan Mitra Ai, an expert ICDS / Poshan Abhiyaan clinical nutrition assistant helping an Anganwadi worker (दीदी) in rural/semi-urban India.

Review all scattered signals for this single child:
- Name: ${body.childName} (${body.ageMonths} months, ${body.gender}), Mother: ${body.motherName}
- Health & Growth: Current Weight ${body.weightKg} kg (Change from last month: ${weightDiff >= 0 ? '+' : ''}${weightDiff} kg), MUAC Tape: ${body.muacMm} mm
- Attendance at Anganwadi: ${body.attendanceDays} out of ${body.totalDays} days
- Ration / THR Uptake: ${body.rationStatus}
- Recent Illness: ${body.recentIllness.length > 0 ? body.recentIllness.join(', ') : 'None reported'}
- Household Signals: ${body.householdFactors.length > 0 ? body.householdFactors.join(', ') : 'Stable'}
- Immunization / Deworming up to date: ${body.immunizationUpToDate ? 'Yes' : 'No'}
- Preliminary Risk Tier: ${body.riskLevel}

Produce guidance in ${lang}. Keep sentences short, respectful, and immediately actionable on a smartphone without medical jargon.
1. oneClearAction: Give EXACTLY ONE clear, highest-priority follow-up action the worker must take next (mentioning when/where/what to do).
2. whyFlagged: 2 to 3 concise reasons showing how the scattered signals connect together.
3. motherCounselingScript: 2 warm, practical sentences the worker can say directly to ${body.motherName} using locally available foods (moong dal khichdi, sattu, seasonal greens, peanut/jaggery, ORS, handwashing).
4. urgencyLabel: Short timeframe label (e.g., "आज ही (24 घंटे के भीतर)" or "3 दिनों के भीतर" or "नियमित मासिक जांच").
`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            oneClearAction: {
              type: Type.STRING,
              description: 'One single, immediate, crystal-clear follow-up action for the Anganwadi worker.',
            },
            whyFlagged: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 short bullet points linking the scattered signals.',
            },
            motherCounselingScript: {
              type: Type.STRING,
              description: '2 warm sentences to speak to the mother during the home visit.',
            },
            urgencyLabel: {
              type: Type.STRING,
              description: 'Short urgency timeframe.',
            },
          },
          required: ['oneClearAction', 'whyFlagged', 'motherCounselingScript', 'urgencyLabel'],
        },
      },
    });

    const text = (response.text ?? '{}').trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('Gemini API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate AI guidance.';
    res.status(502).json({ error: message });
  }
});

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatTurn[];
  childContext?: string;
  language?: 'hi' | 'bho' | 'en';
  fastMode?: boolean;
}

app.post('/api/chat', async (req, res) => {
  const body = req.body as ChatRequestBody;

  if (!body || !body.message || !body.message.trim()) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  if (!aiClient) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  const langLabel =
    body.language === 'en'
      ? 'simple English'
      : body.language === 'bho'
      ? 'pure, natural conversational Bhojpuri (शुद्ध भोजपुरी in Devanagari script, respectful Purvanchal/Bihar style using बा, नइखे, रउआ, खियाईं, पियाईं)'
      : 'simple conversational Hindi (Devanagari script)';
  const selectedModel = body.fastMode ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  const systemInstruction = `You are Poshan Mitra Ai (पोषण मित्र सहायक), a caring and practical ICDS / Poshan Abhiyaan advisor helping Indian Anganwadi workers (आंगनवाड़ी दीदी).
Respond in ${langLabel}. Keep replies concise, warm, bulleted when helpful, and grounded in WHO/ICDS child nutrition, MUAC screening, ORS/Zinc for diarrhea, Take-Home Ration (THR), and locally available Indian home foods (moong dal khichdi, sattu, jaggery, peanuts, greens).
Always remind the worker to refer red-zone SAM cases (<115mm MUAC or edema or persistent danger signs) to an ANM / PHC / NRC immediately.
${body.childContext ? `\nCurrently viewed child context:\n${body.childContext}` : ''}`;

  try {
    const formattedHistory = (body.history || []).slice(-12).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    const chat = aiClient.chats.create({
      model: selectedModel,
      history: formattedHistory,
      config: {
        systemInstruction,
      },
    });

    const response = await chat.sendMessage({
      message: body.message.trim(),
    });

    res.json({
      reply: response.text ?? '',
      model: selectedModel,
    });
  } catch (err) {
    console.error('Gemini Chat API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate chat response.';
    res.status(502).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Poshan Mitra Ai running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
