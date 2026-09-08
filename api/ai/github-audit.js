// Vercel Serverless Function & Vite Dev Middleware Handler for GitHub Technical Profile Audit
import { GoogleGenAI } from '@google/genai';

const RESERVED_PATHS = new Set([
  'explore', 'features', 'enterprise', 'pricing', 'settings', 'orgs', 'organizations',
  'topics', 'trending', 'collections', 'events', 'marketplace', 'security', 'login',
  'join', 'pulls', 'issues', 'notifications', 'stars', 'search', 'account', 'dashboard',
  'about', 'contact', 'blog', 'support', 'site',
]);

function normalizeAndValidateGitHubUrl(rawInput) {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a valid GitHub profile URL (e.g. https://github.com/username).' };
  }

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    if (urlString.startsWith('github.com/') || urlString.startsWith('www.github.com/')) {
      urlString = 'https://' + urlString;
    } else {
      return { valid: false, error: 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL (e.g. https://github.com/username).' };
    }
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return { valid: false, error: 'INVALID GITHUB URL\nDomain must be github.com (e.g. https://github.com/username).' };
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return { valid: false, error: 'INVALID GITHUB URL\nPlease provide a username in the GitHub profile URL (e.g. https://github.com/username).' };
  }

  if (segments.length > 1) {
    return { valid: false, error: 'INVALID GITHUB PROFILE URL\nPlease provide a user profile URL, not a repository or sub-path (e.g. https://github.com/username).' };
  }

  let username = segments[0].replace(/\.git$/i, '');
  if (RESERVED_PATHS.has(username.toLowerCase())) {
    return { valid: false, error: 'INVALID GITHUB PROFILE URL\nProvided path is a reserved GitHub route.' };
  }

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return { valid: false, error: 'INVALID GITHUB URL\nUsername contains invalid characters.' };
  }

  return { valid: true, username, normalizedUrl: `https://github.com/${username}` };
}

