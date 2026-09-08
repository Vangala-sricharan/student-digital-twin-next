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
 * Validates a GitHub repository URL and extracts owner and repo.
 */
function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)(?:\/.*)?$/i);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, '');
  if (!owner || !repo) return null;
  return { owner, repo };
}

/**
 * Fetches real evidence from GitHub API for a public repository.
 */
async function fetchGitHubEvidence(owner, repo) {
  const headers = {
    'User-Agent': 'Student-Digital-Twin-Project-Auditor',
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // 1. Check if repository actually exists
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (repoRes.status === 404) {
    return { exists: false, error: 'GitHub repository not found.' };
  }
  if (repoRes.status === 403 || repoRes.status === 429) {
    // If rate limited, we can still proceed with public raw content checks or report rate limit
    const resetTime = repoRes.headers.get('x-ratelimit-reset');
    return { exists: false, rateLimited: true, error: 'GitHub API rate limit reached. Please retry in a few moments.' };
  }
  if (!repoRes.ok) {
    return { exists: false, error: `GitHub repository check returned HTTP ${repoRes.status}.` };
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || 'main';

  // 2. Concurrently fetch languages, root contents, package.json, commits, README
  const [languagesRes, contentsRes, commitsRes, readmeRes, packageJsonRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }).catch(() => null),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }).catch(() => null),
    fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers }).catch(() => null),
    fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`).catch(() => null),
    fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/package.json`).catch(() => null),
  ]);

  let languages = {};
  if (languagesRes && languagesRes.ok) {
    try {
      languages = await languagesRes.json();
    } catch {}
  }

  let rootFiles = [];
  let hasTests = false;
  let hasCiCd = false;
  let hasDocker = false;
  if (contentsRes && contentsRes.ok) {
    try {
      const contentsData = await contentsRes.json();
      if (Array.isArray(contentsData)) {
        rootFiles = contentsData.map((f) => f.name);
        hasTests = rootFiles.some((name) => /^(test|tests|__tests__|spec)$/i.test(name));
        hasCiCd = rootFiles.includes('.github') || rootFiles.includes('.gitlab-ci.yml');
        hasDocker = rootFiles.some((name) => /^dockerfile|^docker-compose/i.test(name));
      }
    } catch {}
  }

  let commits = [];
  if (commitsRes && commitsRes.ok) {
    try {
      const commitsData = await commitsRes.json();
      if (Array.isArray(commitsData)) {
        commits = commitsData.slice(0, 5).map((c) => ({
          message: c.commit?.message?.split('\n')[0] || 'Commit',
          author: c.commit?.author?.name || c.author?.login || 'Author',
          date: c.commit?.author?.date || '',
        }));
      }
    } catch {}
  }

  let readmeText = '';
  let hasReadme = false;
  if (readmeRes && readmeRes.ok) {
    try {
      const text = await readmeRes.text();
      if (text && !text.startsWith('404: Not Found')) {
        hasReadme = true;
        readmeText = text.slice(0, 4000);
      }
    } catch {}
  }

  let packageInfo = null;
  if (packageJsonRes && packageJsonRes.ok) {
    try {
      const pkg = await packageJsonRes.json();
      packageInfo = {
        name: pkg.name,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        scripts: Object.keys(pkg.scripts || {}),
      };
      if (!hasTests && (packageInfo.scripts.includes('test') || packageInfo.devDependencies.some((d) => /jest|vitest|mocha|cypress|playwright/i.test(d)))) {
        hasTests = true;
      }
    } catch {}
  }

  return {
    exists: true,
    owner,
    repo,
    fullName: repoData.full_name,
    description: repoData.description || '',
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    openIssues: repoData.open_issues_count || 0,
    defaultBranch,
    topics: repoData.topics || [],
    license: repoData.license?.name || 'None',
    sizeKB: repoData.size || 0,
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    pushedAt: repoData.pushed_at,
    languages,
    rootFiles,
    hasTests,
    hasCiCd,
    hasDocker,
    commits,
    hasReadme,
    readmeText,
    packageInfo,
  };
}

