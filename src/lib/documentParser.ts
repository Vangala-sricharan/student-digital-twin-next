import JSZip from 'jszip';
import { decompressFlate, extractTextFromOperators } from './pdfTextExtractor';

function unescapeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export interface NormalizedTopic {
  title: string;
  pageOrSlideRef?: string;
}

export interface NormalizedUnit {
  unitNumber: number | string;
  title: string;
  topics: string[];
  pageOrSlideRange?: string;
}

export interface ParsedDocument {
  fileName: string;
  fileType: 'pdf' | 'ppt' | 'pptx' | 'txt' | 'other';
  fileSize: number;
  fileHash: string;
  extractedText: string;
  pageOrSlideCount: number;
  subject?: string;
  units: NormalizedUnit[];
  detectedTopics: string[];
  summaryNote?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'pdf' | 'ppt' | 'pptx' | 'txt';
}

export interface SyllabusContentValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  detectedType?:
    | 'syllabus'
    | 'lecture_slides'
    | 'course_notes'
    | 'curriculum'
    | 'resume'
    | 'linkedin'
    | 'certificate'
    | 'job_description'
    | 'portfolio'
    | 'generic'
    | 'unknown';
  rejectionReason: string;
  supportingText: string;
  matchedSignals?: string[];
}

const DEFAULT_REJECTION_MESSAGE = 'Please upload the correct PPT/PDF of a subject.';
const DEFAULT_SUPPORTING_TEXT = 'This document does not appear to contain academic subject material for Syllabus Prep.';

/**
 * Checks if the content is a LinkedIn profile export.
 */
function isLinkedInProfileContent(text: string, fileName?: string): boolean {
  const lower = text.toLowerCase();
  const lowerFile = (fileName || '').toLowerCase();

  if (lowerFile.includes('linkedin') && (lower.includes('experience') || lower.includes('education') || lower.includes('skills'))) {
    return true;
  }

  if (
    /linkedin\.com\/(?:in|pub)\/[\w-]+/i.test(text) ||
    lower.includes('www.linkedin.com') ||
    lower.includes('linkedin.com/in') ||
    lower.includes('linkedin corporation')
  ) {
    return true;
  }

  const linkedInMarkers = [
    /\btop\s+skills\b/i,
    /\bcontact\b[\s\S]{0,80}\blinkedin\.com/i,
    /\b(?:500\+|[0-9]+\+?)\s+connections\b/i,
    /\bview\s+full\s+profile\b/i,
    /\bendorsements?\b/i,
    /\blinkedin\s+member\b/i,
  ];

  let matches = 0;
  for (const rx of linkedInMarkers) {
    if (rx.test(text)) matches++;
  }

  if (matches >= 2) return true;
  if (matches >= 1 && (/\bexperience\b/i.test(text) && /\beducation\b/i.test(text))) return true;

  return false;
}

/**
 * Checks if the content is a Resume or Curriculum Vitae.
 */
