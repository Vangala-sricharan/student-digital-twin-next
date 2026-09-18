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
      // If either has an issuer, require issuer compatibility
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
 * Client-side deterministic parser used when server is unreachable or offline.
 */
function extractCertificationsLocally(
  text: string,
  pdfUrls: string[] = []
): ExtractedCertificationRecord[] {
  if (!text) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const SECTION_HEADER_REGEX =
    /^(?:Contact|Top Skills|Skills|Summary|About|Education|Experience|Projects|Languages|Honors-Awards|Honors & Awards|Publications|Interests|Recommendations)$/i;

  let inCertSection = false;
  const certLines: string[] = [];

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

  const cleanLines = certLines.filter(
    (l) => !/^Page\s+\d+(\s+of\s+\d+)?$/i.test(l) && !/^www\.linkedin\.com/i.test(l)
  );

  const results: ExtractedCertificationRecord[] = [];
  const YEAR_REGEX = /\b(20[1-3][0-9]|199[0-9])\b/;
  const DATE_REGEX =
    /\b(?:Issued\s+)?(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+)?(20[1-3][0-9])\b/i;
  const CRED_ID_REGEX = /(?:Credential ID|License Number|Certificate ID|ID)[:\s]+([A-Za-z0-9-_]+)/i;

  const KNOWN_ISSUERS = [
    'aws academy',
    'amazon web services',
    'infosys springboard',
    'infosys',
    'decodelabs',
    'tata',
    'forage',
    'coursera',
    'udemy',
    'google cloud',
    'microsoft',
    'ibm',
    'oracle',
    'deeplearning.ai',
    'meta',
    'cisco',
    'hackerrank',
    'freecodecamp',
    'nptel',
    'swayam',
    'edx',
    'great learning',
  ];

  let currentItem: (ExtractedCertificationRecord & { linesUnder: number }) | null = null;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];

    const dateMatch = line.match(DATE_REGEX);
    const credMatch = line.match(CRED_ID_REGEX);

    if (
      currentItem &&
      (dateMatch ||
        credMatch ||
        line.toLowerCase().startsWith('issued') ||
        line.toLowerCase().startsWith('credential id'))
    ) {
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

    const isKnownIssuer = KNOWN_ISSUERS.some(
      (ki) => line.toLowerCase() === ki || line.toLowerCase().startsWith(`${ki} `)
    );

    if (currentItem && !currentItem.issuingOrganization && (isKnownIssuer || currentItem.linesUnder < 2)) {
      if (
        isKnownIssuer ||
        (!line.includes(' - ') &&
          !line.includes('Program') &&
          !line.includes('Certificate') &&
          line.length < 50)
      ) {
        currentItem.issuingOrganization = line;
        currentItem.sourceEvidence += `\n${line}`;
        currentItem.linesUnder++;
        continue;
      }
    }

    if (SECTION_HEADER_REGEX.test(line)) continue;

    let title = line;
    let issuer: string | null = null;

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

    let titleYear: string | null = null;
    let titleDate: string | null = null;
    const yearMatch = title.match(YEAR_REGEX);
    if (yearMatch && (title.includes('(') || title.includes('-'))) {
      titleYear = yearMatch[1];
    }

    // Match verification URL from PDF links
    let verificationUrl: string | null = null;
    const normTitle = normalizeCertificationKey(title);
    for (const url of pdfUrls) {
      if (url.toLowerCase().includes('linkedin.com/in/')) continue;
      const normUrl = normalizeCertificationKey(url);
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
      selected: true,
    };

    results.push(currentItem);
  }

  return results;
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
      error: pdfResult.error || 'No certification records could be reliably extracted from this PDF.',
      supportingText: 'Please ensure you upload an authentic LinkedIn profile export PDF.',
    };
  }

  const pdfText = pdfResult.extractedText;
  const pdfUrls = pdfResult.extractedUrls || [];

  // 2. Call server-side API
  try {
    const res = await fetch('/api/ai/extract-certifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfText,
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
            title: c.title,
            issuingOrganization: c.issuingOrganization || null,
            issueYear: c.issueYear || null,
            issueDate: c.issueDate || null,
            credentialId: c.credentialId || null,
            verificationUrl: c.verificationUrl || null,
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
            supportingText: json.data.supportingText || 'No certifications were found in this LinkedIn PDF.',
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
          error: json.error || 'No certification records could be reliably extracted from this PDF.',
          supportingText: json.supportingText || 'Please upload an authentic LinkedIn profile PDF.',
        };
      }
    }
  } catch (fetchErr) {
    console.warn('[CertificationExtractor] API call failed, falling back to client parser:', fetchErr);
  }

  // 3. Fallback to client-side deterministic extraction
  const localCerts = extractCertificationsLocally(pdfText, pdfUrls);
  if (localCerts.length === 0) {
    // Check if text has profile cues
    const isProfile =
      pdfText.toLowerCase().includes('top skills') ||
      pdfText.toLowerCase().includes('experience') ||
      pdfText.toLowerCase().includes('education');

    if (isProfile) {
      return {
        status: 'empty',
        certifications: [],
        fileName: file.name,
        fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
        supportingText: 'No certifications were found in this LinkedIn PDF.',
      };
    }

    return {
      status: 'error',
      certifications: [],
      fileName: file.name,
      fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
      error: 'No certification records could be reliably extracted from this PDF.',
      supportingText: 'The uploaded file does not contain a recognizable LinkedIn profile structure.',
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