/**
 * Builds the AI prompt for Project Auditor.
 */
function buildProjectAuditPrompt(projectData, gitHubEvidence, studentContext) {
  const {
    projectTitle,
    description,
    techStack,
    githubUrl,
    liveUrl,
    systemArchitecture,
    role,
    difficulty,
    status,
    customNotes,
  } = projectData;

  const stackStr = Array.isArray(techStack) ? techStack.join(', ') : (techStack || 'Not specified');

  let gitHubSection = '';
  if (gitHubEvidence && gitHubEvidence.exists) {
    const langEntries = Object.entries(gitHubEvidence.languages || {});
    const totalBytes = langEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
    const langBreakdown = langEntries
      .map(([lang, bytes]) => `${lang}: ${Math.round((bytes / (totalBytes || 1)) * 100)}% (${bytes.toLocaleString()} bytes)`)
      .join(', ');

    const recentCommitsStr = gitHubEvidence.commits.length > 0
      ? gitHubEvidence.commits.map((c) => `- "${c.message}" by ${c.author} on ${c.date}`).join('\n')
      : 'No recent commit log retrieved.';

    const depsStr = gitHubEvidence.packageInfo
      ? `\n- Dependencies (${gitHubEvidence.packageInfo.dependencies.length}): ${gitHubEvidence.packageInfo.dependencies.join(', ')}\n- DevDependencies: ${gitHubEvidence.packageInfo.devDependencies.join(', ')}\n- Scripts: ${gitHubEvidence.packageInfo.scripts.join(', ')}`
      : '';

    gitHubSection = `
VERIFIED GITHUB REPOSITORY EVIDENCE:
- Repository: ${gitHubEvidence.fullName} (${githubUrl})
- Description: ${gitHubEvidence.description || 'None provided'}
- Stars: ${gitHubEvidence.stars} | Forks: ${gitHubEvidence.forks} | Open Issues: ${gitHubEvidence.openIssues}
- Primary Languages: ${langBreakdown || 'None detected'}
- Repository Size: ${gitHubEvidence.sizeKB} KB
- Root Files/Directories: ${gitHubEvidence.rootFiles.join(', ') || 'None'}
- Automated Test Presence: ${gitHubEvidence.hasTests ? 'YES (Test directory/scripts detected)' : 'NO (No test directory or test harness identified)'}
- CI/CD Presence: ${gitHubEvidence.hasCiCd ? 'YES (Workflow files detected)' : 'NO (No CI/CD pipeline detected)'}
- Containerization: ${gitHubEvidence.hasDocker ? 'YES (Docker config detected)' : 'NO'}
- README Documentation: ${gitHubEvidence.hasReadme ? `YES (${gitHubEvidence.readmeText.length} characters excerpted below)` : 'NO (README.md is missing from repository)'}
${gitHubEvidence.hasReadme ? `\nREADME EXCERPT:\n"""\n${gitHubEvidence.readmeText.slice(0, 2500)}\n"""` : ''}
${depsStr}
- Recent Commit Rigor:\n${recentCommitsStr}
`;
  } else {
    gitHubSection = `
GITHUB REPOSITORY EVIDENCE:
- Repository URL: ${githubUrl ? githubUrl : 'Not provided'}
- Status: ${githubUrl ? 'Not verified or inaccessible' : 'NO REPOSITORY PROVIDED (Critical proof gap for code audit)'}
`;
  }

  const liveUrlSection = liveUrl
    ? `- Live Demo URL: ${liveUrl} (Note: live demo is supporting evidence, do not claim features not substantiated by repository evidence)`
    : '- Live Demo URL: Not provided';

  const candidateContext = studentContext
    ? `- Candidate: ${studentContext.name || 'Student Candidate'}
- Target Role: ${studentContext.targetRole || 'Software Engineer'}
- Degree/Branch: ${[studentContext.degree, studentContext.branch].filter(Boolean).join(' in ') || 'Engineering'}`
    : '- Candidate: Student Candidate';

  return `You are a Principal Software Engineer & Bar Raiser conducting an uncompromising, evidence-based technical code and architecture audit for a university candidate's portfolio project.

${candidateContext}

TARGET PROJECT DETAILS:
- Title: ${projectTitle}
- Candidate Role: ${role || 'Primary Contributor'}
- Declared Tech Stack: ${stackStr}
- Difficulty Level: ${difficulty || 'Intermediate'}
- Completion Status: ${status || 'Completed'}
- Candidate Description: ${description || 'No description provided'}
- System Architecture / Workflow: ${systemArchitecture || 'No architecture notes provided'}
${liveUrlSection}
${customNotes ? `- User Audit Focus Notes: ${customNotes}` : ''}

${gitHubSection}

AUDIT RULES & SCORING METHODOLOGY:
1. STRICT OBJECTIVITY: Base your evaluation solely on the actual evidence provided above. Never invent libraries, frameworks, performance stats, database tables, or test coverage that are not in the repository evidence.
2. DEDUCTIONS FOR MISSING EVIDENCE:
   - If README is missing, dock points heavily from "Documentation, API Specs & README Clarity" (max score cannot exceed 6/15).
   - If automated tests are absent, dock points from "Automated Testing & Verifiable Proof of Work" (max score cannot exceed 5/15).
   - If CI/CD is absent, note it under Gaps and Recommendations.
3. SCORING BREAKDOWN (Sum must equal overallScore):
   - Technical Depth & Algorithmic Complexity: 0-25
   - Architectural Modularity & State Isolation: 0-25
   - Code Quality & Clean Architecture Principles: 0-20
   - Documentation, API Specs & README Clarity: 0-15
   - Automated Testing & Verifiable Proof of Work: 0-15
   Overall Score = sum of the 5 categories (0 to 100).
4. PROJECT-SPECIFIC OUTPUT: Provide detailed strengths, critical gaps, and recommendations tailored specifically to ${projectTitle} and the actual code technologies found (${stackStr}).
5. INR ONLY: Any costs, hosting budgets, or salary/stipend references must strictly use Indian Rupees (₹) with Indian numbering (e.g. ₹1,499, ₹25,000). Never use dollar signs ($).

You MUST output your evaluation as a valid JSON object wrapped inside a \`\`\`json\`\`\` code block with the following exact keys:
{
  "overallScore": <integer 0-100, exact sum of breakdown scores>,
  "verdict": "<concise evaluation label, e.g. 'Production Ready & Verified', 'Architectural Depth with Test Gaps', 'Early Prototype - Proof Needed'>",
  "projectQuality": "<2-3 sentences summarizing overall project quality based on real evidence>",
  "technicalDepth": "<2-3 sentences evaluating technical complexity, algorithmic rigor, and tech stack utilization>",
  "architecture": "<2-3 sentences evaluating modularity, folder structure, separation of concerns>",
  "engineeringPractices": "<2-3 sentences evaluating commit hygiene, dependencies, and configuration>",
  "documentation": "<2-3 sentences evaluating README presence, clarity, and setup instructions>",
  "evidenceVerification": "<2-3 sentences summarizing verified proof vs missing proof>",
  "recruiterReadiness": "<2-3 sentences assessing readiness for technical hiring bar raisers>",
  "nextImprovements": "<2-3 sentences outlining highest priority next steps>",
  "breakdown": [
    { "label": "Technical Depth & Algorithmic Complexity", "score": <0-25>, "max": 25 },
    { "label": "Architectural Modularity & State Isolation", "score": <0-25>, "max": 25 },
    { "label": "Code Quality & Clean Architecture Principles", "score": <0-20>, "max": 20 },
    { "label": "Documentation, API Specs & README Clarity", "score": <0-15>, "max": 15 },
    { "label": "Automated Testing & Verifiable Proof of Work", "score": <0-15>, "max": 15 }
  ],
  "strengths": [
    "<specific technical strength referencing actual evidence>",
    "<specific technical strength referencing actual evidence>",
    "<specific technical strength referencing actual evidence>"
  ],
  "gaps": [
    "<specific deficiency or missing element in this codebase>",
    "<specific deficiency or missing element in this codebase>"
  ],
  "missingEvidence": [
    "<specific missing verifiable proof item>"
  ],
  "recommendations": [
    { "priority": 1, "title": "<actionable title>", "desc": "<clear, actionable recommendation tailored specifically to this project>" },
    { "priority": 2, "title": "<actionable title>", "desc": "<clear, actionable recommendation tailored specifically to this project>" },
    { "priority": 3, "title": "<actionable title>", "desc": "<clear, actionable recommendation tailored specifically to this project>" }
  ]
}

After the JSON code block, include a comprehensive markdown report summarizing the audit.`;
}