function isResumeOrCVContent(text: string, fileName?: string): boolean {
  const lower = text.toLowerCase();
  const lowerFile = (fileName || '').toLowerCase();

  // Academic / Courseware exceptions: Slide decks and syllabus units are NOT resumes
  if (
    /\[Slide\s*[0-9]+:/i.test(text) ||
    lowerFile.endsWith('.ppt') ||
    lowerFile.endsWith('.pptx') ||
    lowerFile.endsWith('ppt') ||
    lowerFile.endsWith('pptx') ||
    /\b(?:unit|module|chapter|lecture)\s*[0-9IVX]+/i.test(text)
  ) {
    if (!/\bcurriculum\s+vitae\b/i.test(text) && !/\bresume\s+of\b/i.test(text)) {
      return false;
    }
  }

  // Filename check
  if (
    /\b(?:resume|cv|curriculum[\s_-]*vitae)\b/i.test(lowerFile) &&
    !/\b(?:syllabus|course|lecture|subject|unit)\b/i.test(lowerFile)
  ) {
    if (/\b(?:experience|education|skills|projects|profile|objective)\b/i.test(lower)) {
      return true;
    }
  }

  // Explicit Resume Headings
  if (
    /\bcurriculum\s+vitae\b/i.test(text) ||
    /^(?:[\s\S]{0,350})\b(?:resume|c\.?v\.?)\b/i.test(text) ||
    /\bresume\s+of\b/i.test(text)
  ) {
    return true;
  }

  // Resume section combinations
  const resumeSections = [
    /\b(?:work|professional|industry|employment|relevant)\s+experience\b/i,
    /\b(?:career|professional)\s+objective\b/i,
    /\bprofessional\s+summary\b/i,
    /\bemployment\s+history\b/i,
    /\beducation(?:\s*&|\/|\s+and)?\s*(?:qualifications|background|history)?\b/i,
    /\btechnical\s+skills\b/i,
    /\bkey\s+skills\b/i,
    /\bcore\s+competencies\b/i,
    /\bpersonal\s+(?:details|information|profile)\b/i,
    /\bdeclaration\s*:\s*i\s+hereby\s+declare\b/i,
    /\breferences\s+(?:available\s+upon\s+request|on\s+request)\b/i,
    /\bhobbies\s*(?:&|\/|\s+and)?\s*interests\b/i,
    /\blanguages\s+known\b/i,
  ];

  let sectionCount = 0;
  for (const rx of resumeSections) {
    if (rx.test(text)) sectionCount++;
  }

  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/.test(text);
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasGithubOrPortfolio = /(?:github\.com\/|portfolio|gitlab\.com\/)/i.test(text);
  const hasContactBlock = hasEmail && (hasPhone || hasGithubOrPortfolio);

  if (sectionCount >= 3) return true;
  if (sectionCount >= 2 && hasContactBlock) return true;

  const roleTimelineMatch = /\b(?:software\s+engineer|developer|intern|frontend|backend|analyst|associate|manager)\b[\s\S]{0,60}\b(?:201\d|202\d|present|current)\b/i.test(text);
  const educationTimelineMatch = /\b(?:b\.?tech|b\.?e\.?|b\.?s\.?|m\.?tech|m\.?s\.?|bachelor|master|degree)\b[\s\S]{0,60}\b(?:cgpa|gpa|percentage|201\d|202\d)\b/i.test(text);

  if (roleTimelineMatch && educationTimelineMatch && sectionCount >= 1) {
    return true;
  }

  return false;
}

/**
 * Checks if the content is a Certificate or Award.
 */
function isCertificateOrAwardContent(text: string): boolean {
  const certificatePhrases = [
    /\bcertificate\s+of\s+(?:completion|achievement|participation|excellence|merit|attendance|recognition)\b/i,
    /\bthis\s+is\s+to\s+certify\s+that\b/i,
    /\bhas\s+successfully\s+completed\b/i,
    /\bis\s+hereby\s+awarded\b/i,
    /\bproudly\s+presented\s+to\b/i,
    /\bin\s+recognition\s+of\s+(?:his|her|their)?\s*(?:successful)?\s*(?:completion|achievement)\b/i,
    /\bcredential\s+(?:id|url|identifier)\s*:/i,
    /\bcertificate\s+number\s*:/i,
  ];

  for (const rx of certificatePhrases) {
    if (rx.test(text)) return true;
  }
  return false;
}

/**
 * Checks if the content is a Job Description, Offer Letter, or Business/Legal doc.
 */
function isJobOrBusinessContent(text: string): boolean {
  const jobPhrases = [
    /\bjob\s+(?:description|posting|title|summary|overview)\b/i,
    /\babout\s+the\s+role\b/i,
    /\bwhat\s+(?:you'll|you\s+will)\s+do\b/i,
    /\bwhat\s+we(?:'re|\s+are)\s+looking\s+for\b/i,
    /\bequal\s+opportunity\s+employer\b/i,
    /\byears\s+of\s+(?:relevant\s+)?experience\s+required\b/i,
    /\bapply\s+now\b/i,
  ];

  let jobCount = 0;
  for (const rx of jobPhrases) {
    if (rx.test(text)) jobCount++;
  }
  if (jobCount >= 2) return true;

  if (
    (/\btax\s+invoice\b/i.test(text) || /\binvoice\s+(?:number|no|date)\b/i.test(text)) &&
    (/\btotal\s+amount\b/i.test(text) || /\bbilled\s+to\b/i.test(text))
  ) {
    return true;
  }

  if (
    /\bnon-disclosure\s+agreement\b/i.test(text) ||
    /\bconfidentiality\s+agreement\b/i.test(text) ||
    (/\bterms\s+and\s+conditions\b/i.test(text) && /\bgoverning\s+law\b/i.test(text))
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if content is a personal portfolio.
 */
function isPortfolioContent(text: string): boolean {
  if (
    /\b(?:my\s+portfolio|portfolio\s+of)\b/i.test(text) ||
    (/\bselected\s+(?:works|projects|case\s+studies)\b/i.test(text) && /\bcontact\s+me\b/i.test(text))
  ) {
    return true;
  }
  return false;
}

/**
 * Evaluates whether extracted document text is authentic academic syllabus,
 * courseware, or lecture slide material.
 */
export function validateAcademicDocumentContent(
  text: string,
  options?: {
    fileName?: string;
    fileType?: string;
    slideCount?: number | string;
    isSlideDeck?: boolean;
  }
): SyllabusContentValidationResult {
  const clean = (text || '').trim();
  const numericSlideCount = options?.slideCount ? Number(options.slideCount) || 0 : 0;
  const fileName = options?.fileName || '';
  const lowerFile = fileName.toLowerCase();

  // 1. Text Presence & Length check - only reject if genuinely empty or zero readable text
  if (!clean || clean.length < 15) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'generic',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Empty or unreadable document content'],
    };
  }

  // 2. Identify slide deck presentation
  const isSlides = Boolean(
    options?.isSlideDeck ||
    options?.fileType === 'ppt' ||
    options?.fileType === 'pptx' ||
    numericSlideCount >= 1 ||
    /\[Slide\s*[0-9]+:/i.test(clean) ||
    lowerFile.endsWith('.ppt') ||
    lowerFile.endsWith('.pptx') ||
    lowerFile.endsWith('ppt') ||
    lowerFile.endsWith('pptx')
  );

  // 3. Disqualification checks for genuinely non-academic personal / business documents
  if (isLinkedInProfileContent(clean, fileName)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'linkedin',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['LinkedIn profile export detected'],
    };
  }

  if (isResumeOrCVContent(clean, fileName)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'resume',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Resume or Curriculum Vitae detected'],
    };
  }

  if (isCertificateOrAwardContent(clean)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'certificate',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Certificate or completion award detected'],
    };
  }

  if (isJobOrBusinessContent(clean)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'job_description',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Job description or commercial document detected'],
    };
  }

  if (isPortfolioContent(clean)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'portfolio',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Personal portfolio detected'],
    };
  }

  // 4. Any document that is not disqualified as a personal resume, invoice, or certificate
  // is accepted as authentic academic study material.
  const hasUnitHeaders = /(?:Unit|Module|Chapter|Section|Lecture)\s*[0-9IVX]+/i.test(clean);
  const hasSyllabusKeyword = /\b(?:syllabus|curriculum|course\s+outline)\b/i.test(clean);

  let detectedType: SyllabusContentValidationResult['detectedType'] = 'course_notes';
  if (isSlides) {
    detectedType = 'lecture_slides';
  } else if (hasUnitHeaders || hasSyllabusKeyword) {
    detectedType = 'syllabus';
  }

  const matchedSignals: string[] = [];
  if (isSlides) {
    matchedSignals.push(`Lecture presentation slide deck (${numericSlideCount > 0 ? numericSlideCount + ' slides' : 'multiple slides'})`);
  }
  if (hasUnitHeaders) {
    matchedSignals.push('Academic Unit/Module curriculum headings');
  }
  if (matchedSignals.length === 0) {
    matchedSignals.push('Academic subject notes and educational exposition');
  }

  return {
    isValid: true,
    confidence: isSlides || clean.length > 200 ? 'high' : 'medium',
    detectedType,
    rejectionReason: '',
    supportingText: '',
    matchedSignals,
  };
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_EXTENSIONS = new Set(['pdf', 'ppt', 'pptx', 'txt', 'md', 'docx', 'doc']);

