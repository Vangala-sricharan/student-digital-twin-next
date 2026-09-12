// Vercel Serverless Function & Vite Dev Middleware Handler for AI-Grounded Syllabus & Exam Prep
import { GoogleGenAI } from '@google/genai';

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
 * Checks if the text appears to be a non-academic document (resume, job description, receipt, etc.)
 */
function isNonAcademicDocument(text, fileName = '') {
  const lower = text.toLowerCase();
  const lowerFile = fileName.toLowerCase();

  // Slide decks or unit outlines are definitely academic
  if (
    lower.includes('[slide ') ||
    lowerFile.endsWith('.ppt') ||
    lowerFile.endsWith('.pptx') ||
    lowerFile.endsWith('ppt') ||
    lowerFile.endsWith('pptx') ||
    lower.includes('unit ') ||
    lower.includes('chapter ') ||
    lower.includes('module ')
  ) {
    if (!lowerFile.includes('resume') && !lowerFile.includes('invoice') && !lowerFile.includes('receipt')) {
      return false;
    }
  }

  // Obvious non-academic files
  if (
    lowerFile.includes('resume') ||
    lowerFile.includes('cv_') ||
    lowerFile.includes('curriculum_vitae') ||
    lowerFile.includes('invoice') ||
    lowerFile.includes('receipt')
  ) {
    return true;
  }

  // Resume / CV patterns
  const resumeMatches = [
    /\bwork\s+experience\b/i,
    /\bprofessional\s+experience\b/i,
    /\bemployment\s+history\b/i,
    /\beducation\s*:\s*(?:b\.?tech|b\.?s|b\.?e|m\.?s|m\.?tech)\b/i,
    /\breferences\s+available\s+upon\s+request\b/i,
    /\bcurriculum\s+vitae\b/i,
    /\bcontact\s*:\s*[\w.-]+@[\w.-]+\b/i,
  ].filter((r) => r.test(text)).length;

  if (resumeMatches >= 2 && !lower.includes('syllabus') && !lower.includes('course outline') && !lower.includes('lecture')) {
    return true;
  }

  // LinkedIn export
  if (
    (lower.includes('linkedin') && lower.includes('connections') && lower.includes('experience')) ||
    /linkedin\.com\/(?:in|pub)\/[\w-]+/i.test(text)
  ) {
    return true;
  }

  return false;
}

