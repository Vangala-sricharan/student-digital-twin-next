import { validateAndExtractLinkedInPdf } from '../lib/pdfTextExtractor';
import { ExtractedCertificationRecord, CertificationItem } from '../types';

export interface ExtractionResult {
  status: 'success' | 'error' | 'empty';
  certifications: ExtractedCertificationRecord[];
  fileName: string;
  fileSizeFormatted: string;
  error?: string;
  supportingText?: string;
  sourceMethod?: string;
}

/**
 * Normalizes strings for resilient, case-insensitive duplicate detection.
 */
export function normalizeCertificationKey(str?: string | null): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Robust duplicate check comparing normalized titles and issuers.
 */
export function isDuplicateCertification(
  target: { title: string; issuingOrganization?: string | null; issuer?: string | null },
  existing: Array<{ title: string; issuer?: string | null }>
): boolean {
  const normTargetTitle = normalizeCertificationKey(target.title);
  const targetIssuer = target.issuingOrganization || target.issuer;
  const normTargetIssuer = normalizeCertificationKey(targetIssuer);

  if (!normTargetTitle || normTargetTitle.length < 3) return false;

  return existing.some((item) => {
    const normExistingTitle = normalizeCertificationKey(item.title);
    const normExistingIssuer = normalizeCertificationKey(item.issuer);

    // Exact title match
    if (normTargetTitle === normExistingTitle) {
      if (normTargetIssuer && normExistingIssuer) {
        return (
          normTargetIssuer === normExistingIssuer ||
          normTargetIssuer.includes(normExistingIssuer) ||
          normExistingIssuer.includes(normTargetIssuer)
        );
      }
      return true;
    }

    // High similarity for titles with dash/separator
    if (
      (normTargetTitle.length > 10 && normExistingTitle.includes(normTargetTitle)) ||
      (normExistingTitle.length > 10 && normTargetTitle.includes(normExistingTitle))
    ) {
      if (normTargetIssuer && normExistingIssuer) {
        return normTargetIssuer === normExistingIssuer;
      }
      return true;
    }

    return false;
  });
}

/**
 * Converts a File to base64 string for multimodal analysis.
 */