// In-memory session cache for fast deduplicated document lookups
const documentCache = new Map<string, ParsedDocument>();

/**
 * Validates file format and size BEFORE processing.
 */
export function validateAcademicDocument(file: File): ValidationResult {
  if (!file || !file.name) {
    return {
      valid: false,
      error: 'Please select a document file to proceed.',
    };
  }

  const fileName = file.name || '';
  const lowerName = fileName.toLowerCase().trim();

  // Extract extension, handling filenames with or without dot (e.g. "Unit2Arraypptx", "Unit2Array.pptx")
  let ext = '';
  if (lowerName.includes('.')) {
    ext = lowerName.split('.').pop() || '';
  } else {
    // If no dot, check if filename ends with known format names
    if (lowerName.endsWith('pptx')) ext = 'pptx';
    else if (lowerName.endsWith('ppt')) ext = 'ppt';
    else if (lowerName.endsWith('pdf')) ext = 'pdf';
    else if (lowerName.endsWith('txt')) ext = 'txt';
    else if (lowerName.endsWith('docx')) ext = 'docx';
    else if (lowerName.endsWith('doc')) ext = 'doc';
  }

  // Also check MIME type if ext is still empty
  if (!ext && file.type) {
    const mime = file.type.toLowerCase();
    if (mime.includes('presentation') || mime.includes('powerpoint')) ext = 'pptx';
    else if (mime.includes('pdf')) ext = 'pdf';
    else if (mime.includes('word') || mime.includes('document')) ext = 'docx';
    else if (mime.includes('text')) ext = 'txt';
  }

  // If still unknown, check if filename contains keywords like ppt, pdf, array, unit, slide, syllabus
  if (!ext) {
    if (/pptx/i.test(lowerName)) ext = 'pptx';
    else if (/ppt/i.test(lowerName)) ext = 'ppt';
    else if (/pdf/i.test(lowerName)) ext = 'pdf';
    else ext = 'pptx'; // Default to attempting slide/doc parsing
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: 'Please upload the correct PPT/PDF of a subject.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum supported document size is 20 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Please upload the correct PPT/PDF of a subject.',
    };
  }

  let fileType: 'pdf' | 'ppt' | 'pptx' | 'txt' = 'pdf';
  if (ext === 'pptx' || ext === 'docx') fileType = 'pptx';
  else if (ext === 'ppt' || ext === 'doc') fileType = 'ppt';
  else if (ext === 'txt' || ext === 'md') fileType = 'txt';
  else fileType = 'pdf';

  return {
    valid: true,
    fileType,
  };
}

