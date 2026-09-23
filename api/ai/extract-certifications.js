// Vercel Serverless Function & Vite Dev Middleware Handler for PDF Certification Extraction

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

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const arr = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      if (Array.isArray(arr)) {
        return { certificates: arr };
      }
    } catch {}
  }

  return null;
}

/**
 * Deduplicates certification records using normalized title/name.
 * Preserves every distinct certification and does NOT drop records missing issuer/date/url.
 */
function deduplicateCertifications(certs) {
  if (!Array.isArray(certs)) return [];

  const results = [];
  const seenNames = new Set();

  for (const cert of certs) {
    const rawName = cert.name || cert.title || '';
    const normName = normalizeText(rawName);
    const rawIssuer = cert.issuer || cert.issuingOrganization || '';
    const credId = (cert.credentialId || '').trim();

    if (!normName || normName.length < 2) continue;

    // Reject obvious section headings erroneously captured as certificate names
    if (/^(?:certifications?|licenses|licenses\s*(?:&|and)\s*certifications?|skills?|top\s*skills|projects?|experience|education|languages?|summary|about|recommendations?)$/i.test(rawName.trim())) {
      continue;
    }

    if (seenNames.has(normName)) {
      // Find existing entry and enrich missing metadata if available
      const existing = results.find((r) => normalizeText(r.name || r.title) === normName);
      if (existing) {
        if (!existing.issuer && rawIssuer) {
          existing.issuer = rawIssuer;
          existing.issuingOrganization = rawIssuer;
        }
        if (!existing.date && cert.date) existing.date = cert.date;
        if (!existing.issueDate && (cert.issueDate || cert.date)) existing.issueDate = cert.issueDate || cert.date;
        if (!existing.credentialId && credId) existing.credentialId = credId;
        const certUrl = cert.credentialUrl || cert.verificationUrl;
        if (!existing.credentialUrl && certUrl) {
          existing.credentialUrl = certUrl;
          existing.verificationUrl = certUrl;
        }
      }
      continue;
    }

    seenNames.add(normName);
    results.push(cert);
  }

  return results;
}

/**
 * Finds the "Certifications" section in LinkedIn profile text and extracts
 * all candidate records located under that section.
 * Preserves section placement as the primary classification signal.
 */
