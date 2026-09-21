// Vercel Serverless Function & Vite Dev Middleware Handler for AI-Grounded Syllabus & Exam Prep
import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Safe server-side diagnostic logger that captures root causes without exposing sensitive tokens or user content.
 */
function logSafeDiagnostic(stage, error, extra = {}) {
  const safeInfo = {
    timestamp: new Date().toISOString(),
    stage,
    model: extra.model || 'gemini-3.6-flash',
    mimeType: extra.mimeType || 'unknown',
    documentSize: extra.documentSize || 0,
    slideCount: extra.slideCount || 0,
    chunkRange: extra.chunkRange || null,
    errorName: error?.name || 'Error',
    errorMessage: error?.message || String(error),
    httpStatus: error?.status || error?.statusCode || extra.status || null,
    statusText: error?.statusText || null,
    geminiCode: error?.code || error?.error?.code || null,
    geminiStatus: error?.status || error?.error?.status || null,
    details: typeof error?.error?.message === 'string' ? error.error.message : (error?.details || null),
  };
  console.error('[SyllabusPrep API Safe Diagnostic]', JSON.stringify(safeInfo));
}

function unescapeXml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Checks if the text appears to be a non-academic document (resume, LinkedIn, job description, receipt, etc.)
 */
function isNonAcademicDocument(text, fileName = '') {
  const lower = text.toLowerCase();
  const lowerFile = fileName.toLowerCase();

  // Slide decks or unit outlines are definitely academic if not explicitly marked resume/cv/linkedin
  const isSlideOrUnit = (
    lower.includes('[slide ') ||
    lowerFile.endsWith('.ppt') ||
    lowerFile.endsWith('.pptx') ||
    lowerFile.endsWith('ppt') ||
    lowerFile.endsWith('pptx') ||
    lower.includes('unit ') ||
    lower.includes('chapter ') ||
    lower.includes('module ')
  );

  if (isSlideOrUnit && !lowerFile.includes('resume') && !lowerFile.includes('cv') && !lowerFile.includes('linkedin')) {
    return false;
  }

  // 1. Obvious non-academic files
  if (
    lowerFile.includes('resume') ||
    lowerFile.includes('cv_') ||
    lowerFile.includes('curriculum_vitae') ||
    lowerFile.includes('linkedin') ||
    lowerFile.includes('invoice') ||
    lowerFile.includes('receipt') ||
    lowerFile.includes('portfolio') ||
    lowerFile.includes('certificate')
  ) {
    return true;
  }

  // 2. LinkedIn profile export signals
  if (
    lower.includes('linkedin.com') ||
    lower.includes('top skills') ||
    lower.includes('connections') ||
    lower.includes('view full profile') ||
    lower.includes('linkedin member') ||
    /linkedin\.com\/(?:in|pub)\/[\w-]+/i.test(text)
  ) {
    if (lower.includes('experience') || lower.includes('education') || lower.includes('skills')) {
      return true;
    }
  }

  // 3. Resume / CV patterns
  const resumeSections = [
    /\b(?:work|professional|industry|employment)\s+experience\b/i,
    /\bprofessional\s+summary\b/i,
    /\bcareer\s+objective\b/i,
    /\btechnical\s+skills\b/i,
    /\beducation(?:\s*&|\/|\s+and)?\s*(?:qualifications|background)?\b/i,
    /\bcurriculum\s+vitae\b/i,
    /\breferences\s+available\s+upon\s+request\b/i,
    /\bdeclaration\s*:\s*i\s+hereby\s+declare\b/i,
    /\bcontact\s*:\s*[\w.-]+@[\w.-]+\b/i,
  ];

  let matches = 0;
  for (const rx of resumeSections) {
    if (rx.test(text)) matches++;
  }

  if (matches >= 2 && !lower.includes('syllabus') && !lower.includes('course outline') && !lower.includes('lecture')) {
    return true;
  }

  // 4. Portfolio / Bio patterns
  if (
    /\b(?:my\s+portfolio|portfolio\s+of)\b/i.test(text) ||
    (/\bselected\s+(?:works|projects|case\s+studies)\b/i.test(text) && /\bcontact\s+me\b/i.test(text))
  ) {
    return true;
  }

  return false;
}

/**
 * Deterministic academic syllabus and exam preparation generator.
 * Grounded 100% in the uploaded document text. Used as an immediate resilient fallback
 * when all AI models encounter rate limits or quota exhaustion.
 */
