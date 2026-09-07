import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
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
 * Constructs prompt and career context from real Student Twin data.
 * Adheres strictly to:
 * - ACTIVE STUDENT PROFILE: name, university, degree, branch, year, career goal, target role, GitHub, LinkedIn, portfolio
 * - SKILLS: actual skills, category, proficiency
 * - PROJECTS: actual projects, title, description, technology, architecture, role, difficulty, status, GitHub URL, live demo URL
 * - ACHIEVEMENTS: actual achievements, certifications, participations, honours
 * - CAREER GOALS: actual goals, target role, target companies, required skills, timeline
 * - CONVERSATION: recent relevant conversation history (last 6-8 messages)
 * - NO FABRICATION: never invent credentials, projects, skills, internships, companies, metrics.
 * - NO HARDCODED PROFILE FALLBACKS: missing data remains missing (no "Software Engineer", no "Student").
 * - INR ONLY: All currency and CTC in Indian Rupees (₹) with Indian numbering. No dollar signs ($).
 */
export function buildCareerContextPrompt(
  studentContext: any,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): { prompt: string; systemInstruction: string } {
  const c = studentContext || {};

  // Format profile attributes without fabricating defaults
  const profileLines: string[] = [];
  if (c.name) profileLines.push(`- Candidate Name: ${c.name}`);
  if (c.targetRole) {
    profileLines.push(`- Target Role: ${c.targetRole}`);
  } else if (c.careerGoal?.targetRole) {
    profileLines.push(`- Target Role: ${c.careerGoal.targetRole}`);
  } else {
    profileLines.push(`- Target Role: Not specified`);
  }

  if (c.degree || c.branch) {
    profileLines.push(`- Academic Program: ${[c.degree, c.branch].filter(Boolean).join(' in ')}`);
  }
  if (c.university) profileLines.push(`- University: ${c.university}`);
  if (c.year) profileLines.push(`- Academic Year: ${c.year}`);
  if (c.careerGoal?.targetDomain) profileLines.push(`- Target Domain: ${c.careerGoal.targetDomain}`);
  if (c.careerGoal?.targetTimeline) profileLines.push(`- Target Timeline: ${c.careerGoal.targetTimeline}`);
  if (Array.isArray(c.careerGoal?.targetCompanies) && c.careerGoal.targetCompanies.length > 0) {
    profileLines.push(`- Target Companies: ${c.careerGoal.targetCompanies.join(', ')}`);
  }
  if (c.githubUrl) profileLines.push(`- GitHub Profile: ${c.githubUrl}`);
  if (c.linkedinUrl) profileLines.push(`- LinkedIn Profile: ${c.linkedinUrl}`);
  if (c.portfolioUrl) profileLines.push(`- Portfolio URL: ${c.portfolioUrl}`);
  if (typeof c.readinessScore === 'number' && c.readinessScore > 0) {
    profileLines.push(`- Overall Readiness Score: ${c.readinessScore}%`);
  }

  // Skills
  const skillsList =
    Array.isArray(c.skills) && c.skills.length > 0
      ? c.skills
          .map((s: any) => {
            const name = typeof s === 'string' ? s : s.name || '';
            const prof = s.proficiency ? ` (${s.proficiency}%)` : '';
            const cat = s.category ? ` [${s.category}]` : '';
            return `${name}${prof}${cat}`;
          })
          .filter(Boolean)
          .join(', ')
      : 'No skills recorded in Student Twin';

  // Projects
  const projectsList =
    Array.isArray(c.projects) && c.projects.length > 0
      ? c.projects
          .map((p: any) => {
            const stack = Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || '');
            const role = p.role ? ` | Role: ${p.role}` : '';
            const status = p.status ? ` | Status: ${p.status}` : '';
            const github = p.githubUrl ? ` | Repo: ${p.githubUrl}` : '';
            const live = p.liveUrl ? ` | Live: ${p.liveUrl}` : '';
            const desc = p.description ? `\n    Description: ${p.description}` : '';
            return `  • ${p.title || 'Untitled Project'}${stack ? ` (${stack})` : ''}${role}${status}${github}${live}${desc}`;
          })
          .join('\n')
      : 'No projects recorded in Student Twin';

  // Achievements
  const achievementsList =
    Array.isArray(c.achievements) && c.achievements.length > 0
      ? c.achievements
          .map((a: any) => {
            const title = a.title || 'Achievement';
            const issuer = a.issuer ? ` (${a.issuer})` : '';
            const date = a.date ? ` [${a.date}]` : '';
            return `  • ${title}${issuer}${date}`;
          })
          .join('\n')
      : 'No achievements recorded in Student Twin';

  // Recent conversation history
  let historySection = '';
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-8);
    historySection = `\nRECENT CONVERSATION:\n${recent
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n')}\n`;
  }

  const prompt = `STUDENT DIGITAL TWIN (ACTIVE PROFILE CONTEXT):
${profileLines.join('\n')}

RECORDED SKILLS:
${skillsList}

RECORDED PROJECTS:
${projectsList}

RECORDED ACHIEVEMENTS:
${achievementsList}
${historySection}
USER QUESTION:
"${message}"

Provide a direct, specific response to the user's question.`;

  const systemInstruction = `You are the AI Career Assistant for the Student Digital Twin OS.
Your role is to act as a fast, direct, knowledgeable, and objective career advisor.

CORE RULES:
1. Answer the user's specific question directly and concisely in clean markdown.
2. Ground all advice strictly in the provided Student Digital Twin data (profile, skills, projects, achievements).
3. If the user asks about something where their Student Twin has no data (e.g. asking for skill gaps when no skills or target role are recorded, or asking which project to highlight when no projects exist), state clearly and directly what is missing. Never fabricate projects, skills, companies, internships, metrics, or credentials.
4. If this is a follow-up in the conversation, maintain natural continuity based on the recent conversation history.
5. Do NOT include artificial meta-commentary like "Analyzing your student twin...", "Step 1 of 4", or verbose introductory filler. Get straight to the answer.
6. Provide direct, actionable advice, prioritization, or feedback.
7. Format all currency and salary/CTC amounts strictly in Indian Rupees (₹) using the Indian numbering format (e.g. ₹6,00,000 or ₹12 LPA). NEVER use dollar signs ($).`;

  return { prompt, systemInstruction };
}

