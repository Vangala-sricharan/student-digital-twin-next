import { inflate, inflateRaw } from 'pako';

/**
 * PDF Validation and Text Extraction Utility for LinkedIn Profile Exports
 * Robust parser supporting modern PDF streams, FlateDecode decompression via pako,
 * hex/literal text operators, UTF-16BE decoding, robust text normalization, and semantic section detection.
 */

export interface PdfDebugInfo {
  detectedName: string;
  detectedHeadline: string;
  detectedAbout: string;
  detectedSkills: string[];
  detectedCertifications: string[];
  detectedEducation: string;
  detectedExperience: string;
}

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  fileSizeFormatted?: string;
  detectedSections?: string[];
  missingSections?: string[];
  extractedText?: string;
  rawExtractedText?: string;
  normalizedText?: string;
  candidateName?: string;
  candidateHeadline?: string;
  candidateLocation?: string;
  debugInfo?: PdfDebugInfo;
}

export const SEMANTIC_SECTIONS = [
  { id: 'Headline', label: 'Headline', patterns: [/\bheadline\b/i, /(?:student|developer|engineer|architect|specialist|scholar)\s*(?:\||•|@|\/|at\s+)/i] },
  { id: 'Summary', label: 'Summary / About', patterns: [/\b(?:summary|about|about me|profile|professional summary)\b/i] },
  { id: 'Skills', label: 'Top Skills', patterns: [/\b(?:top skills|skills|skills & endorsements|technical skills|core competencies)\b/i] },
  { id: 'Certifications', label: 'Certifications', patterns: [/\b(?:certifications|licenses & certifications|certifications & courses|job simulation|virtual internship|certificates)\b/i] },
  { id: 'Education', label: 'Education', patterns: [/\b(?:education|academic background|academic qualifications|university|college|b\.tech|bachelor|master|degree)\b/i] },
  { id: 'Experience', label: 'Experience', patterns: [/\b(?:work experience|professional experience|employment history)\b/i, /\bexperience\b/i] },
  { id: 'Projects', label: 'Projects', patterns: [/\b(?:projects|key projects|personal projects|academic projects)\b/i] },
  { id: 'Contact', label: 'Contact', patterns: [/\b(?:contact|linkedin\.com|email)\b/i] },
];

/**
 * Normalizes raw extracted PDF text safely while preserving structural integrity.
 * Handles unusual whitespace, quotes, bullets, dashes, line breaks, and encoding artifacts.
 */
export function normalizePdfText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Replace non-breaking spaces and unusual unicode whitespace
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    // Normalize quotes and apostrophes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize hyphens and dashes (preserve bullet points as •)
    .replace(/[\u2013\u2014]/g, ' - ')
    .replace(/[\u2022\u25CF\u25CB\u25AA\u25AB]/g, ' • ')
    // Normalize line breaks: convert \r\n and \r to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse multiple horizontal spaces
    .replace(/[ \t]+/g, ' ')
    // Clean each line
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Extracts candidate name, headline, and location from normalized LinkedIn profile text.
 * Correctly navigates past left-sidebar metadata (Contact, Top Skills, Certifications)
 * and captures multi-line headlines without truncation.
 */
