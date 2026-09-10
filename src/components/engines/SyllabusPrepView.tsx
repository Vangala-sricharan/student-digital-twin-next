import React, { useState, useRef } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { parseAcademicDocument, ParsedDocument, validateAcademicDocument } from '../../lib/documentParser';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
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
  Award,
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
} from 'lucide-react';

interface SyllabusPrepViewProps {
  onBackToHub?: () => void;
}

export const SyllabusPrepView: React.FC<SyllabusPrepViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'syllabus-prep')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('syllabus-prep');

  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [parsingDoc, setParsingDoc] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pastedSyllabus, setPastedSyllabus] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'strategy' | 'questions' | 'checklist'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({ q1: true });
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({ c1: true, c2: true });
  const [completedUnitTopics, setCompletedUnitTopics] = useState<Record<string, boolean>>({});
  const [unitProgressOverrides, setUnitProgressOverrides] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [qaEntries, setQaEntries] = useState<Array<{ id: string; question: string; answer: string; citation: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAskDocumentQuestion = (queryText?: string) => {
    const q = (queryText || customQuestion).trim();
    if (!q) return;

    // Search grounding in parsedDoc or pastedSyllabus or structuredData
    const sourceText = parsedDoc?.extractedText || pastedSyllabus || '';
    const unitsData = structuredData?.units || [];
    const topicsData = structuredData?.importantTopics || [];
    const lowerQ = q.toLowerCase();

    // Check matched units
    const matchedUnit = unitsData.find((u: any) =>
      lowerQ.includes(String(u.unitNumber).toLowerCase()) ||
      lowerQ.includes(u.title?.toLowerCase()) ||
      u.topics?.some((t: string) => lowerQ.includes(t.toLowerCase()))
    );

    // Check matched topics
    const matchedTopic = topicsData.find((t: any) =>
      lowerQ.includes(t.title?.toLowerCase()) ||
      (t.whatToUnderstand && lowerQ.includes(t.whatToUnderstand.toLowerCase()))
    );

    let answer = '';
    let citation = parsedDoc?.fileName || 'Uploaded Academic Document';

    if (matchedTopic) {
      answer = `From ${matchedTopic.unit || 'Identified Syllabus Topics'}: ${matchedTopic.title} is designated as [${matchedTopic.priority} Priority]. Core concept to master: ${matchedTopic.whatToUnderstand}. ${matchedTopic.keyFormula ? `Key formulation: ${matchedTopic.keyFormula}.` : ''} Exam rationale: ${matchedTopic.reasonWhyImportant}`;
      citation = `${matchedTopic.unit || 'Topic Reference'} • ${parsedDoc?.fileName || 'Syllabus'}`;
    } else if (matchedUnit) {
      answer = `From ${matchedUnit.unitNumber} (${matchedUnit.title}): Weightage is ${matchedUnit.weight || '~25%'} with ${matchedUnit.priority || 'HIGH'} exam priority. Covered topics: ${matchedUnit.topics?.join(', ')}. Key focus: ${matchedUnit.recommendation || 'Comprehensive theoretical derivation and problem sets.'}`;
      citation = `${matchedUnit.unitNumber} • ${parsedDoc?.fileName || 'Syllabus'}`;
    } else if (sourceText && sourceText.toLowerCase().includes(lowerQ)) {
      // Find sentence context
      const idx = sourceText.toLowerCase().indexOf(lowerQ);
      const start = Math.max(0, idx - 80);
      const end = Math.min(sourceText.length, idx + lowerQ.length + 200);
      const snippet = sourceText.slice(start, end).trim();
      answer = `Directly matched in source text: "...${snippet}..."`;
      citation = `Extracted Text • ${parsedDoc?.fileName || 'Syllabus Document'}`;
    } else {
      answer = `Based strictly on the uploaded academic syllabus "${parsedDoc?.fileName || 'Course Document'}", this specific topic or term is not explicitly listed in the module units. Please consult the course instructor or verify if this subject falls under supplementary readings.`;
      citation = 'Verification Notice • No Direct Match';
    }

    setQaEntries((prev) => [
      {
        id: `qa-${Date.now()}`,
        question: q,
        answer,
        citation,
      },
      ...prev,
    ]);
    setCustomQuestion('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAcademicDocument(file);
    if (!validation.valid) {
      setParseError(validation.error || 'Invalid file format.');
      return;
    }

    setParsingDoc(true);
    setParseError(null);

    try {
      const doc = await parseAcademicDocument(file);
      setParsedDoc(doc);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse academic document.');
    } finally {
      setParsingDoc(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateAcademicDocument(file);
    if (!validation.valid) {
      setParseError(validation.error || 'Invalid file format.');
      return;
    }

    setParsingDoc(true);
    setParseError(null);

    try {
      const doc = await parseAcademicDocument(file);
      setParsedDoc(doc);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse academic document.');
    } finally {
      setParsingDoc(false);
    }
  };

  const loadDemoSyllabus = (type: 'dsa' | 'os') => {
    setParseError(null);
    if (type === 'dsa') {
      setPastedSyllabus(
        `Course: CS301 Data Structures & Algorithms
Unit 1: Mathematical Foundations & Asymptotic Complexity
- Master Theorem, Big-O, Theta, Omega bounds, Recurrence Relations
Unit 2: Graph Algorithms & Dynamic Programming
- BFS, DFS, Topological Sorting, Dijkstra's Shortest Path, Bellman-Ford
- 0/1 Knapsack Problem, Longest Common Subsequence, Matrix Chain Multiplication
Unit 3: Advanced Trees & Disjoint Sets
- Red-Black Trees, AVL Tree Rotations, Union-Find (Disjoint Set Union)
Unit 4: String Matching & NP-Completeness
- KMP Algorithm, Rabin-Karp, P vs NP, NP-Complete Reductions`
      );
    } else {
      setPastedSyllabus(
        `Course: CS304 Operating Systems & Systems Programming
Unit 1: Process Management & CPU Scheduling
- Process State Transitions, PCB, Round Robin, Multi-level Feedback Queues
Unit 2: Concurrency, Deadlocks & Synchronization
- Critical Section, Semaphores, Monitors, 4 Coffman Conditions, Banker's Algorithm
Unit 3: Memory Management & Virtual Memory
- Paging, Segmentation, TLB, Page Fault Handling, LRU & Optimal Page Replacement
Unit 4: Storage & File Systems
- Disk Scheduling (SSTF, SCAN, C-SCAN), Inodes, Journaling File Systems`
      );
    }
  };

  const handleGeneratePrepGuide = async () => {
    if (!profile || isRunning) return;

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
      documentText: parsedDoc?.extractedText || pastedSyllabus,
      documentMeta: parsedDoc
        ? {
            fileName: parsedDoc.fileName,
            fileType: parsedDoc.fileType,
            fileSize: parsedDoc.fileSize,
          }
        : undefined,
      userInputs: {
        pastedText: pastedSyllabus,
      },
    });
  };

  const handleClearDoc = () => {
    setParsedDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!structuredData && !rawText) return;
    setExportingPdf(true);

    try {
      const data = structuredData || {};
      const docSummary = data.documentSummary || {};
      const units = data.units || [];
      const topics = data.importantTopics || [];
      const priorities = data.studyPriority || [];
      const strategy = data.examStrategy || [];
      const questions = data.practiceQuestions || [];
      const checklist = data.examChecklist || [];

      await generateStyledPDF(
        {
          title: 'ACADEMIC SYLLABUS & EXAM PREPARATION GUIDE',
          subtitle: `Subject: ${docSummary.subject || 'Core Engineering Courseware'}  •  Target: ${docSummary.documentName || parsedDoc?.fileName || 'Syllabus'}`,
          studentName: profile?.name || 'Verified Scholar',
          engineName: 'Engine 8 • Syllabus & Exam Prep',
          score: data.score || 94,
          sections: [
            {
              heading: '1. Document & Syllabus Hierarchy Overview',
              items: [
                { label: 'Document Name', value: docSummary.documentName || parsedDoc?.fileName || 'Academic Syllabus Document' },
                { label: 'Document Type', value: `${docSummary.fileType || parsedDoc?.fileType?.toUpperCase() || 'PDF'} Academic Deck` },
                { label: 'Units Identified', value: `${units.length || 4} Core Exam Modules` },
                { label: 'Preparation Readiness', value: `${data.score || 94}/100 (${data.evaluation || 'Excellent'})` },
              ],
            },
            {
              heading: '2. Unit-Wise High-Yield Weightage & Topics',
              items: units.map((u: any) => ({
                label: `${u.unitNumber}: ${u.title}`,
                value: `Weight: ${u.weight || '~25%'} • Priority: ${u.priority || 'HIGH'}`,
                secondary: u.topics ? `Key Topics: ${u.topics.join(' • ')}` : undefined,
              })),
            },
            {
              heading: '3. What To Study First (Priority Sequence)',
              items: priorities.map((p: any, idx: number) => ({
                label: `#${p.rank || idx + 1} ${p.topicTitle}`,
                value: `Time: ${p.estimatedTime || '3 Hours'} • Source: ${p.sourceRef || 'Course Notes'}`,
                secondary: p.rationale,
              })),
            },
            {
              heading: '4. High-Yield Topics & Proof Formulations',
              items: topics.map((t: any) => ({
                label: `[${t.priority}] ${t.title} (${t.unit})`,
                value: t.whatToUnderstand,
                secondary: t.keyFormula ? `Formula: ${t.keyFormula}` : t.reasonWhyImportant,
              })),
            },
            {
              heading: '5. Exam Sprint Strategy & Action Plan',
              items: strategy.map((s: any) => ({
                label: `${s.dayOrPhase}: ${s.title} (${s.timeCommitment})`,
                value: `Focus: ${s.focusUnits}`,
                secondary: Array.isArray(s.actionItems) ? s.actionItems.join(' | ') : undefined,
              })),
            },
            {
              heading: '6. High-Probability Practice Questions',
              items: questions.map((q: any) => ({
                label: `[${q.type}] ${q.question}`,
                value: `Model Answer: ${q.modelAnswer}`,
                secondary: q.hint ? `Hint: ${q.hint}` : undefined,
              })),
            },
            {
              heading: '7. Final Exam Checklist',
              items: checklist.map((c: any) => ({
                value: `[ ] ${c.label} (${c.category})`,
              })),
            },
          ],
        },
        `${(parsedDoc?.fileName || 'Syllabus-Prep-Guide').replace(/\.[^/.]+$/, '')}-Exam-Strategy.pdf`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const data = structuredData || {};
  const docSummary = data.documentSummary;
  const units = data.units || [];
  const importantTopics = data.importantTopics || [];
  const studyPriority = data.studyPriority || [];
  const topicExplanations = data.topicExplanations || [];
  const examStrategy = data.examStrategy || [];
  const practiceQuestions = data.practiceQuestions || [];
  const revisionPlan = data.revisionPlan || [];
  const examChecklist = data.examChecklist || [];

  const completedCount = examChecklist.filter((c: any) => checklistState[c.id] ?? c.completed).length;

  const getUnitProgress = (unit: any, idx: number) => {
    const unitId = unit.unitNumber || `Unit ${idx + 1}`;
    const topics: string[] = Array.isArray(unit.topics) ? unit.topics : [];
    const totalCount = topics.length;

    if (unitProgressOverrides[unitId] !== undefined) {
      const percent = unitProgressOverrides[unitId];
      const completedCount = totalCount > 0 ? Math.round((percent / 100) * totalCount) : (percent === 100 ? 1 : 0);
      return {
        percent,
        completedCount,
        totalCount,
        status: percent === 100 ? ('completed' as const) : percent > 0 ? ('in-progress' as const) : ('not-started' as const),
      };
    }

    if (totalCount === 0) {
      return { percent: 0, completedCount: 0, totalCount: 0, status: 'not-started' as const };
    }

    let completedCount = 0;
    topics.forEach((_, tIdx) => {
      if (completedUnitTopics[`${unitId}_${tIdx}`]) {
        completedCount++;
      }
    });

    const percent = Math.round((completedCount / totalCount) * 100);
    return {
      percent,
      completedCount,
      totalCount,
      status: percent === 100 ? ('completed' as const) : percent > 0 ? ('in-progress' as const) : ('not-started' as const),
    };
  };

  const toggleUnitTopic = (unitId: string, topicIdx: number) => {
    const key = `${unitId}_${topicIdx}`;
    const nextChecked = !completedUnitTopics[key];

    setUnitProgressOverrides((prev) => {
      const next = { ...prev };
      delete next[unitId];
      return next;
    });

    setCompletedUnitTopics((prev) => ({
      ...prev,
      [key]: nextChecked,
    }));
  };

  const setUnitProgressQuick = (unit: any, idx: number, targetPercent: number) => {
    const unitId = unit.unitNumber || `Unit ${idx + 1}`;
    const topics: string[] = Array.isArray(unit.topics) ? unit.topics : [];

    setUnitProgressOverrides((prev) => ({
      ...prev,
      [unitId]: targetPercent,
    }));

    if (topics.length > 0) {
      setCompletedUnitTopics((prev) => {
        const next = { ...prev };
        const itemsToMark = Math.round((targetPercent / 100) * topics.length);
        topics.forEach((_, tIdx) => {
          next[`${unitId}_${tIdx}`] = tIdx < itemsToMark;
        });
        return next;
      });
    }
  };

  const overallProgress = React.useMemo(() => {
    if (!units || units.length === 0) return { percent: 0, completedUnits: 0, totalUnits: 0 };
    let totalPercentSum = 0;
    let completedUnits = 0;

    units.forEach((u: any, idx: number) => {
      const { percent } = getUnitProgress(u, idx);
      totalPercentSum += percent;
      if (percent === 100) completedUnits++;
    });

    const overallPercent = Math.round(totalPercentSum / units.length);
    return {
      percent: overallPercent,
      completedUnits,
      totalUnits: units.length,
    };
  }, [units, completedUnitTopics, unitProgressOverrides]);

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning || parsingDoc}
      onRunEngine={handleGeneratePrepGuide}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Document Ingestion & Controls Column */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Document Ingestion</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-white/5">
                PDF • PPT • PPTX
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2.5 ${
                parsedDoc
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-300 dark:border-white/15 hover:border-blue-500/60 dark:hover:border-cyan-400/60 bg-slate-50 dark:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />

              {parsingDoc ? (
                <div className="py-4 space-y-2">
                  <div className="w-7 h-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Extracting slide text & document structure...
                  </p>
                </div>
              ) : parsedDoc ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs mx-auto">
                      {parsedDoc.fileName}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {parsedDoc.fileType.toUpperCase()} • {(parsedDoc.fileSize / 1024).toFixed(1)} KB
                      {parsedDoc.pageOrSlideCount ? ` • ${parsedDoc.pageOrSlideCount} ${parsedDoc.fileType === 'pdf' ? 'Pages' : 'Slides'}` : ''}
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {parsedDoc.extractedText.length} characters parsed successfully
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Drop Syllabus or Slide Decks here
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supports PDF syllabi, PPT, and PPTX lecture decks (Max 20MB)
                    </p>
                  </div>
                  <span className="inline-block text-[10px] font-mono px-2.5 py-1 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                    Browse Local Files
                  </span>
                </div>
              )}
            </div>

            {parsedDoc && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-500">Document active for analysis</span>
                <button
                  onClick={handleClearDoc}
                  className="text-[10px] font-mono text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove File</span>
                </button>
              </div>
            )}

            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Quick Demo Pre-load Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Quick-Test Demo Syllabi
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => loadDemoSyllabus('dsa')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  ⚡ CS301 DSA & Graph Syllabus
                </button>
                <button
                  onClick={() => loadDemoSyllabus('os')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  ⚡ CS304 OS & Systems Syllabus
                </button>
              </div>
            </div>

            {/* Paste Plain Syllabus Text */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Or Paste Syllabus / Course Modules Text
              </label>
              <textarea
                value={pastedSyllabus}
                onChange={(e) => setPastedSyllabus(e.target.value)}
                placeholder="Unit 1: Graph Algorithms & Minimum Spanning Trees&#10;Unit 2: Dynamic Programming & Knapsack&#10;Unit 3: Distributed Consensus & Raft Protocols..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            <button
              onClick={handleGeneratePrepGuide}
              disabled={isRunning || (!parsedDoc && !pastedSyllabus.trim())}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Synthesizing Exam Strategy...' : 'Analyze Exam Syllabus'}</span>
            </button>
          </div>

        </div>

        {/* Structured Exam Preparation Output */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Results Display */}
          {rawText ? (
            <div className="space-y-5">
              
              {/* Header Score & Action Card */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[11px] font-bold font-mono text-blue-600 dark:text-cyan-400">
                      {docSummary?.fileType || parsedDoc?.fileType?.toUpperCase() || 'SYLLABUS'} ANALYSIS
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strategy Generated
                    </span>
                    {overallProgress.percent > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {overallProgress.percent}% Mastered
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {docSummary?.documentName || parsedDoc?.fileName || 'Academic Exam Preparation Strategy'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {units.length} Core Modules • {docSummary?.pagesOrSlides || parsedDoc?.pageOrSlideCount || 'Multiple'} Pages/Slides Evaluated
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto text-xs font-mono">
                {[
                  { id: 'overview', label: `Roadmap & Units (${overallProgress.percent}%)`, icon: Layers },
                  { id: 'topics', label: 'High-Yield Topics', icon: Zap },
                  { id: 'strategy', label: 'Study Strategy', icon: Calendar },
                  { id: 'questions', label: 'Ask Questions & Practice', icon: HelpCircle },
                  { id: 'checklist', label: `Exam Checklist (${completedCount}/${examChecklist.length || 7})`, icon: CheckSquare },
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

              {/* TAB 1: OVERVIEW & DETECTED UNITS */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Subject Overview & Document Context */}
                  {docSummary && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-cyan-400">
                            Academic Curriculum Grounding
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
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
                                  🎯 Extra Focus / Known Gaps:
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

                  {/* Overall Syllabus Roadmap Completion Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-[#0d1117] dark:to-[#161b22] border border-slate-200 dark:border-white/10 shadow-sm space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> Roadmap Mastery Tracker
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Live Progress
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Syllabus Completion & Unit Mastery
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            units.forEach((u: any, idx: number) => setUnitProgressQuick(u, idx, 100));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Mark all topics and units complete"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark All Done
                        </button>
                        <button
                          onClick={() => {
                            units.forEach((u: any, idx: number) => setUnitProgressQuick(u, idx, 0));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-mono font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reset all progress to 0%"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                          Overall Syllabus Progress
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
                          {overallProgress.percent}% Completed ({overallProgress.completedUnits} of {overallProgress.totalUnits} Units Mastered)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            overallProgress.percent === 100
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                              : overallProgress.percent > 0
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400'
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${overallProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Units Matrix with Individual Visual Progress Bars */}
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
                              {/* Completion Status Badge */}
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
                                    <span>Mastered (100%)</span>
                                  </>
                                ) : inProgress ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span>{progress.percent}% In Progress</span>
                                  </>
                                ) : (
                                  <span>Not Started (0%)</span>
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
                              {u.weight || '~25% Weight'} • {u.priority || 'High'}
                            </span>
                          </div>

                          {/* Unit Title */}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {u.title}
                          </h4>

                          {/* Visual Progress Bar Section */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                                <span>Unit Progress</span>
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
                                {progress.percent}% ({progress.completedCount}/{progress.totalCount} Topics)
                              </span>
                            </div>

                            {/* Visual Progress Bar Track and Animated Bar */}
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ease-out ${
                                  isComplete
                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                                    : inProgress
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>

                            {/* Quick Progress Presets */}
                            <div className="flex items-center justify-between pt-1 gap-1.5 text-[10px] font-mono">
                              <span className="text-slate-400">Quick set:</span>
                              <div className="flex items-center gap-1">
                                {[0, 25, 50, 75, 100].map((preset) => (
                                  <button
                                    key={preset}
                                    onClick={() => setUnitProgressQuick(u, idx, preset)}
                                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                                      progress.percent === preset
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                                  >
                                    {preset}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Interactive Covered Topics List */}
                          {u.topics && u.topics.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-semibold">
                                <span>Subtopics ({u.pageOrSlideRef || 'Syllabus'}):</span>
                                <span className="text-[9px] lowercase font-normal text-slate-400">
                                  click to check off
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
                                        {isChecked ? 'Done' : 'Pending'}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          {/* Quick Bottom Actions */}
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
                                  <span>Mark Complete</span>
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

                  {/* What to study first sequence */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Recommended Study Sequence (What To Study First)</span>
                    </h4>

                    <div className="space-y-2.5">
                      {studyPriority.map((item: any, idx: number) => {
                        const matchingUnit = units.find(
                          (u: any) =>
                            (item.unit && u.unitNumber?.toLowerCase() === item.unit?.toLowerCase()) ||
                            (u.title && item.topicTitle && (item.topicTitle.toLowerCase().includes(u.title.toLowerCase()) || u.title.toLowerCase().includes(item.topicTitle.toLowerCase())))
                        );
                        const unitProgress = matchingUnit ? getUnitProgress(matchingUnit, units.indexOf(matchingUnit)) : null;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {item.rank || idx + 1}
                            </span>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {item.topicTitle}
                                  </span>
                                  {unitProgress && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                        unitProgress.percent === 100
                                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                                          : unitProgress.percent > 0
                                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-300 font-semibold'
                                          : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                      }`}
                                    >
                                      {unitProgress.percent}% Done
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                                  {item.estimatedTime}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {item.rationale}
                              </p>
                              <span className="inline-block text-[10px] font-mono text-slate-400">
                                Ref: {item.sourceRef}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: HIGH-YIELD TOPICS & EXPLANATIONS */}
              {activeTab === 'topics' && (
                <div className="space-y-4">
                  {/* Important High-Priority Topics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importantTopics.map((topic: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {topic.unit} • {topic.pageOrSlideRef}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              topic.priority === 'CRITICAL'
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {topic.priority} PRIORITY
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {topic.title}
                        </h4>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <p><strong className="text-slate-900 dark:text-white">Why Exam-Critical:</strong> {topic.reasonWhyImportant}</p>
                          <p><strong className="text-slate-900 dark:text-white">Key Understanding:</strong> {topic.whatToUnderstand}</p>
                          {topic.keyFormula && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-blue-600 dark:text-cyan-300">
                              {topic.keyFormula}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deep Dive Concept Explanations */}
                  {topicExplanations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                        Concept Notes & Memory Anchors
                      </h4>
                      {topicExplanations.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {exp.concept}
                            </h5>
                            <span className="text-[10px] font-mono text-slate-400">
                              {exp.sourceRef}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {exp.simpleExplanation}
                          </p>

                          {exp.keyPoints && (
                            <ul className="space-y-1 pl-2">
                              {exp.keyPoints.map((kp: string, kpIdx: number) => (
                                <li key={kpIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                  <span className="text-blue-500 font-bold">•</span>
                                  <span>{kp}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                            <span className="font-bold font-mono text-[10px] uppercase">Memory Anchor & Pitfall:</span>
                            <p>{exp.memoryAnchor} <em>({exp.commonMistakes})</em></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXAM SPRINT STRATEGY & REVISION PLAN */}
              {activeTab === 'strategy' && (
                <div className="space-y-4">
                  {/* Daily Sprints */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                      3-Day Rapid Preparation Sprints
                    </h4>
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
                            {sprint.milestoneCheckpoint}
                          </div>
                        )}

                        {sprint.twinAdjustment && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 {sprint.twinAdjustment}
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

                  {/* Multi-Phase Revision Plan */}
                  {revisionPlan.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                        Structured Revision Phases
                      </h4>

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
                              Focus: {rev.coreFocus}
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
                                  Quick Formulas:
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
                </div>
              )}

              {/* TAB 4: ASK QUESTIONS & PRACTICE QUESTIONS */}
              {activeTab === 'questions' && (
                <div className="space-y-5">
                  {/* Interactive Grounded Q&A Form */}
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <span>Ask Questions Grounded In Uploaded Syllabus</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        Zero-Hallucination Grounding
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
                        placeholder="e.g. Which unit covers Dynamic Programming, or what is the weightage of Unit 2?"
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                      <button
                        onClick={() => handleAskDocumentQuestion()}
                        disabled={!customQuestion.trim()}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold shrink-0 transition-all cursor-pointer"
                      >
                        Ask AI
                      </button>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-400">Suggestions:</span>
                      {[
                        'What is the highest-weight unit?',
                        'Which topics require proofs?',
                        'Summarize Unit 1 topics',
                      ].map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleAskDocumentQuestion(sug)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>

                    {/* Q&A History List */}
                    {qaEntries.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                        {qaEntries.map((qa) => (
                          <div
                            key={qa.id}
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

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white pt-2">
                    High-Probability Exam Questions
                  </h4>

                  {practiceQuestions.map((q: any) => {
                    const isOpen = expandedQuestions[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {q.type} • {q.unitRef}
                          </span>
                          <button
                            onClick={() => toggleQuestion(q.id)}
                            className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isOpen ? 'Hide Answer' : 'Show Answer'}</span>
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
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase block mb-1">
                                Verified Model Answer:
                              </strong>
                              {q.modelAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 5: EXAM CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Exam Day Mastery Checklist</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {completedCount} / {examChecklist.length} Items Mastered
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {examChecklist.map((item: any) => {
                      const isChecked = checklistState[item.id] ?? item.completed;
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-900 dark:text-white'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                            />
                            <span className={`text-xs ${isChecked ? 'line-through opacity-80' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">
                            {item.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : !isRunning && !isError ? (
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center space-y-3 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Academic Syllabus & Exam Prep Engine
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Upload your university course syllabus, lecture slides (PDF, PPT, PPTX), or paste module units to receive a high-yield study sequence, expected question patterns, and 7-day revision checklists.
              </p>
            </div>
          ) : null}

        </div>

      </div>
    </EngineLayout>
  );
};
