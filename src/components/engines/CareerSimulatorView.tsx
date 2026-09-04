import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import {
  Compass,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Layers,
  Award,
  Target,
  ArrowDown,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface CareerSimulatorViewProps {
  onBackToHub?: () => void;
}

export const CareerSimulatorView: React.FC<CareerSimulatorViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'career-simulator')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('career-simulator');

  const [scenario, setScenario] = useState<'current' | 'proof_of_work' | 'aiml_specialization' | 'tier1_fellowship'>('proof_of_work');
  const [timeHorizon, setTimeHorizon] = useState<'1yr' | '2yr' | '4yr'>('2yr');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  const handleSimulate = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'career-simulator',
      studentContext,
      userInputs: {
        scenario:
          scenario === 'proof_of_work'
            ? 'Accelerated Proof-of-Work & Open Source Sprint'
            : scenario === 'aiml_specialization'
            ? 'AI/ML Engineering & Distributed Models'
            : scenario === 'tier1_fellowship'
            ? 'Tier-1 International Fellowships & Research'
            : 'Baseline Status Quo',
        timeHorizon: timeHorizon === '1yr' ? '12 Months' : timeHorizon === '2yr' ? '24 Months' : '48 Months',
      },
    });
  };

  const simulationData = job?.result?.data || structuredData;
  const candidateName = profile?.fullName || profile?.name || 'Student Candidate';

  const baselineScore = profile?.readinessScore || 78;
  const projectedScore = scenario === 'current' ? baselineScore + 4 : scenario === 'proof_of_work' ? 94 : scenario === 'aiml_specialization' ? 96 : 98;
  const scoreDelta = projectedScore - baselineScore;

  const baselineCTC = '₹6.5L - ₹9.0L CTC';
  const projectedCTC = scenario === 'current' ? '₹7.5L - ₹10.5L CTC' : scenario === 'proof_of_work' ? '₹14.0L - ₹22.0L CTC' : scenario === 'aiml_specialization' ? '₹18.0L - ₹28.0L CTC' : '₹24.0L - ₹38.0L CTC';

  const trajectoryTitle =
    scenario === 'proof_of_work'
      ? 'Accelerated Proof-of-Work Sprint'
      : scenario === 'aiml_specialization'
      ? 'AI/ML & Distributed Systems Specialization'
      : scenario === 'tier1_fellowship'
      ? 'Tier-1 International Fellowship & Research Track'
      : 'Baseline Trajectory (Status Quo)';

  const dimensions = [
    { label: 'Project Architectural Depth', baseline: 68, projected: scenario === 'current' ? 72 : 95 },
    { label: 'Industry & Recruiter Alignment', baseline: 74, projected: scenario === 'current' ? 78 : 96 },
    { label: 'Market Compensation Value', baseline: 65, projected: scenario === 'current' ? 70 : 92 },
    { label: 'Tier-1 Placement Probability', baseline: 70, projected: scenario === 'current' ? 75 : 94 },
  ];

  const highestRoiUpgrades = [
    'Deploy and open-source a distributed systems project with comprehensive benchmarks and automated tests.',
    'Build 1 multi-tenant LLM application featuring RAG caching and vector similarity search.',
    'Contribute 3+ merged pull requests to reputable Tier-1 open source repositories.',
  ];

  const riskFactors = [
    'Remaining on status quo coursework without public verifiable GitHub commits slows recruiter visibility.',
    'Generic resume formatting without quantified STAR impact metrics causes automated ATS drop-offs.',
    'Lack of distributed systems or container orchestration exposure limits senior engineering shortlists.',
  ];

  const currentGaps = [
    'Absence of live multi-tenant microservices deployment in portfolio projects.',
    'Limited automated CI/CD pipeline telemetry and unit/integration test suites.',
    'Infrequent GitHub contribution streaks compared to Tier-1 applicant cohorts.',
  ];

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      await generateAuditReportPDF({
        type: 'Career Trajectory Simulation',
        title: `Trajectory Simulation: ${trajectoryTitle} (${timeHorizon})`,
        candidateName,
        score: projectedScore,
        maxScore: 100,
        evaluation: `Projected Improvement: +${scoreDelta}% Readiness`,
        breakdown: dimensions.map((d) => ({
          label: `${d.label} (Current: ${d.baseline}%)`,
          score: d.projected,
          max: 100,
        })),
        strengths: highestRoiUpgrades,
        gaps: riskFactors,
        recommendations: [
          `Target Expected Market Value: ${projectedCTC}`,
          `Time Horizon: ${timeHorizon === '1yr' ? '12 Months' : timeHorizon === '2yr' ? '24 Months' : '48 Months'} Accelerated Execution`,
        ],
      }, `${candidateName.replace(/\s+/g, '_')}_Career_Simulation.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleSimulate}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Simulation Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Trajectory Scenarios</span>
            </h3>

            {/* Scenario Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Simulated Pathway
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'current', label: '1. Baseline Trajectory (Status Quo)' },
                  { id: 'proof_of_work', label: '2. Accelerated Proof-of-Work Sprint' },
                  { id: 'aiml_specialization', label: '3. AI/ML & Systems Specialization' },
                  { id: 'tier1_fellowship', label: '4. Tier-1 Fellowship Track' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id as any)}
                    className={`w-full p-2.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      scenario === s.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Horizon Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Simulation Time Horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1yr', label: '1 Year' },
                  { id: '2yr', label: '2 Years' },
                  { id: '4yr', label: '4 Years' },
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setTimeHorizon(h.id as any)}
                    className={`py-2 text-center rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                      timeHorizon === h.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isRunning ? 'Running Monte Carlo Sim...' : 'Simulate Trajectory'}</span>
            </button>
          </div>

        </div>

        {/* Simulation Output Dashboard (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Top Comparison Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6 transition-colors">
            
            {/* Disclaimer Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
              <span>
                <strong>Scenario Estimate:</strong> Career simulations provide statistical trajectory models based on Student Twin signals, not guaranteed future outcomes.
              </span>
            </div>

            {/* Header & Delta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    CAREER SIMULATOR
                  </span>
                  <span className="text-xs font-mono text-slate-400">{timeHorizon} projection</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {trajectoryTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Candidate: <strong className="text-slate-800 dark:text-slate-200">{candidateName}</strong> • Target Role: <strong className="text-slate-800 dark:text-slate-200">{profile?.targetRole || 'Software Engineer'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl shrink-0">
                <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{scoreDelta}%
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                    Readiness Surge
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">
                Simulation Sequence
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-50 dark:bg-white/5">
                <button
                  onClick={() => setViewMode('structured')}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    viewMode === 'structured'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sequential View
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Raw AI Text
                </button>
              </div>
            </div>

            {viewMode === 'structured' ? (
              <div className="space-y-6">
                
                {/* 1. CURRENT POSITION */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      <span>1. Current Position (Baseline Assessment)</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Student Twin Baseline</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Current Readiness</div>
                      <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">{baselineScore}%</div>
                      <div className="text-[10px] text-slate-500">Verified twin profile</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Target Role</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{profile?.targetRole || 'Software Engineer'}</div>
                      <div className="text-[10px] text-slate-500">{skills.length} verified skills</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Baseline Market Comp</div>
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{baselineCTC}</div>
                      <div className="text-[10px] text-slate-500">Current market tier</div>
                    </div>
                  </div>
                </div>

                {/* Arrow Transition */}
                <div className="flex justify-center -my-2">
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. IDENTIFIED GAPS */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>2. Identified Competency Gaps</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">Barriers to Tier-1</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {currentGaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow Transition */}
                <div className="flex justify-center -my-2">
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. LIKELY OUTCOMES (Estimated Scenarios) */}
                <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-blue-700 dark:text-cyan-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>3. Likely Outcomes ({timeHorizon} Simulated Horizon)</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-semibold">
                      Monte Carlo Projection
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Projected Readiness
                      </span>
                      <div className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                        {projectedScore}% Readiness
                      </div>
                      <div className="text-xs text-slate-500">
                        Top decile competitiveness among applicant pools
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Projected Compensation Band
                      </span>
                      <div className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                        {projectedCTC}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tier-1 product & enterprise engineering compensation
                      </div>
                    </div>
                  </div>

                  {/* Capability Dimension Deltas */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[11px] font-mono text-slate-500 uppercase font-bold block">
                      Dimension Growth Deltas
                    </span>
                    <div className="space-y-2">
                      {dimensions.map((dim, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{dim.label}</span>
                            <span className="font-mono text-xs">
                              <span className="text-slate-400 line-through mr-2">{dim.baseline}%</span>
                              <strong className="text-blue-600 dark:text-cyan-400 font-bold">{dim.projected}%</strong>
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-500"
                              style={{ width: `${dim.projected}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Arrow Transition */}
                <div className="flex justify-center -my-2">
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </div>

                {/* 4. RECOMMENDED ACTIONS */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>4. Recommended High-ROI Actions</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      Trajectory Unlocks
                    </span>
                  </div>
                  <div className="space-y-2">
                    {highestRoiUpgrades.map((u, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/20 flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[550px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                {rawText || 'Simulation executed. No raw text logged.'}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Simulation'}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Exporting...' : 'PDF'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </EngineLayout>
  );
};