export function extractCandidateProfile(text: string): {
  candidateName?: string;
  candidateHeadline?: string;
  candidateLocation?: string;
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let candidateHeadline = '';
  let candidateName = '';
  let candidateLocation = '';

  const SECTION_HEADINGS = /^(?:Contact|Top Skills|Skills|Certifications|Summary|About|Education|Experience|Projects|Languages|Honors-Awards)$/i;
  const CERT_PATTERNS = /(?:job simulation|virtual internship|certificate|certification|licensed|course|specialization)/i;
  const LOCATION_PATTERNS = /(?:India|United States|USA|Area|Telangana|Hyderabad|Bengaluru|Bangalore|Delhi|Mumbai|Pune|California|London|Toronto|District|Region|State|Province|Gujarat|Rajkot|Ahmedabad|Chennai|Kolkata)/i;

  // Approach 1: LinkedIn PDF Layout - Proximity & Document Structure
  // The candidate name is displayed prominently before the headline, and the multi-line headline
  // spans until a location line or the Summary/About section.
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (SECTION_HEADINGS.test(l)) continue;
    if (CERT_PATTERNS.test(l)) continue;
    if (l.includes('linkedin.com') || l.includes('@') || l.startsWith('www.')) continue;
    if (l.length < 2 || l.length > 50) continue;

    // Check if subsequent line starts a candidate headline (contains role, |, or •)
    if (i + 1 < lines.length) {
      const nextL = lines[i + 1];
      const isHeadlineStart =
        nextL.includes('|') ||
        nextL.includes('•') ||
        /(?:student|developer|engineer|architect|specialist|scholar|analyst|consultant|manager|lead)/i.test(nextL);

      if (isHeadlineStart && !LOCATION_PATTERNS.test(l)) {
        candidateName = l;
        // Accumulate multi-line headline until location, section header, or URL
        const headlineLines: string[] = [];
        let cur = i + 1;
        while (cur < lines.length) {
          const hLine = lines[cur];
          if (SECTION_HEADINGS.test(hLine)) break;
          if (LOCATION_PATTERNS.test(hLine) && !hLine.includes('|') && !hLine.includes('•') && hLine.length < 80) {
            candidateLocation = hLine;
            break;
          }
          headlineLines.push(hLine);
          cur++;
        }
        candidateHeadline = headlineLines.join(' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // Approach 2: If approach 1 did not find headline, scan for any line with delimiters (| or •)
  if (!candidateHeadline) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (SECTION_HEADINGS.test(line) || CERT_PATTERNS.test(line) || line.includes('@') || line.includes('linkedin.com')) continue;

      if (line.includes('|') || line.includes('•') || /(?:student|developer|engineer)\s*(?:\||•|@|\/|at\s+)/i.test(line)) {
        const headlineLines = [line];
        let cur = i + 1;
        while (cur < lines.length) {
          const next = lines[cur];
          if (SECTION_HEADINGS.test(next)) break;
          if (LOCATION_PATTERNS.test(next) && !next.includes('|') && !next.includes('•')) {
            if (!candidateLocation) candidateLocation = next;
            break;
          }
          if (next.includes('|') || next.includes('•') || /(?:c\+\+|python|react|sql|java|building|developer|systems)/i.test(next)) {
            headlineLines.push(next);
            cur++;
          } else {
            break;
          }
        }
        candidateHeadline = headlineLines.join(' ').replace(/\s+/g, ' ').trim();

        if (i > 0 && !SECTION_HEADINGS.test(lines[i - 1]) && !CERT_PATTERNS.test(lines[i - 1]) && !lines[i - 1].includes('@') && !lines[i - 1].includes('linkedin.com')) {
          candidateName = lines[i - 1];
        }
        break;
      }
    }
  }

  // Approach 3: Standalone candidate name search if not yet resolved
  if (!candidateName) {
    for (const l of lines) {
      if (
        !SECTION_HEADINGS.test(l) &&
        !CERT_PATTERNS.test(l) &&
        !l.includes('linkedin.com') &&
        !l.includes('@') &&
        l.length > 2 &&
        l.length < 40 &&
        /^[A-Z][a-zA-Z\s.-]+$/.test(l)
      ) {
        candidateName = l;
        break;
      }
    }
  }

  return {
    candidateName: candidateName || undefined,
    candidateHeadline: candidateHeadline || undefined,
    candidateLocation: candidateLocation || undefined,
  };
}

/**
 * Extracts comprehensive debug information from parsed PDF text for transparency and verification.
 */
export function extractPdfDebugInfo(text: string, profile: { candidateName?: string; candidateHeadline?: string; candidateLocation?: string }): PdfDebugInfo {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const SECTION_HEADINGS = /^(?:Contact|Top Skills|Skills|Certifications|Summary|About|Education|Experience|Projects|Languages|Honors-Awards)$/i;

  const sections: Record<string, string[]> = {};
  let currentSection: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const match = l.match(/^(Contact|Top Skills|Skills|Certifications|Summary|About|Education|Experience|Projects)$/i);
    if (match) {
      currentSection = match[1].toLowerCase();
      sections[currentSection] = [];
    } else if (currentSection) {
      // If line is candidate's name or headline, terminate prior section
      if (profile.candidateName && l === profile.candidateName) {
        currentSection = null;
        continue;
      }
      sections[currentSection].push(l);
    }
  }

  // Skills
  const explicitSkills = (sections['top skills'] || sections['skills'] || []).filter((s) => !SECTION_HEADINGS.test(s));
  const KNOWN_TECH = ['git', 'github', 'algorithms', 'data structures', 'c++', 'python', 'react', 'sql', 'typescript', 'javascript', 'ai/ml', 'generative ai', 'full-stack'];
  const textLower = text.toLowerCase();
  const summaryTechSkills = KNOWN_TECH.filter((k) => textLower.includes(k));
  const detectedSkills = Array.from(new Set([...explicitSkills, ...summaryTechSkills]));

  // Certifications
  const detectedCertifications = (sections['certifications'] || []).filter((c) => !SECTION_HEADINGS.test(c));

  // Education
  const detectedEducation = (sections['education'] || []).join(' ') || 'Not detected';

  // Summary / About
  const aboutLines = sections['summary'] || sections['about'] || [];
  const detectedAbout = aboutLines.join(' ') || 'Not detected';

  // Experience
  const expLines = sections['experience'] || [];
  const detectedExperience = expLines.join(' ') || 'None detected (student / early career profile)';

  return {
    detectedName: profile.candidateName || 'Not detected',
    detectedHeadline: profile.candidateHeadline || 'Not detected',
    detectedAbout: detectedAbout.length > 200 ? `${detectedAbout.slice(0, 200)}...` : detectedAbout,
    detectedSkills,
    detectedCertifications,
    detectedEducation,
    detectedExperience,
  };
}

