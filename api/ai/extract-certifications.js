// Vercel Serverless Function & Vite Dev Middleware Handler for LinkedIn Profile PDF Certification Extraction
import { GoogleGenAI } from '@google/genai';

/**
 * Normalizes text for matching and duplicate detection.
 */
function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Extracts and cleans JSON from AI model response.
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

/**
 * Checks if the text looks like an authentic LinkedIn profile export.
 */
function isLikelyLinkedInProfile(text) {
  if (!text || text.length < 30) return false;
  const lower = text.toLowerCase();
  const hasLinkedInMarker = lower.includes('linkedin.com') || lower.includes('linkedin');
  const hasProfileSections =
    (lower.includes('top skills') || lower.includes('skills')) &&
    (lower.includes('experience') || lower.includes('education') || lower.includes('summary') || lower.includes('about'));
  return hasLinkedInMarker || hasProfileSections;
}

/**
 * Deterministic fallback extractor for LinkedIn profile text.
 * Strictly extracts from the Certifications section only. Never touches Skills or Projects.
 */
function extractCertificationsFromText(text, pdfUrls = []) {
  if (!text) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const SECTION_HEADER_REGEX = /^(?:Contact|Top Skills|Skills|Summary|About|Education|Experience|Projects|Languages|Honors-Awards|Honors & Awards|Publications|Interests|Recommendations)$/i;

  let inCertSection = false;
  const certLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:Certifications|Licenses & Certifications|Licenses and Certifications|Certificates)$/i.test(line)) {
      inCertSection = true;
      continue;
    }

    if (inCertSection) {
      if (SECTION_HEADER_REGEX.test(line)) {
        break; // Reached next major section
      }
      certLines.push(line);
    }
  }

  if (certLines.length === 0) {
    return [];
  }

  // Filter out standalone pagination or page number lines
  const cleanLines = certLines.filter(
    (l) => !/^Page\s+\d+(\s+of\s+\d+)?$/i.test(l) && !/^www\.linkedin\.com/i.test(l)
  );

  const results = [];
  let currentItem = null;

  const YEAR_REGEX = /\b(20[1-3][0-9]|199[0-9])\b/;
  const DATE_REGEX = /\b(?:Issued\s+)?(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+)?(20[1-3][0-9])\b/i;
  const CRED_ID_REGEX = /(?:Credential ID|License Number|Certificate ID|ID)[:\s]+([A-Za-z0-9-_]+)/i;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];

    // Check if line represents metadata of current item
    const dateMatch = line.match(DATE_REGEX);
    const credMatch = line.match(CRED_ID_REGEX);

    if (currentItem && (dateMatch || credMatch || line.toLowerCase().startsWith('issued') || line.toLowerCase().startsWith('credential id'))) {
      if (dateMatch && !currentItem.issueYear) {
        currentItem.issueYear = dateMatch[2];
        currentItem.issueDate = dateMatch[0].replace(/^Issued\s+/i, '');
      }
      if (credMatch && !currentItem.credentialId) {
        currentItem.credentialId = credMatch[1];
      }
      currentItem.sourceEvidence += `\n${line}`;
      continue;
    }

    // Known issuers or lines following a title
    const KNOWN_ISSUERS = [
      'aws academy', 'amazon web services', 'infosys springboard', 'infosys',
      'decodelabs', 'tata', 'forage', 'coursera', 'udemy', 'google cloud',
      'microsoft', 'ibm', 'oracle', 'deeplearning.ai', 'meta', 'cisco',
      'hackerrank', 'freecodecamp', 'nptel', 'swayam', 'edx', 'great learning'
    ];

    const isKnownIssuer = KNOWN_ISSUERS.some((ki) => line.toLowerCase() === ki || line.toLowerCase().startsWith(`${ki} `));

    if (currentItem && !currentItem.issuingOrganization && (isKnownIssuer || currentItem.linesUnder < 2)) {
      // If line is short and doesn't look like a title, treat as issuer
      if (isKnownIssuer || (!line.includes(' - ') && !line.includes('Program') && !line.includes('Certificate') && line.length < 50)) {
        currentItem.issuingOrganization = line;
        currentItem.sourceEvidence += `\n${line}`;
        currentItem.linesUnder++;
        continue;
      }
    }

    // Start a new certification item
    // Disqualify if it's a known non-certification marker
    if (SECTION_HEADER_REGEX.test(line)) continue;

    // Check if title has embedded issuer like "Tata - GenAI..." or "DecodeLabs Virtual..."
    let title = line;
    let issuer = null;

    if (line.includes(' - ')) {
      const parts = line.split(' - ');
      if (parts.length === 2) {
        const p0Lower = parts[0].trim().toLowerCase();
        if (KNOWN_ISSUERS.includes(p0Lower)) {
          issuer = parts[0].trim();
          title = parts[1].trim();
        }
      }
    }

    // Check for year in title
    let titleYear = null;
    let titleDate = null;
    const yearMatch = title.match(YEAR_REGEX);
    if (yearMatch && (title.includes('(') || title.includes('-'))) {
      titleYear = yearMatch[1];
    }

    // Find any matching verification URL in PDF URLs
    let verificationUrl = null;
    const normTitle = normalizeText(title);
    for (const url of pdfUrls) {
      if (url.toLowerCase().includes('linkedin.com/in/')) continue; // Never use profile URL
      const normUrl = normalizeText(url);
      if (normTitle && (normUrl.includes(normTitle.slice(0, 8)) || /verify|credential|badge|certificate/i.test(url))) {
        verificationUrl = url;
        break;
      }
    }

    currentItem = {
      id: `cert-extracted-${Date.now()}-${results.length}`,
      title,
      issuingOrganization: issuer,
      issueYear: titleYear,
      issueDate: titleDate,
      credentialId: null,
      verificationUrl,
      sourceEvidence: `Certifications\n${line}`,
      confidence: 0.95,
      linesUnder: 0,
    };

    results.push(currentItem);
  }

  return results;
}