/**
 * Main request handler for POST /api/ai/project-audit.
 */
export async function handleProjectAuditRequest(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  // 2. Validate input
  const body = req.body || {};
  const {
    projectTitle,
    description,
    techStack,
    githubUrl,
    liveUrl,
    systemArchitecture,
    role,
    difficulty,
    status,
    customNotes,
    studentContext,
  } = body;

  if (!projectTitle || typeof projectTitle !== 'string' || !projectTitle.trim()) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Project title is required for code-level auditing.' }));
    return;
  }

  // 3. GitHub repository validation & evidence retrieval
  let gitHubEvidence = null;
  if (githubUrl && typeof githubUrl === 'string' && githubUrl.trim()) {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid GitHub repository URL format. Please provide a valid URL like https://github.com/owner/repo' }));
      return;
    }

    try {
      gitHubEvidence = await fetchGitHubEvidence(parsed.owner, parsed.repo);
      if (!gitHubEvidence.exists) {
        if (gitHubEvidence.rateLimited) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: gitHubEvidence.error }));
          return;
        }
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GitHub repository not found.' }));
        return;
      }
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Failed to inspect GitHub repository: ${err?.message || 'Network error'}` }));
      return;
    }
  }

  // 4. Validate Live Demo URL if supplied
  if (liveUrl && typeof liveUrl === 'string' && liveUrl.trim()) {
    if (!/^https?:\/\//i.test(liveUrl.trim())) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Live Demo URL must start with http:// or https://' }));
      return;
    }
  }

  // 5. Initialize Gemini AI Client
  const ai = getAiClient();
  if (!ai) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }));
    return;
  }

  // 6. Build Audit Prompt
  const prompt = buildProjectAuditPrompt(body, gitHubEvidence, studentContext);

  // Proven modern Gemini models with resilient cascade (fast flash-lite first to avoid 503 capacity spikes)
  const models = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let auditResult = null;
  let rawAiText = '';

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          systemInstruction: 'You are an objective Principal Software Engineer & Bar Raiser auditing code projects for university hiring. Never invent metrics or technologies. Output strict JSON with genuine evaluation. Format currency in Indian Rupees (₹).',
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

        if (parsed && typeof parsed.overallScore === 'number') {
          auditResult = parsed;
          break;
        }
      }
    } catch (modelErr) {
      console.warn(`[Project Audit] Model ${model} failed, trying alternate:`, modelErr?.message || modelErr);
    }
  }

  if (!auditResult) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Project code audit could not be completed. Server AI failure.' }));
    return;
  }

  // Ensure breakdown sum equals overallScore
  if (Array.isArray(auditResult.breakdown) && auditResult.breakdown.length > 0) {
    const breakdownSum = auditResult.breakdown.reduce((sum, item) => sum + (typeof item.score === 'number' ? item.score : 0), 0);
    if (breakdownSum > 0 && Math.abs(breakdownSum - auditResult.overallScore) > 3) {
      auditResult.overallScore = Math.min(100, Math.max(0, breakdownSum));
    }
  }

  auditResult.rawText = rawAiText;
  auditResult.timestamp = new Date().toISOString();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    data: auditResult,
    rawText: rawAiText,
    timestamp: auditResult.timestamp,
  }));
}

// Default export for Vercel Serverless Function entrypoint
export default async function handler(req, res) {
  return handleProjectAuditRequest(req, res);
}