export async function handleSyllabusPrepRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  const body = req.body || {};
  const docText = (body.documentText || body.pastedText || body.userInputs?.pastedText || '').trim();
  const docMeta = body.documentMeta || {};
  const studentContext = body.studentContext || {};
  const fileName = docMeta.fileName || 'Uploaded Document';

  // 1. Text extraction check
  if (!docText || docText.length < 30) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Please upload the correct PPT/PDF of a subject.',
        supportingText: 'The document does not contain readable academic text. Please upload a valid course syllabus, lecture slides, or subject notes PDF/PPT.',
      })
    );
    return;
  }

  // 2. Non-academic content rejection
  if (isNonAcademicDocument(docText, fileName)) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'Please upload the correct PPT/PDF of a subject.',
        supportingText: 'This document does not appear to contain academic subject material for Syllabus Prep.',
      })
    );
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        status: 'error',
        error: 'AI service is temporarily unavailable. Please check your Gemini API key.',
      })
    );
    return;
  }

  try {
    const verifiedSkills = Array.isArray(studentContext.skills)
      ? studentContext.skills.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
      : [];
    const degree = studentContext.degree || studentContext.academicProgram || 'Degree';
    const year = studentContext.year || studentContext.yearOfStudy || 'Undergraduate';

    const systemInstruction = `You are the Academic Syllabus & Exam Preparation AI for the Student Digital Twin OS.
CRITICAL DIRECTIVE:
1. You must analyze the provided uploaded document and generate everything STRICTLY from its actual content.
2. ZERO HARDCODED SUBJECTS, TOPICS, UNITS, C++, DSA, DBMS, probability/math assumptions, fixed scores, fixed study plans, fixed checklists, fake exam weightages and demo results.
3. Detect the ACTUAL subject/topic from the uploaded material and preserve the document's terminology.
4. Any academic subject, course unit, lecture slides (e.g. Unit 2: Arrays), topic deck, textbook chapter, or course notes IS valid academic material. You MUST accept it, detect its real subject and unit structure from the slides/content, and generate the complete exam preparation guide.
   ONLY if the uploaded text genuinely contains no recognizable academic/course material whatsoever (for example, an explicit job-seeker resume/CV, an invoice/receipt, or a commercial contract), return:
   {"isAcademicSubject": false, "error": "Please upload the correct PPT/PDF of a subject."}
5. Complete Topic Roadmap:
   - Extract unit-wise/topic-wise roadmap.
   - Recommended learning order based on prerequisites found in the material.
   - Mark all topics initially: status: "Pending".
6. High-Yield Topics:
   - Identify high/medium/low priority topics using EVIDENCE such as repetition, emphasis, core concepts, formulas, examples, headings and exam relevance.
   - NEVER invent fake exam percentage weightages! Instead provide evidenceBasis (e.g. "Heavily emphasized in Lecture 3", "Foundational theorem required for all proofs", "Primary computational model in Chapter 2").
7. Concept Guide:
   For every important topic provide:
   - whatToLearn: specific learning objective
   - simpleExplanation: plain, intuitive explanation
   - keyDefinitions: key definitions/terms
   - importantFormulas: formulas/theorems/rules when present in material
   - examples: examples from the material
   - prerequisites: prerequisites from the material
   - commonPitfalls: common misconceptions or exam pitfalls
8. Problem-Solving Preparation:
   For subjects containing numerical/programming/problem-solving content:
   - Identify important problem types from document
   - Explain the step-by-step solving approach
   - Give practice guidance
   If the subject is purely theoretical/conceptual, note this clearly and provide essay/case analysis guidance without inventing fake numericals.
9. Dynamic Exam Checklist:
   Generate checklist items categorized into:
   - Concepts Understood
   - Definitions & Formulas Revised
   - Important Topics Completed
   - Problems Practiced
   - Weak Topics
   - Requires Another Revision
   - Final Revision Items
   All items MUST come directly from the uploaded material, with "completed": false.
10. Study Strategy:
    Generate a personalized study plan based on:
    - Uploaded content complexity and topic count
    - Student's verified skills (${verifiedSkills.join(', ') || 'General'}) where relevant (fast-track prior foundations, dedicate focus to new concepts)
    - NEVER use a fixed "3-day" plan unless the document scope dictates it. Give it an appropriate title and realistic duration.
11. Revision Plan:
    - First revision (Comprehensive Concept Review)
    - Second revision (High-Yield & Formulas)
    - Final revision (Exam-Day Quick Scan)
    - Last-minute revision checklist
12. Self-Test / Practice Questions:
    - Topic-based practice questions directly from the uploaded material.
    - Tag with unitNumber, question, hint, modelAnswer outline, commonMistakes.
13. Format all prices/fees in Indian Rupees (₹) if any appear. No dollar signs ($).
14. Output STRICTLY valid JSON matching the requested schema.`;

    const prompt = `UPLOADED DOCUMENT EVIDENCE:
File Name: ${fileName}
File Type: ${docMeta.fileType || 'Document'}
Content:
"""
${docText.slice(0, 75000)}
"""

STUDENT TWIN CONTEXT (For study approach personalization only):
Degree: ${degree}
Year: ${year}
Verified Skills: ${verifiedSkills.join(', ') || 'None listed'}

TASK:
Analyze the document above and return the comprehensive Exam Preparation Guide in the following JSON format:
{
  "isAcademicSubject": true,
  "documentSummary": {
    "subject": "Exact subject name extracted from document",
    "documentName": "${fileName}",
    "fileType": "${docMeta.fileType?.toUpperCase() || 'DOCUMENT'}",
    "pagesOrSlides": "${docMeta.pageOrSlideCount || 'Multiple'}",
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
      "unitNumber": "Unit 1 / Module 1 / Chapter 1",
      "title": "Exact Unit / Chapter Title from document",
      "evidenceBasis": "Evidence for exam importance (e.g. 'Core foundational module with 4 major algorithms')",
      "priority": "CRITICAL | HIGH | MEDIUM | LOW",
      "estimatedTime": "Estimated study time for this unit (e.g. '4 Hours')",
      "pageOrSlideRef": "Slide or section reference from document",
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

    // Call Gemini with resilient models
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let responseText = null;
    let lastErr = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`[SyllabusPrep API] Model ${modelName} attempt failed:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastErr || new Error('No response received from AI model.');
    }

    // Clean and parse JSON response
    const sanitizedText = responseText.replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1');
    let parsedData = null;

    try {
      parsedData = JSON.parse(sanitizedText);
    } catch {
      const match = sanitizedText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      }
    }

    if (!parsedData) {
      throw new Error('Failed to parse structured JSON response from AI.');
    }

    // Non-academic subject rejection from AI validation
    if (parsedData.isAcademicSubject === false) {
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

    // Ensure all checklist items are initially not completed (no fake pre-checked boxes)
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
    const docSummary = parsedData.documentSummary || {};
    const markdownSummary = `### Academic Exam Preparation & Syllabus Study Guide: ${docSummary.subject || 'Course Syllabus'}

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
    console.error('[SyllabusPrep API] Execution error:', err);
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