/**
 * Invokes Gemini via @google/genai with cascading fallback on transient rate limits.
 */
async function generateCertificationsWithAi(ai, pdfText, pdfUrls) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError = null;

  const urlList = (pdfUrls || []).filter((u) => !u.toLowerCase().includes('linkedin.com/in/')).slice(0, 15);

  const prompt = `You are a strict data extraction specialist analyzing text extracted from a LinkedIn Profile Export PDF.

INPUT DOCUMENT TEXT:
"""
${pdfText}
"""

EXTRACTED URLS FROM PDF ANNOTATIONS:
${urlList.length > 0 ? JSON.stringify(urlList, null, 2) : 'None found in PDF'}

YOUR TASK:
Extract ONLY certification, license, job simulation, virtual internship, and credential program records that appear under the "Certifications" (or "Licenses & Certifications" / "Certificates") section of this LinkedIn profile export.

ABSOLUTE NEGATIVE CONSTRAINTS (CRITICAL):
1. NEVER invent certification names, organizations, years, credential IDs, verification URLs, or dates.
2. NEVER convert Skills, Projects, Work experience, Education, Job titles, Recommendations, or Interests into certifications.
   - For example: "Top Skills: Problem Solving, Artificial Intelligence (AI), Amazon Web Services (AWS)" are SKILLS, NOT certifications. They MUST NOT be extracted.
3. If no verification URL is present in the document text or PDF annotations for a certification: verificationUrl MUST BE null. NEVER manufacture a URL. NEVER use the candidate's LinkedIn profile URL as a certification verification URL. NEVER guess a generic issuer homepage.
4. If no issue year or date exists for a certification: issueYear MUST BE null and issueDate MUST BE null. NEVER infer the year from PDF creation date, LinkedIn export date, current year, education year, or project year.
5. If the uploaded document is NOT a LinkedIn profile export or resume at all, set "isLinkedInProfile": false and "certifications": [].
6. If the document IS a LinkedIn profile export, but has NO certifications section or zero certifications listed in that section, set "isLinkedInProfile": true, "hasCertifications": false, and "certifications": [].

OUTPUT FORMAT (JSON ONLY):
{
  "isLinkedInProfile": boolean,
  "hasCertifications": boolean,
  "rejectionReason": string | null, // null if valid, or reason if not a LinkedIn export
  "certifications": [
    {
      "title": string, // Exact title from Certifications section
      "issuingOrganization": string | null, // Exact issuing body (e.g. AWS Academy, Infosys Springboard, Tata, DecodeLabs, Forage, Coursera) or null
      "issueYear": string | null, // Exact 4-digit year (e.g. "2025") if present, otherwise null
      "issueDate": string | null, // Exact date string (e.g. "June 2025" or "2025") if present, otherwise null
      "credentialId": string | null, // Exact credential ID if present, otherwise null
      "verificationUrl": string | null, // Actual verification URL from document or null
      "sourceEvidence": string, // Verbatim snippet (1-2 lines) from document
      "confidence": number // Confidence between 0.0 and 1.0
    }
  ]
}`;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        });
        if (response && response.text) {
          const parsed = extractJson(response.text);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      } catch (err) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  throw lastError || new Error('All AI models failed to return structured certification data.');
}