/**
 * Decodes PDF hex encoded strings (<48656c6c6f>), including UTF-16BE with or without BOM,
 * and Windows-1252 bullets and dashes.
 */
export function decodePdfHexString(cleanHex: string): string {
  cleanHex = cleanHex.replace(/\s+/g, '');
  if (cleanHex.length === 0) return '';
  if (cleanHex.length % 2 !== 0) cleanHex += '0';

  // Check UTF-16BE with BOM FEFF
  if (cleanHex.toUpperCase().startsWith('FEFF')) {
    let str = '';
    for (let i = 4; i <= cleanHex.length - 4; i += 4) {
      const code = parseInt(cleanHex.substring(i, i + 4), 16);
      if (code >= 32 && code !== 127) str += String.fromCharCode(code);
      else if (code === 10 || code === 13) str += '\n';
      else if (code === 9) str += ' ';
    }
    return str;
  }

  // Check UTF-16BE without BOM (common in PDF strings where alternate bytes are 00)
  if (cleanHex.length >= 4 && cleanHex.substring(0, 2) === '00') {
    let str = '';
    for (let i = 0; i <= cleanHex.length - 4; i += 4) {
      const code = parseInt(cleanHex.substring(i, i + 4), 16);
      if (code >= 32 && code !== 127) str += String.fromCharCode(code);
      else if (code === 10 || code === 13) str += '\n';
      else if (code === 9) str += ' ';
    }
    if (str.length > 0) return str;
  }

  // Standard 1-byte ASCII / Latin-1 / Windows-1252 hex
  let str = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    const code = parseInt(cleanHex.substring(i, i + 2), 16);
    if (code === 0x95) str += '•';
    else if (code === 0x96) str += '–';
    else if (code === 0x97) str += '—';
    else if (code >= 32 && code <= 126) str += String.fromCharCode(code);
    else if (code >= 160) str += String.fromCharCode(code);
    else if (code === 10 || code === 13) str += '\n';
    else if (code === 9) str += ' ';
  }
  return str;
}