function extractCandidateCertificationsFromSection(text, pdfUrls = []) {
  if (!text || typeof text !== 'string') {
    return { sectionFound: false, candidateRecords: [] };
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const CERT_SECTION_START =
    /^(?:[•·\-–—\s]*)(?:certifications?|licenses\s*(?:&|and)\s*certifications?|certificates?)\s*:?\s*$/i;

  const OTHER_SECTION_START =
    /^(?:[•·\-–—\s]*)(?:summary|about|education|experience|work\s*experience|top\s*skills|skills|projects|languages|honors[\s-]*awards|honors\s*&\s*awards|volunteer\s*experience|publications|organizations|recommendations|interests|contact)\s*:?\s*$/i;

  const METADATA_LINE =
    /^(?:issued|expires|expiration|valid\s*(?:through|until)|credential\s*id|license\s*number|certificate\s*id|see\s*credential|show\s*credential)\b/i;

  const isCandidateHeaderCue = (s) =>
    /(?:,\s*[A-Z][a-z]+|\bIndia\b|\bUnited States\b|\bUSA\b)/i.test(s) &&
    !/(?:graduate|foundations|internship|simulation|basics|programming|course|certification|academy|analytics)/i.test(s);

  let inCertSection = false;
  let sectionFound = false;
  let startIndex = -1;
  let endIndex = -1;
  const rawCandidates = [];
  let currentRecord = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Page markers (e.g. "Page 1 of 2", "--- Page 1 ---")
    if (/^\[?(?:Page|--- Page)\s*\d+/i.test(line) || /^\d+\s+of\s+\d+$/i.test(line)) {
      continue;
    }

    // Section start
    if (!sectionFound && CERT_SECTION_START.test(line)) {
      inCertSection = true;
      sectionFound = true;
      startIndex = i;
      currentRecord = null;
      continue;
    }

    // Section exit upon reaching next major section or candidate profile header
    if (inCertSection && (OTHER_SECTION_START.test(line) || isCandidateHeaderCue(line))) {
      inCertSection = false;
      endIndex = i;
      currentRecord = null;
      break;
    }

    if (inCertSection) {
      // Ignore header/footer links and personal profile URL
      if (/^www\.linkedin\.com/i.test(line) || /^https?:\/\//i.test(line)) {
        if (currentRecord && !currentRecord.credentialUrl && !line.includes('linkedin.com/in/')) {
          currentRecord.credentialUrl = line;
        }
        continue;
      }

      // Check if this line is metadata for the current candidate record (Date, Credential ID)
      if (currentRecord && METADATA_LINE.test(line)) {
        if (/^Issued\s+/i.test(line)) {
          currentRecord.date = line.replace(/^Issued\s+/i, '').trim();
        } else if (/^Credential\s*ID[:\s]*/i.test(line)) {
          currentRecord.credentialId = line.replace(/^Credential\s*ID[:\s]*/i, '').trim();
        }
        continue;
      }

      // Candidate record line under Certifications section
      let name = line;
      let issuer = null;

      // Extract issuer if line has clear delimiter (e.g. "Tata - GenAI...", "AWS Academy Graduate - ...")
      if (line.includes(' - ') || line.includes(' – ') || line.includes(' — ') || line.includes(' | ')) {
        const delim = line.includes(' – ') ? ' – ' : line.includes(' — ') ? ' — ' : line.includes(' - ') ? ' - ' : ' | ';
        const parts = line.split(delim);
        if (parts.length === 2) {
          const p0 = parts[0].trim();
          const p1 = parts[1].trim();
          if (p0.length <= 25 && p1.length >= 4) {
            issuer = p0;
          } else if (p1.length <= 25 && p0.length >= 4) {
            issuer = p1;
          }
        }
      }

      // Check common authority in name if issuer not yet separated
      if (!issuer) {
        if (/AWS Academy/i.test(line)) issuer = 'AWS Academy';
        else if (/Tata/i.test(line)) issuer = 'Tata';
        else if (/DecodeLabs/i.test(line)) issuer = 'DecodeLabs';
      }

      // Find matching URL from PDF annotations if any
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

      currentRecord = {
        name,
        title: name,
        issuer,
        issuingOrganization: issuer,
        date: null,
        issueDate: null,
        credentialId: null,
        credentialUrl: matchedUrl,
        verificationUrl: matchedUrl,
        sourceEvidence: `Certifications: ${name}`,
        confidence: 0.95,
      };

      rawCandidates.push(currentRecord);
    }
  }

  if (sectionFound && endIndex === -1) {
    endIndex = lines.length;
  }

  // Deduplicate candidate records
  const dedupedCandidates = deduplicateCertifications(rawCandidates);
  return {
    sectionFound,
    startIndex,
    endIndex,
    candidateRecords: dedupedCandidates,
  };
}

/**
 * Invokes Gemini via @google/genai with cascading fallback on transient rate limits.
 * Uses structured schema-constrained JSON output conforming to:
 * {
 *   "certificates": [
 *     { "name": string, "issuer": string|null, "date": string|null, "credentialId": string|null, "credentialUrl": string|null }
 *   ]
 * }
 */
async function generateCertificationsWithAi(ai, pdfText, pdfUrls, pdfBase64) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const urlList = (pdfUrls || []).filter((u) => !u.toLowerCase().includes('linkedin.com/in/')).slice(0, 15);
  const boundedText = (pdfText || '').slice(0, 24000);

  const extractionInstructions = `You are extracting certification/completion records from a LinkedIn profile PDF.

Extract records that are explicitly listed under the document's Certifications section.

Do not reject a record merely because it is called a:
job simulation,
virtual internship program,
course,
training,
program,
graduate certificate,
or foundation program.

Section placement is the primary classification signal.

Extract only records actually present in the document.

Never invent records.

For each record return:
name: The full certificate or program title as written
issuer: The issuing organization, company, or platform if indicated, or null
date: The issue date or year if stated, or null
credentialId: The credential or license ID if present, or null
credentialUrl: The verification URL if present in document text or annotations, or null

If a field is not present, return null.

Return an empty array ONLY when the document genuinely contains no certification/completion records.`;

  const promptText = `${extractionInstructions}

DOCUMENT TEXT:
"""
${boundedText}
"""

EXTRACTED URLS FROM PDF ANNOTATIONS:
${urlList.length > 0 ? JSON.stringify(urlList, null, 2) : 'None found in PDF'}`;

  const contents = [];
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

  // Schema definition for schema-constrained output
  const responseSchema = {
    type: 'OBJECT',
    properties: {
      certificates: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            issuer: { type: 'STRING', nullable: true },
            date: { type: 'STRING', nullable: true },
            credentialId: { type: 'STRING', nullable: true },
            credentialUrl: { type: 'STRING', nullable: true },
          },
          required: ['name'],
        },
      },
    },
    required: ['certificates'],
  };

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.0,
        },
      });

      if (response && response.text) {
        const parsed = extractJson(response.text);
        if (parsed && typeof parsed === 'object') {
          const rawCerts = Array.isArray(parsed.certificates)
            ? parsed.certificates
            : Array.isArray(parsed.certifications)
            ? parsed.certifications
            : Array.isArray(parsed)
            ? parsed
            : [];

          const deduped = deduplicateCertifications(rawCerts);
          return {
            hasCertifications: deduped.length > 0,
            certificates: deduped,
            certifications: deduped,
          };
        }
      }
    } catch (err) {
      lastError = err;
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

  // 1. Direct section extraction from the Certifications section of the document
  const { sectionFound, startIndex, endIndex, candidateRecords } = extractCandidateCertificationsFromSection(
    pdfText || '',
    pdfUrls || []
  );

  const activeList = candidateRecords;

  // Safe Diagnostic Logging
  console.log(
    `[Certificate Extractor]\nPDF loaded: ${Boolean(pdfText)}\nCertification heading found: ${sectionFound}\nCertification section start: ${startIndex}\nCertification section end: ${endIndex}\nExtracted records: ${candidateRecords.length}`
  );

  // Deduplicate and filter empty
  const dedupedCerts = deduplicateCertifications(activeList);

  // Normalize into standard structure
  const structuredCertifications = dedupedCerts
    .map((c, index) => {
      const name = String(c.name || c.title || '').trim();
      const rawIssuer = c.issuer || c.issuingOrganization;
      const issuer = rawIssuer ? String(rawIssuer).trim() : null;

      const dateStr = c.date || c.issueDate || '';
      const yearMatch = dateStr ? String(dateStr).match(/\b(20[1-3][0-9]|199[0-9])\b/) : null;
      const issueYear = c.issueYear
        ? String(c.issueYear).trim()
        : yearMatch
        ? yearMatch[1]
        : null;
      const issueDate = dateStr ? String(dateStr).trim() : issueYear;
      const credentialId = c.credentialId ? String(c.credentialId).trim() : null;
      const rawUrl = c.credentialUrl || c.verificationUrl;
      const credentialUrl = rawUrl && /^https?:\/\//i.test(String(rawUrl).trim()) ? String(rawUrl).trim() : null;

      return {
        id: `cert-extracted-${Date.now()}-${index}`,
        name,
        title: name,
        issuer,
        issuingOrganization: issuer,
        date: issueDate,
        issueDate,
        issueYear,
        credentialId,
        credentialUrl,
        verificationUrl: credentialUrl,
        sourceEvidence: c.sourceEvidence ? String(c.sourceEvidence).trim() : `Certifications: ${name}`,
        confidence: typeof c.confidence === 'number' ? c.confidence : 0.95,
      };
    })
    .filter((c) => c.name.length > 0);

  // Approximate page count from text or page markers
  const pageMatches = (pdfText || '').match(/^\[?(?:Page|--- Page)\s*(\d+)\]?/gim) || [];
  const pageCount = Math.max(1, pageMatches.length);

  // If document genuinely contains 0 certification records
  if (structuredCertifications.length === 0) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'success',
        data: {
          hasCertifications: false,
          certificates: [],
          certifications: [],
          message: 'No certification or program records were found in this PDF.',
          supportingText:
            'The document was read successfully across all pages, but contains no certification, license, job simulation, or course completion records.',
          diagnostic: {
            pdfValidated: true,
            pageCount,
            certSectionFound: sectionFound,
            candidateRecordCount: candidateRecords.length,
            aiRecordCount,
            normalizedRecordCount: 0,
          },
        },
        timestamp: new Date().toISOString(),
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
        hasCertifications: true,
        certificates: structuredCertifications,
        certifications: structuredCertifications,
        sourceMethod: usedAi ? 'gemini_schema_cascade' : 'section_extractor',
        fileName: fileName || 'Document.pdf',
        diagnostic: {
          pdfValidated: true,
          pageCount,
          certSectionFound: sectionFound,
          candidateRecordCount: candidateRecords.length,
          aiRecordCount,
          normalizedRecordCount: structuredCertifications.length,
        },
      },
      timestamp: new Date().toISOString(),
    })
  );
}

export default async function handler(req, res) {
  return handleExtractCertificationsRequest(req, res);
}

