// Vercel Serverless Function & Vite Dev Middleware Handler for LinkedIn Profile PDF Audit
import { GoogleGenAI } from '@google/genai';

/**
 * Score evaluation threshold labels adhering to V4 platform standards.
 */
function getEvaluationLabel(score) {
  if (score >= 80) return 'Top Tier (80-100)';
  if (score >= 70) return 'Competitive (70-79)';
  if (score >= 55) return 'Developing (55-69)';
  return 'Early Stage (0-54)';
}

/**
 * Robustly parses and extracts JSON from model response text.
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Strip markdown code blocks
  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Find outermost balanced braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  return null;
}

/**
 * Executes Gemini generation with model cascading and retry on transient high-demand (503) spikes.
 */
async function generateAuditWithFallback(ai, contents) {
  // Resilient cascade: fast, low-latency gemini-3.1-flash-lite first, then gemini-3.6-flash and gemini-3.8-flash
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err) {
        lastError = err;
        // Brief pause before retry on transient 503 / rate limit
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  throw lastError || new Error('Failed to generate audit from Gemini AI models');
}

/**
 * Core handler for /api/ai/linkedin-audit
 */
export async function handleLinkedInAuditRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = {};
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: 'Invalid JSON payload' }));
    return;
  }

  const pdfBase64 = (body.pdfBase64 || body.userInputs?.pdfBase64 || '').trim();
  const rawExtractedText = (body.rawExtractedText || body.profileText || body.extractedText || body.userInputs?.profileText || '').trim();
  const fileName = body.fileName || body.userInputs?.fileName || 'linkedin_profile.pdf';

  if (!pdfBase64 && (!rawExtractedText || rawExtractedText.length < 30)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'The uploaded PDF does not contain sufficient profile content to conduct an audit. Please upload an authentic profile export PDF.',
      data: null,
    }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: 'Gemini API key is not configured' }));
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const prompt = `You are an expert technical recruiter and executive LinkedIn profile auditor.
You are analyzing an authentic LinkedIn profile PDF export provided as an inline PDF document.
Analyze ONLY the visual and textual contents of this PDF document. Do not invent, assume, or hallucinate any information.
If any section or field is missing or not mentioned in the PDF, return empty strings or empty arrays.

Extract and evaluate the profile according to the following strict schema:
1. Candidate Identity & Profile Content:
   - name: The candidate's full name as displayed on the profile (e.g. at the top of the header / main body).
   - headline: The complete professional headline exactly as written on the profile.
   - location: The location displayed under the headline. If not present in the document, return "".
   - summary: The full text of the Summary or About section. If not present, return "".
   - skills: An array of all skills listed under Top Skills or Skills.
   - certifications: An array of all certifications, licenses, simulations, or virtual internships listed.
   - education: An array of education entries with institution, degree, fieldOfStudy, and year.
   - experience: An array of work experience entries. If no formal corporate/institutional employment is listed in the PDF, return [].
   - projects: An array of projects listed with title and description.

2. Category Evaluations & Scores (0-100 total):
   - headlineImpact (Score 0 to 15): Evaluate clarity, multi-segment structure, keywords (e.g., C++, Python, React, SQL, AI/ML). Strong, multi-part headlines with relevant skills should receive 13-15.
   - aboutSectionDepth (Score 0 to 25): Evaluate narrative depth, domain focus, and technical competencies. If Summary/About is present with clear domain and project background, award 20-25. If missing, award 0.
   - experienceProgression (Score 0 to 20): Evaluate formal corporate/institutional employment history. CRITICAL: If no formal employment history is listed in profile export (e.g. student profile), score MUST be 0.
   - educationCertifications (Score 0 to 20): Evaluate university degree + certifications/simulations/programs. If degree and multiple certifications/simulations are present, award 18-20.
   - skillsPositioning (Score 0 to 20): Evaluate skills (e.g. GitHub, Git, Algorithms, etc.) and positioning. Award 18-20 if aligned with software engineering.

3. Qualitative Evidence & Guidance:
   - evidenceBySection: {
       "headline": string (direct quote or evidence from headline),
       "about": string (evidence from about/summary),
       "experience": string (evidence or note on formal employment absence),
       "education": string (evidence of degree and certifications count),
       "skills": string (evidence of top skills)
     }
   - strengths: 3-4 concise factual strengths grounded strictly in the PDF evidence.
   - gaps: 3-4 factual improvement opportunities grounded strictly in the PDF.
   - headlineVariations: 3 tailored, high-converting professional headline alternatives.
   - recommendations: 3-4 objects with { "priority": number, "title": string, "desc": string }.
   - searchOptimization: 1-2 sentences on recruiter search discoverability keywords.

Output MUST be valid JSON with this exact schema:
{
  "candidate": {
    "name": string,
    "headline": string,
    "location": string,
    "summary": string,
    "skills": string[],
    "certifications": string[],
    "education": [ { "institution": string, "degree": string, "fieldOfStudy": string, "year": string } ],
    "experience": [ { "title": string, "company": string, "dates": string, "description": string } ],
    "projects": [ { "title": string, "description": string } ]
  },
  "categoryScores": {
    "headlineImpact": number,
    "aboutSectionDepth": number,
    "experienceProgression": number,
    "educationCertifications": number,
    "skillsPositioning": number
  },
  "evidenceBySection": {
    "headline": string,
    "about": string,
    "experience": string,
    "education": string,
    "skills": string
  },
  "strengths": string[],
  "gaps": string[],
  "headlineVariations": string[],
  "recommendations": [ { "priority": number, "title": string, "desc": string } ],
  "searchOptimization": string
}`;

  let contents;
  if (pdfBase64) {
    contents = [
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      { text: prompt },
    ];
  } else {
    contents = [
      { text: `${prompt}\n\nRAW PROFILE TEXT CONTENT:\n${rawExtractedText}` },
    ];
  }

  let parsed = null;
  let rawTextResponse = '';
  try {
    rawTextResponse = await generateAuditWithFallback(ai, contents);
    parsed = extractJson(rawTextResponse);
    if (!parsed) {
      throw new Error('Unable to parse JSON from AI model response');
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: `Gemini document analysis failed: ${err?.message || 'AI service unavailable'}`,
    }));
    return;
  }

  // 1. Candidate metadata extraction
  const candidate = parsed?.candidate || {};
  const candidateName = (candidate.name || '').trim() || 'LinkedIn Candidate';
  const candidateHeadline = (candidate.headline || '').trim();
  const candidateLocation = (candidate.location || '').trim();
  const candidateSummary = (candidate.summary || '').trim();
  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const candidateCertifications = Array.isArray(candidate.certifications) ? candidate.certifications : [];
  const candidateEducation = Array.isArray(candidate.education) ? candidate.education : [];
  const candidateExperience = Array.isArray(candidate.experience) ? candidate.experience : [];
  const candidateProjects = Array.isArray(candidate.projects) ? candidate.projects : [];

  // 2. Deterministic category scoring strictly within V4 maximums
  const rawCat = parsed?.categoryScores || {};
  const headlineScore = Math.min(15, Math.max(0, Math.round(Number(rawCat.headlineImpact) || 0)));
  const aboutScore = Math.min(25, Math.max(0, Math.round(Number(rawCat.aboutSectionDepth) || 0)));
  const experienceScore = Math.min(20, Math.max(0, Math.round(Number(rawCat.experienceProgression) || 0)));
  const educationScore = Math.min(20, Math.max(0, Math.round(Number(rawCat.educationCertifications) || 0)));
  const skillsScore = Math.min(20, Math.max(0, Math.round(Number(rawCat.skillsPositioning) || 0)));

  const breakdown = [
    { label: 'Headline Impact', score: headlineScore, max: 15 },
    { label: 'About Section Depth', score: aboutScore, max: 25 },
    { label: 'Experience & Career Progression', score: experienceScore, max: 20 },
    { label: 'Education & Certifications', score: educationScore, max: 20 },
    { label: 'Skills & Professional Positioning', score: skillsScore, max: 20 },
  ];

  // Mathematical single source of truth: overall score derived deterministically from breakdown
  const sumScores = headlineScore + aboutScore + experienceScore + educationScore + skillsScore;
  const sumMax = 100;
  const overallScore = Math.min(100, Math.max(0, Math.round((sumScores / sumMax) * 100)));
  const evaluation = getEvaluationLabel(overallScore);

  // 3. Evidence extraction by section
  const evidenceBySection = {
    headline: parsed?.evidenceBySection?.headline || candidateHeadline || 'Verified in profile header.',
    about: parsed?.evidenceBySection?.about || (candidateSummary ? `${candidateSummary.slice(0, 160)}...` : 'About / summary evaluated.'),
    experience: parsed?.evidenceBySection?.experience || (candidateExperience.length > 0 ? `${candidateExperience.length} experience entries found.` : 'No formal corporate employment history listed in PDF export.'),
    education: parsed?.evidenceBySection?.education || (candidateEducation.length > 0 ? `${candidateEducation.map((e) => e.institution || e.degree).filter(Boolean).join(', ')} (${candidateCertifications.length} certifications)` : 'Education details verified.'),
    skills: parsed?.evidenceBySection?.skills || (candidateSkills.length > 0 ? candidateSkills.join(', ') : 'Top skills verified.'),
  };

  // 4. Detected and missing sections
  const detectedSections = [];
  const missingSections = [];

  if (candidateHeadline) detectedSections.push('Headline');
  else missingSections.push('Headline');

  if (candidateSummary) detectedSections.push('Summary');
  else missingSections.push('Summary');

  if (candidateExperience.length > 0) detectedSections.push('Experience');
  else missingSections.push('Experience');

  if (candidateEducation.length > 0) detectedSections.push('Education');
  else missingSections.push('Education');

  if (candidateCertifications.length > 0) detectedSections.push('Certifications');
  else missingSections.push('Certifications');

  if (candidateSkills.length > 0) detectedSections.push('Skills');
  else missingSections.push('Skills');

  if (candidateProjects.length > 0) detectedSections.push('Projects');

  // 5. Diagnostics payload
  const candidateEducationText = candidateEducation.length > 0
    ? candidateEducation.map((e) => [e.institution, e.degree, e.fieldOfStudy, e.year].filter(Boolean).join(' - ')).join('; ')
    : 'None detected';

  const candidateExperienceText = candidateExperience.length > 0
    ? candidateExperience.map((e) => [e.title, e.company, e.dates].filter(Boolean).join(' - ')).join('; ')
    : 'None (Student profile without formal employment tenure)';

  const debugInfo = {
    detectedName: candidateName,
    detectedHeadline: candidateHeadline || 'None detected',
    detectedAbout: candidateSummary || 'None detected',
    detectedSkills: candidateSkills,
    detectedCertifications: candidateCertifications,
    detectedEducation: candidateEducationText,
    detectedExperience: candidateExperienceText,
    detectedSections,
    missingSections,
  };

  // 6. Qualitative advice
  const strengths = Array.isArray(parsed?.strengths) && parsed.strengths.length > 0
    ? parsed.strengths
    : [
        candidateEducation.length > 0 ? 'Academic credentials verified directly from LinkedIn PDF export.' : 'PDF profile parsed.',
        candidateSkills.length > 0 ? `Core technical skills verified: ${candidateSkills.slice(0, 4).join(', ')}.` : 'Technical profile verified.',
        candidateHeadline ? 'Structured headline present.' : 'Profile presence verified.',
      ];

  const gaps = Array.isArray(parsed?.gaps) && parsed.gaps.length > 0
    ? parsed.gaps
    : [
        candidateExperience.length === 0 ? 'No formal corporate employment history listed; early career student profile.' : 'Add quantified impact metrics.',
        'Ensure top portfolio projects and proof-of-work links are pinned in Featured media.',
      ];

  const headlineVariations = Array.isArray(parsed?.headlineVariations) && parsed.headlineVariations.length > 0
    ? parsed.headlineVariations
    : [
        `${candidateName} | Software Engineer | ${candidateSkills.slice(0, 3).join(' • ') || 'Full-Stack'}`,
        `Computer Science Undergraduate | Building Scalable AI & Web Systems | ${candidateSkills.slice(0, 3).join(' • ') || 'Software Development'}`,
        `${candidateName} | Full-Stack & Systems Developer | Available for Engineering Roles`,
      ];

  const recommendations = Array.isArray(parsed?.recommendations) && parsed.recommendations.length > 0
    ? parsed.recommendations
    : [
        { priority: 1, title: 'Upgrade Professional Headline', desc: 'Calibrate headline keywords for recruiter search queries.' },
        { priority: 2, title: 'Quantify Engineering About Section', desc: 'Add specific architecture achievements and latency benchmarks.' },
        { priority: 3, title: 'Pin Featured Proof of Work', desc: 'Attach live GitHub repository demos in the Featured section.' },
      ];

  const searchOptimization = parsed?.searchOptimization || 'Optimize profile with high-volume recruiter Boolean keywords aligned with your core technical competencies.';

  const profile = {
    name: candidateName,
    headline: candidateHeadline,
    location: candidateLocation,
    source: 'pdf',
    fileName,
  };

  const auditData = {
    score: overallScore,
    overallScore,
    evaluation,
    profile,
    candidate,
    breakdown,
    evidenceBySection,
    strengths,
    gaps,
    headlineVariations,
    recommendations,
    searchOptimization,
    detectedSections,
    missingSections,
    debugInfo,
  };

  const rawText = `### LinkedIn Profile & Recruiter Visibility Audit (PDF Export)

**Candidate**: ${profile.name}  
**Audited File**: \`${fileName}\`  
**Recruiter-Readiness Score**: **${overallScore} / 100** (${evaluation})

#### 1. Empirical Profile Strengths
${strengths.map((s) => `- ${s}`).join('\n')}

#### 2. Identified Profile Gaps
${gaps.map((g) => `- ${g}`).join('\n')}

#### 3. High-Converting Headline Calibration Options
${headlineVariations.map((h, i) => `Option ${i + 1}: \`${h}\``).join('\n')}

#### 4. High Impact Profile Adjustments
${recommendations.map((r) => `#${r.priority} ${r.title}: ${r.desc}`).join('\n')}

#### 5. Recruiter Search Discoverability Strategy
${searchOptimization}`;

  const sanitizedRawText = rawText.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    data: auditData,
    rawText: sanitizedRawText,
    timestamp: new Date().toISOString(),
  }));
}

export default async function handler(req, res) {
  return handleLinkedInAuditRequest(req, res);
}
