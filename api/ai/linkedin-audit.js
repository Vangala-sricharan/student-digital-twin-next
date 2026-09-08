// Vercel Serverless Function & Vite Dev Middleware Handler for LinkedIn Profile PDF Audit
import { GoogleGenAI } from '@google/genai';

function computeDeterministicLinkedInScore(extractedText, detectedSections = [], candidateHeadline = '') {
  const textLower = extractedText.toLowerCase();
  const sectionsSet = new Set(detectedSections.map(s => s.toLowerCase()));

  // 1. Headline Impact (max 15)
  let headlineScore = 0;
  const hasHeadline = Boolean(candidateHeadline && candidateHeadline.trim().length > 5);
  if (hasHeadline) {
    headlineScore += 6;
    if (candidateHeadline.length > 25) headlineScore += 3;
    if (/engineer|developer|architect|full-stack|software|backend|frontend|data|ai|student/i.test(candidateHeadline)) {
      headlineScore += 3;
    }
    if (/\||•|@|at\s+/i.test(candidateHeadline)) {
      headlineScore += 3;
    }
  } else if (textLower.includes('headline') || textLower.includes('aspiring') || textLower.includes('student')) {
    headlineScore += 4;
  }
  headlineScore = Math.min(15, Math.max(0, headlineScore));

  // 2. About Section Depth (max 25)
  let aboutScore = 0;
  const hasAbout = sectionsSet.has('summary') || /summary|about\b/i.test(extractedText);
  if (hasAbout) {
    aboutScore += 10;
    // Length & substance
    if (extractedText.length > 500) aboutScore += 6;
    if (/project|system|built|engineered|architected|developed/i.test(textLower)) aboutScore += 5;
    if (/impact|metrics|scalable|performance|results/i.test(textLower)) aboutScore += 4;
  }
  aboutScore = Math.min(25, Math.max(0, aboutScore));

  // 3. Experience & Career Progression (max 20)
  let experienceScore = 0;
  const hasExperience = sectionsSet.has('experience') || /\bexperience\b/i.test(extractedText);
  if (hasExperience) {
    experienceScore += 8;
    if (/intern|developer|engineer|lead|assistant|founder|freelance|analyst/i.test(textLower)) {
      experienceScore += 6;
    }
    if (/responsibilities|achieved|implemented|designed|created/i.test(textLower)) {
      experienceScore += 6;
    }
  }
  experienceScore = Math.min(20, Math.max(0, experienceScore));

  // 4. Education & Certifications (max 20)
  let educationScore = 0;
  const hasEducation = sectionsSet.has('education') || /\beducation\b/i.test(extractedText);
  if (hasEducation) {
    educationScore += 8;
    if (/b\.tech|bachelor|master|degree|computer science|engineering|university|college/i.test(textLower)) {
      educationScore += 5;
    }
    if (/\b(20\d\d)\b/.test(extractedText)) {
      educationScore += 3;
    }
  }
  const hasCerts = sectionsSet.has('certifications') || sectionsSet.has('honors-awards') || /certification|certified|license|honor|award/i.test(textLower);
  if (hasCerts) {
    educationScore += 4;
  }
  educationScore = Math.min(20, Math.max(0, educationScore));

  // 5. Skills & Professional Positioning (max 20)
  let skillsScore = 0;
  const hasSkills = sectionsSet.has('skills') || /\btop skills\b|\bskills\b/i.test(extractedText);
  if (hasSkills) {
    skillsScore += 8;
    const commonTechs = ['python', 'java', 'javascript', 'typescript', 'react', 'node', 'c++', 'c#', 'sql', 'docker', 'aws', 'git', 'linux', 'html', 'css'];
    const foundTechs = commonTechs.filter(t => textLower.includes(t));
    if (foundTechs.length >= 5) skillsScore += 7;
    else if (foundTechs.length >= 2) skillsScore += 4;

    if (foundTechs.length > 0) skillsScore += 5;
  }
  skillsScore = Math.min(20, Math.max(0, skillsScore));

  const breakdown = [
    { label: 'Headline Impact', score: headlineScore, max: 15 },
    { label: 'About Section Depth', score: aboutScore, max: 25 },
    { label: 'Experience & Career Progression', score: experienceScore, max: 20 },
    { label: 'Education & Certifications', score: educationScore, max: 20 },
    { label: 'Skills & Professional Positioning', score: skillsScore, max: 20 },
  ];

  const sumScores = breakdown.reduce((acc, b) => acc + b.score, 0);
  const sumMax = breakdown.reduce((acc, b) => acc + b.max, 0); // 100
  const overallScore = Math.round((sumScores / sumMax) * 100);

  const evaluation =
    overallScore >= 85 ? 'Recruiter Ready' :
    overallScore >= 70 ? 'Competitive' :
    overallScore >= 55 ? 'Developing' : 'Needs Polish';

  return {
    overallScore,
    evaluation,
    breakdown,
  };
}

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
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    }
  } catch (err) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: 'Invalid JSON payload' }));
    return;
  }

  const extractedText = (body.profileText || body.extractedText || body.userInputs?.profileText || '').trim();
  const fileName = body.fileName || body.userInputs?.fileName || 'linkedin_profile.pdf';
  const detectedSections = Array.isArray(body.detectedSections) ? body.detectedSections : (body.userInputs?.detectedSections || []);
  const missingSections = Array.isArray(body.missingSections) ? body.missingSections : (body.userInputs?.missingSections || []);
  const candidateName = body.candidateName || body.userInputs?.candidateName || '';
  const candidateHeadline = body.candidateHeadline || body.userInputs?.candidateHeadline || '';
  const candidateLocation = body.candidateLocation || body.userInputs?.candidateLocation || '';

  // Strict Validation on extracted PDF text
  if (!extractedText || extractedText.length < 40) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'The uploaded PDF does not contain sufficient profile content to conduct an audit. Please upload an authentic PDF exported from LinkedIn using More -> Save to PDF.',
      data: null,
    }));
    return;
  }

  // Deterministic Scoring
  const scoring = computeDeterministicLinkedInScore(extractedText, detectedSections, candidateHeadline);

  // Evidence-grounded defaults
  let strengths = [];
  if (detectedSections.includes('Education') || /education/i.test(extractedText)) {
    strengths.push('Academic credentials and university background clearly declared in profile export.');
  }
  if (detectedSections.includes('Skills') || /skills/i.test(extractedText)) {
    strengths.push('Standard skills taxonomy present for recruiter algorithmic search indexing.');
  }
  if (detectedSections.includes('Experience') || /experience/i.test(extractedText)) {
    strengths.push('Work experience timeline and institutional engagement documented.');
  }
  if (strengths.length < 2) {
    strengths.push('Valid LinkedIn PDF export structure detected with searchable text.');
  }

  let gaps = [];
  if (!detectedSections.includes('Summary') && !/summary/i.test(extractedText)) {
    gaps.push('Missing About/Summary Section: Profile lacks an executive summary outlining technical focus and career value proposition.');
  }
  if (!candidateHeadline || candidateHeadline.length < 20) {
    gaps.push('Weak or Undefined Headline: Headline does not currently communicate specialized technical depth or target role.');
  }
  if (!detectedSections.includes('Certifications') && !/certification/i.test(extractedText)) {
    gaps.push('Certifications: No industry certifications or verified technical badges listed.');
  }
  if (gaps.length === 0) {
    gaps.push('Quantifiable Metrics: Experience bullet points could benefit from stronger numerical performance metrics.');
  }

  const roleKeyword = /intern|student/i.test(candidateHeadline) ? 'Software Engineer Intern' : 'Software Development Engineer';
  const nameDisplay = candidateName || 'Engineering Candidate';

  let headlineVariations = [
    `${nameDisplay} | Aspiring ${roleKeyword} | Full-Stack & Systems Development`,
    `${nameDisplay} | Computer Science Scholar | Building High-Performance Distributed Systems`,
    `${nameDisplay} | Software Developer | Proven Proof-of-Work in Modern Web Architectures`,
  ];

  let recommendations = [
    { priority: 1, title: 'Calibrate Headline with High-Yield Keywords', desc: 'Replace generic student titles with your specific engineering focus and core tech stack.' },
    { priority: 2, title: 'Draft a 3-Paragraph Architecture About Section', desc: 'Highlight technical problem-solving philosophy, top deployed projects, and immediate career readiness.' },
    { priority: 3, title: 'Feature Top GitHub Repositories in Media Section', desc: 'Directly attach verified repository links and live project URLs to your LinkedIn featured card.' },
    { priority: 4, title: 'Reorganize Skills by Engineering Specialization', desc: 'Ensure your top 3 pinned skills precisely match current recruiter Boolean queries.' },
  ];

  let searchOptimization = `Include high-volume recruiter Boolean keywords in your About section: REST APIs, Distributed Systems, Data Structures, TypeScript, Cloud Architecture.`;

  // Grounded AI Enhancement if Gemini is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Principal Technical Recruiter and Executive LinkedIn Branding Strategist auditing an authentic LinkedIn Profile PDF.
