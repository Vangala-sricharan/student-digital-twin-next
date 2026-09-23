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
 * Direct PDF Section Extractor
 * Reads the PDF content, locates the "Certifications" section heading,
 * extracts ONLY records belonging to that section until the next major section begins,
 * and returns the records directly to the review UI without AI classification.
 */
export function extractCertificationsFromPdfText(
  text: string,
  candidateName?: string,
  pdfUrls: string[] = []
): {
  headingFound: boolean;
  sectionStart: number;
  sectionEnd: number;
  records: ExtractedCertificationRecord[];
} {
  if (!text || typeof text !== 'string') {
    return { headingFound: false, sectionStart: -1, sectionEnd: -1, records: [] };
  }

  const isCertHeading = (s: string) =>
    /^(?:[•·\-–—\s]*)(?:certifications?|licenses\s*(?:&|and)\s*certifications?|certificates?)\s*:?\s*$/i.test(s.trim());

  const isNextMajorSection = (s: string) =>
    /^(?:[•·\-–—\s]*)(?:summary|about|education|experience|work\s*experience|top\s*skills|skills|projects|languages|honors[\s-]*awards|honors\s*&\s*awards|volunteer\s*experience|publications|organizations|recommendations|interests|contact)\s*:?\s*$/i.test(s.trim());

  const isPageArtifact = (s: string) =>
    /^(?:page\s+\d+(\s+of\s+\d+)?|\d+\s+of\s+\d+|www\.linkedin\.com\S*|\(linkedin\))$/i.test(s.trim());

  const isMetadataLine = (s: string) =>
    /^(?:issued|expires|expiration|valid\s*(?:through|until)|credential\s*id|license\s*number|certificate\s*id|see\s*credential|show\s*credential)\b/i.test(s.trim()) ||
    /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/i.test(s.trim());

  const isCandidateHeaderCue = (s: string) => {
    if (candidateName && s.trim().toLowerCase() === candidateName.trim().toLowerCase()) return true;
    return (
      /(?:,\s*[A-Z][a-z]+|\bIndia\b|\bUnited States\b|\bUSA\b)/i.test(s) &&
      !/(?:graduate|foundations|internship|simulation|basics|programming|course|certification|academy|analytics)/i.test(s)
    );
  };

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let headingFound = false;
  let sectionStart = -1;
  let sectionEnd = -1;

  const rawEntries: Array<{
    title: string;
    issuer: string | null;
    issueDate: string | null;
    credentialId: string | null;
  }> = [];

  let currentRecord: {
    title: string;
    issuer: string | null;
    issueDate: string | null;
    credentialId: string | null;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!headingFound) {
      if (isCertHeading(line)) {
        headingFound = true;
        sectionStart = i;
      }
    } else {
      // 1. Next major LinkedIn section boundary
      if (isNextMajorSection(line)) {
        sectionEnd = i;
        break;
      }

      // 2. Candidate profile header / main column boundary
      if (isCandidateHeaderCue(line)) {
        sectionEnd = i;
        break;
      }

      // 3. Skip page artifacts
      if (isPageArtifact(line)) {
        continue;
      }

      // 4. Metadata line attaching to the previous certification
      if (currentRecord && isMetadataLine(line)) {
        if (/issued/i.test(line)) {
          const d = line.replace(/^issued\s*:?\s*/i, '').trim();
          currentRecord.issueDate = d;
        } else if (/credential\s*id/i.test(line)) {
          currentRecord.credentialId = line.replace(/^credential\s*id\s*:?\s*/i, '').trim();
        }
        continue;
      }

      // 5. This is a record belonging to the Certifications section
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

      currentRecord = {
        title: line,
        issuer,
        issueDate: null,
        credentialId: null,
      };

      rawEntries.push(currentRecord);
    }
  }

  if (headingFound && sectionEnd === -1) {
    sectionEnd = lines.length;
  }

  // Convert raw records to full ExtractedCertificationRecord objects
  const records: ExtractedCertificationRecord[] = rawEntries.map((r, idx) => {
    let year: string | null = null;
    if (r.issueDate) {
      const ym = r.issueDate.match(/\b(20[1-3][0-9]|199[0-9])\b/);
      if (ym) year = ym[1];
    }

    let verificationUrl: string | null = null;
    const normTitle = normalizeCertificationKey(r.title);
    for (const url of pdfUrls) {
      if (url.toLowerCase().includes('linkedin.com/in/')) continue;
      const normUrl = normalizeCertificationKey(url);
      if (
        normTitle &&
        (normUrl.includes(normTitle.slice(0, 10)) ||
          /verify|credential|badge|certificate|forage|coursera|udemy/i.test(url))
      ) {
        verificationUrl = url;
        break;
      }
    }

    return {
      id: `cert-extracted-${Date.now()}-${idx}`,
      title: r.title,
      name: r.title,
      issuingOrganization: r.issuer,
      issuer: r.issuer,
      issueYear: year,
      issueDate: r.issueDate,
      date: r.issueDate,
      expirationDate: null,
      credentialId: r.credentialId,
      credentialUrl: verificationUrl,
      verificationUrl: verificationUrl,
      description: null,
      sourcePage: null,
      sourceEvidence: `Certifications: ${r.title}`,
      confidence: 1.0,
      selected: true,
    };
  });

  return {
    headingFound,
    sectionStart,
    sectionEnd,
    records,
  };
}

/**
 * Orchestrates full extraction pipeline:
 * 1. Reads the uploaded PDF
 * 2. Finds the section whose heading is "Certifications"
 * 3. Extracts ONLY records belonging to that section until the next section begins
 * 4. Returns those extracted records to the existing review UI
 * Strictly ZERO AI classification.
 */
export async function extractCertificationsFromLinkedInPdf(file: File): Promise<ExtractionResult> {
  const pdfLoaded = Boolean(file && file.size > 0);

  // 1. Read the uploaded PDF
  const pdfResult = await validateAndExtractLinkedInPdf(file);
  if (!pdfResult.isValid || !pdfResult.extractedText) {
    console.log(
      `[Certificate Extractor]\nPDF loaded: ${pdfLoaded}\nCertification heading found: false\nCertification section start: -1\nCertification section end: -1\nExtracted records: 0`
    );
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

  // 2. Direct section detection and record extraction
  const { headingFound, sectionStart, sectionEnd, records } = extractCertificationsFromPdfText(
    pdfResult.extractedText,
    pdfResult.candidateName,
    pdfResult.extractedUrls || []
  );

  // Required Safe Diagnostics (Requirement)
  console.log(
    `[Certificate Extractor]\nPDF loaded: ${pdfLoaded}\nCertification heading found: ${headingFound}\nCertification section start: ${sectionStart}\nCertification section end: ${sectionEnd}\nExtracted records: ${records.length}`
  );

  // 3. Return results to review UI
  if (!headingFound || records.length === 0) {
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
    status: 'success',
    certifications: records,
    fileName: file.name,
    fileSizeFormatted: pdfResult.fileSizeFormatted || '0 KB',
    sourceMethod: 'pdf_section_extractor',
  };
}
