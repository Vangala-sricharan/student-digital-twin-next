import { GoogleGenAI } from '@google/genai';

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Handles AI-powered quiz question generation for Demo Mode Timepass Quiz.
 * Strict Demo Mode constraint:
 * - Dynamic generation according to topic, difficulty, questionCount.
 * - Exactly 4 options per question, exactly 1 correct answer index (0..3).
 * - Read-only, no Supabase writes.
 * - Structured JSON output.
 */
export async function handleQuizRequest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: 'Method not allowed' }));
    return;
  }

  const body = req.body || {};
  const topic = String(body.topic || 'Data Structures').trim().slice(0, 100);
  const difficulty = ['Easy', 'Medium', 'Hard'].includes(body.difficulty)
    ? body.difficulty
    : 'Medium';
  const allowedCounts = [5, 10, 15];
  const questionCount = allowedCounts.includes(Number(body.questionCount))
    ? Number(body.questionCount)
    : 5;

  const ai = getAiClient();
  if (!ai) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        error: "Couldn't generate the quiz. Please try again.",
      })
    );
    return;
  }

  const systemInstruction = `Output valid JSON only. Exactly 4 options per question. correctAnswerIndex is 0-3. Format currency in ₹ (INR).`;

  const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" (${difficulty} difficulty).
JSON format:
{"questions":[{"question":"string","options":["A","B","C","D"],"correctAnswerIndex":0}]}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid quiz response structure');
    }

    const validQuestions = [];
    for (const item of parsed.questions) {
      if (
        item &&
        typeof item.question === 'string' &&
        item.question.trim().length > 0 &&
        Array.isArray(item.options) &&
        item.options.length === 4 &&
        typeof item.correctAnswerIndex === 'number' &&
        item.correctAnswerIndex >= 0 &&
        item.correctAnswerIndex <= 3
      ) {
        validQuestions.push({
          question: item.question.trim().replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1'),
          options: item.options.map((opt) =>
            String(opt).trim().replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1')
          ),
          correctAnswerIndex: Math.floor(item.correctAnswerIndex),
        });
      }
    }

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'success',
        data: {
          topic,
          difficulty,
          questions: validQuestions.slice(0, questionCount),
        },
      })
    );
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        error: "Couldn't generate the quiz. Please try again.",
      })
    );
  }
}

export default async function handler(req, res) {
  return handleQuizRequest(req, res);
}