EXTRACTED PROFILE PDF TEXT:
${extractedText.slice(0, 4000)}

DETECTED PROFILE SECTIONS: ${detectedSections.join(', ') || 'Standard profile text'}
MISSING PROFILE SECTIONS: ${missingSections.join(', ') || 'None'}
CANDIDATE NAME DETECTED: ${candidateName || 'Candidate'}
CURRENT HEADLINE DETECTED: ${candidateHeadline || 'Not specified'}

CRITICAL RULES:
1. Ground every comment ONLY in the real extracted text above.
2. DO NOT fabricate companies, degrees, dates, awards, or projects not mentioned in the text.
3. If sections (like Summary, Experience, or Certifications) are missing, note them as critical deficiencies.
4. Output strict JSON with:
   - "strengths": 3-4 factual strings
   - "gaps": 3-4 factual strings
   - "headlineVariations": 3 specific headline strings tailored to their actual skills and background
   - "recommendations": 4 objects with { "priority": number, "title": string, "desc": string }
   - "searchOptimization": string (1-2 sentences)

JSON ONLY:`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];
      let response = null;

      for (const model of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
          if (response && response.text) break;
        } catch {
          // Model temporarily saturated; quietly cascade to alternate candidate
        }
      }

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed.strengths) && parsed.strengths.length > 0) strengths = parsed.strengths;
        if (Array.isArray(parsed.gaps) && parsed.gaps.length > 0) gaps = parsed.gaps;
        if (Array.isArray(parsed.headlineVariations) && parsed.headlineVariations.length > 0) headlineVariations = parsed.headlineVariations;
        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) recommendations = parsed.recommendations;
        if (parsed.searchOptimization) searchOptimization = parsed.searchOptimization;
      }
    } catch {
      // Heuristic values retained if AI inference unavailable
    }
  }

  const profile = {
    name: candidateName || 'LinkedIn Candidate',
    headline: candidateHeadline || 'Engineering Scholar',
    location: candidateLocation || 'Verified Profile',
    source: 'pdf',
    fileName,
  };

  const auditData = {
    score: scoring.overallScore,
    evaluation: scoring.evaluation,
    profile,
    breakdown: scoring.breakdown,
    strengths,
    gaps,
    headlineVariations,
    recommendations,
    searchOptimization,
    detectedSections,
    missingSections,
  };

  const rawText = `### LinkedIn Profile & Recruiter Visibility Audit (PDF Export)

**Candidate**: ${profile.name}  
**Audited File**: \`${fileName}\`  
**Recruiter-Readiness Score**: **${scoring.overallScore} / 100** (${scoring.evaluation})

#### 1. Empirical Profile Strengths
${strengths.map(s => `- ${s}`).join('\n')}

#### 2. Identified Profile Gaps
${gaps.map(g => `- ${g}`).join('\n')}

#### 3. High-Converting Headline Calibration Options
${headlineVariations.map((h, i) => `Option ${i + 1}: \`${h}\``).join('\n')}

#### 4. High Impact Profile Adjustments
${recommendations.map(r => `#${r.priority} ${r.title}: ${r.desc}`).join('\n')}

#### 5. Recruiter Search Discoverability Strategy
${searchOptimization}`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    data: auditData,
    rawText,
    timestamp: new Date().toISOString(),
  }));
}

export default async function handler(req, res) {
  return handleLinkedInAuditRequest(req, res);
}