function computeDeterministicGitHubScore(userData, repos, events) {
  const publicRepos = userData.public_repos || 0;
  const followers = userData.followers || 0;
  const hasBio = Boolean(userData.bio && userData.bio.trim().length > 0);
  const hasName = Boolean(userData.name && userData.name.trim().length > 0);
  const hasAvatar = Boolean(userData.avatar_url);
  const hasLocationOrBlog = Boolean(userData.location || userData.blog);

  // 1. Profile Quality (max 15)
  let profileQuality = 0;
  if (hasAvatar) profileQuality += 3;
  if (hasBio) profileQuality += (userData.bio.trim().length > 20 ? 3 : 2);
  if (hasName) profileQuality += 2;
  if (hasLocationOrBlog) profileQuality += 3;
  if (publicRepos > 0) profileQuality += 4;
  profileQuality = Math.min(15, profileQuality);

  // 2. Project Quality (max 25)
  let totalStars = 0;
  let totalForks = 0;
  const languagesSet = new Set();
  let originalRepos = 0;
  let reposWithDescription = 0;
  let reposWithLicenseOrTopics = 0;

  if (Array.isArray(repos)) {
    for (const r of repos) {
      totalStars += (r.stargazers_count || 0);
      totalForks += (r.forks_count || 0);
      if (r.language) languagesSet.add(r.language);
      if (!r.fork) originalRepos++;
      if (r.description && r.description.trim().length > 5) reposWithDescription++;
      if (r.license || (Array.isArray(r.topics) && r.topics.length > 0)) reposWithLicenseOrTopics++;
    }
  }

  let projectQuality = 0;
  if (publicRepos >= 15) projectQuality += 11;
  else if (publicRepos >= 8) projectQuality += 9;
  else if (publicRepos >= 3) projectQuality += 6;
  else if (publicRepos > 0) projectQuality += 3;

  if (totalStars >= 20) projectQuality += 7;
  else if (totalStars >= 5) projectQuality += 5;
  else if (totalStars >= 1) projectQuality += 3;
  else if (publicRepos > 0) projectQuality += 1;

  if (languagesSet.size >= 4) projectQuality += 4;
  else if (languagesSet.size >= 2) projectQuality += 3;
  else if (languagesSet.size >= 1) projectQuality += 1;

  if (totalForks >= 3) projectQuality += 3;
  else if (totalForks >= 1) projectQuality += 2;
  projectQuality = Math.min(25, projectQuality);

  // 3. Documentation (max 20)
  let documentation = 0;
  const repoCount = repos.length || publicRepos || 1;
  const descRatio = repoCount > 0 ? (reposWithDescription / repoCount) : 0;
  if (descRatio >= 0.7) documentation += 10;
  else if (descRatio >= 0.4) documentation += 7;
  else if (descRatio > 0) documentation += 4;

  if (reposWithDescription >= 5) documentation += 10;
  else if (reposWithDescription >= 2) documentation += 7;
  else if (reposWithDescription >= 1) documentation += 4;
  else documentation += 1;
  documentation = Math.min(20, documentation);

  // 4. Repo Organization (max 15)
  let repoOrganization = 0;
  if (reposWithLicenseOrTopics >= 3) repoOrganization += 8;
  else if (reposWithLicenseOrTopics >= 1) repoOrganization += 5;
  else if (publicRepos > 0) repoOrganization += 2;

  const originalRatio = repoCount > 0 ? (originalRepos / repoCount) : 0;
  if (originalRatio >= 0.6) repoOrganization += 7;
  else if (originalRatio > 0) repoOrganization += 4;
  repoOrganization = Math.min(15, repoOrganization);

  // 5. Activity Consistency (max 15)
  let activityConsistency = 0;
  const pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : [];
  if (pushEvents.length >= 5) activityConsistency += 10;
  else if (pushEvents.length >= 2) activityConsistency += 7;
  else if (pushEvents.length >= 1) activityConsistency += 4;
  else activityConsistency += 2;

  const createdYear = userData.created_at ? new Date(userData.created_at).getFullYear() : 2024;
  const yearsActive = Math.max(1, new Date().getFullYear() - createdYear);
  if (yearsActive >= 2) activityConsistency += 5;
  else if (yearsActive >= 1) activityConsistency += 3;
  else activityConsistency += 2;
  activityConsistency = Math.min(15, activityConsistency);

  // 6. Engineering Presentation (max 10)
  let engineeringPresentation = 0;
  if (userData.blog && userData.blog.trim().length > 0) engineeringPresentation += 4;
  if (followers >= 10) engineeringPresentation += 3;
  else if (followers >= 1) engineeringPresentation += 2;
  if (userData.company || userData.hireable) engineeringPresentation += 3;
  else if (publicRepos > 3) engineeringPresentation += 2;
  engineeringPresentation = Math.min(10, engineeringPresentation);

  const breakdown = [
    { label: 'Profile Quality', score: profileQuality, max: 15 },
    { label: 'Project Quality', score: projectQuality, max: 25 },
    { label: 'Documentation', score: documentation, max: 20 },
    { label: 'Repository Organization', score: repoOrganization, max: 15 },
    { label: 'Activity Consistency', score: activityConsistency, max: 15 },
    { label: 'Engineering Presentation', score: engineeringPresentation, max: 10 },
  ];

  const overallScore = Math.min(100, Math.max(0, breakdown.reduce((acc, b) => acc + b.score, 0)));
  const evaluation =
    overallScore >= 85 ? 'Recruiter Ready' :
    overallScore >= 70 ? 'Competitive' :
    overallScore >= 55 ? 'Developing' : 'Needs Polish';

  return {
    overallScore,
    evaluation,
    breakdown,
    totalStars,
    totalForks,
    languages: Array.from(languagesSet),
  };
}