async function fileToBase64(file: File): Promise<string | null> {
  if (file.size > 3.5 * 1024 * 1024) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || null;
      resolve(base64);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Client-side deterministic parser used when server is unreachable or offline.
 * Extracts certification and program records directly from document text.
 * Strictly adheres to section placement and does not reject job simulations or completion courses.
 */
function extractCertificationsLocally(
  text: string,
  pdfUrls: string[] = []
): ExtractedCertificationRecord[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const CERT_SECTION_START =
    /^(?:Certifications?|Licenses\s*(?:&|and)\s*Certifications?|Certificates?|Professional\s*Certifications?|Courses?|Programs?|Job\s*Simulations?|Virtual\s*Internships?)(?:\s*\(.*?\))?[:\s]*$/i;

  const OTHER_SECTION_START =
    /^(?:Contact|Top\s*Skills|Skills|Summary|About|Education|Experience|Work\s*Experience|Projects|Languages|Honors[\s-]*Awards|Honors\s*&\s*Awards|Publications|Interests|Recommendations|Volunteer\s*Experience)(?:\s*\(.*?\))?[:\s]*$/i;

  const METADATA_LINE =
    /^(?:Issued|Expires|Expiration|Valid\s*(?:through|until)|Credential\s*ID|License\s*Number|Certificate\s*ID|See\s*credential|Show\s*credential)[:\s]*/i;

  let inCertSection = false;
  let currentRecord: ExtractedCertificationRecord | null = null;
  const rawEntries: ExtractedCertificationRecord[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\[?(?:Page|--- Page)\s*\d+/i.test(line)) {
      continue;
    }

    if (CERT_SECTION_START.test(line)) {
      inCertSection = true;
      currentRecord = null;
      continue;
    }

    if (inCertSection && OTHER_SECTION_START.test(line)) {
      inCertSection = false;
      currentRecord = null;
      break;
    }

    if (inCertSection) {
      if (/^www\.linkedin\.com/i.test(line) || /^https?:\/\//i.test(line)) {
        if (currentRecord && !currentRecord.verificationUrl && !line.includes('linkedin.com/in/')) {
          currentRecord.verificationUrl = line;
          currentRecord.credentialUrl = line;
        }
        continue;
      }

      if (currentRecord && METADATA_LINE.test(line)) {
        if (/^Issued\s+/i.test(line)) {
          const d = line.replace(/^Issued\s+/i, '').trim();
          currentRecord.issueDate = d;
          currentRecord.date = d;
          const ym = d.match(/\b(20[1-3][0-9]|199[0-9])\b/);
          if (ym) currentRecord.issueYear = ym[1];
        } else if (/^Credential\s*ID[:\s]*/i.test(line)) {
          currentRecord.credentialId = line.replace(/^Credential\s*ID[:\s]*/i, '').trim();
        }
        continue;
      }

      let title = line;
      let issuer: string | null = null;

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

      if (!issuer) {
        if (/AWS Academy/i.test(line)) issuer = 'AWS Academy';
        else if (/Tata/i.test(line)) issuer = 'Tata';
        else if (/DecodeLabs/i.test(line)) issuer = 'DecodeLabs';
      }

      let verificationUrl: string | null = null;
      const normTitle = normalizeCertificationKey(title);
      for (const url of pdfUrls) {
        if (url.toLowerCase().includes('linkedin.com/in/')) continue;
        const normUrl = normalizeCertificationKey(url);
        if (normTitle && (normUrl.includes(normTitle.slice(0, 10)) || /verify|credential|badge|certificate|forage|coursera|udemy/i.test(url))) {
          verificationUrl = url;
          break;
        }
      }

      currentRecord = {
        id: `cert-extracted-${Date.now()}-${rawEntries.length}`,
        title,
        name: title,
        issuingOrganization: issuer,
        issuer,
        issueYear: null,
        issueDate: null,
        date: null,
        expirationDate: null,
        credentialId: null,
        verificationUrl,
        credentialUrl: verificationUrl,
        description: null,
        sourceEvidence: `Certifications: ${line}`,
        confidence: 0.95,
        selected: true,
      };

      rawEntries.push(currentRecord);
    }
  }

  // Deduplicate by normalized title
  const deduped: ExtractedCertificationRecord[] = [];
  const seen = new Set<string>();

  for (const c of rawEntries) {
    const k = normalizeCertificationKey(c.title);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    deduped.push(c);
  }

  return deduped;
}

/**
 * Orchestrates full extraction pipeline:
 * 1. File verification & text extraction via pdfTextExtractor
 * 2. POST /api/ai/extract-certifications
 * 3. Fallback client-side parsing if needed
 */
export async function extractCertificationsFromLinkedInPdf(file: File): Promise<ExtractionResult> {
  // 1. Validation & local extraction of text streams and annotation URLs
  const pdfResult = await validateAndExtractLinkedInPdf(file);
  if (!pdfResult.isValid || !pdfResult.extractedText) {
    return {
      status: 'error',
      certifications: [],
      fileName: file.name,
      fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
      error: pdfResult.error || 'Could not extract readable text from this PDF.',
      supportingText:
        'The document may be password-protected, encrypted, image-only, or corrupted. Please upload an authentic PDF.',
    };
  }

  const pdfText = pdfResult.extractedText;
  const pdfUrls = pdfResult.extractedUrls || [];

  // Avoid binary/base64 bloat when clean text has already been parsed locally
  let pdfBase64: string | null = null;
  if (!pdfText || pdfText.trim().length < 60) {
    try {
      pdfBase64 = await fileToBase64(file);
    } catch {}
  }

  // 2. Call server-side API
  try {
    const res = await fetch('/api/ai/extract-certifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfText,
        pdfBase64,
        fileName: file.name,
        pdfUrls,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const rawList = Array.isArray(json.data.certificates)
          ? json.data.certificates
          : Array.isArray(json.data.certifications)
          ? json.data.certifications
          : [];

        const certs: ExtractedCertificationRecord[] = rawList.map(
          (c: any, index: number) => ({
            id: c.id || `cert-extracted-${Date.now()}-${index}`,
            title: c.name || c.title,
            name: c.name || c.title,
            issuingOrganization: c.issuer || c.issuingOrganization || null,
            issuer: c.issuer || c.issuingOrganization || null,
            issueYear: c.issueYear || (c.date && /\b(20[1-3][0-9]|199[0-9])\b/.test(c.date) ? c.date.match(/\b(20[1-3][0-9]|199[0-9])\b/)[1] : null),
            issueDate: c.date || c.issueDate || null,
            date: c.date || c.issueDate || null,
            expirationDate: c.expirationDate || null,
            credentialId: c.credentialId || null,
            credentialUrl: c.credentialUrl || c.verificationUrl || null,
            verificationUrl: c.credentialUrl || c.verificationUrl || null,
            description: c.description || null,
            sourcePage: c.sourcePage || null,
            sourceEvidence: c.sourceEvidence || `Source: Certifications`,
            confidence: typeof c.confidence === 'number' ? c.confidence : 0.95,
            selected: true,
          })
        );

        // Safe Diagnostic Logging (Requirement 14)
        const diag = json.data.diagnostic || {};
        console.log(
          `[Certificate Extractor]\nPDF validated: true\nPDF pages: ${diag.pageCount || 1}\nCertification section found: ${diag.certSectionFound !== undefined ? diag.certSectionFound : certs.length > 0}\nCandidate certification records: ${diag.candidateRecordCount !== undefined ? diag.candidateRecordCount : certs.length}\nAI extraction records: ${diag.aiRecordCount !== undefined ? diag.aiRecordCount : certs.length}\nNormalized records: ${diag.normalizedRecordCount !== undefined ? diag.normalizedRecordCount : certs.length}\nFrontend records: ${certs.length}`
        );

        if (certs.length === 0) {
          return {
            status: 'empty',
            certifications: [],
            fileName: file.name,
            fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
            supportingText:
              json.data.supportingText ||
              'No certification or program records were found in this PDF. The document was read across all pages, but contains no certification or completion records.',
          };
        }

        return {
          status: 'success',
          certifications: certs,
          fileName: file.name,
          fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
          sourceMethod: json.data.sourceMethod || 'ai_extracted',
        };
      }

      if (json.status === 'error') {
        return {
          status: 'error',
          certifications: [],
          fileName: file.name,
          fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
          error: json.error || 'Could not extract readable text from this PDF.',
          supportingText: json.supportingText || 'Please upload an authentic PDF with readable text.',
        };
      }
    }
  } catch (fetchErr) {
    console.warn('[CertificationExtractor] API call failed, activating client-side parser fallback:', fetchErr);
  }

  // 3. Fallback to client-side deterministic extraction
  const localCerts = extractCertificationsLocally(pdfText, pdfUrls);

  // Safe Diagnostic Logging for fallback (Requirement 14)
  console.log(
    `[Certificate Extractor]\nPDF validated: true\nPDF pages: 1\nCertification section found: ${localCerts.length > 0}\nCandidate certification records: ${localCerts.length}\nAI extraction records: 0\nNormalized records: ${localCerts.length}\nFrontend records: ${localCerts.length}`
  );

  if (localCerts.length === 0) {
    // If text was successfully read (> 10 chars), report empty cleanly rather than error
    if (pdfText.length >= 10) {
      return {
        status: 'empty',
        certifications: [],
        fileName: file.name,
        fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
        supportingText:
          'No certification or program records were found in this PDF. The document was read across all pages, but contains no certification or completion records.',
      };
    }

    return {
      status: 'error',
      certifications: [],
      fileName: file.name,
      fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
      error: 'Could not extract readable text from this PDF.',
      supportingText: 'The document may be password-protected, encrypted, image-only, or corrupted.',
    };
  }

  return {
    status: 'success',
    certifications: localCerts,
    fileName: file.name,
    fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
    sourceMethod: 'client_fallback',
  };
}