/**
 * Decompresses a FlateDecode (zlib/deflate) byte buffer using synchronous pako.
 */
export function decompressFlate(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return '';
  try {
    const decompressed = inflate(bytes);
    return new TextDecoder('latin1').decode(decompressed);
  } catch {
    try {
      const decompressed = inflateRaw(bytes);
      return new TextDecoder('latin1').decode(decompressed);
    } catch {
      return '';
    }
  }
}

/**
 * Extracts text operators ((text) Tj, <hex> Tj, [(text) 12 <hex>] TJ, and newline operators) from PDF stream text.
 * Accurately handles horizontal spacing (space ' ') vs vertical line breaks ('\n').
 */
export function extractTextFromOperators(streamContent: string): string[] {
  const parts: string[] = [];

  const regex = /(?:([-\d.]+)\s+([-\d.]+)\s+(Td|TD))|\[([\s\S]*?)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|['"])|<([0-9a-fA-F\s]+)>\s*(?:Tj|['"])|\b(T\*|ET)\b/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(streamContent)) !== null) {
    if (match[3] !== undefined) {
      // Td / TD: check if vertical displacement represents newline or horizontal space
      const y = parseFloat(match[2]);
      if (Math.abs(y) > 3) {
        parts.push('\n');
      } else {
        parts.push(' ');
      }
    } else if (match[4] !== undefined) {
      // TJ array: match both (...) literal and <...> hex strings
      const inner = match[4];
      const tokenRegex = /\(((?:[^()\\]|\\.)*)\)|<([0-9a-fA-F\s]+)>/g;
      let tjText = '';
      let tm: RegExpExecArray | null;
      while ((tm = tokenRegex.exec(inner)) !== null) {
        if (tm[1] !== undefined) {
          const s = tm[1]
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\r/g, ' ')
            .replace(/\\n/g, ' ')
            .replace(/\\t/g, ' ');
          tjText += s;
        } else if (tm[2] !== undefined) {
          tjText += decodePdfHexString(tm[2]);
        }
      }
      const trimmed = tjText.trim();
      if (trimmed) parts.push(trimmed);
    } else if (match[5] !== undefined) {
      // Literal string (...) Tj / ' / "
      const s = match[5]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\r/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .trim();
      if (s) parts.push(s);
    } else if (match[6] !== undefined) {
      // Hex string <...> Tj / ' / "
      const s = decodePdfHexString(match[6]).trim();
      if (s) parts.push(s);
    } else if (match[7] !== undefined) {
      // Text positioning / line breaking operators (T*, ET)
      parts.push('\n');
    }
  }

  return parts;
}