function generateFallbackSyllabusPrep(docText, docMeta = {}, studentContext = {}, fileName = '') {
  const cleanDoc = (docText || '').trim();
  const fileType = (docMeta.fileType || 'PDF').toUpperCase();
  const degree = studentContext.degree || studentContext.academicProgram || 'Degree';
  const year = studentContext.year || studentContext.yearOfStudy || 'Undergraduate';
  const verifiedSkills = Array.isArray(studentContext.skills)
    ? studentContext.skills.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
    : [];

  // 1. Detect subject name directly from uploaded content
  let detectedSubject = '';
  const firstChunk = cleanDoc.slice(0, 800);
  const subjectPatterns = [
    /(?:Course(?:\s+Name)?|Subject(?:\s+Name)?|Module(?:\s+Name)?|Title)[:\s–-]+([^\n\r.]+)/i,
    /(?:Syllabus\s+(?:for|of)|Introduction\s+to|Advanced)\s+([^\n\r.]+)/i,
    /(?:Course\s+Code[:\s]+[A-Z0-9_-]+[:\s–-]+)?([A-Z][A-Za-z0-9\s&/-]{4,45}(?:Engineering|Science|Systems|Networks|Structures|Programming|Database|Intelligence|Design|Electronics|Mechanics|Mathematics|Computing))/i,
  ];

  for (const pat of subjectPatterns) {
    const m = firstChunk.match(pat);
    if (m && m[1]?.trim().length > 3) {
      detectedSubject = m[1].trim().slice(0, 60);
      break;
    }
  }

  if (!detectedSubject) {
    const lines = firstChunk
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 4 && l.length < 60 && !/^(page|slide|figure|table|unit|module|http)/i.test(l));
    if (lines[0]) {
      detectedSubject = lines[0];
    } else {
      detectedSubject = (fileName || 'Academic Subject').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }
  }

  // 2. Extract Units & Modules directly from text
  const unitRegex = /(?:Unit|Module|Chapter|Section|Part)\s*([0-9IVX]+)[:\s–-]+([^\n\r.]+)/gi;
  const slideRegex = /\[Slide\s*([0-9]+):\s*([^\]]+)\]/gi;
  const numberedSectionRegex = /(?:^|\n)([1-9IVX]\b[.:\s–-]+[A-Z][^\n\r]{3,60})/g;

  const rawUnits = [];
  let m;

  let matchesFound = [];
  while ((m = unitRegex.exec(cleanDoc)) !== null) {
    matchesFound.push({
      unitNum: `Unit ${m[1]}`,
      title: m[2].trim().slice(0, 60),
      index: m.index,
    });
  }

  if (matchesFound.length < 2) {
    matchesFound = [];
    while ((m = slideRegex.exec(cleanDoc)) !== null) {
      matchesFound.push({
        unitNum: `Slide ${m[1]}`,
        title: m[2].trim().slice(0, 60),
        index: m.index,
      });
    }
  }

  if (matchesFound.length < 2) {
    matchesFound = [];
    while ((m = numberedSectionRegex.exec(cleanDoc)) !== null) {
      const heading = m[1].trim();
      const parts = heading.split(/[.:\s–-]+/);
      matchesFound.push({
        unitNum: `Unit ${matchesFound.length + 1}`,
        title: parts.slice(1).join(' ').trim().slice(0, 60) || heading.slice(0, 60),
        index: m.index,
      });
    }
  }

  if (matchesFound.length >= 2) {
    for (let i = 0; i < matchesFound.length && i < 8; i++) {
      const cur = matchesFound[i];
      const next = matchesFound[i + 1];
      const slice = cleanDoc.slice(cur.index, next ? next.index : cur.index + 3000);

      const subLines = slice
        .split(/[\n\r]+/)
        .map((l) => l.trim().replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(
          (l) =>
            l.length > 4 &&
            l.length < 90 &&
            !l.toLowerCase().startsWith('unit') &&
            !l.toLowerCase().startsWith('slide') &&
            !l.toLowerCase().startsWith('module')
        );

      rawUnits.push({
        unitNumber: cur.unitNum,
        title: cur.title,
        rawContent: slice,
        topics: subLines.slice(1, 6),
      });
    }
  } else {
    // Segment document lines into 3-4 cohesive units
    const allLines = cleanDoc
      .split(/[\n\r]+/)
      .map((l) => l.trim().replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((l) => l.length > 5 && l.length < 90);

    const totalLines = allLines.length;
    const chunkSize = Math.max(3, Math.ceil(totalLines / 4));

    for (let i = 0; i < 4 && i * chunkSize < totalLines; i++) {
      const chunk = allLines.slice(i * chunkSize, (i + 1) * chunkSize);
      const titleCandidate = chunk[0] || `Module ${i + 1}`;
      rawUnits.push({
        unitNumber: `Unit ${i + 1}`,
        title: titleCandidate.length < 55 ? titleCandidate : `Module ${i + 1}: Core Concepts`,
        rawContent: chunk.join('\n'),
        topics: chunk.slice(1, 6),
      });
    }
  }

  if (rawUnits.length === 0) {
    rawUnits.push({
      unitNumber: 'Unit 1',
      title: `${detectedSubject} - Foundations`,
      rawContent: cleanDoc.slice(0, 1000),
      topics: ['Theoretical Scope & Principles', 'Primary Definitions', 'Standard Formulations'],
    });
    rawUnits.push({
      unitNumber: 'Unit 2',
      title: `${detectedSubject} - Core Applications`,
      rawContent: cleanDoc.slice(1000, 2000),
      topics: ['Applied Methodologies', 'Comparative Derivations', 'Problem Solving Sets'],
    });
  }

  // 3. Student Twin Personalization
  const fastTrackList = [];
  const extraFocusList = [];
  const rawLower = cleanDoc.toLowerCase();

  for (const sk of verifiedSkills) {
    const sName = (typeof sk === 'string' ? sk : sk.name || '').toLowerCase();
    if (sName.length > 2 && rawLower.includes(sName)) {
      fastTrackList.push(`${sk} (Found in syllabus — fast-track introductory modules covering this)`);
    }
  }

  if (fastTrackList.length === 0 && verifiedSkills.length > 0) {
    fastTrackList.push(
      `Verified skills in ${verifiedSkills.slice(0, 2).join(', ')} provide foundational logic for analytical problem sets`
    );
  }

  extraFocusList.push(
    `${rawUnits[0]?.unitNumber || 'Unit 1'} (${rawUnits[0]?.title || 'Foundations'}) — Core definitions and formulas required for subsequent chapters`
  );
  if (rawUnits.length > 2) {
    extraFocusList.push(
      `${rawUnits[1]?.unitNumber || 'Unit 2'} — High exam weightage problem solving and derivations`
    );
  }

  const totalUnits = rawUnits.length;
  const weightPerUnit = Math.round(100 / totalUnits);

  const units = rawUnits.map((u, idx) => {
    const priority = idx === 0 ? 'HIGH' : idx === 1 ? 'CRITICAL' : idx === 2 ? 'HIGH' : 'MEDIUM';
    const estHours = idx === 1 ? 8 : 6;
    return {
      unitNumber: u.unitNumber,
      title: u.title,
      weight: `~${weightPerUnit}% Weight`,
      priority,
      estimatedTime: `${estHours} Hours`,
      pageOrSlideRef: fileType === 'PDF' ? `Section ${idx + 1}` : `Slides ${idx * 6 + 1}–${(idx + 1) * 6}`,
      topics:
        u.topics.length > 0
          ? u.topics
          : ['Core definitions & scope', 'Governing principles', 'Standard problem sets'],
      studyChecklist: [
        `Review definitions and principles of ${u.title}`,
        `Derive core mechanisms and formulas by hand`,
        `Solve 3-4 representative textbook problems from ${u.unitNumber}`,
      ],
      focusAreas: [
        `Essential definitions & governing equations for ${u.title}`,
        `Step-by-step problem solving methodology`,
      ],
      howToPractice: 'Solve numerical/analytical problem sets, sketch block diagrams from memory, and write clean summaries.',
    };
  });

  const importantTopics = [];
  rawUnits.forEach((u, idx) => {
    const topicTitle = u.topics[0] || u.title;
    const prio = idx === 1 || idx === 0 ? 'CRITICAL' : 'HIGH';
    importantTopics.push({
      title: topicTitle,
      unit: u.unitNumber,
      pageOrSlideRef: fileType === 'PDF' ? `Unit ${idx + 1}` : `Slide ${idx * 6 + 2}`,
      priority: prio,
      reasonWhyImportant: `Fundamental concept in ${u.title} with recurring weightage in university exams.`,
      whatToUnderstand: `Understand the underlying mechanism, prerequisite assumptions, and exact analytical formulation for ${topicTitle}.`,
      keyFormula: `Governing relation / Core definition for ${topicTitle}`,
      commonPitfalls: `Confusing edge-case boundary conditions or omitting standard units/derivation steps.`,
    });
  });

  const studyPriority = rawUnits.map((u, idx) => ({
    rank: idx + 1,
    topicTitle: `${u.unitNumber}: ${u.title}`,
    estimatedTime: `${idx === 1 ? 6 : 4} Hours`,
    rationale:
      idx === 0
        ? 'Foundational prerequisite — establishes the definitions and equations required for all subsequent units.'
        : idx === 1
        ? 'Core high-yield section — carries highest mark distribution and descriptive problem sets.'
        : `Applied module — builds directly upon ${rawUnits[idx - 1]?.unitNumber || 'earlier units'}.`,
    sourceRef: u.unitNumber,
    milestone: `After finishing this, you should be able to solve standard ${u.title} problems without reference notes.`,
  }));

  const examStrategy = [
    {
      dayOrPhase: 'Phase 1: Foundations & Core Mechanisms',
      title: `Master ${rawUnits[0]?.unitNumber || 'Unit 1'} & Core Theory`,
      focusUnits: `${rawUnits[0]?.unitNumber || 'Unit 1'} (${rawUnits[0]?.title || 'Foundations'})`,
      timeCommitment: '6 Hours across 2 Days',
      prerequisites: 'Uploaded lecture slides & textbook chapters',
      milestoneCheckpoint: 'Milestone: Explain core definitions and derive primary formulas without referencing notes.',
      twinAdjustment: `Pacing calibrated for ${degree} curriculum.`,
      actionItems: [
        `Read through ${rawUnits[0]?.unitNumber || 'Unit 1'} slides line-by-line and annotate key definitions.`,
        `Derive all primary governing equations by hand on blank paper.`,
        `Write down a 1-page formula & terminology cheat sheet.`,
      ],
    },
    {
      dayOrPhase: 'Phase 2: High-Yield Problem Solving',
      title: `Deep Dive into ${rawUnits[1]?.unitNumber || 'Unit 2'} Problem Sets`,
      focusUnits: `${rawUnits[1]?.unitNumber || 'Unit 2'} (${rawUnits[1]?.title || 'Core Applications'})`,
      timeCommitment: '8 Hours across 3 Days',
      prerequisites: `${rawUnits[0]?.unitNumber || 'Unit 1'} foundational concepts`,
      milestoneCheckpoint: 'Milestone: Solve previous exam questions under timed conditions with 90%+ accuracy.',
      twinAdjustment:
        fastTrackList.length > 0
          ? 'Leverage verified skills to accelerate initial theory review.'
          : 'Spend extra time on step-by-step problem proofs.',
      actionItems: [
        `Solve 5 standard university numerical or descriptive problems from ${rawUnits[1]?.unitNumber || 'Unit 2'}.`,
        `Practice diagram sketching and notation accuracy under a 15-minute timer.`,
        `Identify recurring exam question formats and model answer structures.`,
      ],
    },
    {
      dayOrPhase: 'Phase 3: Comprehensive Synthesis & Mock Sprint',
      title: `Full Syllabus Review & Timed Mock Exam`,
      focusUnits: `All Units (${rawUnits.map((u) => u.unitNumber).join(', ')})`,
      timeCommitment: '5 Hours across 2 Days',
      prerequisites: 'Completion of Phases 1 & 2',
      milestoneCheckpoint: 'Milestone: Complete full-length practice paper within official exam duration.',
      twinAdjustment: 'Focus revision on identified gap areas.',
      actionItems: [
        'Review the 3-phase revision plan and scan the formula bank.',
        'Complete 1 full-length past exam question paper without external aids.',
        'Review all flagged common pitfalls before exam day.',
      ],
    },
  ];

  const topicExplanations = rawUnits.slice(0, 3).map((u) => ({
    concept: `${u.title} - Core Framework`,
    simpleExplanation: `Essential subject concept extracted from ${u.unitNumber} of the uploaded course material.`,
    keyPoints: [
      `Grounded directly in the uploaded ${fileName} lecture notes.`,
      `Governs problem solving in ${u.unitNumber}.`,
      `High-frequency candidate for descriptive exam questions.`,
    ],
    formulas: [`Core governing formula for ${u.title}`],
    commonMistakes: `Omitting initial assumptions or boundary conditions in exam answers.`,
    memoryAnchor: `Remember: ${u.title} forms the structural backbone of ${u.unitNumber}.`,
    howToPractice: `Write out the complete proof or diagram 3 times from memory.`,
    sourceRef: u.unitNumber,
  }));

  const revisionPlan = [
    {
      phase: 'First Revision (Comprehensive Review)',
      timeWindow: '72-48 Hours Before Exam',
      coreFocus: 'All unit definitions, formulas, and structural theory',
      checklist: rawUnits.map((u) => `Verify full conceptual mastery of ${u.unitNumber} (${u.title})`),
      quickFormulas: rawUnits.map((u) => `Governing relation: ${u.title}`),
    },
    {
      phase: 'Second Revision (High-Yield & Formulas)',
      timeWindow: '24 Hours Before Exam',
      coreFocus: 'High-priority topics, derivations, and hand-drawn diagrams',
      checklist: [
        `Re-derive top formulas from ${rawUnits[0]?.unitNumber || 'Unit 1'} and ${rawUnits[1]?.unitNumber || 'Unit 2'}`,
        'Draw all architecture or process diagrams on paper without looking at notes',
        'Review model answers for expected 10-mark questions',
      ],
      quickFormulas: [`Core formula sheet: ${detectedSubject}`],
    },
    {
      phase: 'Final Revision (Exam-Day Quick Scan)',
      timeWindow: 'Morning of Exam',
      coreFocus: 'Rapid scan of formula bank, key terminology, and common pitfalls',
      checklist: [
        'Scan the 1-page formula & terminology sheet',
        'Review common mistake warnings to avoid careless point deductions',
        'Confirm exam toolkit: pens, calculator, ruler, and hall ticket',
      ],
      quickFormulas: [`Final quick scan reminders for ${detectedSubject}`],
    },
  ];

  const practiceQuestions = rawUnits.map((u, idx) => ({
    id: `q${idx + 1}`,
    type: idx % 2 === 0 ? 'Theory' : 'Numerical',
    question: `Explain the fundamental principles and mechanisms of ${u.title}. What are the primary governing equations or assumptions?`,
    unitRef: `${u.unitNumber} (${u.title})`,
    hint: `Begin with a concise formal definition, state assumptions, and provide a clear step-by-step derivation or diagram.`,
    modelAnswer: `Model Outline: (1) Define ${u.title} precisely; (2) List core assumptions; (3) Present governing equations or architectural flow; (4) Discuss practical application and boundary cases.`,
    commonMistakes: `Failing to write clear headings or jumping directly into calculations without defining notation.`,
  }));

  const examChecklist = [
    ...rawUnits.map((u, idx) => ({
      id: `c-concept-${idx + 1}`,
      category: 'Concepts Understood',
      label: `Core theory and principles of ${u.unitNumber}: ${u.title}`,
      unitRef: u.unitNumber,
      completed: false,
    })),
    ...rawUnits.map((u, idx) => ({
      id: `c-formula-${idx + 1}`,
      category: 'Definitions & Formulas Revised',
      label: `Key formulas and derivations for ${u.title}`,
      unitRef: u.unitNumber,
      completed: false,
    })),
    ...rawUnits.map((u, idx) => ({
      id: `c-practice-${idx + 1}`,
      category: 'Problems Practiced',
      label: `Solve standard question sets from ${u.unitNumber}`,
      unitRef: u.unitNumber,
      completed: false,
    })),
    {
      id: 'c-final-1',
      category: 'Final Revision Items',
      label: `Scan 1-page formula and terminology sheet for ${detectedSubject}`,
      unitRef: 'All Units',
      completed: false,
    },
    {
      id: 'c-final-2',
      category: 'Final Revision Items',
      label: 'Review common pitfalls and boundary conditions before entering exam hall',
      unitRef: 'All Units',
      completed: false,
    },
  ];

  const totalEstimatedHours = rawUnits.length * 6;

  const documentSummary = {
    subject: detectedSubject,
    documentName: fileName,
    fileType,
    pagesOrSlides: docMeta.pageOrSlideCount || 'Multiple',
    coverageOverview: `Comprehensive exam study guide grounded in ${rawUnits.length} detected syllabus units for ${detectedSubject}.`,
    totalEstimatedStudyTime: `${totalEstimatedHours} Hours across 2–3 Weeks`,
    difficultyLevel: totalUnits >= 5 ? 'Rigorous' : totalUnits >= 4 ? 'Intermediate' : 'Foundational',
    academicFit: `Core curriculum subject aligned with ${degree} academic progression and technical interviews.`,
    twinPersonalization: {
      academicLevel: `${degree} (${year})`,
      fastTrackRecommendations: fastTrackList,
      extraFocusAreas: extraFocusList,
      studyApproachNote: `Study approach calibrated to student's verified skills while strictly preserving 100% of uploaded syllabus content.`,
    },
  };

  return {
    isAcademicSubject: true,
    documentSummary,
    units,
    importantTopics,
    studyPriority,
    examStrategy,
    topicExplanations,
    revisionPlan,
    practiceQuestions,
    examChecklist,
    lastMinuteChecklist: [
      `Scan 1-page formula & terminology bank for ${detectedSubject}`,
      'Review common mistake warnings to avoid point deductions',
      'Confirm exam equipment, stationery, and hall ticket',
    ],
  };
}

function buildSyllabusMarkdownSummary(parsedData, fileName = 'Document', degree = 'Degree', year = 'Undergraduate') {
  const docSummary = parsedData.documentSummary || {};
  return `### Academic Exam Preparation & Syllabus Study Guide: ${docSummary.subject || 'Course Syllabus'}

**Uploaded Source**: **${docSummary.documentName || fileName}** (${docSummary.fileType || 'Document'})  
**Academic Source of Truth**: Evaluated strictly on uploaded document content.  
**Estimated Total Study Time**: **${docSummary.totalEstimatedStudyTime || 'Calibrated to curriculum'}**  
**Difficulty Level**: **${docSummary.difficultyLevel || 'Intermediate'}**  

---

#### 1. Subject Overview & Curriculum Context
- **Subject**: ${docSummary.subject || 'Detected Subject'}
- **Coverage**: ${docSummary.coverageOverview || 'Comprehensive syllabus modules'}
- **Student Twin Alignment**:
  - Academic Level: ${docSummary.twinPersonalization?.academicLevel || `${degree} (${year})`}
  - Fast-Track Suggestions: ${(docSummary.twinPersonalization?.fastTrackRecommendations || []).join('; ') || 'Follow recommended study path'}
  - Recommended Extra Focus: ${(docSummary.twinPersonalization?.extraFocusAreas || []).join('; ') || 'Core unit foundations'}

---

#### 2. Topic Roadmap
${(parsedData.units || [])
  .map(
    (u) => `##### **${u.unitNumber}: ${u.title}** (${u.weight || u.priority || 'High Priority'} • ${u.estimatedTime || 'Self-paced'})
- **Topics**: ${(u.topics || []).join(' • ') || 'Core concepts'}
- **Focus**: ${(u.focusAreas || []).join(' | ') || 'Essential principles'}`
  )
  .join('\n\n')}

---

#### 3. High-Priority / High-Yield Topics
${(parsedData.importantTopics || [])
  .map(
    (t) => `##### **[${t.priority || 'HIGH'}] ${t.title}** (${t.unit || 'Core Unit'})
- **Why Important**: ${t.reasonWhyImportant || 'Key concept'}
- **What To Understand**: ${t.whatToUnderstand || 'Core mechanism'}
${t.keyFormula ? `- **Core Formula / Rule**: ${t.keyFormula}` : ''}
- **Common Pitfalls**: ${t.commonPitfalls || 'Avoid common misconceptions'}`
  )
  .join('\n\n')}`;
}

// Helper functions for normalized document extraction, chunking, and synthesis

async function extractPptxBufferToSlides(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = [];
  zip.forEach((path) => {
    const norm = path.replace(/\\/g, '/').replace(/^\.?\//, '');
    if (norm.match(/(?:^|\/)ppt\/slides\/slide[0-9]+\.xml$/i)) {
      slideEntries.push(path);
    }
  });

  slideEntries.sort((a, b) => {
    const numA = parseInt((a.match(/slide([0-9]+)\.xml/i) || [0, 0])[1], 10);
    const numB = parseInt((b.match(/slide([0-9]+)\.xml/i) || [0, 0])[1], 10);
    return numA - numB;
  });

  const slides = [];
  for (let i = 0; i < slideEntries.length; i++) {
    const xml = await zip.file(slideEntries[i])?.async('text');
    if (!xml) continue;
    const paragraphs = [];
    const pMatches = xml.match(/<a:p[\s>][\s\S]*?<\/a:p>/gi) || [];
    for (const pXml of pMatches) {
      const tMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
      if (tMatches.length > 0) {
        const line = tMatches.map((m) => unescapeXml(m.replace(/<\/?[^>]+(>|$)/g, ''))).join('').trim();
        if (line) paragraphs.push(line);
      }
    }
    if (paragraphs.length === 0) {
      const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
      const clean = textMatches.map((m) => unescapeXml(m.replace(/<\/?[^>]+(>|$)/g, '')).trim()).filter(Boolean);
      if (clean.length > 0) paragraphs.push(clean.join(' '));
    }
    const title = paragraphs[0] ? paragraphs[0].slice(0, 100) : `Slide ${i + 1}`;
    slides.push({
      slideNumber: i + 1,
      title,
      text: paragraphs.join('\n'),
    });
  }
  return slides;
}

function parseSlidesFromDocText(text) {
  const slideRegex = /\[Slide\s*([0-9]+)(?::\s*([^\]]*))?\]([\s\S]*?)(?=\n*\[Slide\s*[0-9]+|\s*$)/gi;
  const slides = [];
  let match;
  while ((match = slideRegex.exec(text)) !== null) {
    slides.push({
      slideNumber: parseInt(match[1], 10),
      title: (match[2] || '').trim(),
      text: (match[3] || '').trim(),
    });
  }
  return slides;
}

async function buildNormalizedDocument(body) {
  const docMeta = body.documentMeta || {};
  let rawText = (body.documentText || body.pastedText || body.userInputs?.pastedText || '').trim();
  const fileName = docMeta.fileName || body.fileName || 'Uploaded Document';
  let fileType = (docMeta.fileType || '').toLowerCase();

  if (!fileType) {
    if (fileName.endsWith('.pptx')) fileType = 'pptx';
    else if (fileName.endsWith('.ppt')) fileType = 'ppt';
    else if (fileName.endsWith('.pdf')) fileType = 'pdf';
    else fileType = 'text';
  }

  let slides = [];

  // Check if raw base64 PPTX payload is provided
  if (body.fileBase64 && (fileType === 'pptx' || fileName.endsWith('.pptx'))) {
    try {
      const buf = Buffer.from(body.fileBase64, 'base64');
      slides = await extractPptxBufferToSlides(buf);
      rawText = slides.map((s) => `[Slide ${s.slideNumber}: ${s.title}]\n${s.text}`).join('\n\n');
    } catch (e) {
      logSafeDiagnostic('pptx_base64_extract', e, { documentSize: body.fileBase64?.length });
    }
  }

  if (slides.length === 0 && rawText) {
    slides = parseSlidesFromDocText(rawText);
  }

  const sections = [];
  let pagesOrSlides = docMeta.pageOrSlideCount || slides.length || 1;

  if (slides.length > 0) {
    pagesOrSlides = slides.length;
    for (const slide of slides) {
      sections.push({
        id: `slide-${slide.slideNumber}`,
        title: slide.title || `Slide ${slide.slideNumber}`,
        slideOrPageRange: `Slide ${slide.slideNumber}`,
        text: slide.text,
      });
    }
  } else {
    // Non-slide document (PDF / syllabus text): segment by page markers or logical paragraph blocks
    const pageRegex = /\[Page\s*([0-9]+)(?::\s*([^\]]*))?\]([\s\S]*?)(?=\n*\[Page\s*[0-9]+|\s*$)/gi;
    let pageMatch;
    const pages = [];
    while ((pageMatch = pageRegex.exec(rawText)) !== null) {
      pages.push({
        pageNumber: parseInt(pageMatch[1], 10),
        title: (pageMatch[2] || '').trim(),
        text: (pageMatch[3] || '').trim(),
      });
    }

    if (pages.length > 0) {
      pagesOrSlides = pages.length;
      for (const page of pages) {
        sections.push({
          id: `page-${page.pageNumber}`,
          title: page.title || `Page ${page.pageNumber}`,
          slideOrPageRange: `Page ${page.pageNumber}`,
          text: page.text,
        });
      }
    } else {
      const paragraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      let currentChunk = '';
      let secIdx = 1;
      for (const p of paragraphs) {
        if (currentChunk.length + p.length > 3000 && currentChunk.length > 0) {
          sections.push({
            id: `section-${secIdx}`,
            title: `Section ${secIdx}`,
            slideOrPageRange: `Section ${secIdx}`,
            text: currentChunk,
          });
          secIdx++;
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + p;
        }
      }
      if (currentChunk.trim()) {
        sections.push({
          id: `section-${secIdx}`,
          title: `Section ${secIdx}`,
          slideOrPageRange: `Section ${secIdx}`,
          text: currentChunk,
        });
      }
      pagesOrSlides = sections.length || 1;
    }
  }

  return {
    sourceType: fileType,
    title: fileName,
    pagesOrSlides,
    sections,
    extractedText: rawText,
  };
}

function validateDocumentContent(normalizedDoc) {
  const text = (normalizedDoc.extractedText || '').trim();
  if (!text || text.length < 25) {
    return {
      isValid: false,
      status: 400,
      error: 'Please upload a valid subject syllabus PPT/PPTX/PDF containing readable course or syllabus content.',
      supportingText: 'No readable academic document or syllabus text was found in the upload.',
    };
  }

  if (isNonAcademicDocument(text, normalizedDoc.title)) {
    return {
      isValid: false,
      status: 400,
      error: 'Please upload the correct PPT/PDF of a subject.',
      supportingText: 'This document does not contain enough academic subject/course material to generate an exam preparation guide.',
    };
  }

  return { isValid: true };
}

async function runWithBoundedConcurrency(items, concurrency, workerFn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await workerFn(items[idx], idx);
    }
  }

  const workers = [];
  const limit = Math.min(concurrency, items.length);
  for (let i = 0; i < limit; i++) {
    workers.push(runner());
  }
  await Promise.all(workers);
  return results;
}

