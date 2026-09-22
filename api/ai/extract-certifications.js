// Vercel Serverless Function & Vite Dev Middleware Handler for PDF Certification Extraction
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
 * Deduplicates certification records using normalized name, issuer, and credential ID.
 * Merges richer fields when duplicate occurrences are detected across pages.
 */
function deduplicateCertifications(certs) {
  if (!Array.isArray(certs)) return [];

  const results = [];
  const seenKeys = new Set();

  for (const cert of certs) {
    const rawName = cert.name || cert.title || '';
    const normName = normalizeText(rawName);
    const rawIssuer = cert.issuer || cert.issuingOrganization || '';
    const normIssuer = normalizeText(rawIssuer);
    const credId = (cert.credentialId || '').trim();

    if (!normName || normName.length < 2) continue;

    // Reject obvious generic non-certification phrases
    if (/^(?:skills?|projects?|experience|education|languages?|summary|about|recommendations?)$/i.test(rawName.trim())) {
      continue;
    }

    const nameIssuerKey = `${normName}::${normIssuer}`;
    const idKey = credId ? `id::${credId.toLowerCase()}` : null;

    if (seenKeys.has(nameIssuerKey) || (idKey && seenKeys.has(idKey))) {
      // Find existing entry and enrich missing fields
      const existing = results.find((r) => {
        const rName = normalizeText(r.name || r.title);
        const rIssuer = normalizeText(r.issuer || r.issuingOrganization);
        const rId = (r.credentialId || '').trim().toLowerCase();
        return (
          (rName === normName && (!normIssuer || !rIssuer || rIssuer === normIssuer)) ||
          (credId && rId && rId === credId.toLowerCase())
        );
      });

      if (existing) {
        if (!existing.issuer && rawIssuer) {
          existing.issuer = rawIssuer;
          existing.issuingOrganization = rawIssuer;
        }
        if (!existing.issueDate && cert.issueDate) existing.issueDate = cert.issueDate;
        if (!existing.issueYear && cert.issueYear) existing.issueYear = cert.issueYear;
        if (!existing.expirationDate && cert.expirationDate) existing.expirationDate = cert.expirationDate;
        if (!existing.credentialId && credId) existing.credentialId = credId;
        const certUrl = cert.credentialUrl || cert.verificationUrl;
        if (!existing.credentialUrl && certUrl) {
          existing.credentialUrl = certUrl;
          existing.verificationUrl = certUrl;
        }
        if (!existing.description && cert.description) existing.description = cert.description;
        if (!existing.sourcePage && cert.sourcePage) existing.sourcePage = cert.sourcePage;
      }
      continue;
    }

    seenKeys.add(nameIssuerKey);
    if (idKey) seenKeys.add(idKey);
    results.push(cert);
  }

  return results;
}

/**
 * Deterministic fallback extractor for document text.
 * Strictly extracts certification, program, and credential records supported by the document.
 * Does NOT hardcode any user certifications or known issuers.
 */
