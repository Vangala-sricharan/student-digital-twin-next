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
        },
        required: ['question', 'options', 'correctAnswerIndex'],
      },
    },
  },
  required: ['questions'],
};

function isRateLimitError(err) {
  const status = err?.status || err?.statusCode || 0;
  const msg = String(err?.message || '').toLowerCase();
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota')
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
      });
    }
  }

  if (validQuestions.length === 0) return null;
  return validQuestions.slice(0, expectedCount);
}

/**
 * Handles AI-powered quiz question generation for Timepass Quiz.
 * Strict reliability constraints:
 * 1. Use the fastest suitable Gemini model already configured in V4 (gemini-3.8-flash).
 * 2. Make exactly ONE AI request per quiz generation attempt (no automatic retry loops).
 * 3. Compact structured JSON only with minimal schema.
 * 4. Send only minimal required context: topic + difficulty + questionCount.
 * 5. Distinct, descriptive error codes (RATE_LIMIT, TIMEOUT, SERVICE_UNAVAILABLE, GENERAL).
 */
export async function handleQuizRequest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }));
    return;
  }

  const body = req.body || {};
  const topic = String(body.topic || 'Data Structures').trim().slice(0, 80);
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
        code: 'MISSING_API_KEY',
        error: 'AI service configuration is missing. Please check API settings.',
      })
    );
    return;
  }

  const systemInstruction =
    'You are a high-speed quiz generator. Output only valid JSON matching the schema. Exactly 4 options per question. correctAnswerIndex must be 0, 1, 2, or 3. Any pricing or currency must strictly use Indian Rupees (₹), never USD ($).';

  const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" (${difficulty} difficulty). Provide clear, concise questions with 4 distinct options and one correct answer.`;

  // Use fastest suitable model configured in V4
  const modelName = 'gemini-3.8-flash';

  try {
    // Exactly ONE AI request attempt
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: quizResponseSchema,
      },
    });

    const rawText = response?.text || '';
    const questions = parseAndValidateQuestions(rawText, questionCount);

    if (!questions || questions.length === 0) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: 'MALFORMED_RESPONSE',
          error: "Couldn't generate the quiz. Please try again.",
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
          questions,
        },
      })
    );
  } catch (err) {
    if (isRateLimitError(err)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: 'RATE_LIMIT',
          error: 'The AI service encountered a temporary hiccup or rate limit.',
        })
      );
      return;
    }

    if (isTimeoutError(err)) {
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
        error: "Couldn't generate the quiz. Please try again.",
      })
    );
  }
}

export default async function handler(req, res) {
  return handleQuizRequest(req, res);
}