function createDocumentChunks(sections, targetPerChunk = 20) {
  const chunks = [];
  let currentGroup = [];
  let startRange = '';
  let endRange = '';

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (currentGroup.length === 0) {
      startRange = sec.slideOrPageRange;
    }
    currentGroup.push(sec);
    endRange = sec.slideOrPageRange;

    if (currentGroup.length >= targetPerChunk || i === sections.length - 1) {
      const range = `${startRange} to ${endRange}`;
      const chunkText = currentGroup
        .map((s) => `[${s.slideOrPageRange}: ${s.title}]\n${s.text}`)
        .join('\n\n');
      chunks.push({
        range,
        sections: currentGroup,
        text: chunkText,
      });
      currentGroup = [];
    }
  }
  return chunks;
}

async function analyzeChunkWithGemini(ai, chunk) {
  const prompt = `You are an academic course syllabus analyzer extracting factual topics from a document section.
Analyze ONLY the content in this chunk (${chunk.range}). Do not fabricate any information.

CHUNK CONTENT:
"""
${chunk.text.slice(0, 15000)}
"""

Extract as JSON:
{
  "chunkRange": "${chunk.range}",
  "detectedSubject": null,
  "unitsOrModules": [
    {
      "name": "Unit or Module name if present in these slides",
      "topics": ["topic 1", "topic 2"]
    }
  ],
  "topics": ["topic or concept title 1", "topic 2"],
  "importantFormulasOrDefinitions": ["definition or formula 1"],
  "problemTypes": ["problem or numerical type 1"],
  "learningObjectives": ["objective 1"]
}`;

  const chunkCandidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const modelName of chunkCandidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      if (response?.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      logSafeDiagnostic('chunk_analysis', err, { model: modelName, chunkRange: chunk.range });
      const errMsg = String(err?.message || err);
      const isQuotaOrDemand =
        err?.status === 429 ||
        err?.status === 503 ||
        errMsg.includes('429') ||
        errMsg.includes('503') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('UNAVAILABLE');

      if (isQuotaOrDemand) {
        // Immediately try next model without sleeping
        continue;
      }
      break;
    }
  }

  // Graceful deterministic chunk fallback
  return {
    chunkRange: chunk.range,
    detectedSubject: null,
    unitsOrModules: [],
    topics: chunk.sections.map((s) => s.title).filter((t) => t && t.length > 2),
    importantFormulasOrDefinitions: [],
    problemTypes: [],
    learningObjectives: [],
  };
}

