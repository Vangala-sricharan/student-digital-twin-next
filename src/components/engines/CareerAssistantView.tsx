import React, { useState, useEffect } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
import { Send, Bot, User, Sparkles, HelpCircle, ArrowRight, CheckCircle2, Download, Copy, Check } from 'lucide-react';

interface CareerAssistantViewProps {
  onBackToHub?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  'What are my top 3 skill gaps for my target role?',
  'Am I ready for a Tier-1 engineering internship?',
  'Which high-impact project should I build next to improve my Twin score?',
  'How should I prepare for technical interviews based on my skills?',
  'Evaluate my current readiness score and suggest a weekly study plan.',
];

export const CareerAssistantView: React.FC<CareerAssistantViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'career-assistant')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, execute, retry } = useEngineJob('career-assistant');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${profile?.fullName || 'Student'}! I am your AI Career Assistant, fully connected to your Student Digital Twin.

I have calibrated your profile with **${profile?.readinessScore || 75}% Readiness**, **${skills.length} verified skills**, and **${projects.length} proof-of-work repositories**.

How can I assist your career progression today? You can choose a quick prompt below or type any question regarding placement strategy, skill sprints, or project architecture.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleCopyTranscript = () => {
    const text = messages.map((m) => `${m.sender.toUpperCase()} (${m.timestamp}):\n${m.text}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!profile) return;
    setExportingPdf(true);

    try {
      await generateStyledPDF(
        {
          title: 'CAREER ASSISTANT CONSULTATION TRANSCRIPT',
          subtitle: `Student Twin: ${profile.fullName || profile.name}  •  Target: ${profile.targetRole}`,
          studentName: profile.fullName || profile.name,
          engineName: 'Engine 1 • Career Assistant Consultation',
          score: profile.readinessScore || 78,
          sections: messages.map((m, idx) => ({
            heading: `${idx + 1}. ${m.sender === 'user' ? (profile.fullName || 'Student') : 'AI Career Assistant'} (${m.timestamp})`,
            content: m.text,
          })),
        },
        `${(profile.fullName || profile.name).replace(/\s+/g, '_')}_Career_Consultation.pdf`
      );
    } catch (err) {
      console.error('Failed to export transcript PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // When job completes, append assistant response if not already present
  useEffect(() => {
    if (job.status === 'completed' && job.rawText && job.inputsSnapshot?.query) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === 'user') {
        const assistantMsg: Message = {
          id: `assistant-${job.completedTime || Date.now()}`,
          sender: 'assistant',
          text: job.rawText,
          timestamp: new Date(job.completedTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    }
  }, [job.status, job.rawText, job.completedTime]);

  const handleSendMessage = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isRunning || !profile) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'career-assistant',
      studentContext,
      userInputs: { query: query.trim() },
    });
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      resultText={messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chat Stream Window */}
        <div className="lg:col-span-8 flex flex-col h-[650px] rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
          
          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none prose dark:prose-invert max-w-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  <div
                    className={`text-[10px] font-mono mt-2 text-right ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-sm mt-1 font-mono font-bold text-xs">
                    {profile?.fullName.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Persistent Step-Based Processing Card while running or error */}
            {(isRunning || isError) && (
              <div className="py-2">
                <AIProcessingCard
                  job={job}
                  engineName={engine.name}
                  onRetry={retry}
                />
              </div>
            )}
          </div>

          {/* Prompt Chips Bar */}
          <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold shrink-0 pl-1">
              Quick Inquiries:
            </span>
            {STARTER_PROMPTS.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isRunning}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:border-blue-400 dark:hover:border-cyan-500 transition-colors shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about your target role, skill roadmap, placement preparation..."
              disabled={isRunning}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isRunning}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{isRunning ? 'Processing...' : 'Send'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

        {/* Right Column: Twin Calibrations */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Twin Calibration Signals</span>
            </h3>
            
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Target Role</span>
                <strong className="text-slate-900 dark:text-white">{profile?.targetRole}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Readiness Metric</span>
                <strong className="text-blue-600 dark:text-cyan-400 font-mono">{profile?.readinessScore}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Verified Skills</span>
                <strong className="text-slate-900 dark:text-white">{skills.length} tracked</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyTranscript}
                className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Chat'}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[10px] tracking-wider">
              Career Engine Principles
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Strictly grounded in your verified Student Digital Twin data.</li>
              <li>Calculates actionable, student-specific sprint timelines.</li>
              <li>Identifies unverified competencies before interviews.</li>
            </ul>
          </div>

        </div>

      </div>
    </EngineLayout>
  );
};
