import { inflate, inflateRaw } from 'pako';
import { normalizePdfText } from './pdfTextExtractor';

export interface ResumeExtractedData {
  isValid: boolean;
  error?: string;
  fileName: string;
  fileType: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  extractedText: string;
  rawExtractedText: string;
  candidateName: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  detectedSections: string[];
  missingSections: string[];
  skillsList: string[];
  formattingIssues: string[];
  wordCount: number;
}

export interface ResumeATSAnalysisResult {
  score: number;
  evaluation: string;
  breakdown: Array<{ label: string; score: number; max: number }>;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  formattingIssues: string[];
  recommendations: Array<{ priority: number; title: string; desc: string }>;
  candidateName: string;
  targetRole: string;
  fileName: string;
  extractedSections: Record<string, string>;
  rawText: string;
}

// Common comprehensive technical keywords taxonomy
const KNOWN_TECH_KEYWORDS: string[] = [
  'typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'bash', 'shell',
  'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'asp.net', 'flutter', 'react native', 'tailwind css', 'redux',
  'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'cassandra', 'dynamodb', 'firebase', 'supabase', 'prisma', 'graphql',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab', 'ci/cd', 'linux', 'terraform', 'nginx', 'microservices', 'distributed systems',
  'data structures', 'algorithms', 'system design', 'rest apis', 'unit testing', 'test-driven development', 'tdd', 'agile', 'scrum', 'object-oriented programming', 'oop',
  'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'computer vision', 'devops', 'cloud architecture'
];

/**
 * Validates the uploaded file is an authentic PDF file within limits.
 */
export async function validateResumePdfFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload an authentic PDF (.pdf) resume.',
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected PDF file is empty (0 bytes).' };
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please upload a standard resume PDF under 10MB.',
    };
  }

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
  } catch (err: any) {
    return {
      isValid: false,
      error: `Could not read file header: ${err?.message || 'Read error'}`,
    };
  }

  return { isValid: true };
}

