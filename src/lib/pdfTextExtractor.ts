import { inflate, inflateRaw } from 'pako';

/**
 * PDF Validation and Text Extraction Utility for LinkedIn Profile Exports
 * Robust parser supporting modern PDF streams, FlateDecode decompression via pako,
 * and text operator extraction without unhandled stream exceptions.
 */

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  fileSizeFormatted?: string;
  detectedSections?: string[];
  missingSections?: string[];
  extractedText?: string;
  candidateName?: string;
  candidateHeadline?: string;
  candidateLocation?: string;
}

const ALL_STANDARD_SECTIONS = [
  'Summary',
  'Experience',
  'Education',
  'Skills',
  'Certifications',
  'Contact',
  'Honors-Awards',
  'Languages',
  'Projects',
];

/**
 * Decompresses a FlateDecode (zlib/deflate) byte buffer using synchronous pako.
 * Synchronous execution ensures zero unhandled promise rejections or stream errors.
 */
function decompressFlate(bytes: Uint8Array): string {
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
 * Extracts text operators ((text) Tj and [(text)...] TJ) from PDF stream text.
 */
function extractTextFromOperators(streamContent: string): string[] {
  const matches: string[] = [];

  // (Text) Tj
  const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(streamContent)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      const clean = match[1]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\r/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .trim();
      if (clean) matches.push(clean);
    }
  }

  // [(Text) 12 (More)] TJ
  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(streamContent)) !== null) {
    const innerTj = match[1];
    const innerStrings = innerTj.match(/\(((?:[^()\\]|\\.)*)\)/g);
    if (innerStrings) {
      const assembled = innerStrings
        .map((s) =>
          s
            .slice(1, -1)
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\r/g, ' ')
            .replace(/\\n/g, ' ')
            .replace(/\\t/g, ' ')
        )
        .join('');
      if (assembled.trim().length > 0) {
        matches.push(assembled.trim());
      }
    }
  }

  // Hex encoded strings <48656c6c6f> Tj
  const hexTjRegex = /<([0-9a-fA-F\s]+)>\s*Tj/g;
  while ((match = hexTjRegex.exec(streamContent)) !== null) {
    const cleanHex = match[1].replace(/\s+/g, '');
    if (cleanHex.length % 2 === 0) {
      let str = '';
      for (let i = 0; i < cleanHex.length; i += 2) {
        const charCode = parseInt(cleanHex.substring(i, i + 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          str += String.fromCharCode(charCode);
        }
      }
      if (str.trim().length > 1) {
        matches.push(str.trim());
      }
    }
  }

  return matches;
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

      // Extract dictionary before stream
      const dictSnippet = rawPdfString.slice(Math.max(0, streamPos - 400), streamPos);

      // Skip non-text streams (Images, Fonts, XRef)
      const isNonText = /\/Subtype\s*\/(?:Image|Type1C|CIDFontType0C)|(?:\/Type\s*\/(?:XRef|Image|Font))/i.test(dictSnippet);
      if (isNonText) {
        searchIndex = endstreamPos + 9;
        continue;
      }

      // Check stream length from dictionary if present
      const lengthMatch = dictSnippet.match(/\/Length\s+(\d+)/);
      const specifiedLength = lengthMatch ? parseInt(lengthMatch[1], 10) : null;

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
            const decompressed = decompressFlate(streamBytes);
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
            // Ignore any single stream failure cleanly
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

    let extractedText = extractedTextParts.join(' ').trim();

    // Fallback if structured stream extraction gave very little text
    if (extractedText.length < 50) {
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
      extractedText = filtered.slice(0, 200).join(' ').trim();
    }

    if (extractedText.length < 30) {
      return {
        isValid: false,
        error:
          'The uploaded PDF does not contain extractable profile text. Please export your profile directly from LinkedIn using More -> Save to PDF.',
      };
    }

    // Detect sections present in the text
    const detectedSections = ALL_STANDARD_SECTIONS.filter((sec) => {
      const pattern = new RegExp(`\\b${sec.replace('-', '[- ]?')}\\b`, 'i');
      return pattern.test(extractedText);
    });

    const missingSections = ALL_STANDARD_SECTIONS.filter((sec) => !detectedSections.includes(sec));

    // Guess Candidate Identity from Header text
    let candidateName = '';
    let candidateHeadline = '';
    let candidateLocation = '';

    const lines = extractedText
      .split(/(?:\r?\n| {3,})/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1);

    if (lines.length > 0) {
      // Typically the first line or words in a LinkedIn PDF export is the name
      const nameCandidate = lines[0].replace(/^(Contact|Top Skills|Summary)\s+/i, '').trim();
      if (nameCandidate.length > 2 && nameCandidate.length < 40 && !/LinkedIn/i.test(nameCandidate)) {
        candidateName = nameCandidate;
      }
      if (lines.length > 1 && lines[1].length < 120) {
        candidateHeadline = lines[1];
      }
      if (lines.length > 2 && lines[2].length < 80 && /India|United States|Hyderabad|Bengaluru|Bangalore|Delhi|Mumbai|Pune|California|London|Toronto|Area/i.test(lines[2])) {
        candidateLocation = lines[2];
      }
    }

    return {
      isValid: true,
      fileSizeFormatted: formatSize(file.size),
      detectedSections,
      missingSections,
      extractedText,
      candidateName: candidateName || undefined,
      candidateHeadline: candidateHeadline || undefined,
      candidateLocation: candidateLocation || undefined,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to read PDF file: ${err?.message || 'Unknown read error'}`,
    };
  }
}