/**
 * Handles POST /api/ai/assistant
 * Supports SSE streaming (default) and standard JSON response.
 */
export async function handleAssistantRequest(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const message = (body?.message || body?.query || '').trim();
  if (!message) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Message is required' }));
    return;
  }

  const history = Array.isArray(body?.history) ? body.history : [];
  const studentContext = body?.studentContext || {};
  const isStreamingRequested = body?.stream !== false;

  const ai = getAiClient();
  if (!ai) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Career Assistant is temporarily unavailable. Please configure GEMINI_API_KEY.',
      })
    );
    return;
  }

  const { prompt, systemInstruction } = buildCareerContextPrompt(studentContext, message, history);

  // V3 proven model strategy: gemini-2.5-flash with resilient fallback
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  if (isStreamingRequested) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    let streamSucceeded = false;

    for (const model of models) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        let accumulated = '';
        for await (const chunk of stream) {
          const rawChunk = chunk.text || '';
          if (rawChunk) {
            const sanitized = rawChunk.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');
            accumulated += sanitized;
            res.write(`data: ${JSON.stringify({ text: sanitized })}\n\n`);
            if (typeof res.flush === 'function') {
              res.flush();
            }
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        streamSucceeded = true;
        break;
      } catch (err: any) {
        console.warn(`[Assistant Stream] Model ${model} failed, trying alternate:`, err?.message || err);
      }
    }

    if (!streamSucceeded) {
      res.write(
        `data: ${JSON.stringify({ error: 'Career Assistant is temporarily unavailable. Please try again.' })}\n\n`
      );
      res.end();
    }
  } else {
    // Non-streaming fallback
    for (const model of models) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const rawText = result.text || '';
        const sanitized = rawText.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            status: 'success',
            text: sanitized,
          })
        );
        return;
      } catch (err: any) {
        console.warn(`[Assistant Non-Stream] Model ${model} failed:`, err?.message || err);
      }
    }

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Career Assistant is temporarily unavailable. Please try again.',
      })
    );
  }
}