function decodePdfHexString(cleanHex: string): string {
  cleanHex = cleanHex.replace(/\s+/g, '');
  if (cleanHex.length === 0) return '';
  if (cleanHex.length % 2 !== 0) cleanHex += '0';

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

function extractTextFromOperators(streamContent: string): string[] {
  const parts: string[] = [];
  const regex = /(?:([-\d.]+)\s+([-\d.]+)\s+(Td|TD))|\[([\s\S]*?)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|['"])|<([0-9a-fA-F\s]+)>\s*(?:Tj|['"])|\b(T\*|ET)\b/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(streamContent)) !== null) {
    if (match[3] !== undefined) {
      const y = parseFloat(match[2]);
      if (Math.abs(y) > 3) {
        parts.push('\n');
      } else {
        parts.push(' ');
      }
    } else if (match[4] !== undefined) {
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
      const s = match[5]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\r/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .trim();
      if (s) parts.push(s);
    } else if (match[6] !== undefined) {
      const s = decodePdfHexString(match[6]).trim();
      if (s) parts.push(s);
    } else if (match[7] !== undefined) {
      parts.push('\n');
    }
  }

  return parts;
}

/**
 * Extracts and normalizes text from a resume PDF file.
 */
export async function extractResumePdfData(file: File): Promise<ResumeExtractedData> {
  const validation = await validateResumePdfFile(file);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error || 'Invalid PDF file',
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSizeFormatted: formatBytes(file.size),
      fileSizeBytes: file.size,
      extractedText: '',
      rawExtractedText: '',
      candidateName: '',
      detectedSections: [],
      missingSections: [],
      skillsList: [],
      formattingIssues: ['Unable to read PDF file format'],
      wordCount: 0,
    };
  }

  try {
    const fullBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fullBuffer);
    const latin1Decoder = new TextDecoder('latin1');
    const rawPdfString = latin1Decoder.decode(bytes);

    const extractedTextParts: string[] = [];

    // 1. Uncompressed operators in raw string
    const rawOperators = extractTextFromOperators(rawPdfString);
    if (rawOperators.length > 0) {
      extractedTextParts.push(...rawOperators);
    }

    // 2. Decompress Flate streams
    let searchIndex = 0;
    while (searchIndex < bytes.length) {
      const streamPos = rawPdfString.indexOf('stream', searchIndex);
      if (streamPos === -1) break;

      let streamDataStart = streamPos + 6;
      if (rawPdfString[streamDataStart] === '\r' && rawPdfString[streamDataStart + 1] === '\n') {
        streamDataStart += 2;
      } else if (rawPdfString[streamDataStart] === '\n' || rawPdfString[streamDataStart] === '\r') {
        streamDataStart += 1;
      }

      const endstreamPos = rawPdfString.indexOf('endstream', streamDataStart);
      if (endstreamPos === -1) break;

      const lastObjPos = rawPdfString.lastIndexOf('obj', streamPos);
      const dictSnippet =
        lastObjPos !== -1 && streamPos - lastObjPos < 1000
          ? rawPdfString.slice(lastObjPos, streamPos)
          : rawPdfString.slice(Math.max(0, streamPos - 300), streamPos);

      const isNonText =
        /\/Subtype\s*\/(?:Image|Type1C|CIDFontType0C|Type3)/i.test(dictSnippet) ||
        /\/Type\s*\/(?:XRef|FontDescriptor)/i.test(dictSnippet) ||
        /\/FontFile[23]?\b/i.test(dictSnippet);

      if (isNonText) {
        searchIndex = endstreamPos + 9;
        continue;
      }

      let specifiedLength: number | null = null;
      const directLengthMatch = dictSnippet.match(/\/Length\s+(\d+)\b(?!\s+\d+\s+R)/);
      if (directLengthMatch) {
        specifiedLength = parseInt(directLengthMatch[1], 10);
      }

      let actualEnd = endstreamPos;
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
            if (!decompressed && specifiedLength && streamBytes.length !== actualEnd - streamDataStart) {
              decompressed = decompressFlate(bytes.subarray(streamDataStart, actualEnd));
            }
            if (decompressed) {
              const decompressedOperators = extractTextFromOperators(decompressed);
              if (decompressedOperators.length > 0) {
                extractedTextParts.push(...decompressedOperators);
              } else {
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
            // Ignore single stream error
          }
        } else if (!hasFilter) {
          const plainText = latin1Decoder.decode(streamBytes);
          const plainOps = extractTextFromOperators(plainText);
          if (plainOps.length > 0) {
            extractedTextParts.push(...plainOps);
          }
        }
      }

      searchIndex = endstreamPos + 9;
    }

    const rawExtractedText = extractedTextParts
      .reduce((acc, part) => {
        if (part === '\n') {
          return acc.endsWith('\n') ? acc : acc + '\n';
        }
        return acc ? (acc.endsWith('\n') ? acc + part : acc + ' ' + part) : part;
      }, '')
      .trim();

    const normalizedText = normalizePdfText(rawExtractedText);
    let finalText = normalizedText || rawExtractedText;

    // Fallback if structured stream extraction gave sparse text
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
      finalText = filtered.slice(0, 300).join(' ').trim();
    }

    // Validation: text must be non-empty and substantive
    if (finalText.length < 30) {
      return {
        isValid: false,
        error: 'The uploaded PDF does not contain extractable resume text. Please ensure it is a text-based PDF and not a scanned image.',
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSizeFormatted: formatBytes(file.size),
        fileSizeBytes: file.size,
        extractedText: '',
        rawExtractedText: '',
        candidateName: '',
        detectedSections: [],
        missingSections: [],
        skillsList: [],
        formattingIssues: ['No extractable text found in PDF document.'],
        wordCount: 0,
      };
    }

    // Structure parsing
    const lines = finalText.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Email extraction
    const emailMatch = finalText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : undefined;

    // 2. Phone extraction
    const phoneMatch = finalText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    const phone = phoneMatch ? phoneMatch[0] : undefined;

    // 3. Links
    const linkedinMatch = finalText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const linkedin = linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : undefined;

    const githubMatch = finalText.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    const github = githubMatch ? `github.com/${githubMatch[1]}` : undefined;

    const portfolioMatch = finalText.match(/(?:portfolio|website|link)?\s*(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.vercel\.app|[a-zA-Z0-9-]+\.dev)/i);
    const portfolio = portfolioMatch ? portfolioMatch[1] : undefined;

    // 4. Candidate Name detection
    let candidateName = '';
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        !line.includes('@') &&
        !line.includes('http') &&
        !line.includes('www.') &&
        !line.includes('linkedin.com') &&
        !line.includes('github.com') &&
        !/(?:resume|curriculum|vitae|page|phone|mobile)/i.test(line) &&
        line.length >= 2 &&
        line.length <= 40
      ) {
        candidateName = line;
        break;
      }
    }
    if (!candidateName) {
      candidateName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    }

    // 5. Detect Sections
    const SECTION_PATTERNS: Record<string, RegExp> = {
      'Contact / Header': /(?:contact|email|phone|linkedin|github)/i,
      'Summary / Objective': /\b(?:summary|objective|professional summary|about me|profile)\b/i,
      'Education': /\b(?:education|academic background|qualifications|university|college|bachelor|b\.tech|degree|cgpa|gpa)\b/i,
      'Technical Skills': /\b(?:skills|technical skills|technologies|core competencies|programming languages)\b/i,
      'Projects': /\b(?:projects|key projects|academic projects|personal projects|featured projects)\b/i,
      'Experience': /\b(?:experience|work experience|employment|internships|professional experience)\b/i,
      'Certifications': /\b(?:certifications|certificates|licenses|training)\b/i,
      'Achievements': /\b(?:achievements|awards|honors|extracurricular|publications)\b/i,
    };

    const detectedSections: string[] = [];
    const missingSections: string[] = [];

    for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(finalText)) {
        detectedSections.push(sectionName);
      } else {
        missingSections.push(sectionName);
      }
    }

    // 6. Technical Skills Extraction
    const textLower = finalText.toLowerCase();
    const skillsList = KNOWN_TECH_KEYWORDS.filter((skill) => {
      const regex = new RegExp(`\\b${skill.replace(/\+/g, '\\+').replace(/\./g, '\\.')}\\b`, 'i');
      return regex.test(textLower);
    });

    // 7. Formatting / ATS Issues detection
    const formattingIssues: string[] = [];
    if (!email) formattingIssues.push('Contact email address not detected or formatted non-standardly.');
    if (!phone) formattingIssues.push('Phone number not clearly formatted or missing.');
    if (!detectedSections.includes('Education')) formattingIssues.push('Standard Education section heading missing.');
    if (!detectedSections.includes('Technical Skills')) formattingIssues.push('Dedicated Skills section heading missing.');
    if (!detectedSections.includes('Projects')) formattingIssues.push('Dedicated Projects section heading missing.');
    if (lines.length < 15) formattingIssues.push('Low content density: resume appears shorter than typical single-page format.');

    const words = finalText.trim().split(/\s+/).filter(Boolean);

    return {
      isValid: true,
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSizeFormatted: formatBytes(file.size),
      fileSizeBytes: file.size,
      extractedText: finalText,
      rawExtractedText,
      candidateName,
      email,
      phone,
      linkedin,
      github,
      portfolio,
      detectedSections,
      missingSections,
      skillsList,
      formattingIssues,
      wordCount: words.length,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to parse PDF document: ${err?.message || 'Read error'}`,
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSizeFormatted: formatBytes(file.size),
      fileSizeBytes: file.size,
      extractedText: '',
      rawExtractedText: '',
      candidateName: '',
      detectedSections: [],
      missingSections: [],
      skillsList: [],
      formattingIssues: ['Document parsing exception encountered.'],
      wordCount: 0,
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Performs accurate, isolated ATS compatibility analysis using ONLY the uploaded resume text and target JD.
 */
export function evaluateUploadedResumeATS(
  resume: ResumeExtractedData,
  targetJobDescription: string
): ResumeATSAnalysisResult {
  const jdLower = (targetJobDescription || '').toLowerCase();
  const resumeLower = resume.extractedText.toLowerCase();

  // Extract keywords mentioned in JD
  const jdKeywords = KNOWN_TECH_KEYWORDS.filter((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/\+/g, '\\+').replace(/\./g, '\\.')}\\b`, 'i');
    return regex.test(jdLower);
  });

  // If JD is short or generic, use standard target role expectations
  const expectedKeywords = jdKeywords.length >= 3 ? jdKeywords : [
    'typescript', 'react', 'node.js', 'sql', 'git', 'rest apis', 'data structures', 'docker'
  ];

  // Match keywords
  const matchedKeywords = resume.skillsList.filter((kw) => {
    return expectedKeywords.includes(kw) || jdLower.includes(kw);
  });

  // If matched keywords is low because JD didn't list specific skills, include top skills from resume
  const displayMatched = Array.from(
    new Set([...matchedKeywords, ...resume.skillsList.slice(0, 6)])
  ).slice(0, 10);

  // Missing keywords: expected in JD but missing in resume
  const missingKeywords = expectedKeywords.filter(
    (kw) => !resume.skillsList.includes(kw) && !resumeLower.includes(kw)
  ).slice(0, 8);

  // 1. Role Match score (0-25)
  let roleMatchScore = 15;
  if (resume.skillsList.length >= 6) roleMatchScore += 4;
  if (displayMatched.length >= 4) roleMatchScore += 4;
  if (resume.detectedSections.includes('Experience') || resume.detectedSections.includes('Projects')) roleMatchScore += 2;
  roleMatchScore = Math.min(25, Math.max(8, roleMatchScore));

  // 2. Keyword Match Density score (0-25)
  const matchRatio = expectedKeywords.length > 0 ? displayMatched.length / expectedKeywords.length : 0.6;
  let keywordScore = Math.round(matchRatio * 20) + 5;
  keywordScore = Math.min(25, Math.max(7, keywordScore));

  // 3. Layout Parseability (0-20)
  let layoutScore = 20;
  if (!resume.email) layoutScore -= 3;
  if (!resume.phone) layoutScore -= 2;
  if (resume.missingSections.includes('Education')) layoutScore -= 3;
  if (resume.missingSections.includes('Technical Skills')) layoutScore -= 4;
  if (resume.missingSections.includes('Projects')) layoutScore -= 3;
  layoutScore = Math.min(20, Math.max(6, layoutScore));

  // 4. Skills Alignment (0-15)
  let skillsScore = Math.min(15, Math.max(5, Math.round((resume.skillsList.length / 8) * 15)));

  // 5. Project & Experience Relevance (0-15)
  let projectScore = 10;
  if (resume.detectedSections.includes('Projects')) projectScore += 3;
  if (resume.detectedSections.includes('Experience')) projectScore += 2;
  // check for metrics in text (numbers, percentages)
  const hasMetrics = /\d+%\b|\d+\s*(?:users|ms|seconds|x|million|k)\b/i.test(resume.extractedText);
  if (hasMetrics) projectScore += 1;
  projectScore = Math.min(15, Math.max(6, projectScore));

  const totalScore = Math.min(100, Math.max(25, roleMatchScore + keywordScore + layoutScore + skillsScore + projectScore));

  const evaluation =
    totalScore >= 85
      ? 'Excellent Alignment'
      : totalScore >= 70
      ? 'Competitive with Minor Gaps'
      : totalScore >= 55
      ? 'Needs ATS Optimization'
      : 'Significant Gaps Detected';

  const breakdown = [
    { label: 'Target Role Match', score: roleMatchScore, max: 25 },
    { label: 'Keyword Match Density', score: keywordScore, max: 25 },
    { label: 'Layout Parseability', score: layoutScore, max: 20 },
    { label: 'Skills Alignment', score: skillsScore, max: 15 },
    { label: 'Project Relevance', score: projectScore, max: 15 },
  ];

  // Derive genuine strengths based on what was detected
  const strengths: string[] = [];
  if (resume.email && resume.phone) {
    strengths.push('ATS-compliant contact block: clean detection of candidate email, phone, and profile identifiers.');
  }
  if (resume.skillsList.length >= 4) {
    strengths.push(`Indexed ${resume.skillsList.length} verified technical keywords matching software engineering competencies.`);
  }
  if (resume.detectedSections.includes('Education')) {
    strengths.push('Standard Education section structured with recognizable academic keywords for automated scanners.');
  }
  if (resume.detectedSections.includes('Projects')) {
    strengths.push('Distinct Technical Projects section detected with architectural implementation details.');
  }
  if (hasMetrics) {
    strengths.push('Demonstrates quantifiable engineering metrics and outcome measurements.');
  }
  if (strengths.length === 0) {
    strengths.push('Clean single-column parsing layout allows standard text extraction by modern ATS scanners.');
  }

  // Derive genuine gaps based on missing elements
  const gaps: string[] = [];
  if (missingKeywords.length > 0) {
    gaps.push(`Missing role keywords found in JD: ${missingKeywords.slice(0, 4).join(', ')}.`);
  }
  if (!hasMetrics) {
    gaps.push('Limited quantifiable engineering metrics (e.g. latency reduction, scale, test coverage %) in bullet points.');
  }
  if (resume.missingSections.includes('Summary / Objective')) {
    gaps.push('Missing concise 2-3 sentence Professional Summary tailored to the target role.');
  }
  if (!resume.linkedin || !resume.github) {
    gaps.push('Public code evidence links (GitHub or LinkedIn) were not prominently identified in header.');
  }
  if (gaps.length === 0) {
    gaps.push('Expand bullet points using the XYZ impact formula ("Accomplished [X] as measured by [Y] by doing [Z]").');
  }

  // Derive prioritized recommendations
  const recommendations: Array<{ priority: number; title: string; desc: string }> = [];
  if (missingKeywords.length > 0) {
    recommendations.push({
      priority: 1,
      title: 'Incorporate Missing Role Keywords',
      desc: `Integrate high-frequency keywords (${missingKeywords.slice(0, 3).join(', ')}) into your Skills and Project descriptions.`,
    });
  }
  if (!hasMetrics) {
    recommendations.push({
      priority: recommendations.length + 1,
      title: 'Quantify Engineering Accomplishments',
      desc: 'Inject concrete metrics into project bullets (e.g., "reduced latency by 25%", "supported 1,000+ requests/sec").',
    });
  }
  if (resume.missingSections.length > 0) {
    recommendations.push({
      priority: recommendations.length + 1,
      title: 'Standardize Semantic Section Headings',
      desc: `Add explicit headings for: ${resume.missingSections.slice(0, 2).join(', ')} to ensure ATS parsers classify blocks correctly.`,
    });
  }
  if (recommendations.length < 3) {
    recommendations.push({
      priority: recommendations.length + 1,
      title: 'Single-Column Semantic Layout',
      desc: 'Maintain a single-column layout without graphical skill bars or non-standard icon fonts for 100% parser fidelity.',
    });
  }

  const rawText = `### ATS Compatibility & Keyword Diagnostic Report

**Candidate**: ${resume.candidateName}  
**Uploaded File**: \`${resume.fileName}\` (${resume.fileSizeFormatted})  
**ATS Compatibility Score**: **${totalScore} / 100** (${evaluation})

#### 1. Core Evaluation Breakdown
${breakdown.map((b) => `- **${b.label}**: ${b.score}/${b.max} (${Math.round((b.score / b.max) * 100)}%)`).join('\n')}

#### 2. Matched Role Keywords (${displayMatched.length})
${displayMatched.map((k) => `\`${k}\``).join(', ')}

#### 3. Missing High-Priority Keywords (${missingKeywords.length})
${missingKeywords.length > 0 ? missingKeywords.map((k) => `\`${k}\``).join(', ') : 'No critical keyword deficits identified.'}

#### 4. Presentation Strengths
${strengths.map((s) => `- ${s}`).join('\n')}

#### 5. Identified Gaps & Deficiencies
${gaps.map((g) => `- ${g}`).join('\n')}

#### 6. Actionable ATS Priority Fixes
${recommendations.map((r) => `#${r.priority} **${r.title}**: ${r.desc}`).join('\n')}`;

  return {
    score: totalScore,
    evaluation,
    breakdown,
    matchedKeywords: displayMatched,
    missingKeywords,
    strengths,
    gaps,
    formattingIssues: resume.formattingIssues,
    recommendations,
    candidateName: resume.candidateName,
    targetRole: 'Target Role (from Job Description)',
    fileName: resume.fileName,
    extractedSections: {
      detected: resume.detectedSections.join(', '),
      missing: resume.missingSections.join(', '),
    },
    rawText,
  };
}
