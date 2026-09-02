import JSZip from 'jszip';

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
      error: `Unsupported file type (.${ext || 'unknown'}). Please upload a valid PDF, PPT, or PPTX academic syllabus or presentation deck.`,
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
      error: 'Uploaded document is empty (0 bytes). Please upload a valid study document.',
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
      if (path.match(/^ppt\/slides\/slide[0-9]+\.xml$/i)) {
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
          .map((m) => m.replace(/<\/?[^>]+(>|$)/g, '').trim())
          .filter((t) => t.length > 0);

        if (cleanWords.length > 0) {
          const slideTitle = cleanWords[0] || `Topic ${i + 1}`;
          const bodyText = cleanWords.slice(1).join(' ');
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
    extractedText = cleaned.slice(0, 18000);
    pageOrSlideCount = Math.max(1, Math.floor(cleaned.length / 450));
  } else if (fileType === 'pdf') {
    // PDF: Parse streams and text blocks
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('latin1');
    const rawString = textDecoder.decode(arrayBuffer);

    const textChunks: string[] = [];
    const tjMatches = rawString.match(/\(([^()]{2,})\)\s*T[jd]/g);

    if (tjMatches && tjMatches.length > 0) {
      tjMatches.forEach((m) => {
        const inner = m.replace(/^[\(\\]+|[\)\\]+T[jd]$/g, '').replace(/\\([()\\])/g, '$1').trim();
        if (inner.length > 1 && !/^[0-9\s.,\-_]+$/.test(inner)) {
          textChunks.push(inner);
        }
      });
    }

    if (textChunks.length < 15) {
      const streamMatches = rawString.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
      if (streamMatches) {
        streamMatches.forEach((s) => {
          const cleanStr = s.replace(/[^a-zA-Z0-9\s.,!?:;()\-_/]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanStr.length > 25) {
            textChunks.push(cleanStr);
          }
        });
      }
    }

    const pageMatches = rawString.match(/\/Type\s*\/Page\b/g);
    pageOrSlideCount = pageMatches && pageMatches.length > 0 ? pageMatches.length : Math.max(1, Math.ceil(textChunks.length / 30));

    const combined = textChunks.join(' ').replace(/\s+/g, ' ').trim();
    extractedText = combined.length > 60 ? combined.slice(0, 22000) : rawString.replace(/[^a-zA-Z0-9\s.,!?:;()\-_]/g, ' ').slice(0, 12000).trim();
  } else {
    extractedText = await file.text();
    pageOrSlideCount = Math.max(1, Math.ceil(extractedText.length / 1500));
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

  // Guess course/subject name from title/first lines
  let subject = 'Core Computer Science & Engineering';
  const firstLines = extractedText.slice(0, 300).split(/[\n\r]+/);
  for (const line of firstLines) {
    const cleaned = line.trim();
    if (cleaned.length > 5 && cleaned.length < 50 && !/^(page|slide|table|figure|unit)/i.test(cleaned)) {
      subject = cleaned;
      break;
    }
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
