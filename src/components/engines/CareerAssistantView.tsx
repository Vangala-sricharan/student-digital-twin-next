import React, { useState, useEffect, useRef } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext, executeAiEngine } from '../../lib/aiEngineService';
import { generateStyledPDF } from '../../lib/pdfExportService';
import { Send, Bot, Sparkles, Download, Copy, Check, RotateCcw } from 'lucide-react';

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
  'What are my top skill gaps?',
  'Am I ready for an internship?',
  'Which project should I highlight?',
  'What should I learn next?',
];

function getInitialWelcomeMessage(): Message {
  return {
    id: 'welcome',
    sender: 'assistant',
    text: 'Ask me about your career, skills, projects or target role.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export const CareerAssistantView: React.FC<CareerAssistantViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'career-assistant')!;
  const { profile, skills, projects, achievements, careerGoals, isDemoMode } = useStudentTwin();

  const [messages, setMessages] = useState<Message[]>([getInitialWelcomeMessage()]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isSubmittingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll helper guaranteeing latest message or 'Thinking...' indicator is in view
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const performScroll = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior,
        });
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: 'end',
          inline: 'nearest',
        });
      }
    };

    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
  };

  // User isolation: Reset conversation when switching between Demo Mode and Authenticated user, or across logins
  const userIdentifier = isDemoMode ? 'demo-mode-session' : (profile?.id || profile?.fullName || 'authenticated-user');
  const prevUserRef = useRef(userIdentifier);

  useEffect(() => {
    if (prevUserRef.current !== userIdentifier) {
      prevUserRef.current = userIdentifier;
      setMessages([getInitialWelcomeMessage()]);
      setError(null);
      setLastFailedQuery(null);
      setInputQuery('');
    }
  }, [userIdentifier]);

  // Initial scroll on mount
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  // Auto-scroll when messages update, thinking indicator appears/disappears, or error occurs
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isThinking, error]);

  // ResizeObserver to ensure dynamic content expansion (e.g. text reflow, markdown) stays scrolled
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isThinking || isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isThinking]);

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
          subtitle: `Student Twin: ${profile.fullName || profile.name || 'Candidate'}  •  Target: ${profile.targetRole || 'Software Engineering'}`,
          studentName: profile.fullName || profile.name || 'Candidate',
          engineName: 'Engine 1 • AI Career Assistant',
          score: profile.readinessScore ?? 0,
          sections: messages.map((m, idx) => ({
            heading: `${idx + 1}. ${m.sender === 'user' ? (profile.fullName || 'User') : 'AI Career Assistant'} (${m.timestamp})`,
            content: m.text,
          })),
        },
        `${(profile.fullName || profile.name || 'Career').replace(/\s+/g, '_')}_Career_Assistant_Chat.pdf`
      );
    } catch (err) {
      console.error('Failed to export transcript PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend ?? inputQuery).trim();
    if (!query || isSubmittingRef.current || isThinking) return;

    isSubmittingRef.current = true;
    setIsThinking(true);
    setError(null);
    setInputQuery('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    // Ensure prompt and 'Thinking...' indicator are immediately scrolled into view
    scrollToBottom('smooth');

    try {
      const studentContext = buildStudentContext(
        profile,
        skills,
        projects,
        achievements,
        careerGoals[0]
      );

      // Build compact history of recent exchanges
      const recentHistory = nextMessages.slice(-8).map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const res = await executeAiEngine({
        engineId: 'career-assistant',
        studentContext,
        userInputs: {
          query,
          history: recentHistory,
        },
      });

      if (res && res.status === 'success' && res.rawText) {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: res.rawText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLastFailedQuery(null);
      } else {
        setError('Something went wrong. Please try again.');
        setLastFailedQuery(query);
      }
    } catch (err) {
      console.error('Career Assistant request failed:', err);
      setError('Something went wrong. Please try again.');
      setLastFailedQuery(query);
    } finally {
      setIsThinking(false);
      isSubmittingRef.current = false;
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSendMessage(lastFailedQuery);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      resultText={messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Conversational Chat Container */}
        <div className="lg:col-span-8 flex flex-col h-[650px] rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
          
          {/* Chat Messages Stream */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth"
          >
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
                    {profile?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Conversational "Thinking..." Minimal Loading Indicator */}
            {isThinking && (
              <div className="flex gap-3 justify-start items-center pt-1">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm flex items-center gap-2.5">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Thinking...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && !isThinking && (
              <div className="flex gap-3 justify-start items-center pt-1">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-4">
                  <span>{error}</span>
                  {lastFailedQuery && (
                    <button
                      onClick={handleRetry}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-px w-full pointer-events-none opacity-0 shrink-0" aria-hidden="true" />
          </div>

          {/* Quick Questions Starter Bar */}
          <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold shrink-0 pl-1">
              Suggestions:
            </span>
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isThinking}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:border-blue-400 dark:hover:border-cyan-500 transition-colors shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
              placeholder="Ask me about your career, skills, projects or target role..."
              disabled={isThinking}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isThinking}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{isThinking ? 'Thinking...' : 'Send'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

        {/* Right Column: Twin Calibration Signals & Actions */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Twin Calibration Signals</span>
            </h3>
            
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Target Role</span>
                <strong className="text-slate-900 dark:text-white">{profile?.targetRole || 'Not specified'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Readiness Metric</span>
                <strong className="text-blue-600 dark:text-cyan-400 font-mono">{profile?.readinessScore ?? 0}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Verified Skills</span>
                <strong className="text-slate-900 dark:text-white">{skills.length} tracked</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className="font-mono">Projects</span>
                <strong className="text-slate-900 dark:text-white">{projects.length} verified</strong>
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
                className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
              <li>Direct answers with zero artificial delay.</li>
              <li>Grounded in your current Student Digital Twin evidence.</li>
              <li>Real AI inference generated dynamically for each question.</li>
            </ul>
          </div>

        </div>

      </div>
    </EngineLayout>
  );
};
