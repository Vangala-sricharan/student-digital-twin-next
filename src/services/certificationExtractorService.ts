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
 * Does NOT hardcode any user certifications or known issuers.
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
  const results: (ExtractedCertificationRecord & { linesUnder: number })[] = [];
  let currentItem: (ExtractedCertificationRecord & { linesUnder: number }) | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const pageMatch = line.match(/^\[?(?:Page|--- Page)\s*(\d+)\]?/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10) || currentPage;
      continue;
    }
    if (/^Page\s+\d+(\s+of\s+\d+)?$/i.test(line)) {
      continue;
    }

    if (CERT_SECTION_REGEX.test(line)) {
      inCertSection = true;
      currentSection = line;
      currentItem = null;
      continue;
    }

    if (inCertSection && OTHER_SECTION_REGEX.test(line)) {
      inCertSection = false;
      currentSection = '';
      currentItem = null;
      continue;
    }

    if (inCertSection) {
      if (/^www\.linkedin\.com/i.test(line) || /^https?:\/\//i.test(line)) {
        if (currentItem && !currentItem.verificationUrl && /^https?:\/\//i.test(line)) {
          if (!line.includes('linkedin.com/in/')) {
            currentItem.verificationUrl = line;
            currentItem.credentialUrl = line;
          }
        }
        continue;
      }

      const dateMatch = line.match(DATE_REGEX);
      const expMatch = line.match(EXPIRATION_REGEX);
      const credMatch = line.match(CRED_ID_REGEX);

      if (
        currentItem &&
        (dateMatch ||
          expMatch ||
          credMatch ||
          line.toLowerCase().startsWith('issued') ||
          line.toLowerCase().startsWith('credential id') ||
          line.toLowerCase().startsWith('expires'))
      ) {
        if (dateMatch && !currentItem.issueYear) {
          currentItem.issueYear = dateMatch[2];
          currentItem.issueDate = dateMatch[0].replace(/^Issued\s+/i, '');
        }
        if (expMatch && !currentItem.expirationDate) {
          currentItem.expirationDate = expMatch[0].replace(/^(?:Expires|Expiration|Valid\s*(?:through|until))[:\s]*/i, '');
        }
        if (credMatch && !currentItem.credentialId) {
          currentItem.credentialId = credMatch[1];
        }
        currentItem.sourceEvidence += `\n${line}`;
        continue;
      }

      if (currentItem && !currentItem.issuingOrganization && currentItem.linesUnder < 2) {
        if (
          !dateMatch &&
          !credMatch &&
          !line.toLowerCase().startsWith('issued') &&
          !line.toLowerCase().startsWith('credential id') &&
          line.length < 80
        ) {
          currentItem.issuingOrganization = line;
          currentItem.issuer = line;
          currentItem.sourceEvidence += `\n${line}`;
          currentItem.linesUnder++;
          continue;
        }
      }

      let title = line;
      let issuer: string | null = null;

      if (line.includes(' - ') || line.includes(' | ')) {
        const delim = line.includes(' - ') ? ' - ' : ' | ';
        const parts = line.split(delim);
        if (parts.length === 2) {
          const p0 = parts[0].trim();
          const p1 = parts[1].trim();
          if (p0.length < 35 && p1.length >= 5) {
            issuer = p0;
            title = p1;
          } else {
            title = p0;
            issuer = p1;
          }
        }
      }

      let titleYear: string | null = null;
      let titleDate: string | null = null;
      const yr = title.match(YEAR_REGEX);
      if (yr && (title.includes('(') || title.includes('-'))) {
        titleYear = yr[1];
        titleDate = yr[1];
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

      currentItem = {
        id: `cert-extracted-${Date.now()}-${results.length}`,
        title,
        name: title,
        issuingOrganization: issuer,
        issuer,
        issueYear: titleYear,
        issueDate: titleDate,
        expirationDate: null,
        credentialId: null,
        verificationUrl,
        credentialUrl: verificationUrl,
        description: null,
        sourcePage: currentPage,
        sourceEvidence: `${currentSection || 'Certifications'}\n${line}`,
        confidence: 0.95,
        linesUnder: 0,
        selected: true,
      };

      results.push(currentItem);
    }
  }

  // Standalone detection if no section was matched
  if (results.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (OTHER_SECTION_REGEX.test(line)) continue;

      const isCertLine =
        /(?:Certificate\s+of\s+Completion|Certified\s+[A-Za-z]|Job\s+Simulation\s+Certificate|Simulation\s+Completed|Credential\s+ID|Completion\s+Certificate)/i.test(
          line
        );

      if (isCertLine) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
        let issuer: string | null = null;
        if (nextLine && nextLine.length < 50 && !OTHER_SECTION_REGEX.test(nextLine)) {
          issuer = nextLine;
        }
        const yr = line.match(YEAR_REGEX);
        results.push({
          id: `cert-extracted-${Date.now()}-${results.length}`,
          title: line,
          name: line,
          issuingOrganization: issuer,
          issuer,
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
          selected: true,
        });
      }
    }
  }

  // Deduplicate
  const deduped: ExtractedCertificationRecord[] = [];
  const seen = new Set<string>();

  for (const c of results) {
    const k = `${normalizeCertificationKey(c.title)}::${normalizeCertificationKey(c.issuingOrganization)}`;
    if (seen.has(k)) continue;
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

  // Attempt base64 encoding if file is within reasonable size
  let pdfBase64: string | null = null;
  try {
    pdfBase64 = await fileToBase64(file);
  } catch {}

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
        const certs: ExtractedCertificationRecord[] = (json.data.certifications || []).map(
          (c: any, index: number) => ({
            id: c.id || `cert-extracted-${Date.now()}-${index}`,
            title: c.name || c.title,
            name: c.name || c.title,
            issuingOrganization: c.issuer || c.issuingOrganization || null,
            issuer: c.issuer || c.issuingOrganization || null,
            issueYear: c.issueYear || null,
            issueDate: c.issueDate || null,
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