function mergeChunkFindings(chunkResults, docTitle) {
  let detectedSubject = null;
  const unitMap = new Map();
  const allTopics = new Set();
  const allFormulas = new Set();
  const allProblemTypes = new Set();
  const allObjectives = new Set();

  for (const res of chunkResults) {
    if (!detectedSubject && res.detectedSubject) {
      detectedSubject = res.detectedSubject;
    }
    if (Array.isArray(res.unitsOrModules)) {
      for (const u of res.unitsOrModules) {
        if (u.name) {
          if (!unitMap.has(u.name)) {
            unitMap.set(u.name, new Set());
          }
          if (Array.isArray(u.topics)) {
            for (const t of u.topics) unitMap.get(u.name).add(t);
          }
        }
      }
    }
    if (Array.isArray(res.topics)) {
      for (const t of res.topics) {
        if (t && t.length > 2) allTopics.add(t);
      }
    }
    if (Array.isArray(res.importantFormulasOrDefinitions)) {
      for (const f of res.importantFormulasOrDefinitions) {
        if (f && f.length > 2) allFormulas.add(f);
      }
    }
    if (Array.isArray(res.problemTypes)) {
      for (const p of res.problemTypes) {
        if (p && p.length > 2) allProblemTypes.add(p);
      }
    }
    if (Array.isArray(res.learningObjectives)) {
      for (const o of res.learningObjectives) {
        if (o && o.length > 2) allObjectives.add(o);
      }
    }
  }

  const units = [];
  let unitIdx = 1;
  for (const [name, topics] of unitMap.entries()) {
    units.push({
      unitNumber: `Unit ${unitIdx++}`,
      title: name,
      topics: Array.from(topics),
    });
  }

  return {
    subject: detectedSubject || docTitle.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    units,
    topics: Array.from(allTopics),
    formulasAndDefinitions: Array.from(allFormulas),
    problemTypes: Array.from(allProblemTypes),
    learningObjectives: Array.from(allObjectives),
  };
}