/**
 * Computes a fast SHA-256 fingerprint for cache deduplication
 */
async function computeFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.slice(0, 1024 * 512).arrayBuffer(); // first 512KB for speed
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('') + `-${file.size}`;
  } catch {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}

/**
 * Parses, extracts, and normalizes PDF, PPT, and PPTX documents.
 */
export async function parseAcademicDocument(file: File): Promise<ParsedDocument> {
  const validation = validateAcademicDocument(file);
  if (!validation.valid || !validation.fileType) {
    throw new Error(validation.error || 'Invalid academic document.');
  }

  const fileHash = await computeFileHash(file);
  if (documentCache.has(fileHash)) {
    return documentCache.get(fileHash)!;
  }

  const fileName = file.name;
  const fileSize = file.size;
  const fileType = validation.fileType;

  let extractedText = '';
  let pageOrSlideCount = 1;
  const units: NormalizedUnit[] = [];
  const detectedTopics: string[] = [];

  if (fileType === 'pptx') {
    // PPTX: Unzip and parse slide XML files
    const arrayBuffer = await file.arrayBuffer();
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slideEntries: string[] = [];

      zip.forEach((path) => {
        const normalizedPath = path.replace(/\\/g, '/').replace(/^\.?\//, '');
        if (normalizedPath.match(/(?:^|\/)ppt\/slides\/slide[0-9]+\.xml$/i)) {
          slideEntries.push(path);
        }
      });

      slideEntries.sort((a, b) => {
        const matchA = a.match(/slide([0-9]+)\.xml/i);
        const matchB = b.match(/slide([0-9]+)\.xml/i);
        const numA = matchA ? parseInt(matchA[1], 10) : 0;
        const numB = matchB ? parseInt(matchB[1], 10) : 0;
        return numA - numB;
      });

      pageOrSlideCount = Math.max(1, slideEntries.length);
      const slideTexts: string[] = [];

      for (let i = 0; i < slideEntries.length; i++) {
        const slidePath = slideEntries[i];
        const xml = await zip.file(slidePath)?.async('text');
        if (xml) {
          const paragraphs: string[] = [];
          const pMatches = xml.match(/<a:p[\s>][\s\S]*?<\/a:p>/gi) || [];

          for (const pXml of pMatches) {
            const tMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
            if (tMatches.length > 0) {
              const lineText = tMatches
                .map((m) => unescapeXml(m.replace(/<\/?[^>]+(>|$)/g, '')))
                .join('')
                .trim();
              if (lineText) paragraphs.push(lineText);
            }
          }

          if (paragraphs.length === 0) {
            const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
            const cleanWords = textMatches
              .map((m) => unescapeXml(m.replace(/<\/?[^>]+(>|$)/g, '')).trim())
              .filter((t) => t.length > 0);
            if (cleanWords.length > 0) {
              paragraphs.push(cleanWords.join(' '));
            }
          }

          if (paragraphs.length > 0) {
            const slideTitle = paragraphs[0].slice(0, 100);
            slideTexts.push(`[Slide ${i + 1}: ${slideTitle}]\n${paragraphs.join('\n')}`);

            if (slideTitle.length > 2 && !detectedTopics.includes(slideTitle)) {
              detectedTopics.push(slideTitle);
            }
          }
        }
      }

      extractedText = slideTexts.join('\n\n');
    } catch (zipErr) {
      console.warn('[documentParser] JSZip reading failed on PPTX, attempting text scan:', zipErr);
      const bytes = new Uint8Array(arrayBuffer);
      let textBuffer = '';
      let currentWord = '';
      for (let i = 0; i < bytes.length; i++) {
        const code = bytes[i];
        if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
          currentWord += String.fromCharCode(code);
        } else {
          if (currentWord.trim().length >= 3) {
            textBuffer += currentWord.trim() + ' ';
          }
          currentWord = '';
        }
      }
      extractedText = textBuffer.replace(/[\r\n]+/g, '\n').replace(/\s{2,}/g, ' ').trim().slice(0, 30000);
      pageOrSlideCount = Math.max(1, Math.floor(extractedText.length / 400));
    }
  } else if (fileType === 'ppt') {
    // Legacy binary PPT: Stream printable characters
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let textBuffer = '';
    let currentWord = '';

    for (let i = 0; i < bytes.length; i++) {
      const code = bytes[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        currentWord += String.fromCharCode(code);
      } else {
        if (currentWord.trim().length >= 3) {
          textBuffer += currentWord.trim() + ' ';
        }
        currentWord = '';
      }
    }

    const cleaned = textBuffer.replace(/[\r\n]+/g, '\n').replace(/\s{2,}/g, ' ').trim();
    extractedText = cleaned.slice(0, 22000);
    pageOrSlideCount = Math.max(1, Math.floor(cleaned.length / 450));
  } else if (fileType === 'pdf') {
    // PDF: Parse streams and text blocks with FlateDecode decompressor
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('latin1');
    const rawString = textDecoder.decode(bytes);

    const textChunks: string[] = [];

    // 1. Extract operators from raw uncompressed blocks
    const uncompressedOps = extractTextFromOperators(rawString);
    if (uncompressedOps.length > 0) {
      textChunks.push(...uncompressedOps);
    }

    // 2. Scan and decompress Flate streams
    let searchPos = 0;
    while (searchPos < bytes.length) {
      const streamIdx = rawString.indexOf('stream', searchPos);
      if (streamIdx === -1) break;

      let dataStart = streamIdx + 6;
      if (rawString[dataStart] === '\r' && rawString[dataStart + 1] === '\n') {
        dataStart += 2;
      } else if (rawString[dataStart] === '\n' || rawString[dataStart] === '\r') {
        dataStart += 1;
      }

      const endstreamIdx = rawString.indexOf('endstream', dataStart);
      if (endstreamIdx === -1) break;

      const objStart = rawString.lastIndexOf('obj', streamIdx);
      const dictSnippet =
        objStart !== -1 && streamIdx - objStart < 1200
          ? rawString.slice(objStart, streamIdx)
          : rawString.slice(Math.max(0, streamIdx - 350), streamIdx);

      const isFlate = /Filter\s*(?:\/\s*FlateDecode|\[\s*\/FlateDecode)/i.test(dictSnippet);

      if (isFlate) {
        const streamBytes = bytes.subarray(dataStart, endstreamIdx);
        const decompressed = decompressFlate(streamBytes);
        if (decompressed) {
          const ops = extractTextFromOperators(decompressed);
          if (ops.length > 0) {
            textChunks.push(...ops);
          }
        }
      }

      searchPos = endstreamIdx + 9;
    }

    // Fallback if structured operators yielded few chunks
    if (textChunks.length < 10) {
      const tjMatches = rawString.match(/\(([^()]{2,})\)\s*T[jd]/g);
      if (tjMatches) {
        tjMatches.forEach((m) => {
          const inner = m.replace(/^[\(\\]+|[\)\\]+T[jd]$/g, '').replace(/\\([()\\])/g, '$1').trim();
          if (inner.length > 1 && !/^[0-9\s.,\-_]+$/.test(inner)) {
            textChunks.push(inner);
          }
        });
      }
    }

    const pageMatches = rawString.match(/\/Type\s*\/Page\b/g);
    pageOrSlideCount = pageMatches && pageMatches.length > 0 ? pageMatches.length : Math.max(1, Math.ceil(textChunks.length / 35));

    const combined = textChunks.join(' ').replace(/\s+/g, ' ').trim();
    extractedText = combined.length > 60 ? combined.slice(0, 30000) : rawString.replace(/[^a-zA-Z0-9\s.,!?:;()\-_]/g, ' ').slice(0, 15000).trim();
  } else {
    extractedText = await file.text();
    pageOrSlideCount = Math.max(1, Math.ceil(extractedText.length / 1500));
  }

  // Validate CONTENT before accepting or generating topics for Syllabus Prep
  const contentValidation = validateAcademicDocumentContent(extractedText, {
    fileName,
    fileType,
    slideCount: pageOrSlideCount,
    isSlideDeck: fileType === 'ppt' || fileType === 'pptx',
  });

  if (!contentValidation.isValid) {
    const error: any = new Error(contentValidation.rejectionReason || 'Please upload the correct PPT/PDF of a subject.');
    error.supportingText = contentValidation.supportingText || 'This document does not appear to contain academic subject material for Syllabus Prep.';
    error.isInvalidSubject = true;
    error.detectedType = contentValidation.detectedType;
    throw error;
  }

  // Parse Units & Modules from extracted text
  const unitRegex = /(?:Unit|Module|Chapter|Section)\s*([0-9IVX]+)[:\s–-]+([^\n\r.]+)/gi;
  let match: RegExpExecArray | null;
  let unitIndex = 1;

  while ((match = unitRegex.exec(extractedText)) !== null) {
    const unitNum = match[1];
    const unitTitle = match[2].trim().slice(0, 80);
    if (unitTitle.length > 3 && !units.some((u) => u.title.toLowerCase() === unitTitle.toLowerCase())) {
      units.push({
        unitNumber: unitNum || unitIndex,
        title: unitTitle,
        topics: [],
        pageOrSlideRange: fileType === 'pdf' ? `Pages ${unitIndex * 5 - 4}-${unitIndex * 5 + 6}` : `Slides ${unitIndex * 4 - 3}-${unitIndex * 4 + 4}`,
      });
      unitIndex++;
    }
    if (units.length >= 8) break;
  }

  // Detect coarse topics if none extracted
  if (detectedTopics.length === 0) {
    const lines = extractedText.split(/[\n\r.]+/).map((l) => l.trim()).filter((l) => l.length > 8 && l.length < 90);
    for (const l of lines.slice(0, 30)) {
      if (!detectedTopics.includes(l) && !l.includes('http') && !l.includes('www.')) {
        detectedTopics.push(l);
      }
    }
  }

  // Determine course/subject name from title, first lines, or file name
  let subject = '';
  const firstLines = extractedText.slice(0, 500).split(/[\n\r]+/);
  for (const line of firstLines) {
    const cleaned = line.replace(/^\[Slide\s*[0-9]+:\s*/i, '').replace(/\]$/, '').trim();
    if (cleaned.length > 3 && cleaned.length < 65 && !/^(page|slide|table|figure|[0-9]+$)/i.test(cleaned)) {
      subject = cleaned;
      break;
    }
  }

  if (!subject) {
    // Derive from filename (e.g. "Unit2Arraypptx" -> "Unit 2 Array", "Thermodynamics_Syllabus.pdf" -> "Thermodynamics")
    subject = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/pptx?$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Za-z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([A-Za-z])/g, '$1 $2')
      .replace(/\b(syllabus|curriculum|deck|lecture|slides?|notes?|academic|study)\b/gi, '')
      .trim();
  }

  if (!subject) {
    subject = 'Academic Course Curriculum';
  }

  // Ensure at least one unit exists for single-unit lecture decks or notes
  if (units.length === 0 && extractedText.length > 20) {
    const defaultUnitTitle = subject || 'Core Study Unit';
    units.push({
      unitNumber: 1,
      title: defaultUnitTitle,
      topics: detectedTopics.slice(0, 8),
      pageOrSlideRange: fileType === 'pdf' ? `Pages 1-${pageOrSlideCount}` : `Slides 1-${pageOrSlideCount}`,
    });
  }

  const result: ParsedDocument = {
    fileName,
    fileType,
    fileSize,
    fileHash,
    extractedText: extractedText.trim(),
    pageOrSlideCount,
    subject,
    units,
    detectedTopics: detectedTopics.slice(0, 20),
    summaryNote: `Successfully parsed ${fileName} (${fileType.toUpperCase()}) — ${pageOrSlideCount} ${fileType === 'pdf' ? 'pages' : 'slides'} detected with ${extractedText.length} characters of evidence.`,
  };

  documentCache.set(fileHash, result);
  return result;
}
