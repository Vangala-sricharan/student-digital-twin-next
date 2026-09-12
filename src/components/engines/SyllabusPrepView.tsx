import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { parseAcademicDocument, ParsedDocument, validateAcademicDocumentContent } from '../../lib/documentParser';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
import {
  loadSyllabusPrepState,
  saveSyllabusPrepState,
  clearSyllabusPrepState,
} from '../../lib/syllabusPrepStorageService';
import {
  BookOpen,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  CheckSquare,
  Square,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Zap,
  TrendingUp,
  BarChart3,
  RotateCcw,
  Calculator,
  ListChecks,
  Target,
  Search,
} from 'lucide-react';

interface SyllabusPrepViewProps {
  onBackToHub?: () => void;
}

export const SyllabusPrepView: React.FC<SyllabusPrepViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'syllabus-prep')!;
  const { user } = useAuth();
  const { profile, skills, projects, achievements, careerGoals, isDemoMode } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, reset, retry } = useEngineJob('syllabus-prep');

  // Local state persisted to Supabase and scoped by user/twin
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [pastedSyllabus, setPastedSyllabus] = useState<string>('');
  const [persistedStructuredData, setPersistedStructuredData] = useState<any>(null);
  const [persistedRawText, setPersistedRawText] = useState<string>('');

  const [parsingDoc, setParsingDoc] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseErrorSupportingText, setParseErrorSupportingText] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'problems' | 'strategy' | 'questions' | 'checklist'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [checklistFilter, setChecklistFilter] = useState<string>('all');

  // Interactive tracking states (initialized cleanly, never pre-checked with fake data)
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [completedUnitTopics, setCompletedUnitTopics] = useState<Record<string, boolean>>({});
  const [unitProgressOverrides, setUnitProgressOverrides] = useState<Record<string, number>>({});

  const [customQuestion, setCustomQuestion] = useState('');
  const [qaEntries, setQaEntries] = useState<Array<{ id?: string; question: string; answer: string; citation?: string; timestamp: string }>>([]);

  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate persisted state from Supabase / localStorage on mount or user/profile change
  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      if (isDemoMode || !user?.id) {
        return;
      }
      try {
        const saved = await loadSyllabusPrepState(user.id, profile?.id, false);
        if (isMounted && saved) {
          if (saved.parsedDoc) setParsedDoc(saved.parsedDoc);
          if (saved.pastedSyllabus) setPastedSyllabus(saved.pastedSyllabus);
          if (saved.structuredData) setPersistedStructuredData(saved.structuredData);
          if (saved.rawText) setPersistedRawText(saved.rawText);
          if (saved.checklistState) setChecklistState(saved.checklistState);
          if (saved.completedUnitTopics) setCompletedUnitTopics(saved.completedUnitTopics);
          if (saved.unitProgressOverrides) setUnitProgressOverrides(saved.unitProgressOverrides);
          if (saved.qaEntries) setQaEntries(saved.qaEntries);
        }
      } catch (err) {
        console.warn('[SyllabusPrep] Hydration notice:', err);
      }
    }
    hydrate();
    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.id, isDemoMode]);

  // Handle completed AI job
  useEffect(() => {
    if (job?.status === 'completed' && structuredData) {
      // Check if server indicated non-academic document rejection
      if (structuredData.isAcademicSubject === false) {
        setParseError('Please upload the correct PPT/PDF of a subject.');
        setParseErrorSupportingText(
          structuredData.rejectionReason || 'This document does not appear to contain academic subject material for Syllabus Prep.'
        );
        return;
      }

      setParseError(null);
      setParseErrorSupportingText(null);
      setPersistedStructuredData(structuredData);
      if (rawText) setPersistedRawText(rawText);

      // Save to Supabase and localStorage
      if (user?.id) {
        saveSyllabusPrepState(
          user.id,
          profile?.id,
          {
            parsedDoc,
            pastedSyllabus,
            structuredData,
            rawText: rawText || '',
            checklistState,
            completedUnitTopics,
            unitProgressOverrides,
            qaEntries,
            updatedAt: new Date().toISOString(),
          },
          isDemoMode
        );
      }
    } else if (job?.status === 'error' && isError) {
      setParseError('Please upload the correct PPT/PDF of a subject.');
      setParseErrorSupportingText('AI document analysis could not extract academic subject material. Please upload a clear subject syllabus, lecture slides, or course module outline.');
    }
  }, [job?.status, structuredData, rawText, isError]);

  // Persist interactive updates (checklists, topic checkoffs)
  const persistCurrentState = (updatedChecklist?: Record<string, boolean>, updatedTopics?: Record<string, boolean>, updatedOverrides?: Record<string, number>, updatedQa?: any[]) => {
    if (!user?.id || isDemoMode) return;
    const currentData = activeStructuredData;
    if (!currentData) return;

    saveSyllabusPrepState(
      user.id,
      profile?.id,
      {
        parsedDoc,
        pastedSyllabus,
        structuredData: currentData,
        rawText: activeRawText,
        checklistState: updatedChecklist ?? checklistState,
        completedUnitTopics: updatedTopics ?? completedUnitTopics,
        unitProgressOverrides: updatedOverrides ?? unitProgressOverrides,
        qaEntries: updatedQa ?? qaEntries,
        updatedAt: new Date().toISOString(),
      },
      isDemoMode
    );
  };

  // Active dataset resolution
  const activeStructuredData = structuredData || persistedStructuredData;
  const activeRawText = rawText || persistedRawText;

  // Extract structured sub-objects
  const docSummary = activeStructuredData?.documentSummary;
  const units = useMemo(() => Array.isArray(activeStructuredData?.units) ? activeStructuredData.units : [], [activeStructuredData]);
  const importantTopics = useMemo(() => Array.isArray(activeStructuredData?.importantTopics) ? activeStructuredData.importantTopics : [], [activeStructuredData]);
  const conceptGuide = useMemo(() => Array.isArray(activeStructuredData?.conceptGuide) ? activeStructuredData.conceptGuide : [], [activeStructuredData]);
  const problemSolving = activeStructuredData?.problemSolving;
  const studyPriority = useMemo(() => Array.isArray(activeStructuredData?.studyPriority) ? activeStructuredData.studyPriority : [], [activeStructuredData]);
  const examStrategy = useMemo(() => Array.isArray(activeStructuredData?.examStrategy) ? activeStructuredData.examStrategy : [], [activeStructuredData]);
  const revisionPlan = useMemo(() => Array.isArray(activeStructuredData?.revisionPlan) ? activeStructuredData.revisionPlan : [], [activeStructuredData]);
  const practiceQuestions = useMemo(() => Array.isArray(activeStructuredData?.practiceQuestions) ? activeStructuredData.practiceQuestions : [], [activeStructuredData]);
  const examChecklist = useMemo(() => Array.isArray(activeStructuredData?.examChecklist) ? activeStructuredData.examChecklist : [], [activeStructuredData]);
  const lastMinuteChecklist = useMemo(() => Array.isArray(activeStructuredData?.lastMinuteChecklist) ? activeStructuredData.lastMinuteChecklist : [], [activeStructuredData]);

  // Handle document upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsingDoc(true);
    setParseError(null);
    setParseErrorSupportingText(null);

    try {
      const doc = await parseAcademicDocument(file);
      const validation = validateAcademicDocumentContent(doc.extractedText, {
        fileName: doc.fileName,
        fileType: doc.fileType,
        slideCount: doc.pageOrSlideCount,
        isSlideDeck: doc.fileType === 'ppt' || doc.fileType === 'pptx',
      });

      if (!validation.isValid) {
        setParseError('Please upload the correct PPT/PDF of a subject.');
        setParseErrorSupportingText(validation.rejectionReason || 'This document does not appear to contain academic subject material for Syllabus Prep.');
        setParsedDoc(null);
        setParsingDoc(false);
        return;
      }

      setParsedDoc(doc);
      setPastedSyllabus('');
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError('Please upload the correct PPT/PDF of a subject.');
      setParseErrorSupportingText(err.message || 'Unable to parse document. Please upload a standard PDF, PPT, PPTX, or text file.');
      setParsedDoc(null);
    } finally {
      setParsingDoc(false);
    }
  };

  // Trigger AI analysis
  const handleGeneratePrepGuide = async () => {
    if (!profile || isRunning) return;

    const textToAnalyze = (parsedDoc?.extractedText || pastedSyllabus || '').trim();
    if (!textToAnalyze) {
      setParseError('Please upload the correct PPT/PDF of a subject.');
      setParseErrorSupportingText('This document does not appear to contain academic subject material for Syllabus Prep.');
      return;
    }

    const validation = validateAcademicDocumentContent(textToAnalyze, {
      fileName: parsedDoc?.fileName,
      fileType: parsedDoc?.fileType,
      slideCount: parsedDoc?.pageOrSlideCount,
      isSlideDeck: parsedDoc?.fileType === 'ppt' || parsedDoc?.fileType === 'pptx',
    });

    if (!validation.isValid) {
      setParseError('Please upload the correct PPT/PDF of a subject.');
      setParseErrorSupportingText(validation.supportingText || 'This document does not appear to contain academic subject material for Syllabus Prep.');
      return;
    }

    setParseError(null);
    setParseErrorSupportingText(null);

    // Reset interactive states for new document analysis (clean start)
    setChecklistState({});
    setCompletedUnitTopics({});
    setUnitProgressOverrides({});
    setQaEntries([]);

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'syllabus-prep',
      studentContext,
      documentText: textToAnalyze,
      documentMeta: parsedDoc
        ? {
            fileName: parsedDoc.fileName,
            fileType: parsedDoc.fileType,
            fileSize: parsedDoc.fileSize,
            pageOrSlideCount: parsedDoc.pageOrSlideCount,
          }
        : undefined,
      userInputs: {
        pastedText: pastedSyllabus,
      },
    });
  };

  // Reset entire analysis and clear storage
  const handleClearAnalysis = async () => {
    if (window.confirm('Reset this syllabus preparation guide? This will clear current progress for this document.')) {
      setParsedDoc(null);
      setPastedSyllabus('');
      setPersistedStructuredData(null);
      setPersistedRawText('');
      setChecklistState({});
      setCompletedUnitTopics({});
      setUnitProgressOverrides({});
      setQaEntries([]);
      setParseError(null);
      setParseErrorSupportingText(null);
      reset();

      if (user?.id && !isDemoMode) {
        await clearSyllabusPrepState(user.id, profile?.id);
      }
    }
  };

  // Interactive subtopic toggling
  const toggleUnitTopic = (unitId: string, topicIdx: number) => {
    const key = `${unitId}_${topicIdx}`;
    const nextState = {
      ...completedUnitTopics,
      [key]: !completedUnitTopics[key],
    };
    setCompletedUnitTopics(nextState);
    persistCurrentState(undefined, nextState);
  };

  // Unit progress calculation
  const getUnitProgress = (unit: any, idx: number) => {
    const unitId = unit.unitNumber || `Unit ${idx + 1}`;
    const topicList = unit.topics || [];
    const totalCount = topicList.length;

    if (totalCount === 0) {
      const override = unitProgressOverrides[unitId];
      return {
        percent: override !== undefined ? override : 0,
        completedCount: override === 100 ? 1 : 0,
        totalCount: 1,
      };
    }

    let completed = 0;
    topicList.forEach((_: any, tIdx: number) => {
      if (completedUnitTopics[`${unitId}_${tIdx}`]) {
        completed += 1;
      }
    });

    const percent = Math.round((completed / totalCount) * 100);
    return {
      percent,
      completedCount: completed,
      totalCount,
    };
  };

  const setUnitProgressQuick = (unit: any, idx: number, targetPercent: number) => {
    const unitId = unit.unitNumber || `Unit ${idx + 1}`;
    const topicList = unit.topics || [];
    const nextTopics = { ...completedUnitTopics };

    if (targetPercent === 100) {
      topicList.forEach((_: any, tIdx: number) => {
        nextTopics[`${unitId}_${tIdx}`] = true;
      });
    } else if (targetPercent === 0) {
      topicList.forEach((_: any, tIdx: number) => {
        delete nextTopics[`${unitId}_${tIdx}`];
      });
    } else {
      const targetCount = Math.round((targetPercent / 100) * topicList.length);
      topicList.forEach((_: any, tIdx: number) => {
        if (tIdx < targetCount) {
          nextTopics[`${unitId}_${tIdx}`] = true;
        } else {
          delete nextTopics[`${unitId}_${tIdx}`];
        }
      });
    }

    const nextOverrides = { ...unitProgressOverrides, [unitId]: targetPercent };
    setCompletedUnitTopics(nextTopics);
    setUnitProgressOverrides(nextOverrides);
    persistCurrentState(undefined, nextTopics, nextOverrides);
  };

  // Overall progress calculated strictly from actual user checkoffs
  const overallProgress = useMemo(() => {
    if (!units || units.length === 0) return { percent: 0, completedTopics: 0, totalTopics: 0, completedUnits: 0, totalUnits: 0 };

    let totalTopics = 0;
    let completedTopics = 0;
    let completedUnits = 0;

    units.forEach((u: any, idx: number) => {
      const p = getUnitProgress(u, idx);
      totalTopics += p.totalCount;
      completedTopics += p.completedCount;
      if (p.percent === 100) completedUnits += 1;
    });

    const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return {
      percent,
      completedTopics,
      totalTopics,
      completedUnits,
      totalUnits: units.length,
    };
  }, [units, completedUnitTopics, unitProgressOverrides]);

  // Checklist toggling
  const toggleChecklistItem = (id: string) => {
    const next = {
      ...checklistState,
      [id]: !checklistState[id],
    };
    setChecklistState(next);
    persistCurrentState(next);
  };

  const completedChecklistCount = useMemo(() => {
    return examChecklist.filter((item: any) => checklistState[item.id]).length;
  }, [examChecklist, checklistState]);

  // Questions toggle
  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Document Q&A Search strictly grounded in document
  const handleAskDocumentQuestion = (queryText?: string) => {
    const q = (queryText || customQuestion).trim();
    if (!q) return;

    const sourceText = parsedDoc?.extractedText || pastedSyllabus || '';
    const lowerQ = q.toLowerCase();

    // Check matched units
    const matchedUnit = units.find((u: any) =>
      lowerQ.includes(String(u.unitNumber).toLowerCase()) ||
      lowerQ.includes(u.title?.toLowerCase()) ||
      u.topics?.some((t: string) => lowerQ.includes(t.toLowerCase()))
    );

    // Check matched topics
    const matchedTopic = importantTopics.find((t: any) =>
      lowerQ.includes(t.title?.toLowerCase()) ||
      (t.whatToUnderstand && lowerQ.includes(t.whatToUnderstand.toLowerCase()))
    );

    let answer = '';
    let citation = parsedDoc?.fileName || 'Uploaded Academic Document';

    if (matchedTopic) {
      answer = `From ${matchedTopic.unit || 'Syllabus Core'}: ${matchedTopic.title} is prioritized as [${matchedTopic.priority} Priority]. Core concept to master: ${matchedTopic.whatToUnderstand}. ${matchedTopic.keyFormula ? `Key formula: ${matchedTopic.keyFormula}.` : ''} Exam rationale: ${matchedTopic.reasonWhyImportant}`;
      citation = `${matchedTopic.unit || 'Topic Reference'} • ${parsedDoc?.fileName || 'Syllabus'}`;
    } else if (matchedUnit) {
      answer = `From ${matchedUnit.unitNumber} (${matchedUnit.title}): Exam priority is ${matchedUnit.priority || 'HIGH'}. Covered topics: ${matchedUnit.topics?.join(', ')}. Key focus: ${matchedUnit.recommendation || 'Comprehensive study of all listed subtopics.'}`;
      citation = `${matchedUnit.unitNumber} • ${parsedDoc?.fileName || 'Syllabus'}`;
    } else if (sourceText && sourceText.toLowerCase().includes(lowerQ)) {
      const idx = sourceText.toLowerCase().indexOf(lowerQ);
      const start = Math.max(0, idx - 80);
      const end = Math.min(sourceText.length, idx + lowerQ.length + 200);
      const snippet = sourceText.slice(start, end).trim();
      answer = `Directly matched in syllabus content: "...${snippet}..."`;
      citation = `Extracted Syllabus Text • ${parsedDoc?.fileName || 'Document'}`;
    } else {
      answer = `Based strictly on the uploaded document for ${docSummary?.subject || 'this course'}, this topic is not explicitly listed in the main unit titles or subtopics. Review the full unit breakdown in the Roadmap tab.`;
      citation = parsedDoc?.fileName || 'Syllabus Document';
    }

    const newEntries = [
      {
        id: `qa-${Date.now()}`,
        question: q,
        answer,
        citation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...qaEntries,
    ];

    setQaEntries(newEntries);
    setCustomQuestion('');
    persistCurrentState(undefined, undefined, undefined, newEntries);
  };

  // Copy raw output or summary
  const handleCopy = async () => {
    const textToCopy = activeRawText || JSON.stringify(activeStructuredData, null, 2);
    if (!textToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!activeStructuredData && !activeRawText) return;
    setExportingPdf(true);

    try {
      const data = activeStructuredData || {};
      const summary = data.documentSummary || {};

      await generateStyledPDF(
        {
          title: 'ACADEMIC SYLLABUS & EXAM PREPARATION GUIDE',
          subtitle: `Subject: ${summary.subject || 'Academic Courseware'} • Document: ${summary.documentName || parsedDoc?.fileName || 'Syllabus'}`,
          studentName: profile?.name || 'Verified Scholar',
          engineName: 'Engine 8 • Syllabus & Exam Prep',
          score: overallProgress.percent,
          sections: [
            {
              heading: '1. Document & Syllabus Hierarchy Overview',
              items: [
                { label: 'Subject / Course', value: summary.subject || 'Detected Academic Course' },
                { label: 'Document Name', value: summary.documentName || parsedDoc?.fileName || 'Uploaded Syllabus' },
                { label: 'Estimated Study Time', value: summary.totalEstimatedStudyTime || 'Modular Sequence' },
                { label: 'Student Progress', value: `${overallProgress.percent}% (${overallProgress.completedTopics}/${overallProgress.totalTopics} Topics Mastered)` },
              ],
            },
            {
              heading: '2. Unit-Wise High-Yield Topics & Evidence Priority',
              items: units.map((u: any) => ({
                label: `${u.unitNumber}: ${u.title}`,
                value: `Priority: ${u.priority || 'HIGH'} • Evidence: ${u.evidenceBasis || 'Curriculum core'}`,
                secondary: u.topics ? `Key Topics: ${u.topics.join(' • ')}` : undefined,
              })),
            },
            {
              heading: '3. What To Study First (Prerequisite Priority)',
              items: studyPriority.map((p: any, idx: number) => ({
                label: `#${p.rank || idx + 1} ${p.topicTitle}`,
                value: `Time: ${p.estimatedTime || 'Self-paced'} • Source: ${p.sourceRef || 'Syllabus'}`,
                secondary: p.rationale,
              })),
            },
            {
              heading: '4. High-Yield Topics & Core Concept Guide',
              items: importantTopics.map((t: any) => ({
                label: `${t.title} [${t.priority} Priority]`,
                value: t.reasonWhyImportant,
                secondary: t.keyFormula ? `Key Formulation: ${t.keyFormula}` : undefined,
              })),
            },
            {
              heading: '5. Exam Strategy & Structured Revision Plan',
              items: examStrategy.map((s: any) => ({
                label: `${s.dayOrPhase}: ${s.title}`,
                value: `Commitment: ${s.timeCommitment} • Focus: ${s.focusUnits}`,
                secondary: s.actionItems ? s.actionItems.join(' | ') : undefined,
              })),
            },
            {
              heading: '6. Self-Test Questions & Model Outlines',
              items: practiceQuestions.map((q: any) => ({
                label: `[${q.type} • ${q.unitRef}] ${q.question}`,
                value: `Model Answer: ${q.modelAnswer}`,
                secondary: q.commonMistakes ? `Common Pitfalls: ${q.commonMistakes}` : undefined,
              })),
            },
          ],
        },
        `${(summary.subject || 'Syllabus').replace(/[^a-zA-Z0-9_-]/g, '_')}_Exam_Prep_Guide.pdf`
      );
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      onClearHistory={activeStructuredData ? handleClearAnalysis : undefined}
    >
      <div className="space-y-6">

        {/* Demo Mode Notice (Only shown if actively in demo mode, never in authenticated mode) */}
        {isDemoMode && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Demo Mode Showcase: Authenticate to analyze your own course syllabi and persist personal progress.</span>
            </div>
          </div>
        )}

        {/* TOP SECTION: Document Upload & Input Area */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Upload Course Material (PDF, PPT, PPTX, or Syllabus Text)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload your syllabus, lecture slides, or course module outline to generate an AI-grounded preparation plan.
              </p>
            </div>
            {activeStructuredData && (
              <button
                onClick={handleClearAnalysis}
                className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 font-mono transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Syllabus</span>
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.ppt,.pptx,.txt,.doc,.docx"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                parsedDoc
                  ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-300 dark:border-white/15 hover:border-blue-500 dark:hover:border-cyan-500 bg-slate-50/50 dark:bg-white/5'
              }`}
            >
              {parsedDoc ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {parsedDoc.fileName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 font-mono">
                    <span>{parsedDoc.fileType.toUpperCase()}</span>
                    <span>•</span>
                    <span>{parsedDoc.pageOrSlideCount} {parsedDoc.fileType === 'ppt' || parsedDoc.fileType === 'pptx' ? 'Slides' : 'Pages'}</span>
                    <span>•</span>
                    <span>{Math.round(parsedDoc.fileSize / 1024)} KB</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    ✓ Academic material verified. Click to replace file.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Click to browse or drag & drop syllabus document
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Supports PDF, PPT, PPTX, DOCX, TXT (Max 20MB)
                  </div>
                </div>
              )}
            </div>

            {/* Paste Plain Syllabus Text */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Or Paste Syllabus / Course Modules Text
              </label>
              <textarea
                value={pastedSyllabus}
                onChange={(e) => {
                  setPastedSyllabus(e.target.value);
                  if (e.target.value.trim()) setParsedDoc(null);
                }}
                placeholder="Paste course syllabus, unit modules, or lecture notes text here..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {/* Rejection / Validation Error State */}
            {parseError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold font-mono uppercase block">{parseError}</span>
                  {parseErrorSupportingText && (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {parseErrorSupportingText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleGeneratePrepGuide}
                disabled={(!parsedDoc && !pastedSyllabus.trim()) || isRunning || parsingDoc}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRunning ? 'Analyzing Syllabus...' : 'Generate Exam Prep Guide'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI PROCESSING STATE */}
        <AIProcessingCard job={job} engineName="Syllabus & Exam Prep Engine" />

        {/* MAIN RESULTS DISPLAY (Only shown when verified academic content is generated) */}
        {activeStructuredData && activeStructuredData.isAcademicSubject !== false && (
          <div className="space-y-6">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  {docSummary?.subject || 'Verified Subject'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
                  {docSummary?.documentName || parsedDoc?.fileName || 'Academic Material'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto text-xs font-mono">
              {[
                { id: 'overview', label: `Roadmap & Units (${overallProgress.percent}%)`, icon: Layers },
                { id: 'topics', label: 'High-Yield Topics & Concepts', icon: Zap },
                { id: 'problems', label: 'Problem-Solving Prep', icon: Calculator },
                { id: 'strategy', label: 'Study Strategy & Sprints', icon: Calendar },
                { id: 'questions', label: 'Practice & Grounded Q&A', icon: HelpCircle },
                { id: 'checklist', label: `Dynamic Checklist (${completedChecklistCount}/${examChecklist.length})`, icon: CheckSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & COMPLETE TOPIC ROADMAP */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Academic Context Header Card */}
                {docSummary && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-cyan-400">
                          Academic Curriculum Grounding
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {docSummary.subject || 'Course Syllabus Analysis'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {docSummary.totalEstimatedStudyTime && (
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[11px] font-mono font-semibold">
                            ⏱️ {docSummary.totalEstimatedStudyTime}
                          </span>
                        )}
                        {docSummary.difficultyLevel && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-semibold">
                            🎯 {docSummary.difficultyLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    {docSummary.coverageOverview && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {docSummary.coverageOverview}
                      </p>
                    )}

                    {/* Student Twin Alignment & Personalization */}
                    {docSummary.twinPersonalization && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                            <span>Student Twin Personalization Guidance</span>
                          </span>
                          {docSummary.twinPersonalization.academicLevel && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {docSummary.twinPersonalization.academicLevel}
                            </span>
                          )}
                        </div>

                        {docSummary.twinPersonalization.studyApproachNote && (
                          <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                            "{docSummary.twinPersonalization.studyApproachNote}"
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {docSummary.twinPersonalization.fastTrackRecommendations?.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                                ⚡ Fast-Track / Prior Foundation:
                              </span>
                              <ul className="space-y-1">
                                {docSummary.twinPersonalization.fastTrackRecommendations.map((ft: string, fIdx: number) => (
                                  <li key={fIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{ft}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {docSummary.twinPersonalization.extraFocusAreas?.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                                🎯 Extra Focus Areas:
                              </span>
                              <ul className="space-y-1">
                                {docSummary.twinPersonalization.extraFocusAreas.map((ef: string, eIdx: number) => (
                                  <li key={eIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{ef}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Overall Syllabus Roadmap Completion Card (Live Calculated from user checkoffs) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-[#0d1117] dark:to-[#161b22] border border-slate-200 dark:border-white/10 shadow-sm space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Live Syllabus Roadmap
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Interactive Topic Tracking
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Preparation Progress & Unit Completion
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          units.forEach((u: any, idx: number) => setUnitProgressQuick(u, idx, 100));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Mark all topics complete"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark All Done
                      </button>
                      <button
                        onClick={() => {
                          units.forEach((u: any, idx: number) => setUnitProgressQuick(u, idx, 0));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-mono font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Reset all progress"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        Overall Preparation Progress
                      </span>
                      <span
                        className={`font-bold ${
                          overallProgress.percent === 100
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : overallProgress.percent > 0
                            ? 'text-blue-600 dark:text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {overallProgress.percent}% Completed ({overallProgress.completedTopics} of {overallProgress.totalTopics} Subtopics Mastered)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          overallProgress.percent === 100
                            ? 'bg-emerald-500'
                            : overallProgress.percent > 0
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${overallProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Units Matrix with Evidence-Based Priority & Topic Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {units.map((u: any, idx: number) => {
                    const unitId = u.unitNumber || `Unit ${idx + 1}`;
                    const progress = getUnitProgress(u, idx);
                    const isComplete = progress.percent === 100;
                    const inProgress = progress.percent > 0 && progress.percent < 100;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl bg-white dark:bg-[#0d1117] border transition-all duration-200 shadow-sm space-y-4 ${
                          isComplete
                            ? 'border-emerald-200 dark:border-emerald-800/50 ring-1 ring-emerald-500/20'
                            : inProgress
                            ? 'border-blue-200 dark:border-blue-800/50'
                            : 'border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {/* Unit Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                              {u.unitNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                                isComplete
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                  : inProgress
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/50'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isComplete ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Completed</span>
                                </>
                              ) : inProgress ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span>{progress.percent}% In Progress</span>
                                </>
                              ) : (
                                <span>Pending</span>
                              )}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              u.priority === 'CRITICAL'
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : u.priority === 'HIGH'
                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {u.priority || 'HIGH'} PRIORITY
                          </span>
                        </div>

                        {/* Unit Title */}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {u.title}
                        </h4>

                        {/* Evidence Basis (Why prioritized) */}
                        {u.evidenceBasis && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Evidence: {u.evidenceBasis}
                          </p>
                        )}

                        {/* Progress Bar Section */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                              Unit Topics Completed
                            </span>
                            <span
                              className={`font-bold ${
                                isComplete
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : inProgress
                                  ? 'text-blue-600 dark:text-cyan-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {progress.percent}% ({progress.completedCount}/{progress.totalCount})
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isComplete
                                  ? 'bg-emerald-500'
                                  : inProgress
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
                                  : 'bg-transparent'
                              }`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Interactive Covered Topics List */}
                        {u.topics && u.topics.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-semibold">
                              <span>Topics & Subtopics ({u.topics.length}):</span>
                              <span className="text-[9px] lowercase font-normal text-slate-400">
                                click to mark completed
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {u.topics.map((t: string, tIdx: number) => {
                                const isChecked = Boolean(completedUnitTopics[`${unitId}_${tIdx}`]);
                                return (
                                  <li
                                    key={tIdx}
                                    onClick={() => toggleUnitTopic(unitId, tIdx)}
                                    className={`text-xs p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                                      isChecked
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
                                        : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {isChecked ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      )}
                                      <span
                                        className={`text-xs truncate ${
                                          isChecked ? 'line-through opacity-75 text-slate-500 dark:text-slate-400' : ''
                                        }`}
                                      >
                                        {t}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono shrink-0 font-medium ${
                                        isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                      }`}
                                    >
                                      {isChecked ? 'Completed' : 'Pending'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Quick Bottom Action */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[11px] font-mono">
                          <button
                            onClick={() => setUnitProgressQuick(u, idx, isComplete ? 0 : 100)}
                            className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {isComplete ? (
                              <>
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Unit</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Mark Unit Complete</span>
                              </>
                            )}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u.pageOrSlideRef || 'Syllabus Grounded'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommended Learning Order based on prerequisites */}
                {studyPriority.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <span>Recommended Learning Order (Prerequisite-Based Priority)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        What to study first
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {studyPriority.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {item.rank || idx + 1}
                          </span>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.topicTitle}
                              </span>
                              {item.estimatedTime && (
                                <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                                  {item.estimatedTime}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.rationale}
                            </p>
                            {item.sourceRef && (
                              <span className="inline-block text-[10px] font-mono text-slate-400">
                                Grounded in: {item.sourceRef}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HIGH-YIELD TOPICS & COMPREHENSIVE CONCEPT GUIDE */}
            {activeTab === 'topics' && (
              <div className="space-y-6">
                {/* Important High-Yield Topics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Evidence-Ranked High-Yield Topics</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Grounded in repetition, core formulas & emphasis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importantTopics.map((topic: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {topic.unit || 'Core Unit'} {topic.pageOrSlideRef ? `• ${topic.pageOrSlideRef}` : ''}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              topic.priority === 'CRITICAL'
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : topic.priority === 'HIGH'
                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {topic.priority || 'HIGH'} PRIORITY
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {topic.title}
                        </h4>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {topic.reasonWhyImportant && (
                            <p><strong className="text-slate-900 dark:text-white">Exam Relevance:</strong> {topic.reasonWhyImportant}</p>
                          )}
                          {topic.whatToUnderstand && (
                            <p><strong className="text-slate-900 dark:text-white">What To Master:</strong> {topic.whatToUnderstand}</p>
                          )}
                          {topic.keyFormula && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-blue-600 dark:text-cyan-300">
                              {topic.keyFormula}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comprehensive Concept Guide */}
                {conceptGuide.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <span>Concept Guide (Definitions, Formulas, Examples & Pitfalls)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        Preserving exact course terminology
                      </span>
                    </div>

                    <div className="space-y-4">
                      {conceptGuide.map((cg: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3.5"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                            <div>
                              <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-cyan-400">
                                {cg.unitRef || 'Concept Reference'}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                {cg.topicTitle}
                              </h5>
                            </div>
                            {cg.prerequisites && (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                                Prereq: {cg.prerequisites}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cg.simpleExplanation}
                          </p>

                          {/* Key Definitions & Formulas */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {cg.keyDefinitions?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5">
                                <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-cyan-400 block">
                                  Key Definitions:
                                </span>
                                <ul className="space-y-1">
                                  {cg.keyDefinitions.map((def: string, dIdx: number) => (
                                    <li key={dIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                      <span className="text-blue-500 font-bold">•</span>
                                      <span>{def}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {cg.formulasOrRules?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-1.5">
                                <span className="text-[10px] font-mono uppercase font-bold text-blue-700 dark:text-cyan-300 block">
                                  Formulas / Rules / Theorems:
                                </span>
                                <ul className="space-y-1 font-mono text-[11px]">
                                  {cg.formulasOrRules.map((f: string, fIdx: number) => (
                                    <li key={fIdx} className="text-blue-800 dark:text-cyan-200">
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Examples */}
                          {cg.examples?.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-slate-700 dark:text-slate-300 block">
                                Practical Examples / Cases:
                              </span>
                              <ul className="space-y-1">
                                {cg.examples.map((ex: string, exIdx: number) => (
                                  <li key={exIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{ex}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Common Exam Pitfalls */}
                          {cg.commonPitfalls && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                              <div>
                                <span className="font-bold font-mono text-[10px] uppercase block">
                                  Common Exam Pitfall to Avoid:
                                </span>
                                <p>{cg.commonPitfalls}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROBLEM-SOLVING PREPARATION */}
            {activeTab === 'problems' && (
              <div className="space-y-5">
                {problemSolving ? (
                  <div className="space-y-5">
                    {/* Subject Problem Nature Overview */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-cyan-400 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4" />
                          <span>Curriculum Problem Nature</span>
                        </span>
                        {problemSolving.subjectNature && (
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[11px] font-mono font-semibold">
                            {problemSolving.subjectNature}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Problem-Solving & Methodological Preparation
                      </h4>
                      {problemSolving.strategyAdvice && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {problemSolving.strategyAdvice}
                        </p>
                      )}
                    </div>

                    {/* Identified Problem Types */}
                    {problemSolving.identifiedProblemTypes?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                          Identified Question & Problem Patterns
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {problemSolving.identifiedProblemTypes.map((pt: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                                  {pt.unitRef || 'Unit Problem Set'}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                {pt.typeName}
                              </h5>

                              {pt.stepByStepApproach?.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block">
                                    Step-By-Step Solution Blueprint:
                                  </span>
                                  <ol className="space-y-1 pl-1">
                                    {pt.stepByStepApproach.map((st: string, sIdx: number) => (
                                      <li key={sIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                        <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold shrink-0">{sIdx + 1}.</span>
                                        <span>{st}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {pt.practiceGuidance && (
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                                  <strong>Practice Advice:</strong> {pt.practiceGuidance}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Purely Theoretical or Conceptual Subject
                    </h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      This material is primarily conceptual and theoretical. Focus on definitions, principles, and structured explanations outlined in the Concept Guide.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STUDY STRATEGY & REVISION PLAN */}
            {activeTab === 'strategy' && (
              <div className="space-y-6">
                {/* Dynamically Sized Study Sprints (No fixed 3-day hardcoding) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>{docSummary?.totalEstimatedStudyTime ? `Tailored Study Sprints (${docSummary.totalEstimatedStudyTime})` : 'Curriculum-Grounded Study Sprints'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Personalized for Student Twin
                    </span>
                  </div>

                  <div className="space-y-3">
                    {examStrategy.map((sprint: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-white/5 text-[11px] font-bold font-mono text-blue-600 dark:text-cyan-400">
                            {sprint.dayOrPhase}
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {sprint.timeCommitment}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {sprint.title} (Focus: {sprint.focusUnits})
                        </h4>

                        {sprint.milestoneCheckpoint && (
                          <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-[11px] font-mono text-blue-700 dark:text-cyan-300">
                            Milestone: {sprint.milestoneCheckpoint}
                          </div>
                        )}

                        {sprint.twinAdjustment && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 Student Twin note: {sprint.twinAdjustment}
                          </p>
                        )}

                        <div className="space-y-1.5 pt-1">
                          {sprint.actionItems?.map((act: string, aIdx: number) => (
                            <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structured Multi-Phase Revision Plan */}
                {revisionPlan.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <span>Structured 3-Phase Revision Plan</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        First Revision • Second Revision • Final Polish
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {revisionPlan.map((rev: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2"
                        >
                          <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-cyan-400">
                            {rev.phase}
                          </span>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {rev.timeWindow}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Core Focus: {rev.coreFocus}
                          </p>
                          <ul className="space-y-1 pt-1">
                            {rev.checklist?.map((chk: string, cIdx: number) => (
                              <li key={cIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                                <span className="text-blue-500">•</span>
                                <span>{chk}</span>
                              </li>
                            ))}
                          </ul>

                          {rev.quickFormulas?.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-1">
                              <span className="text-[10px] font-mono uppercase text-blue-600 dark:text-cyan-400 font-bold block">
                                Quick Formulas / Key Rules:
                              </span>
                              {rev.quickFormulas.map((qf: string, qIdx: number) => (
                                <div key={qIdx} className="font-mono text-[10px] text-slate-700 dark:text-slate-300 p-1 rounded bg-white dark:bg-white/5 truncate">
                                  {qf}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last-Minute Revision Checklist */}
                {lastMinuteChecklist.length > 0 && (
                  <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Last-Minute Revision Checklist (Before Entering Exam Hall)</span>
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {lastMinuteChecklist.map((item: string, iIdx: number) => (
                        <li key={iIdx} className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 bg-white/60 dark:bg-white/5 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SELF-TEST QUESTIONS & DOCUMENT SEARCH Q&A */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Interactive Grounded Q&A Form */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Ask Questions Grounded In Uploaded Syllabus</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Grounded In Actual Course Text
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAskDocumentQuestion();
                      }}
                      placeholder={`Ask anything about ${docSummary?.subject || 'this syllabus'}...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                    <button
                      onClick={() => handleAskDocumentQuestion()}
                      disabled={!customQuestion.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold shrink-0 transition-all cursor-pointer"
                    >
                      Search
                    </button>
                  </div>

                  {/* Q&A History List */}
                  {qaEntries.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                      {qaEntries.map((qa) => (
                        <div
                          key={qa.id || qa.question}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>Q: {qa.question}</span>
                            <span className="text-[10px] font-mono font-normal text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-white/5 px-2 py-0.5 rounded border border-blue-200 dark:border-white/10">
                              {qa.citation}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                            {qa.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* High-Probability Exam Practice Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Topic-Based Practice Questions</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      {practiceQuestions.length} Questions With Model Answers
                    </span>
                  </div>

                  <div className="space-y-3">
                    {practiceQuestions.map((q: any) => {
                      const isOpen = expandedQuestions[q.id];
                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                              {q.type} • {q.unitRef}
                            </span>
                            <button
                              onClick={() => toggleQuestion(q.id)}
                              className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isOpen ? 'Hide Solution' : 'Show Solution'}</span>
                              {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                            {q.question}
                          </h4>

                          {isOpen && (
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                              {q.hint && (
                                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  <strong>Hint:</strong> {q.hint}
                                </div>
                              )}
                              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-1">
                                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase block">
                                  Model Answer Outline:
                                </strong>
                                <p>{q.modelAnswer}</p>
                              </div>
                              {q.commonMistakes && (
                                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-[11px] text-amber-800 dark:text-amber-300">
                                  <strong>Common Exam Pitfall:</strong> {q.commonMistakes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DYNAMIC EXAM CHECKLIST (7 Requested Categories) */}
            {activeTab === 'checklist' && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Dynamic Exam Day Mastery Checklist</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check items off as you prepare. Progress persists automatically across sessions.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                    {completedChecklistCount} / {examChecklist.length} Items Mastered
                  </span>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                  {[
                    { id: 'all', label: `All (${examChecklist.length})` },
                    { id: 'Concepts Understood', label: 'Concepts' },
                    { id: 'Definitions & Formulas Revised', label: 'Definitions & Formulas' },
                    { id: 'Important Topics Completed', label: 'Key Topics' },
                    { id: 'Problems Practiced', label: 'Problems' },
                    { id: 'Weak Topics', label: 'Weak Topics' },
                    { id: 'Requires Another Revision', label: 'Re-Revision' },
                    { id: 'Final Revision Items', label: 'Final Scan' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setChecklistFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        checklistFilter === cat.id
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Checklist Items */}
                <div className="space-y-2.5">
                  {examChecklist
                    .filter((item: any) => checklistFilter === 'all' || item.category === checklistFilter)
                    .map((item: any) => {
                      const isChecked = Boolean(checklistState[item.id]);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isChecked
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0"
                            />
                            <span className={`text-xs ${isChecked ? 'line-through opacity-75 text-slate-500 dark:text-slate-400' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 shrink-0">
                            {item.category || 'Essential'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Empty State when no document has been analyzed yet */}
        {!activeStructuredData && !isRunning && !isError && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              AI-Grounded Exam Preparation Engine
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Upload your academic syllabus, lecture presentation, or course modules above. The engine will detect the curriculum, extract units and topics, calculate prerequisite order, and build a tailored preparation guide.
            </p>
          </div>
        )}

      </div>
    </EngineLayout>
  );
};
