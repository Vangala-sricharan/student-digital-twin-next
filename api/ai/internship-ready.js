// Vercel Serverless Function & Vite Dev Middleware Handler for Tier-1 Internship Readiness Diagnostic
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

export async function handleInternshipReadyRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  const body = req.body || {};
  const rawContext = body.studentContext || body.studentTwinData || {};
  const profile = rawContext.profile || rawContext;
  const userInputs = body.userInputs || {};

  const targetDomain =
    userInputs.targetDomain ||
    userInputs.targetRole ||
    profile.targetRole ||
    profile.careerFocus ||
    profile.careerGoal?.targetRole ||
    'Tier-1 Software Engineering Internship';

  const userProjects = Array.isArray(rawContext.projects) ? rawContext.projects : Array.isArray(profile.projects) ? profile.projects : [];
  const userSkills = Array.isArray(rawContext.skills) ? rawContext.skills : Array.isArray(profile.skills) ? profile.skills : [];
  const userCerts = Array.isArray(rawContext.certifications) ? rawContext.certifications : Array.isArray(profile.certifications) ? profile.certifications : [];
  const userAchievements = Array.isArray(rawContext.achievements) ? rawContext.achievements : Array.isArray(profile.achievements) ? profile.achievements : [];

  const liveProjects = userProjects.filter((p) => Boolean(p.liveUrl && String(p.liveUrl).trim().length > 0));
  const repoProjects = userProjects.filter((p) => Boolean(p.githubUrl && String(p.githubUrl).trim().length > 0));

  const projectSummary =
    userProjects.length > 0
      ? userProjects
          .map((p, idx) => {
            const stack = Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack || 'Not specified';
            const live = p.liveUrl ? ` | Live Demo: ${p.liveUrl}` : ' | No Live Demo URL';
            const repo = p.githubUrl ? ` | GitHub Repo: ${p.githubUrl}` : ' | No GitHub Repo URL';
            return `${idx + 1}. "${p.title}" [Tech Stack: ${stack}${live}${repo}] - ${p.description || 'No description provided'}`;
          })
          .join('\n')
      : 'NO PROJECTS RECORDED (0 projects). The student has not logged any projects in their Student Twin yet.';

  const skillSummary =
    userSkills.length > 0
      ? userSkills.map((s) => `${s.name} (${s.proficiency || 60}%, ${s.verified ? 'Verified' : 'Unverified'})`).join(', ')
      : 'NO SKILLS RECORDED (0 skills).';

  const certSummary =
    userCerts.length > 0
      ? userCerts.map((c) => `${c.title} (Issued by: ${c.issuer || 'Unknown'}, Date: ${c.issueDate || 'N/A'})`).join('; ')
      : 'None recorded yet';

  const achievementSummary =
    userAchievements.length > 0
      ? userAchievements.map((a) => `${a.title} (${a.issuer || a.category || 'Honour'})`).join('; ')
      : 'None recorded yet';

  const hasGithub = Boolean(
    profile.githubUrl &&
      profile.githubUrl.includes('github.com') &&
      !profile.githubUrl.includes('username') &&
      profile.githubUrl.trim().length > 12
  );
  const hasLinkedin = Boolean(
    profile.linkedinUrl &&
      profile.linkedinUrl.includes('linkedin.com') &&
      !profile.linkedinUrl.includes('username') &&
      profile.linkedinUrl.trim().length > 12
  );

  const githubStatus = hasGithub ? `Connected: ${profile.githubUrl}` : 'NOT CONNECTED (Missing public profile)';
  const linkedinStatus = hasLinkedin ? `Connected: ${profile.linkedinUrl}` : 'NOT CONNECTED (Missing public profile)';
  const cgpaStatus = profile.cgpa || profile.currentGpa ? `${profile.cgpa || profile.currentGpa} / 10.0` : 'Not recorded in profile';

  const prompt = `You are a Principal Engineering Recruiter & Technical Bar Raiser evaluating student candidates for "${targetDomain}".

DETAILED REAL STUDENT TWIN EVIDENCE AUDIT:
- Candidate Name: ${profile.name || profile.fullName || 'Candidate'}
- Academic Program: ${profile.academicProgram || profile.degree || 'Degree not specified'} in ${profile.branch || 'Branch not specified'} (${profile.yearOfStudy || profile.year || 'Current'} Year, Semester: ${profile.semester || 'Current'}) at ${profile.university || 'University'}
- CGPA: ${cgpaStatus}
- Total Projects Logged: ${userProjects.length} (${liveProjects.length} with live demo URLs, ${repoProjects.length} with repository URLs)
- Project List:
${projectSummary}
- Recorded Skills (${userSkills.length}): ${skillSummary}
- Certifications (${userCerts.length}): ${certSummary}
- Achievements (${userAchievements.length}): ${achievementSummary}
- GitHub Status: ${githubStatus}
- LinkedIn Status: ${linkedinStatus}

STRICT EVALUATION & GROUNDING RULES (MANDATORY):
1. EVALUATE ONLY AGAINST THE STUDENT'S ACTUAL EVIDENCE ABOVE. NEVER invent, assume, or hallucinate projects, skills, or achievements.
2. If 0 projects are logged, the score for "Project Portfolio Depth & Code Verification" MUST NOT exceed 4 out of 25.
3. If 0 skills are recorded, the score for "Core Computer Science & Technical Foundation" MUST NOT exceed 4 out of 20.
4. If GitHub is not connected, the score for "GitHub Activity & Proof of Work" MUST NOT exceed 5 out of 20.
5. If LinkedIn is not connected, the score for "LinkedIn & Recruiter Discoverability" MUST NOT exceed 3 out of 15.
6. DO NOT TELL THE USER TO DO SOMETHING THEY HAVE ALREADY COMPLETED:
   - If a project already has a live demo URL (${liveProjects.length > 0 ? liveProjects.map((p) => `"${p.title}"`).join(', ') : 'none'}), NEVER tell them to deploy a live demo for that project.
   - If their GitHub is already connected (${hasGithub ? 'YES' : 'NO'}), NEVER tell them to connect GitHub.
   - If their LinkedIn is already connected (${hasLinkedin ? 'YES' : 'NO'}), NEVER tell them to connect LinkedIn.
7. RECOMMENDATIONS MUST TARGET REAL GAPS:
   - If projects are 0, recommend building and deploying a production-grade portfolio project tailored to "${targetDomain}".
   - If GitHub is missing, recommend creating and populating GitHub with commit history.
   - If LinkedIn is missing, recommend setting up LinkedIn optimized for recruiter discovery.
   - If skills are lacking, recommend specific high-demand competencies for "${targetDomain}".
8. All compensation or salary references must strictly use Indian Rupees (₹). Never use US Dollar ($).

OUTPUT FORMAT:
Respond with ONLY valid JSON (no markdown fences, no explanatory text):
{
  "readinessScore": <integer 0-100, exactly equal to the sum of the 5 dimension scores below>,
  "verdict": "<'Competitive for Tier-1 Internships' if score >= 80, 'Approaching Readiness with Minor Gaps' if score >= 50, or 'Foundational Phase • Baseline Evaluated' if score < 50>",
  "breakdown": [
    { "label": "Resume & ATS Compliance", "score": <0-20>, "max": 20 },
    { "label": "Project Portfolio Depth & Code Verification", "score": <0-25>, "max": 25 },
    { "label": "GitHub Activity & Proof of Work", "score": <0-20>, "max": 20 },
    { "label": "LinkedIn & Recruiter Discoverability", "score": <0-15>, "max": 15 },
    { "label": "Core Computer Science & Technical Foundation", "score": <0-20>, "max": 20 }
  ],
  "strengths": [
    "<genuinely existing strength grounded in their actual data>",
    "<another genuine strength>"
  ],
  "gaps": [
    "<specific real gap or blocker actually missing from their profile>",
    "<another real gap or blocker>"
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "<Concise Action Title>",
      "desc": "<Context explaining why this gap matters for ${targetDomain}>",
      "action": "<Specific, actionable next step tailored to their actual gaps>"
    },
    {
      "priority": 2,
      "title": "<Concise Action Title>",
      "desc": "<Context explaining why this gap matters>",
      "action": "<Specific, actionable next step>"
    },
    {
      "priority": 3,
      "title": "<Concise Action Title>",
      "desc": "<Context explaining why this gap matters>",
      "action": "<Specific, actionable next step>"
    }
  ]
}`;

  const ai = getAiClient();
  if (!ai) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Internship Readiness Engine is temporarily unavailable. Please configure GEMINI_API_KEY.',
      })
    );
    return;
  }

  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let diagnosticResult = null;
  let rawAiText = '';

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          systemInstruction:
            'You are an objective Principal Recruiter and Bar Raiser evaluating student internship readiness. Never invent metrics or technologies. Output strict JSON with genuine evaluation. All currency must be in Indian Rupees (₹).',
        },
      });

      rawAiText = response.text || '';
      if (rawAiText) {
        // Sanitize dollar signs to Indian Rupees (₹)
        rawAiText = rawAiText.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');

        // Extract JSON code block
        const jsonMatch = rawAiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let parsed = null;
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1]);
          } catch {}
        }
        if (!parsed) {
          const firstBrace = rawAiText.indexOf('{');
          const lastBrace = rawAiText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
              parsed = JSON.parse(rawAiText.slice(firstBrace, lastBrace + 1));
            } catch {}
          }
        }

        if (parsed && typeof parsed.readinessScore === 'number') {
          diagnosticResult = parsed;
          break;
        }
      }
    } catch (err) {
      console.warn(`Gemini model ${model} diagnostic attempt notice:`, err?.message);
    }
  }

  if (!diagnosticResult) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Unable to complete the Internship Readiness analysis. Please retry.',
      })
    );
    return;
  }

  // Ensure breakdown sum matches readinessScore exactly
  if (Array.isArray(diagnosticResult.breakdown) && diagnosticResult.breakdown.length > 0) {
    const sum = diagnosticResult.breakdown.reduce(
      (acc, item) => acc + (typeof item.score === 'number' ? item.score : 0),
      0
    );
    if (sum > 0) {
      diagnosticResult.readinessScore = sum;
    }
  }

  // Re-verify verdict matches final score
  const finalScore = diagnosticResult.readinessScore;
  diagnosticResult.verdict =
    finalScore >= 80
      ? 'Competitive for Tier-1 Internships'
      : finalScore >= 50
      ? 'Approaching Readiness with Minor Gaps'
      : 'Foundational Phase • Baseline Evaluated';

  const rawMarkdown = `### Tier-1 Internship Readiness Diagnostic & Recruiter Benchmark

**Target Internship Specification**: ${targetDomain}  
**Recruiter Benchmark Score**: **${diagnosticResult.readinessScore} / 100** (${diagnosticResult.verdict})  
**Candidate Twin Evaluated**: ${profile.name || profile.fullName || 'Candidate'}

#### 1. Dimension Breakdown
${(diagnosticResult.breakdown || []).map((b) => `- **${b.label}**: ${b.score} / ${b.max}`).join('\n')}

#### 2. Empirical Candidate Strengths
${(diagnosticResult.strengths || []).map((s) => `- ${s}`).join('\n')}

#### 3. Recruiter Screening Gaps & Blockers
${(diagnosticResult.gaps || []).map((g) => `- ${g}`).join('\n')}

#### 4. High-Yield Action Sprint
${(diagnosticResult.recommendations || []).map((r, i) => `#${i + 1} ${r.title}: ${r.desc || r.action}`).join('\n')}`;

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      status: 'success',
      data: diagnosticResult,
      rawText: rawMarkdown,
      timestamp: new Date().toISOString(),
    })
  );
}

export default async function handler(req, res) {
  return handleInternshipReadyRequest(req, res);
}