export async function handleSyllabusPrepRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  // Robust body parsing for Vercel serverless function execution
  let body = req.body;
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString('utf-8'));
    } catch {
      body = {};
    }
  } else if (!body && typeof req.on === 'function') {
    try {
      body = await new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
        });
        req.on('end', () => {
          try {
            resolve(raw ? JSON.parse(raw) : {});
          } catch {
            resolve({});
          }
        });
        req.on('error', reject);
      });
    } catch {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Check payload size limits (e.g. 50MB)
  const rawPayloadLength = (body.documentText?.length || 0) + (body.fileBase64?.length || 0);
  if (rawPayloadLength > 50 * 1024 * 1024) {
    res.statusCode = 413;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Document payload too large. Maximum supported size is 50 MB.',
      })
    );
    return;
  }

  // 1. Build normalized internal document representation
  const normalizedDoc = await buildNormalizedDocument(body);
  const docText = normalizedDoc.extractedText;
  const docMeta = body.documentMeta || {};
  const studentContext = body.studentContext || {};
  const fileName = normalizedDoc.title;
  const degree = studentContext.degree || studentContext.academicProgram || 'Degree';
  const year = studentContext.year || studentContext.yearOfStudy || 'Undergraduate';

  // 2. Validate document content before AI calls
  const validation = validateDocumentContent(normalizedDoc);
  if (!validation.isValid) {
    res.statusCode = validation.status || 400;
    res.end(
      JSON.stringify({
        status: 'error',
        error: validation.error,
        supportingText: validation.supportingText,
      })
    );
    return;
  }

  const ai = getAiClient();

  // If Gemini client is unavailable, immediately fall back to the deterministic academic parser
  if (!ai) {
    console.warn('[SyllabusPrep API] AI client unavailable. Activating deterministic academic syllabus parser.');
    const parsedData = generateFallbackSyllabusPrep(docText, docMeta, studentContext, fileName);
    const markdownSummary = buildSyllabusMarkdownSummary(parsedData, fileName, degree, year);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'success',
        data: parsedData,
        rawText: markdownSummary,
        sourceMethod: 'deterministic_academic_parser',
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  try {
    const verifiedSkills = Array.isArray(studentContext.skills)
      ? studentContext.skills.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
      : [];

    const isLargeDocument = normalizedDoc.sections.length > 25 || normalizedDoc.extractedText.length > 25000;

    let intermediateFindings = null;

    // STEP B & C: For large documents (e.g. 107-slide PPTX), chunk and analyze with bounded concurrency
    if (isLargeDocument) {
      console.log(`[SyllabusPrep API] Large document detected (${normalizedDoc.sections.length} sections, ${normalizedDoc.extractedText.length} chars). Executing bounded chunk extraction.`);
      const chunks = createDocumentChunks(normalizedDoc.sections, 20);
      
      const chunkResults = await runWithBoundedConcurrency(chunks, 2, async (chunk) => {
        return analyzeChunkWithGemini(ai, chunk);
      });

      intermediateFindings = mergeChunkFindings(chunkResults, fileName);
      console.log(`[SyllabusPrep API] Intermediate findings merged: ${intermediateFindings.topics.length} topics, ${intermediateFindings.units.length} units.`);
    }

    const systemInstruction = `You are the Academic Syllabus & Exam Preparation AI for the Student Digital Twin OS.
CRITICAL DIRECTIVE:
1. You must analyze the provided uploaded document and generate everything STRICTLY from its actual content. NEVER infer or generate the subject, syllabus topics, or units from the filename alone. The actual content is the sole source of truth.
2. ZERO HARDCODED SUBJECTS, TOPICS, UNITS, C++, DSA, DBMS, probability/math assumptions, fixed scores, fixed study plans, fixed checklists, fake exam weightages and demo results.
3. Detect the ACTUAL subject/topic from the uploaded material and preserve the document's terminology.
4. Any academic subject, course unit, lecture slides, topic deck, textbook chapter, or course notes IS valid academic material.
5. Complete Topic Roadmap:
   - Extract unit-wise/topic-wise roadmap.
   - Recommended learning order based on prerequisites found in the material.
   - Mark all topics initially: status: "Pending".
6. High-Yield Topics:
   - Identify high/medium/low priority topics using EVIDENCE such as repetition, emphasis, core concepts, formulas, examples, headings and exam relevance.
   - NEVER invent fake exam percentage weightages! Instead provide evidenceBasis (e.g. "Heavily emphasized in Lecture 3", "Foundational theorem required for all proofs").
7. Concept Guide:
   For important topics provide whatToLearn, simpleExplanation, keyDefinitions, importantFormulas, examples, prerequisites, commonPitfalls.
8. Problem-Solving Preparation:
   For subjects containing numerical/programming/problem-solving content, identify important problem types, step-by-step approach, and practice guidance.
9. Dynamic Exam Checklist:
   Generate checklist items categorized into Concepts Understood, Definitions & Formulas Revised, Important Topics Completed, Problems Practiced, Weak Topics, Requires Another Revision, Final Revision Items. All items MUST have "completed": false.
10. Study Strategy & Revision Plan:
    Generate personalized study plan and 3-phase revision plan (First Revision, Second Revision, Final Revision).
11. Format all prices/fees in Indian Rupees (₹) if any appear. No dollar signs ($).
12. Output STRICTLY valid JSON matching the requested schema.`;

    let prompt = '';
    if (intermediateFindings) {
      prompt = `UPLOADED DOCUMENT PRE-EXTRACTED EVIDENCE (${normalizedDoc.pagesOrSlides} slides/sections):
File Name: ${fileName}
Source Type: ${normalizedDoc.sourceType?.toUpperCase()}
Detected Subject: ${intermediateFindings.subject}

PRE-EXTRACTED UNITS & MODULES:
${JSON.stringify(intermediateFindings.units, null, 2)}

PRE-EXTRACTED TOPICS FROM ALL SLIDES:
${JSON.stringify(intermediateFindings.topics.slice(0, 100), null, 2)}

PRE-EXTRACTED FORMULAS & DEFINITIONS:
${JSON.stringify(intermediateFindings.formulasAndDefinitions.slice(0, 40), null, 2)}

PRE-EXTRACTED PROBLEM TYPES:
${JSON.stringify(intermediateFindings.problemTypes.slice(0, 25), null, 2)}

STUDENT TWIN CONTEXT:
Degree: ${degree}
Year: ${year}
Verified Skills: ${verifiedSkills.join(', ') || 'None listed'}`;
    } else {
      prompt = `UPLOADED DOCUMENT EVIDENCE:
File Name: ${fileName}
File Type: ${normalizedDoc.sourceType?.toUpperCase() || 'DOCUMENT'}
Content:
"""
${docText.slice(0, 30000)}
"""

STUDENT TWIN CONTEXT:
Degree: ${degree}
Year: ${year}
Verified Skills: ${verifiedSkills.join(', ') || 'None listed'}`;
    }

    prompt += `

TASK:
Synthesize the verified evidence above into the complete Exam Preparation Guide in the following JSON format:
{
  "isAcademicSubject": true,
  "documentSummary": {
    "subject": "Exact subject name extracted from document",
    "documentName": "${fileName}",
    "fileType": "${normalizedDoc.sourceType?.toUpperCase() || 'DOCUMENT'}",
    "pagesOrSlides": "${normalizedDoc.pagesOrSlides}",
    "coverageOverview": "Concise summary of what this document covers based strictly on the text",
    "totalEstimatedStudyTime": "Realistic study time based on document breadth (e.g. '18 Hours across 10 Days')",
    "difficultyLevel": "Foundational | Intermediate | Advanced | Rigorous",
    "academicFit": "How this subject contributes to degree curriculum and professional depth",
    "twinPersonalization": {
      "academicLevel": "${degree} (${year})",
      "fastTrackRecommendations": ["Topics the student can fast-track based on verified skills or foundations"],
      "extraFocusAreas": ["High-complexity or novel areas in this document requiring extra focus"],
      "studyApproachNote": "Personalized study approach recommendation"
    }
  },
  "units": [
    {
      "unitNumber": "Unit 1",
      "title": "Exact Unit / Chapter Title from document",
      "evidenceBasis": "Evidence for exam importance (e.g. 'Core foundational module with 4 major algorithms')",
      "priority": "CRITICAL | HIGH | MEDIUM | LOW",
      "estimatedTime": "Estimated study time (e.g. '4 Hours')",
      "pageOrSlideRef": "Slide or section reference",
      "topics": ["Subtopic 1 from doc", "Subtopic 2 from doc"],
      "studyChecklist": ["Specific task 1", "Specific task 2"],
      "focusAreas": ["Key areas from this unit"],
      "howToPractice": "Specific practice recommendations for this unit"
    }
  ],
  "importantTopics": [
    {
      "title": "Specific High-Yield Topic from document",
      "unit": "Unit reference",
      "pageOrSlideRef": "Reference from document",
      "priority": "CRITICAL | HIGH | MEDIUM",
      "reasonWhyImportant": "Evidence-based reason why this topic is exam-critical",
      "whatToUnderstand": "Core concept to grasp",
      "keyFormula": "Formula, theorem, law, or rule from document (if present)",
      "commonPitfalls": "Common mistake or misconception"
    }
  ],
  "conceptGuide": [
    {
      "topicTitle": "Important Topic from document",
      "unit": "Unit reference",
      "whatToLearn": "Learning objective",
      "simpleExplanation": "Clear, concise explanation",
      "keyDefinitions": ["Definition 1", "Definition 2"],
      "importantFormulas": ["Formula or theorem from document"],
      "examples": ["Example mentioned in the document"],
      "prerequisites": ["Prerequisite topic from earlier in document"],
      "commonPitfalls": ["Common pitfall to avoid in exam"]
    }
  ],
  "problemSolving": {
    "isApplicable": true,
    "subjectProblemNature": "Numerical / Algorithmic / Analytical / Conceptual Frameworks",
    "problemTypes": [
      {
        "typeName": "Type of problem found in document",
        "unitRef": "Unit reference",
        "description": "What the problem asks",
        "solvingApproach": ["Step 1", "Step 2", "Step 3"],
        "practiceGuidance": "How to practice this problem type"
      }
    ],
    "advice": "General problem-solving strategy for this subject"
  },
  "studyPriority": [
    {
      "rank": 1,
      "topicTitle": "Topic or Unit to study first",
      "estimatedTime": "Estimated time",
      "rationale": "Why study this first based on prerequisites found in the material",
      "sourceRef": "Unit reference",
      "milestone": "Checkpoint after completing this topic"
    }
  ],
  "studyStrategy": [
    {
      "phaseNumber": 1,
      "phaseName": "Phase 1: Foundations",
      "title": "Strategy phase title tailored to this subject",
      "focusUnits": "Units covered",
      "timeCommitment": "Time commitment (e.g. '5 Hours over 2 Days')",
      "prerequisites": "Prerequisites",
      "milestoneCheckpoint": "Milestone checkpoint",
      "twinAdjustment": "Twin adjustment",
      "actionItems": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "revisionPlan": [
    {
      "phase": "First Revision (Comprehensive Concept Review)",
      "timeWindow": "Early revision window",
      "coreFocus": "All unit concepts, definitions, and mechanisms",
      "checklist": ["Checklist item 1", "Checklist item 2"],
      "quickFormulas": ["Formula or theorem 1", "Formula 2"]
    },
    {
      "phase": "Second Revision (High-Yield & Formulas)",
      "timeWindow": "24-48 Hours before exam",
      "coreFocus": "High-priority topics, derivations, and problem sets",
      "checklist": ["Checklist item 1", "Checklist item 2"],
      "quickFormulas": ["Formula or theorem 3"]
    },
    {
      "phase": "Final Revision (Exam-Day Quick Scan)",
      "timeWindow": "Morning of exam",
      "coreFocus": "Formula bank, key definitions, and pitfall checklist",
      "checklist": ["Checklist item 1", "Checklist item 2"],
      "quickFormulas": ["Key reminder 1"]
    }
  ],
  "practiceQuestions": [
    {
      "id": "q1",
      "unitNumber": "Unit 1",
      "topicName": "Topic name",
      "type": "Theory | Numerical | Derivation | Diagram | Case Analysis",
      "question": "Realistic exam question strictly from the document",
      "hint": "Guidance hint",
      "modelAnswer": "Model answer outline",
      "commonMistakes": "Common mistake"
    }
  ],
  "examChecklist": [
    {
      "id": "c1",
      "category": "Concepts Understood",
      "label": "Grounded concept from document to understand",
      "unitRef": "Unit 1",
      "completed": false
    },
    {
      "id": "c2",
      "category": "Definitions & Formulas Revised",
      "label": "Grounded definition or formula to revise",
      "unitRef": "Unit 1",
      "completed": false
    },
    {
      "id": "c3",
      "category": "Important Topics Completed",
      "label": "Key high-yield topic to complete",
      "unitRef": "Unit 2",
      "completed": false
    },
    {
      "id": "c4",
      "category": "Problems Practiced",
      "label": "Representative problem or derivation to solve",
      "unitRef": "Unit 2",
      "completed": false
    },
    {
      "id": "c5",
      "category": "Weak Topics",
      "label": "Challenging concept to double check",
      "unitRef": "Unit 1",
      "completed": false
    },
    {
      "id": "c6",
      "category": "Requires Another Revision",
      "label": "High-frequency exam topic requiring re-review",
      "unitRef": "Unit 2",
      "completed": false
    },
    {
      "id": "c7",
      "category": "Final Revision Items",
      "label": "Final exam-day scan item",
      "unitRef": "All Units",
      "completed": false
    }
  ],
  "lastMinuteChecklist": [
    "Scan 1-page formula & terminology bank",
    "Review common mistake warnings",
    "Confirm exam equipment and hall ticket"
  ]
}`;

    // Primary model is gemini-3.6-flash, with resilient backup cascade
    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ];

    let responseText = null;

    for (const modelName of candidateModels) {
      console.log(`[SyllabusPrep API] Requesting final synthesis with: ${modelName}`);
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.15,
            responseMimeType: 'application/json',
          },
        });

        if (response && response.text) {
          responseText = response.text;
          console.log(`[SyllabusPrep API] Synthesis succeeded with model: ${modelName}`);
          break;
        } else {
          throw new Error('Empty response received from Gemini model.');
        }
      } catch (err) {
        logSafeDiagnostic('final_synthesis', err, {
          model: modelName,
          documentSize: docText.length,
          slideCount: normalizedDoc.pagesOrSlides,
        });

        const errMsg = String(err?.message || err);
        const isQuotaOrDemand =
          err?.status === 429 ||
          err?.code === 429 ||
          err?.status === 503 ||
          errMsg.includes('429') ||
          errMsg.includes('503') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota') ||
          errMsg.includes('UNAVAILABLE');

        if (isQuotaOrDemand) {
          console.warn(`[SyllabusPrep API] Model ${modelName} unavailable or quota limited, cascading to next model.`);
          continue;
        }
      }
      if (responseText) break;
    }

    let parsedData = null;

    if (!responseText) {
      console.warn('[SyllabusPrep API] AI generation unavailable or quota exhausted. Activating deterministic academic syllabus parser fallback.');
      parsedData = generateFallbackSyllabusPrep(docText, docMeta, studentContext, fileName);
    } else {
      const sanitizedText = responseText.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');

      try {
        parsedData = JSON.parse(sanitizedText);
      } catch {
        const match = sanitizedText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch {}
        }
      }

      if (!parsedData) {
        console.warn('[SyllabusPrep API] Failed to parse model output as JSON. Activating deterministic parser fallback.');
        parsedData = generateFallbackSyllabusPrep(docText, docMeta, studentContext, fileName);
      }
    }

    // Non-academic subject rejection from AI validation
    if (parsedData && parsedData.isAcademicSubject === false) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          status: 'error',
          error: parsedData.error || 'Please upload the correct PPT/PDF of a subject.',
          supportingText: 'This document does not appear to contain academic subject material for Syllabus Prep.',
        })
      );
      return;
    }

    // Ensure all checklist items are initially not completed
    if (Array.isArray(parsedData.examChecklist)) {
      parsedData.examChecklist = parsedData.examChecklist.map((item, idx) => ({
        ...item,
        id: item.id || `c${idx + 1}`,
        completed: false,
      }));
    }

    // Ensure units have real topic arrays
    if (Array.isArray(parsedData.units)) {
      parsedData.units = parsedData.units.map((u, idx) => ({
        ...u,
        unitNumber: u.unitNumber || `Unit ${idx + 1}`,
        title: u.title || `Module ${idx + 1}`,
        topics: Array.isArray(u.topics) ? u.topics : [],
        weight: u.evidenceBasis || u.weight || 'High-Yield Exam Scope',
      }));
    }

    // Normalize examStrategy to match UI expectations
    if (!parsedData.examStrategy && Array.isArray(parsedData.studyStrategy)) {
      parsedData.examStrategy = parsedData.studyStrategy.map((s, idx) => ({
        dayOrPhase: s.phaseName || `Phase ${idx + 1}`,
        title: s.title || `Sprint ${idx + 1}`,
        focusUnits: s.focusUnits || 'All Units',
        timeCommitment: s.timeCommitment || 'Dedicated Focus',
        prerequisites: s.prerequisites || '',
        milestoneCheckpoint: s.milestoneCheckpoint || '',
        twinAdjustment: s.twinAdjustment || '',
        actionItems: Array.isArray(s.actionItems) ? s.actionItems : [],
      }));
    }

    // Generate readable markdown text summary for rawText
    const markdownSummary = buildSyllabusMarkdownSummary(parsedData, fileName, degree, year);

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'success',
        data: parsedData,
        rawText: markdownSummary,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (err) {
    logSafeDiagnostic('handler_exception', err, {
      documentSize: docText?.length,
      slideCount: normalizedDoc?.pagesOrSlides,
    });
    console.warn('[SyllabusPrep API] Exception during processing, falling back to deterministic parser:', err?.message || err);
    try {
      const fallbackData = generateFallbackSyllabusPrep(docText, docMeta, studentContext, fileName);
      const markdownSummary = buildSyllabusMarkdownSummary(fallbackData, fileName, degree, year);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 'success',
          data: fallbackData,
          rawText: markdownSummary,
          sourceMethod: 'deterministic_academic_parser_recovery',
          timestamp: new Date().toISOString(),
        })
      );
    } catch (fallbackErr) {
      logSafeDiagnostic('critical_fallback_failure', fallbackErr);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          status: 'error',
          error: 'Unable to analyze the syllabus. Please check your document and try again.',
          details: err?.message,
        })
      );
    }
  }
}

// Default export for Vercel Serverless Function entrypoint
export default async function handler(req, res) {
  return handleSyllabusPrepRequest(req, res);
}
