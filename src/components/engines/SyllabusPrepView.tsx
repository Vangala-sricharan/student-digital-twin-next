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
  Clock,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Zap,
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
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
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
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[11px] font-bold font-mono text-blue-600 dark:text-cyan-400">
                      {docSummary?.fileType || parsedDoc?.fileType?.toUpperCase() || 'SYLLABUS'} ANALYSIS
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strategy Generated
                    </span>
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
                  { id: 'overview', label: 'Overview & Units', icon: Layers },
                  { id: 'topics', label: 'High-Yield Topics', icon: Zap },
                  { id: 'strategy', label: 'Study Strategy', icon: Calendar },
                  { id: 'questions', label: 'Practice Questions', icon: HelpCircle },
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
                  
                  {/* Units Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {units.map((u: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {u.unitNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
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

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {u.title}
                        </h4>

                        {u.topics && u.topics.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                              Covered Topics ({u.pageOrSlideRef || 'Syllabus'}):
                            </span>
                            <ul className="space-y-1">
                              {u.topics.map((t: string, tIdx: number) => (
                                <li key={tIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* What to study first sequence */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>Recommended Study Sequence (What To Study First)</span>
                    </h4>

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
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.topicTitle}
                              </span>
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
                      ))}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PRACTICE QUESTIONS */}
              {activeTab === 'questions' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    High-Probability Exam Questions
                  </h4>

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
                <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4">
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
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl min-h-[500px] flex flex-col items-center justify-center text-center space-y-3 transition-colors">
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