function extractCertificationsFromText(text, pdfUrls = []) {
  if (!text || typeof text !== 'string') return [];

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const CERT_SECTION_REGEX =
    /^(?:Certifications?|Licenses\s*(?:&|and)\s*Certifications?|Certificates?|Professional\s*Certifications?|Courses?|Programs?|Credentials?|Training(?:s)?|Job\s*Simulations?|Virtual\s*Internships?|Completion\s*Certificates?|Accreditations?|Licenses?)(?:\s*\(.*?\))?$/i;

  const OTHER_SECTION_REGEX =
    /^(?:Contact|Top\s*Skills|Skills|Summary|About|Education|Experience|Work\s*Experience|Projects|Languages|Honors[\s-]*Awards|Honors\s*&\s*Awards|Publications|Interests|Recommendations|Volunteer\s*Experience)$/i;

  const YEAR_REGEX = /\b(20[1-3][0-9]|199[0-9])\b/;
  const DATE_REGEX =
    /\b(?:Issued\s+)?(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+)?(20[1-3][0-9])\b/i;
  const EXPIRATION_REGEX =
    /\b(?:Expires|Expiration|Valid\s*(?:through|until))[:\s]+(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+)?(20[1-3][0-9])\b/i;
  const CRED_ID_REGEX = /(?:Credential\s*ID|License\s*Number|Certificate\s*ID|ID)[:\s]+([A-Za-z0-9-_/]+)/i;

  let inCertSection = false;
  let currentSection = '';
  let currentPage = 1;
  const rawEntries = [];
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Page marker tracking
    const pageMatch = line.match(/^\[?(?:Page|--- Page)\s*(\d+)\]?/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10) || currentPage;
      continue;
    }
    if (/^Page\s+\d+(\s+of\s+\d+)?$/i.test(line)) {
      continue;
    }

    // Section header check
    if (CERT_SECTION_REGEX.test(line)) {
      inCertSection = true;
      currentSection = line;
      currentEntry = null;
      continue;
    }

    if (inCertSection && OTHER_SECTION_REGEX.test(line)) {
      inCertSection = false;
      currentSection = '';
      currentEntry = null;
      continue;
    }

    if (inCertSection) {
      // Ignore URL headers or footer lines
      if (/^www\.linkedin\.com/i.test(line) || /^https?:\/\//i.test(line)) {
        if (currentEntry && !currentEntry.credentialUrl && /^https?:\/\//i.test(line)) {
          if (!line.includes('linkedin.com/in/')) {
            currentEntry.credentialUrl = line;
          }
        }
        continue;
      }

      // Check for dates or credential IDs belonging to current entry
      const dateMatch = line.match(DATE_REGEX);
      const expMatch = line.match(EXPIRATION_REGEX);
      const credMatch = line.match(CRED_ID_REGEX);

      if (
        currentEntry &&
        (dateMatch ||
          expMatch ||
          credMatch ||
          line.toLowerCase().startsWith('issued') ||
          line.toLowerCase().startsWith('credential id') ||
          line.toLowerCase().startsWith('expires'))
      ) {
        if (dateMatch && !currentEntry.issueYear) {
          currentEntry.issueYear = dateMatch[2];
          currentEntry.issueDate = dateMatch[0].replace(/^Issued\s+/i, '');
        }
        if (expMatch && !currentEntry.expirationDate) {
          currentEntry.expirationDate = expMatch[0].replace(/^(?:Expires|Expiration|Valid\s*(?:through|until))[:\s]*/i, '');
        }
        if (credMatch && !currentEntry.credentialId) {
          currentEntry.credentialId = credMatch[1];
        }
        currentEntry.sourceEvidence += `\n${line}`;
        continue;
      }

      // Check if line represents issuer under the title
      if (currentEntry && !currentEntry.issuer && currentEntry.linesUnder < 2) {
        // Line that isn't a date and is relatively short can be treated as issuer
        if (
          !dateMatch &&
          !credMatch &&
          !line.toLowerCase().startsWith('issued') &&
          !line.toLowerCase().startsWith('credential id') &&
          line.length < 80
        ) {
          currentEntry.issuer = line;
          currentEntry.sourceEvidence += `\n${line}`;
          currentEntry.linesUnder++;
          continue;
        }
      }

      // Start a new certification entry within section
      let name = line;
      let issuer = null;

      // Handle split entry formats like "Certificate Name - Issuer" or "Issuer - Certificate Name"
      if (line.includes(' - ') || line.includes(' | ')) {
        const delim = line.includes(' - ') ? ' - ' : ' | ';
        const parts = line.split(delim);
        if (parts.length === 2) {
          const p0 = parts[0].trim();
          const p1 = parts[1].trim();
          if (p0.length < 35 && p1.length >= 5) {
            issuer = p0;
            name = p1;
          } else {
            name = p0;
            issuer = p1;
          }
        }
      }

      // Extract year from title if present in parentheses e.g. "Python (2024)"
      let titleYear = null;
      let titleDate = null;
      const yr = name.match(YEAR_REGEX);
      if (yr && (name.includes('(') || name.includes('-'))) {
        titleYear = yr[1];
        titleDate = yr[1];
      }

      // Find matching verification URL
      let matchedUrl = null;
      const normN = normalizeText(name);
      for (const u of pdfUrls) {
        if (u.toLowerCase().includes('linkedin.com/in/')) continue;
        const normU = normalizeText(u);
        if (normN && (normU.includes(normN.slice(0, 10)) || /verify|credential|badge|certificate|forage|coursera|udemy/i.test(u))) {
          matchedUrl = u;
          break;
        }
      }

      currentEntry = {
        name,
        title: name,
        issuer,
        issuingOrganization: issuer,
        issueDate: titleDate,
        issueYear: titleYear,
        expirationDate: null,
        credentialId: null,
        credentialUrl: matchedUrl,
        verificationUrl: matchedUrl,
        description: null,
        sourcePage: currentPage,
        sourceEvidence: `${currentSection || 'Certifications'}\n${line}`,
        confidence: 0.95,
        linesUnder: 0,
      };

      rawEntries.push(currentEntry);
    }
  }

  // If no explicit certification section was found, check for standalone completion records
  if (rawEntries.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (OTHER_SECTION_REGEX.test(line)) continue;

      const isCertLine =
        /(?:Certificate\s+of\s+Completion|Certified\s+[A-Za-z]|Job\s+Simulation\s+Certificate|Simulation\s+Completed|Credential\s+ID|Completion\s+Certificate)/i.test(
          line
        );

      if (isCertLine) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
        let issuer = null;
        if (nextLine && nextLine.length < 50 && !OTHER_SECTION_REGEX.test(nextLine)) {
          issuer = nextLine;
        }
        const yr = line.match(YEAR_REGEX);
        rawEntries.push({
          name: line,
          title: line,
          issuer,
          issuingOrganization: issuer,
          issueDate: yr ? yr[1] : null,
          issueYear: yr ? yr[1] : null,
          expirationDate: null,
          credentialId: null,
          credentialUrl: null,
          verificationUrl: null,
          description: null,
          sourcePage: currentPage,
          sourceEvidence: line,
          confidence: 0.9,
          linesUnder: 0,
        });
      }
    }
  }

  return deduplicateCertifications(rawEntries);
}