export async function handleGitHubAuditRequest(req, res) {
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

  const rawUrl = body.userInputs?.githubUrl || body.githubUrl || '';
  const validation = normalizeAndValidateGitHubUrl(rawUrl);

  if (!validation.valid || !validation.username) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: validation.error || 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL (e.g. https://github.com/username).',
      data: null,
    }));
    return;
  }

  const username = validation.username;

  // STEP 2: Verify account via genuine GitHub API
  const headers = {
    'User-Agent': 'StudentTwin-GitHubAuditor/4.0',
    'Accept': 'application/vnd.github.v3+json',
  };
  const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  let userRes;
  try {
    userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  } catch (netErr) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'Failed to reach GitHub API. Please verify your internet connection and try again.',
      data: null,
    }));
    return;
  }

  // 404 Verification Check: Strictly reject nonexistent accounts
  if (userRes.status === 404) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: "GitHub account not found. We couldn't find a public GitHub account for this username. Please check the URL and try again.",
      data: null,
    }));
    return;
  }

  if (userRes.status === 403 || userRes.status === 429) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'GitHub API rate limit reached. Please wait a few moments before retrying.',
      data: null,
    }));
    return;
  }

  if (!userRes.ok) {
    res.statusCode = userRes.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: `GitHub API returned status ${userRes.status}. Please try again later.`,
      data: null,
    }));
    return;
  }

  const userData = await userRes.json();

  // Fetch genuine repositories & events
  let repos = [];
  try {
    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated`, { headers });
    if (reposRes.ok) {
      repos = await reposRes.json();
    }
  } catch (e) {}

  let events = [];
  try {
    const eventsRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=15`, { headers });
    if (eventsRes.ok) {
      events = await eventsRes.json();
    }
  } catch (e) {}

  // Compute deterministic score and metrics
  const scoring = computeDeterministicGitHubScore(userData, repos, events);
  const sampleRepos = Array.isArray(repos) ? repos.slice(0, 5).map(r => ({
    name: r.name,
    description: r.description || null,
    language: r.language || null,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    hasReadme: Boolean(r.has_pages || r.has_wiki || r.description),
  })) : [];

  const memberSinceFormatted = userData.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Unknown';

  let strengths = [
    `Public repository portfolio featuring ${userData.public_repos || 0} visible codebases.`,
    scoring.languages.length > 0
      ? `Demonstrable language footprint across ${scoring.languages.slice(0, 4).join(', ')}.`
      : 'Active GitHub presence registered since ' + memberSinceFormatted + '.',
    scoring.totalStars > 0
      ? `Recognized community traction with ${scoring.totalStars} total stars received.`
      : 'Initial code repositories initialized and discoverable on GitHub.',
  ];

  let gaps = [];
  if (!userData.bio || userData.bio.trim().length === 0) {
    gaps.push('Profile README / Bio: Missing descriptive technical positioning bio.');
  }
  if (scoring.totalStars === 0) {
    gaps.push('Social Proof & Stars: Repositories currently lack external community recognition or stars.');
  }
  if (!repos.some(r => r.description && r.description.length > 10)) {
    gaps.push('Documentation: Multiple repositories lack concise architectural descriptions.');
  }
  if (!userData.blog) {
    gaps.push('Portfolio Link: Missing attached personal engineering portfolio or project demo URL.');
  }
  if (gaps.length === 0) {
    gaps.push('CI/CD & Testing: Ensure automated GitHub Actions workflows and test suites are active.');
  }

  let adjustments = [
    { priority: 1, title: 'Enhance the Profile Bio & Overview', desc: 'Add a high-signal headline showcasing your tech stack, target engineering role, and verified project links.' },
    { priority: 2, title: 'Add Clear Repository Descriptions & Tags', desc: 'Ensure every pinned repository has a clear 1-sentence value proposition, setup guide, and topic tags.' },
    { priority: 3, title: 'Attach Live Project Demonstrations', desc: 'Include live deployed demo URLs in the homepage field of your primary pinned repositories.' },
    { priority: 4, title: 'Pin Top 3 Proof-of-Work Repositories', desc: 'Curate your top 3 cleanest architectural projects to anchor recruiter first impressions.' },
  ];

  const searchKeywords = scoring.languages.slice(0, 3).join(', ') || 'Software Engineering, Full-Stack';
  let searchOptimization = `Pin top 3 proof-of-work repositories. Ensure keywords: ${searchKeywords}, Clean Architecture, REST APIs appear in repository descriptions for recruiter search indexing.`;

  // Grounded AI enhancement if Gemini is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Tier-1 Tech Recruiter and Senior Systems Architect conducting an empirical audit of the public GitHub profile @${username}.