/**
 * Main handler for POST /api/ai/extract-certifications
 */
export async function handleExtractCertificationsRequest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', error: 'Method Not Allowed' }));
    return;
  }

  const { pdfText, fileName, pdfUrls } = req.body || {};

  if (!pdfText || typeof pdfText !== 'string' || pdfText.trim().length < 25) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'No certification records could be reliably extracted from this PDF.',
      supportingText: 'The uploaded PDF is empty or does not contain readable text.',
    }));
    return;
  }

  // Guard: Validate authentic LinkedIn profile structure
  const isProfile = isLikelyLinkedInProfile(pdfText);
  if (!isProfile) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      error: 'No certification records could be reliably extracted from this PDF.',
      supportingText: 'The uploaded file does not appear to be an authentic LinkedIn profile PDF. Please export your profile directly using LinkedIn -> More -> Save to PDF.',
    }));
    return;
  }

  // Attempt AI extraction with deterministic regex fallback
  let extractedResult = null;
  let usedAi = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const aiResponse = await generateCertificationsWithAi(ai, pdfText, pdfUrls || []);
      if (aiResponse) {
        extractedResult = aiResponse;
        usedAi = true;
      }
    } catch (aiErr) {
      console.warn('[ExtractCertifications] Gemini API failed, activating deterministic parser fallback:', aiErr?.message);
    }
  }

  // Deterministic local parsing fallback / validation
  if (!extractedResult || !extractedResult.certifications) {
    const localCerts = extractCertificationsFromText(pdfText, pdfUrls || []);
    extractedResult = {
      isLinkedInProfile: true,
      hasCertifications: localCerts.length > 0,
      certifications: localCerts,
    };
  }

  // Check if LinkedIn profile but simply zero certifications
  if (!extractedResult.hasCertifications || extractedResult.certifications.length === 0) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'success',
      data: {
        isLinkedInProfile: true,
        hasCertifications: false,
        certifications: [],
        message: 'No certifications were found in this LinkedIn PDF.',
        supportingText: 'The profile text was read successfully, but no certifications or license records are listed in the Certifications section of this PDF.',
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Map each certification into structured record with unique ID
  const structuredCertifications = extractedResult.certifications.map((c, index) => ({
    id: `cert-extracted-${Date.now()}-${index}`,
    title: String(c.title || '').trim(),
    issuingOrganization: c.issuingOrganization ? String(c.issuingOrganization).trim() : null,
    issueYear: c.issueYear ? String(c.issueYear).trim() : null,
    issueDate: c.issueDate ? String(c.issueDate).trim() : (c.issueYear ? String(c.issueYear).trim() : null),
    credentialId: c.credentialId ? String(c.credentialId).trim() : null,
    verificationUrl: c.verificationUrl && /^https?:\/\//i.test(c.verificationUrl) ? String(c.verificationUrl).trim() : null,
    sourceEvidence: c.sourceEvidence ? String(c.sourceEvidence).trim() : `Certifications: ${c.title}`,
    confidence: typeof c.confidence === 'number' ? c.confidence : 0.95,
  })).filter((c) => c.title.length > 0);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    data: {
      isLinkedInProfile: true,
      hasCertifications: structuredCertifications.length > 0,
      certifications: structuredCertifications,
      sourceMethod: usedAi ? 'gemini_cascade' : 'deterministic_parser',
      fileName: fileName || 'LinkedIn Profile.pdf',
    },
    timestamp: new Date().toISOString(),
  }));
}

export default async function handler(req, res) {
  return handleExtractCertificationsRequest(req, res);
}