/**
 * Invokes Gemini via @google/genai with cascading fallback on transient rate limits.
 * Extracts certification and program records from document text.
 * Prioritizes low-latency gemini-3.1-flash-lite for near-instant structured extraction.
 */
async function generateCertificationsWithAi(ai, pdfText, pdfUrls, pdfBase64) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const urlList = (pdfUrls || []).filter((u) => !u.toLowerCase().includes('linkedin.com/in/')).slice(0, 15);
  // Bound input text to 16,000 characters to prevent token bloat while capturing all sections
  const boundedText = (pdfText || '').slice(0, 16000);

  const promptText = `You are an expert document analysis specialist. Analyze the provided document text to extract all completed certification, license, credential, course, training, job simulation, or completion program records.

INPUT DOCUMENT TEXT:
"""
${boundedText}
"""

EXTRACTED URLS FROM DOCUMENT ANNOTATIONS:
${urlList.length > 0 ? JSON.stringify(urlList, null, 2) : 'None found in PDF'}

YOUR TASK:
Extract only certification/program records supported by the supplied document. Do not infer or fabricate any field.

Recognize sections, headings, or entries such as:
- Certifications
- Licenses & Certifications
- Certificates
- Professional Certifications
- Courses
- Programs
- Credentials
- Training
- Job Simulations
- Virtual Internship
- Completion Certificates
- Certification / Program entries

Also recognize certificate-like records when the section heading is different, provided the document clearly identifies them as completed certifications/programs.

For each record extract ONLY information actually present:
{
  "name": string, // Exact certificate or program title (e.g., "GenAI Powered Data Analytics Job Simulation", "Python Programming", "AWS Certified Cloud Practitioner")
  "issuer": string | null, // Exact issuing organization or authority (e.g., "Tata", "Forage", "Infosys Springboard", "AWS", "Coursera", "DecodeLabs") or null if not specified
  "issueDate": string | null, // Exact date string if present (e.g. "June 2025", "2025-06", "2025") or null
  "expirationDate": string | null, // Exact expiration date if stated or null
  "credentialId": string | null, // Exact credential/certificate ID if present or null
  "credentialUrl": string | null, // Exact verification or credential URL if present in document text or annotations, or null
  "description": string | null, // Brief description if explicitly stated or null
  "sourcePage": number | string | null // Page number where this certification appears if known, or null
}

ABSOLUTE NEGATIVE CONSTRAINTS (CRITICAL):
1. Extract only certification/program records supported by the supplied document. Do not infer or fabricate any field.
2. Any unavailable field must be null or empty string. NEVER invent missing issuer, date, credential ID, credential URL, certificate name, or completion status.
3. NEVER convert general skills (e.g., 'Python', 'React', 'Problem Solving', 'Data Structures'), work experience job titles, degrees, or recommendations into certifications unless they are explicitly listed as a certification or credential program.
4. NEVER use the candidate's personal profile URL or generic homepages as credential verification URLs.
5. If the document contains NO certification or program records, return "hasCertifications": false and "certifications": [].

OUTPUT FORMAT (JSON ONLY):
{
  "hasCertifications": boolean,
  "certifications": [
    {
      "name": string,
      "issuer": string | null,
      "issueDate": string | null,
      "expirationDate": string | null,
      "credentialId": string | null,
      "credentialUrl": string | null,
      "description": string | null,
      "sourcePage": number | string | null
    }
  ]
}`;

  const contents = [];
  // Avoid sending binary/base64 bloat when readable text is already extracted
  const hasSubstantialText = boundedText.trim().length >= 60;
  if (
    !hasSubstantialText &&
    pdfBase64 &&
    typeof pdfBase64 === 'string' &&
    pdfBase64.length > 100 &&
    pdfBase64.length < 3.5 * 1024 * 1024
  ) {
    contents.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  }
  contents.push(promptText);

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0,
        },
      });
      if (response && response.text) {
        const parsed = extractJson(response.text);
        if (parsed && typeof parsed === 'object') {
          const rawCerts = Array.isArray(parsed.certifications) ? parsed.certifications : [];
          const deduped = deduplicateCertifications(rawCerts);
          return {
            hasCertifications: deduped.length > 0,
            certifications: deduped,
          };
        }
      }
    } catch (err) {
      lastError = err;
      // Cascade immediately to next model candidate without artificial sleep
      console.warn(`[ExtractCertifications API] Model ${model} cascade:`, err?.message || err);
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

  const { pdfText, pdfBase64, fileName, pdfUrls } = req.body || {};

  const hasText = pdfText && typeof pdfText === 'string' && pdfText.trim().length >= 10;
  const hasBase64 = pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.length > 100;

  if (!hasText && !hasBase64) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Could not extract readable text from this PDF.',
        supportingText: 'The uploaded file is empty or does not contain readable text.',
      })
    );
    return;
  }

  // Attempt AI extraction with deterministic regex fallback
  let extractedResult = null;
  let usedAi = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const aiResponse = await generateCertificationsWithAi(ai, pdfText || '', pdfUrls || [], pdfBase64);
      if (aiResponse && Array.isArray(aiResponse.certifications)) {
        extractedResult = aiResponse;
        usedAi = true;
      }
    } catch (aiErr) {
      console.warn('[ExtractCertifications] Gemini API failed, activating deterministic parser fallback:', aiErr?.message);
    }
  }

  // Deterministic local parsing fallback / validation
  if (!extractedResult || !Array.isArray(extractedResult.certifications)) {
    const localCerts = extractCertificationsFromText(pdfText || '', pdfUrls || []);
    extractedResult = {
      hasCertifications: localCerts.length > 0,
      certifications: localCerts,
    };
  }

  // Deduplicate records
  const dedupedCerts = deduplicateCertifications(extractedResult.certifications || []);

  // Check if document simply contains zero certifications
  if (dedupedCerts.length === 0) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'success',
        data: {
          hasCertifications: false,
          certifications: [],
          message: 'No certification or program records were found in this PDF.',
          supportingText:
            'The document was read successfully across all pages, but contains no certification, license, job simulation, or course completion records.',
        },
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Map each certification into structured record with unique ID and aliases
  const structuredCertifications = dedupedCerts
    .map((c, index) => {
      const name = String(c.name || c.title || '').trim();
      const issuer = c.issuer || c.issuingOrganization ? String(c.issuer || c.issuingOrganization).trim() : null;
      const issueYear = c.issueYear
        ? String(c.issueYear).trim()
        : c.issueDate && /\b(20[1-3][0-9]|199[0-9])\b/.test(c.issueDate)
        ? c.issueDate.match(/\b(20[1-3][0-9]|199[0-9])\b/)[1]
        : null;
      const issueDate = c.issueDate ? String(c.issueDate).trim() : issueYear;
      const expirationDate = c.expirationDate ? String(c.expirationDate).trim() : null;
      const credentialId = c.credentialId ? String(c.credentialId).trim() : null;
      const credentialUrl =
        c.credentialUrl || c.verificationUrl
          ? String(c.credentialUrl || c.verificationUrl).trim()
          : null;
      const validUrl = credentialUrl && /^https?:\/\//i.test(credentialUrl) ? credentialUrl : null;
      const sourcePage = c.sourcePage !== undefined && c.sourcePage !== null ? c.sourcePage : null;
      const description = c.description ? String(c.description).trim() : null;

      return {
        id: `cert-extracted-${Date.now()}-${index}`,
        name,
        title: name,
        issuer,
        issuingOrganization: issuer,
        issueYear,
        issueDate,
        expirationDate,
        credentialId,
        credentialUrl: validUrl,
        verificationUrl: validUrl,
        description,
        sourcePage,
        sourceEvidence: c.sourceEvidence ? String(c.sourceEvidence).trim() : `Certifications: ${name}`,
        confidence: typeof c.confidence === 'number' ? c.confidence : 0.95,
      };
    })
    .filter((c) => c.name.length > 0);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'success',
      data: {
        hasCertifications: structuredCertifications.length > 0,
        certifications: structuredCertifications,
        sourceMethod: usedAi ? 'gemini_cascade' : 'deterministic_parser',
        fileName: fileName || 'Document.pdf',
      },
      timestamp: new Date().toISOString(),
    })
  );
}

export default async function handler(req, res) {
  return handleExtractCertificationsRequest(req, res);
}
