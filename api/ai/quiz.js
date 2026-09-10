import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

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
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    } else {
      return null;
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

async function requestGeminiQuiz(ai, modelName, prompt, systemInstruction) {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.3,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
      },
      responseMimeType: 'application/json',
      responseSchema: quizResponseSchema,
    },
  });
  return response?.text || '';
}

/**
 * Handles AI-powered quiz question generation for Demo Mode Timepass Quiz.
 * Strict reliability constraints:
 * - Minimal context: topic + difficulty + questionCount only.
 * - Compact structured JSON schema.
 * - Fastest suitable Gemini model configured in V4 (gemini-3.1-flash-lite, fallback gemini-3.8-flash).
 * - Exactly ONE AI request attempt from the client.
 * - Single bounded retry on server for transient 429 (exponential backoff) or malformed responses.
 * - Distinct, user-friendly HTTP error codes (429, 504, 503, 422, 500).
 */
export async function handleQuizRequest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' }));
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
        code: 'MISSING_API_KEY',
        error: 'AI service configuration is missing. Please check API settings.',
      })
    );
    return;
  }

  const systemInstruction =
    'Output valid JSON only matching the schema. Exactly 4 options per question. correctAnswerIndex must be 0, 1, 2, or 3. Any currency must be in Indian Rupees (₹), never USD ($).';

  const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" (${difficulty} difficulty). Provide clear questions with exactly 4 distinct options and one correct answer.`;

  const primaryModel = 'gemini-3.1-flash-lite';
  const fallbackModel = 'gemini-3.8-flash';

  let rawText = '';
  let lastError = null;

  // Primary attempt
  try {
    rawText = await requestGeminiQuiz(ai, primaryModel, prompt, systemInstruction);
  } catch (err) {
    lastError = err;
  }

  let questions = parseAndValidateQuestions(rawText, questionCount);

  // If primary attempt failed or returned malformed JSON, perform AT MOST ONE bounded retry
  if (!questions) {
    const isRateLimit = lastError && isRateLimitError(lastError);
    const isTimeout = lastError && isTimeoutError(lastError);

    if (isTimeout) {
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

    if (isRateLimit) {
      // Short bounded backoff for rate limit before single retry
      await new Promise((r) => setTimeout(r, 1200));
      try {
        rawText = await requestGeminiQuiz(ai, primaryModel, prompt, systemInstruction);
        questions = parseAndValidateQuestions(rawText, questionCount);
      } catch (retryErr) {
        lastError = retryErr;
      }
    } else {
      // Malformed JSON or transient 5xx error: single retry with fallback model
      const retryModel = lastError ? fallbackModel : primaryModel;
      await new Promise((r) => setTimeout(r, 600));
      try {
        rawText = await requestGeminiQuiz(ai, retryModel, prompt, systemInstruction);
        questions = parseAndValidateQuestions(rawText, questionCount);
      } catch (retryErr) {
        lastError = retryErr;
      }
    }
  }

  // Final check after at most ONE retry
  if (!questions || questions.length === 0) {
    if (lastError && isRateLimitError(lastError)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: 'RATE_LIMIT',
          error: 'AI service rate limit reached. Please wait a moment before trying again.',
        })
      );
      return;
    }

    if (lastError && isTimeoutError(lastError)) {
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

    if (lastError) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          code: 'SERVICE_UNAVAILABLE',
          error: 'AI service is temporarily unavailable. Please try again.',
        })
      );
      return;
    }

    // No exception thrown, but AI returned unparseable/empty data even after retry
    res.statusCode = 422;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        code: 'MALFORMED_RESPONSE',
        error: "Couldn't generate valid questions for this topic. Please try again or choose another topic.",
      })
    );
    return;
  }

  // Success
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
}

export default async function handler(req, res) {
  return handleQuizRequest(req, res);
}