REAL EVIDENCE RETRIEVED FROM GITHUB API:
- Display Name: ${userData.name || 'Not specified'}
- Public Repos: ${userData.public_repos || 0}
- Total Stars: ${scoring.totalStars}
- Total Forks: ${scoring.totalForks}
- Detected Languages: ${scoring.languages.join(', ') || 'None detected'}
- Bio: ${userData.bio || 'None provided'}
- Location: ${userData.location || 'None'}
- Blog/Portfolio: ${userData.blog || 'None'}
- Account Created: ${memberSinceFormatted}
- Top Repositories: ${JSON.stringify(sampleRepos)}

REQUIREMENTS:
1. Provide 3-4 factual technical strengths strictly grounded in the evidence above.
2. Provide 3-4 factual deficiencies/gaps strictly grounded in the evidence (e.g. missing bio, zero stars, lack of descriptions, missing demo links).
3. Provide 4 high-impact profile adjustments (#1, #2, #3, #4).
4. Provide a 1-2 sentence recruiter search optimization directive.

OUTPUT MUST BE VALID STRICT JSON:
{
  "strengths": ["..."],
  "gaps": ["..."],
  "adjustments": [
    {"priority": 1, "title": "...", "desc": "..."},
    {"priority": 2, "title": "...", "desc": "..."},
    {"priority": 3, "title": "...", "desc": "..."},
    {"priority": 4, "title": "...", "desc": "..."}
  ],
  "searchOptimization": "..."
}`;

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
        if (Array.isArray(parsed.adjustments) && parsed.adjustments.length > 0) adjustments = parsed.adjustments;
        if (parsed.searchOptimization) searchOptimization = parsed.searchOptimization;
      }
    } catch {
      // Heuristic values retained if AI enhancement unavailable
    }
  }

  const finalProfile = {
    username: userData.login,
    name: userData.name || userData.login,
    avatarUrl: userData.avatar_url,
    htmlUrl: userData.html_url,
    bio: userData.bio || 'No public bio provided.',
    publicRepos: userData.public_repos || 0,
    totalStars: scoring.totalStars,
    forks: scoring.totalForks,
    languages: scoring.languages,
    memberSince: memberSinceFormatted,
    followers: userData.followers || 0,
    following: userData.following || 0,
    location: userData.location || null,
    blog: userData.blog || null,
  };

  const auditData = {
    score: scoring.overallScore,
    evaluation: scoring.evaluation,
    profile: finalProfile,
    breakdown: scoring.breakdown,
    strengths,
    gaps,
    adjustments,
    searchOptimization,
  };

  const rawText = `### GitHub Code Signals & Technical Readiness Audit

**Target Profile**: [@${finalProfile.username}](${finalProfile.htmlUrl})  
**Recruiter-Readiness Score**: **${scoring.overallScore} / 100** (${scoring.evaluation})

#### 1. Empirical Profile Strengths
${strengths.map(s => `- ${s}`).join('\n')}

#### 2. Identified Gaps & Deficiencies
${gaps.map(g => `- ${g}`).join('\n')}

#### 3. High Impact Profile Adjustments
${adjustments.map((a, i) => `#${i + 1} ${a.title}: ${a.desc}`).join('\n')}

#### 4. Recruiter Search Algorithm Optimization
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
  return handleGitHubAuditRequest(req, res);
}