export async function validateAndExtractLinkedInPdf(file: File): Promise<PdfValidationResult> {
  // 1. File type validation
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload an authentic PDF (.pdf) exported from LinkedIn.',
    };
  }

  // 2. File size validation (Min > 0, Max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size === 0) {
    return { isValid: false, error: 'The selected PDF file is empty (0 bytes).' };
  }
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please upload a standard LinkedIn profile PDF.',
    };
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 3. Header signature validation
  try {
    const headerBuffer = await file.slice(0, 8).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    const headerStr = String.fromCharCode(...headerBytes);
    if (!headerStr.startsWith('%PDF-')) {
      return {
        isValid: false,
        error: 'Corrupted or unreadable PDF: Missing %PDF- file header signature.',
      };
    }

    const fullBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fullBuffer);
    const latin1Decoder = new TextDecoder('latin1');
    const rawPdfString = latin1Decoder.decode(bytes);

    const extractedTextParts: string[] = [];

    // Extract from uncompressed operators in raw string
    const rawOperators = extractTextFromOperators(rawPdfString);
    if (rawOperators.length > 0) {
      extractedTextParts.push(...rawOperators);
    }

    // Locate and decompress FlateDecode streams
    let searchIndex = 0;
    while (searchIndex < bytes.length) {
      // Find 'stream'
      const streamPos = rawPdfString.indexOf('stream', searchIndex);
      if (streamPos === -1) break;

      // Ensure it's a stream keyword (preceded by whitespace/newline)
      let streamDataStart = streamPos + 6;
      if (rawPdfString[streamDataStart] === '\r' && rawPdfString[streamDataStart + 1] === '\n') {
        streamDataStart += 2;
      } else if (rawPdfString[streamDataStart] === '\n' || rawPdfString[streamDataStart] === '\r') {
        streamDataStart += 1;
      }

      const endstreamPos = rawPdfString.indexOf('endstream', streamDataStart);
      if (endstreamPos === -1) break;

      // Extract dictionary before stream strictly within the current object
      const lastObjPos = rawPdfString.lastIndexOf('obj', streamPos);
      const dictSnippet =
        lastObjPos !== -1 && streamPos - lastObjPos < 1000
          ? rawPdfString.slice(lastObjPos, streamPos)
          : rawPdfString.slice(Math.max(0, streamPos - 300), streamPos);

      // Skip ONLY streams that are explicitly non-text (Images, FontFiles, XRef)
      const isNonText =
        /\/Subtype\s*\/(?:Image|Type1C|CIDFontType0C|Type3)/i.test(dictSnippet) ||
        /\/Type\s*\/(?:XRef|FontDescriptor)/i.test(dictSnippet) ||
        /\/FontFile[23]?\b/i.test(dictSnippet);

      if (isNonText) {
        searchIndex = endstreamPos + 9;
        continue;
      }

      // Check stream length from dictionary if present (direct or indirect reference)
      let specifiedLength: number | null = null;
      const directLengthMatch = dictSnippet.match(/\/Length\s+(\d+)\b(?!\s+\d+\s+R)/);
      if (directLengthMatch) {
        specifiedLength = parseInt(directLengthMatch[1], 10);
      } else {
        const indirectMatch = dictSnippet.match(/\/Length\s+(\d+)\s+0\s+R/);
        if (indirectMatch) {
          const objNum = indirectMatch[1];
          const objRegex = new RegExp(`\\b${objNum}\\s+0\\s+obj\\s*(\\d+)\\s*endobj`, 'i');
          const objMatch = rawPdfString.match(objRegex);
          if (objMatch) {
            specifiedLength = parseInt(objMatch[1], 10);
          }
        }
      }

      let actualEnd = endstreamPos;
      // Trim trailing CR / LF / space before endstream
      while (
        actualEnd > streamDataStart &&
        (rawPdfString[actualEnd - 1] === '\n' || rawPdfString[actualEnd - 1] === '\r' || rawPdfString[actualEnd - 1] === ' ')
      ) {
        actualEnd--;
      }

      let streamBytes: Uint8Array;
      if (specifiedLength && specifiedLength > 0 && streamDataStart + specifiedLength <= bytes.length) {
        streamBytes = bytes.subarray(streamDataStart, streamDataStart + specifiedLength);
      } else {
        streamBytes = bytes.subarray(streamDataStart, actualEnd);
      }

      const isFlate = /FlateDecode/i.test(dictSnippet);
      const hasFilter = /Filter/i.test(dictSnippet);

      if (streamBytes.length > 0) {
        if (isFlate) {
          try {
            let decompressed = decompressFlate(streamBytes);
            // If specifiedLength slice failed, fallback to actualEnd slice
            if (!decompressed && specifiedLength && streamBytes.length !== (actualEnd - streamDataStart)) {
              decompressed = decompressFlate(bytes.subarray(streamDataStart, actualEnd));
            }
            if (decompressed) {
              const decompressedOperators = extractTextFromOperators(decompressed);
              if (decompressedOperators.length > 0) {
                extractedTextParts.push(...decompressedOperators);
              } else {
                // Extract clean ASCII printable strings if text operators aren't direct
                const words = decompressed.match(/[A-Za-z0-9 .,/\\-_:;@()#&+'"–—]{3,}/g) || [];
                const cleanWords = words.filter(
                  (w) =>
                    !w.startsWith('obj') &&
                    !w.startsWith('endobj') &&
                    !w.includes('Font') &&
                    !w.includes('Filter') &&
                    !w.includes('Type')
                );
                if (cleanWords.length > 3) {
                  extractedTextParts.push(cleanWords.join(' '));
                }
              }
            }
          } catch {
            // Ignore single stream failure cleanly
          }
        } else if (!hasFilter) {
          // Uncompressed text stream
          const plainText = latin1Decoder.decode(streamBytes);
          const plainOps = extractTextFromOperators(plainText);
          if (plainOps.length > 0) {
            extractedTextParts.push(...plainOps);
          }
        }
      }

      searchIndex = endstreamPos + 9;
    }

    // Preserve newlines and spacing across operators
    const rawExtractedText = extractedTextParts
      .reduce((acc, part) => {
        if (part === '\n') {
          return acc.endsWith('\n') ? acc : acc + '\n';
        }
        return acc ? (acc.endsWith('\n') ? acc + part : acc + ' ' + part) : part;
      }, '')
      .trim();

    const normalizedText = normalizePdfText(rawExtractedText);
    const extractedText = normalizedText || rawExtractedText;

    // Fallback if structured stream extraction gave very little text
    let finalText = extractedText;
    if (finalText.length < 50) {
      const generalStrings = rawPdfString.match(/[A-Za-z0-9 .,/\\-_:;@()#&+'"–—]{4,}/g) || [];
      const filtered = generalStrings.filter(
        (s) =>
          !s.startsWith('obj') &&
          !s.startsWith('endobj') &&
          !s.startsWith('xref') &&
          !s.startsWith('stream') &&
          !s.includes('Font') &&
          !s.includes('Filter') &&
          !s.includes('Linearized')
      );
      finalText = filtered.slice(0, 200).join(' ').trim();
    }

    if (finalText.length < 30) {
      return {
        isValid: false,
        error:
          'The uploaded PDF does not contain extractable profile text. Please export your profile directly from LinkedIn using More -> Save to PDF.',
      };
    }

    // Candidate Identity extraction
    const candidateProfile = extractCandidateProfile(finalText);
    const candidateName = candidateProfile.candidateName;
    const candidateHeadline = candidateProfile.candidateHeadline;
    const candidateLocation = candidateProfile.candidateLocation;

    // Detect sections semantically
    const detectedSections = SEMANTIC_SECTIONS
      .filter((sec) => {
        if (sec.id === 'Headline' && candidateHeadline) return true;
        return sec.patterns.some((p) => p.test(finalText));
      })
      .map((s) => s.id);

    const STANDARD_AUDIT_SECTIONS = ['Headline', 'Summary', 'Skills', 'Education', 'Certifications', 'Experience'];
    const missingSections = STANDARD_AUDIT_SECTIONS.filter((sec) => !detectedSections.includes(sec));

    const debugInfo = extractPdfDebugInfo(finalText, candidateProfile);

    return {
      isValid: true,
      fileSizeFormatted: formatSize(file.size),
      detectedSections,
      missingSections,
      extractedText: finalText,
      rawExtractedText,
      normalizedText: finalText,
      candidateName,
      candidateHeadline,
      candidateLocation,
      debugInfo,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to read PDF file: ${err?.message || 'Unknown read error'}`,
    };
  }
}

