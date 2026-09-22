// Vercel Serverless Function & Vite Dev Middleware Handler for Timepass Quiz Generation
import { GoogleGenAI, Type } from '@google/genai';

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

const quizResponseSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctAnswerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctAnswerIndex'],
      },
    },
  },
  required: ['questions'],
};

// Candidate models prioritized for low latency, active availability, and resilience
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
];

function isRateLimitOrServiceUnavailable(err) {
  const status = err?.status || err?.statusCode || 0;
  const msg = String(err?.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('unavailable') ||
    msg.includes('high demand')
  );
}

function isTimeoutError(err) {
  const msg = String(err?.message || '').toLowerCase();
  return (
    err?.name === 'AbortError' ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('deadline exceeded')
  );
}

function parseAndValidateQuestions(rawText, expectedCount) {
  if (!rawText || typeof rawText !== 'string') return null;

  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidateStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    try {
      parsed = JSON.parse(candidateStr);
    } catch {
      const start = candidateStr.indexOf('{');
      const end = candidateStr.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          parsed = JSON.parse(candidateStr.slice(start, end + 1));
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : Array.isArray(parsed?.quiz)
    ? parsed.quiz
    : null;

  if (!list || list.length === 0) return null;

  const validQuestions = [];
  for (const item of list) {
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
        explanation: item.explanation
          ? String(item.explanation).trim().replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1')
          : undefined,
      });
    }
  }

  if (validQuestions.length === 0) return null;
  return validQuestions.slice(0, expectedCount);
}

/**
 * Handles AI-powered quiz question generation for Timepass Quiz.
 * Resilient V5 flow:
 * 1. Supports any valid user topic without hardcoding.
 * 2. Uses candidate model fallback cascade (gemini-3.1-flash-lite, gemini-3.6-flash, gemini-3.8-flash).
 * 3. Supports Beginner, Intermediate, and Expert difficulty levels.
 * 4. Supports timed vs untimed quiz modes.
 * 5. Returns explanations for structured review.
 * 6. Proper error status mapping (429, 503, 504, 500) instead of unexplained errors.
 */
export async function handleQuizRequest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }));
    return;
  }

  let body = req.body;
  if (!body && typeof req.on === 'function') {
    try {
      body = await new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch {
            resolve({});
          }
        });
        req.on('error', () => resolve({}));
      });
    } catch {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const topic = String(body.topic || 'General Knowledge').trim().slice(0, 100);

  // Normalize difficulty: Beginner, Intermediate, Expert
  let difficulty = 'Intermediate';
  const rawDiff = String(body.difficulty || '').trim().toLowerCase();
  if (rawDiff === 'beginner' || rawDiff === 'easy') {
    difficulty = 'Beginner';
  } else if (rawDiff === 'expert' || rawDiff === 'hard') {
    difficulty = 'Expert';
  } else {
    difficulty = 'Intermediate';
  }

  const quizMode = String(body.quizMode || '').trim().toLowerCase() === 'timed' ? 'timed' : 'untimed';

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
        code: 'MISSING_API_KEY',
        error: 'AI service configuration is missing. Please check API settings.',
      })
    );
    return;
  }

  const systemInstruction =
    'You are a high-speed quiz generator. Output only valid JSON matching the schema. Exactly 4 options per question. correctAnswerIndex must be 0, 1, 2, or 3. Any pricing or currency must strictly use Indian Rupees (₹), never USD ($). Do not output markdown or text outside JSON.';

  const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" (${difficulty} difficulty, ${quizMode} mode).
Difficulty Calibration:
- Beginner: Foundational concepts, straightforward definitions, and entry-level problem solving.
- Intermediate: Practical scenarios, core principles, applied problems, and moderate complexity.
- Expert: Advanced edge cases, tricky gotchas, deep architectural nuances, and complex analytical scenarios.

Requirements:
- Exactly ${questionCount} questions.
- Each question MUST have exactly 4 distinct, plausible options.
- Exactly one correct answer with correctAnswerIndex (0, 1, 2, or 3).
- Provide a clear, 1-2 sentence explanation for why the correct option is right.
- Ensure all questions are freshly generated and unique.`;

  let rawText = '';
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: quizResponseSchema,
        },
      });

      const text = response?.text || '';
      if (text) {
        rawText = text;
        break;
      }
    } catch (modelErr) {
      lastError = modelErr;
      // If temporary demand or rate limit, fall through to next candidate model
      continue;
    }
  }

  if (!rawText) {
    if (isRateLimitOrServiceUnavailable(lastError)) {
      const is503 = lastError?.status === 503 || String(lastError?.message || '').toLowerCase().includes('503');
      res.statusCode = is503 ? 503 : 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: is503 ? 'SERVICE_UNAVAILABLE' : 'RATE_LIMIT',
          error: 'The AI service encountered a temporary hiccup or rate limit.',
        })
      );
      return;
    }

    if (isTimeoutError(lastError)) {
      res.statusCode = 504;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: 'TIMEOUT',
          error: 'Quiz generation timed out. Please try again.',
        })
      );
      return;
    }

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        code: 'GENERAL',
        error: lastError?.message || "Couldn't generate the quiz. Please try again.",
      })
    );
    return;
  }

  const questions = parseAndValidateQuestions(rawText, questionCount);

  if (!questions || questions.length === 0) {
    res.statusCode = 422;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        code: 'MALFORMED_RESPONSE',
        error: "Couldn't generate valid questions for this topic. Please try again.",
      })
    );
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'success',
      data: {
        topic,
        difficulty,
        quizMode,
        questionCount: questions.length,
        questions,
      },
    })
  );
}

export default async function handler(req, res) {
  return handleQuizRequest(req, res);
}
