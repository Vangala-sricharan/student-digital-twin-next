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

  // 1. Text Presence & Length check
  if (!clean || clean.length < 35) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'unknown',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Empty or insufficient document content'],
    };
  }

  // 2. Disqualification: LinkedIn Profile
  if (isLinkedInProfileContent(clean, options?.fileName)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'linkedin',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['LinkedIn profile export detected'],
    };
  }

  // 3. Disqualification: Resume / CV
  if (isResumeOrCVContent(clean, options?.fileName)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'resume',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Resume or Curriculum Vitae detected'],
    };
  }

  // 4. Disqualification: Certificate / Award
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

  // 5. Disqualification: Job Description / Commercial Doc
  if (isJobOrBusinessContent(clean)) {
    return {
      isValid: false,
      confidence: 'none',
      detectedType: 'job_description',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals: ['Job description or non-academic document detected'],
    };
  }

  // 6. Disqualification: Portfolio
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

  // 7. Academic Positive Signals Evaluation
  let academicScore = 0;
  const matchedSignals: string[] = [];

  // A. Syllabus / Course Structure Terminology
  const syllabusKeywords = [
    { pattern: /\b(?:course\s+)?syllabus\b/i, weight: 18, name: 'Syllabus keyword' },
    { pattern: /\bcourse\s+(?:outline|curriculum|structure|handout)\b/i, weight: 16, name: 'Course Outline/Curriculum' },
    { pattern: /\bcourse\s+outcomes\s*(?:\(cos?\))?/i, weight: 16, name: 'Course Outcomes' },
    { pattern: /\bcourse\s+objectives\b/i, weight: 15, name: 'Course Objectives' },
    { pattern: /\blearning\s+outcomes\b/i, weight: 12, name: 'Learning Outcomes' },
    { pattern: /\bcourse\s+code\s*[:\s]+[A-Z0-9_-]+/i, weight: 14, name: 'Course Code' },
    { pattern: /\bcredits?\s*[:\s]+[0-9](\.[0-9])?\b/i, weight: 12, name: 'Course Credits' },
    { pattern: /\b(?:scheme\s+of\s+instruction|instruction\s+hours|lecture\s+hours)\b/i, weight: 10, name: 'Instruction Hours' },
    { pattern: /\b(?:evaluation\s+scheme|grading\s+scheme|internal\s+assessment|mid-?term\s+exam|end-?sem(?:ester)?\s+exam)\b/i, weight: 12, name: 'Evaluation Scheme' },
    { pattern: /\b(?:text\s*books?|reference\s*books?|prescribed\s*books?|suggested\s*readings?)\b/i, weight: 14, name: 'Textbook References' },
    { pattern: /\bprerequisites?\s*[:\s]/i, weight: 8, name: 'Course Prerequisites' },
    { pattern: /\bsemester\s*[:\s]+(?:[1-8]|i|ii|iii|iv|v|vi|vii|viii)\b/i, weight: 12, name: 'Semester designation' },
    { pattern: /\bdepartment\s+of\s+[A-Za-z\s&]+/i, weight: 8, name: 'Academic Department' },
  ];

  for (const item of syllabusKeywords) {
    if (item.pattern.test(clean)) {
      academicScore += item.weight;
      matchedSignals.push(item.name);
    }
  }

  // B. Units / Modules / Chapters Structure
  const unitRegex = /(?:Unit|Module|Chapter|Part|Section)\s*([0-9IVX]+)[:\s–-]+([^\n\r.]+)/gi;
  let unitCount = 0;
  let unitMatch: RegExpExecArray | null;
  while ((unitMatch = unitRegex.exec(clean)) !== null) {
    unitCount++;
    if (unitCount >= 8) break;
  }

  if (unitCount >= 1) {
    const unitScore = Math.min(32, unitCount * 8);
    academicScore += unitScore;
    matchedSignals.push(`${unitCount} Unit/Module headers`);
  }

  // C. Lecture Presentation Structure (PPT / PPTX / Slide Deck)
  const isSlides =
    options?.isSlideDeck ||
    options?.fileType === 'ppt' ||
    options?.fileType === 'pptx' ||
    numericSlideCount >= 2;

  if (isSlides) {
    const slideTagMatches = (clean.match(/\[Slide\s*[0-9]+:/gi) || []).length;
    if (slideTagMatches >= 2 || numericSlideCount >= 2) {
      academicScore += 16;
      matchedSignals.push(`Slide presentation deck (${slideTagMatches || numericSlideCount} slides)`);
    }
  }

  // D. Academic Subject Matter Concepts
  const academicTopics = [
    /\b(?:data\s+structures?|algorithms?|dynamic\s+programming|graph\s+theory|trees?|sorting|searching|asymptotic|big-?o|recurrence)\b/i,
    /\b(?:operating\s+systems?|process\s+scheduling|deadlocks?|semaphores?|concurrency|virtual\s+memory|paging|file\s+systems?)\b/i,
    /\b(?:database\s+management|relational\s+algebra|normalization|sql|indexing|transactions?|acid\s+properties)\b/i,
    /\b(?:computer\s+networks?|osi\s+model|tcp\/ip|routing|packet\s+switching|congestion\s+control|dns|http)\b/i,
    /\b(?:compiler\s+design|lexical\s+analysis|parsing|syntax\s+tree|code\s+generation|finite\s+automata)\b/i,
    /\b(?:software\s+engineering|system\s+design|uml|agile|design\s+patterns?|sdlc)\b/i,
    /\b(?:theory\s+of\s+computation|turing\s+machines?|decidability|regular\s+languages?|context-?free\s+grammar)\b/i,
    /\b(?:machine\s+learning|deep\s+learning|neural\s+networks?|regression|classification|supervised\s+learning)\b/i,
    /\b(?:discrete\s+mathematics?|propositional\s+logic|set\s+theory|combinatorics|relations?|functions?)\b/i,
    /\b(?:calculus|linear\s+algebra|differential\s+equations?|matrices|eigenvalues?|vectors?|probability|statistics)\b/i,
    /\b(?:thermodynamics|fluid\s+mechanics|kinematics|newton's\s+laws?|electromagnetism|maxwell's\s+equations?|quantum)\b/i,
    /\b(?:digital\s+logic|microprocessors?|computer\s+architecture|logic\s+gates|flip-?flops?|registers?|alu)\b/i,
    /\b(?:electric\s+circuits?|kirchhoff's|ohms\s+law|ac\/dc|signals\s+and\s+systems|fourier\s+transform)\b/i,
    /\b(?:organic\s+chemistry|chemical\s+bonding|thermodynamics|kinetics|equilibrium)\b/i,
    /\b(?:cell\s+biology|genetics|molecular\s+biology|biochemistry|physiology)\b/i,
    /\b(?:macroeconomics|microeconomics|monetary\s+policy|fiscal\s+policy|elasticity|market\s+structure)\b/i,
    /\b(?:accounting\s+principles|balance\s+sheet|financial\s+management|corporate\s+finance)\b/i,
  ];

  let topicMatches = 0;
  for (const rx of academicTopics) {
    if (rx.test(clean)) {
      topicMatches++;
    }
  }

  if (topicMatches >= 1) {
    const topicScore = Math.min(26, topicMatches * 6);
    academicScore += topicScore;
    matchedSignals.push(`${topicMatches} Academic topic concepts matched`);
  }

  // E. Academic Exposition & Lecture Vocabulary
  const academicVocab = [
    /\btheorems?\b/i,
    /\bproofs?\b/i,
    /\bdefinition\s*:/i,
    /\bformulation\b/i,
    /\bderivations?\b/i,
    /\bworking\s+principle\b/i,
    /\bcharacteristics\s+of\b/i,
    /\badvantages\s+and\s+disadvantages\b/i,
    /\bclassification\s+of\b/i,
    /\bproperties\s+of\b/i,
    /\bexercise\s+problems?\b/i,
  ];

  let vocabMatches = 0;
  for (const rx of academicVocab) {
    if (rx.test(clean)) vocabMatches++;
  }

  if (vocabMatches >= 1) {
    academicScore += Math.min(15, vocabMatches * 4);
    matchedSignals.push(`${vocabMatches} Academic exposition indicators`);
  }

  // 8. Confidence & Classification Decision
  // Minimum required academic score is 15
  if (academicScore < 15) {
    return {
      isValid: false,
      confidence: 'low',
      detectedType: 'generic',
      rejectionReason: DEFAULT_REJECTION_MESSAGE,
      supportingText: DEFAULT_SUPPORTING_TEXT,
      matchedSignals,
    };
  }

  const detectedType = isSlides ? 'lecture_slides' : unitCount >= 2 ? 'syllabus' : 'course_notes';

  return {
    isValid: true,
    confidence: academicScore >= 30 ? 'high' : 'medium',
    detectedType,
    rejectionReason: '',
    supportingText: '',
    matchedSignals,
  };
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_EXTENSIONS = new Set(['pdf', 'ppt', 'pptx', 'txt', 'md']);

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

  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';

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
  if (ext === 'pptx') fileType = 'pptx';
  else if (ext === 'ppt') fileType = 'ppt';
  else if (ext === 'txt' || ext === 'md') fileType = 'txt';

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
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideEntries: string[] = [];

    zip.forEach((path) => {
      const normalizedPath = path.replace(/\\/g, '/');
      if (normalizedPath.match(/^ppt\/slides\/slide[0-9]+\.xml$/i)) {
        slideEntries.push(path);
      }
    });

    slideEntries.sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });

    pageOrSlideCount = Math.max(1, slideEntries.length);
    const slideTexts: string[] = [];

    for (let i = 0; i < slideEntries.length; i++) {
      const slidePath = slideEntries[i];
      const xml = await zip.file(slidePath)?.async('text');
      if (xml) {
        const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
        const cleanWords = textMatches
          .map((m) => unescapeXml(m.replace(/<\/?[^>]+(>|$)/g, '')).trim())
          .filter((t) => t.length > 0);

        if (cleanWords.length > 0) {
          const slideTitle = cleanWords[0] || `Topic ${i + 1}`;
          slideTexts.push(`[Slide ${i + 1}: ${slideTitle}]\n${cleanWords.join(' ')}`);

          if (cleanWords.length > 1 && !detectedTopics.includes(slideTitle)) {
            detectedTopics.push(slideTitle);
          }
        }
      }
    }

    extractedText = slideTexts.join('\n\n');
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
    const cleaned = line.trim();
    if (cleaned.length > 4 && cleaned.length < 65 && !/^(page|slide|table|figure|unit|module|chapter|[0-9]+$)/i.test(cleaned)) {
      subject = cleaned;
      break;
    }
  }

  if (!subject) {
    // Derive from filename (e.g. "Thermodynamics_Syllabus.pdf" -> "Thermodynamics")
    subject = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b(syllabus|course|curriculum|deck|lecture|slides?|notes?|academic|study)\b/gi, '')
      .trim();
  }

  if (!subject) {
    subject = 'Academic Course Curriculum';
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
