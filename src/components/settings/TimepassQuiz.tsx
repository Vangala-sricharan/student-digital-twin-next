import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Flame,
  ChevronRight,
  BookOpen,
  Film,
  AlertCircle,
} from 'lucide-react';
import { recordQuizCompleted, useQuizStreak } from '../../lib/quizStreak';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

const TECH_TOPICS = [
  'Data Structures',
  'JavaScript',
  'Python',
  'AI & ML',
  'Web Development',
];

const FUN_TOPICS = [
  'Movies',
  'Cartoons & Anime',
  'General Knowledge',
  'Gaming',
  'Indian Cinema',
];

const STATUS_LINES = [
  'Creating your quiz...',
  'Crafting questions...',
  'Almost ready...',
];

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type QuestionCount = 5 | 10 | 15;
type QuizStatus = 'setup' | 'generating' | 'active' | 'completed' | 'error';

export const TimepassQuiz: React.FC = () => {
  const currentStreak = useQuizStreak();

  // Setup state
  const [selectedTopic, setSelectedTopic] = useState<string>('Data Structures');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);

  // Play state
  const [status, setStatus] = useState<QuizStatus>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [latestStreak, setLatestStreak] = useState<number>(currentStreak);
  const [statusLineIndex, setStatusLineIndex] = useState<number>(0);

  // Guard refs to strictly prevent duplicate requests from double-clicks or re-renders
  const isRequestActiveRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cycle short clean status messages during generation
  useEffect(() => {
    if (status !== 'generating') {
      setStatusLineIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusLineIndex((prev) => (prev + 1) % STATUS_LINES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  // Clean up any pending in-flight request upon unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isRequestActiveRef.current = false;
    };
  }, []);

  const activeTopicName = isCustom && customTopic.trim() ? customTopic.trim() : selectedTopic;

  const handleSelectPreset = (topic: string) => {
    setIsCustom(false);
    setSelectedTopic(topic);
  };

  const handleStartQuiz = async () => {
    const topicToUse = activeTopicName;
    if (!topicToUse || !topicToUse.trim()) return;

    // Strict guard: prevent duplicate requests caused by double-clicks, effects, or stale state
    if (isRequestActiveRef.current) return;
    isRequestActiveRef.current = true;

    // Cancel any previous in-flight request cleanly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setStatus('generating');
    setErrorMessage('');
    setErrorCode(null);

    try {
      // Send ONLY minimal required context: topic + difficulty + questionCount
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          topic: topicToUse.trim(),
          difficulty,
          questionCount,
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok || json?.status !== 'success') {
        const code =
          json?.code ||
          (res.status === 429
            ? 'RATE_LIMIT'
            : res.status === 504
            ? 'TIMEOUT'
            : res.status === 503
            ? 'SERVICE_UNAVAILABLE'
            : 'GENERAL');

        let msg = json?.error;
        if (!msg) {
          if (code === 'RATE_LIMIT' || res.status === 429) {
            msg = 'The AI service encountered a temporary hiccup or rate limit.';
          } else if (code === 'TIMEOUT' || res.status === 504) {
            msg = 'Quiz generation timed out. Please try again.';
          } else if (code === 'SERVICE_UNAVAILABLE' || res.status === 503) {
            msg = 'The AI service encountered a temporary hiccup or rate limit.';
          } else {
            msg = "Couldn't generate the quiz. Please try again.";
          }
        }

        setErrorCode(code);
        setErrorMessage(msg);
        setStatus('error');
        return;
      }

      // Validate returned structured JSON locally before displaying
      const rawQuestions = json.data?.questions;
      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        setErrorCode('MALFORMED_RESPONSE');
        setErrorMessage("Couldn't generate valid questions for this topic. Please try again.");
        setStatus('error');
        return;
      }

      const validatedQuestions: QuizQuestion[] = [];
      for (const item of rawQuestions) {
        if (
          item &&
          typeof item.question === 'string' &&
          item.question.trim().length > 0 &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.correctAnswerIndex === 'number' &&
          item.correctAnswerIndex >= 0 &&
          item.correctAnswerIndex <= 3
        ) {
          validatedQuestions.push({
            question: item.question.trim().replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1'),
            options: item.options.map((opt: any) =>
              String(opt).trim().replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g, '₹$1')
            ),
            correctAnswerIndex: Math.floor(item.correctAnswerIndex),
          });
        }
      }

      if (validatedQuestions.length === 0) {
        setErrorCode('MALFORMED_RESPONSE');
        setErrorMessage("Couldn't generate valid questions for this topic. Please try again.");
        setStatus('error');
        return;
      }

      // Display quiz immediately with zero artificial delay
      setQuestions(validatedQuestions.slice(0, questionCount));
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setStatus('active');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was deliberately aborted, ignore
      }
      setErrorCode('GENERAL');
      setErrorMessage(err.message || "Couldn't generate the quiz. Please try again.");
      setStatus('error');
    } finally {
      isRequestActiveRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitQuiz = () => {
    // Record completion in local browser storage only
    const updatedStreak = recordQuizCompleted();
    setLatestStreak(updatedStreak);
    setStatus('completed');
  };

  const handlePlayAnother = () => {
    setStatus('setup');
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setErrorMessage('');
  };

  // Compute results
  const totalQuestions = questions.length;
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctAnswerIndex) {
      correctCount += 1;
    }
  });
  const incorrectCount = totalQuestions - correctCount;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const getCelebratoryMessage = (pct: number) => {
    if (pct === 100) return 'Outstanding! Perfect score!';
    if (pct >= 70) return 'Great job! Strong performance!';
    if (pct >= 40) return 'Good effort! Keep learning!';
    return 'Nice try! Play another quiz to level up!';
  };

  return (
    <div className="space-y-6">
      {/* Timepass Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Timepass Quiz
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold">
              AI-POWERED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Take a quick fun quiz generated by AI.
          </p>
        </div>

        {/* Streak indicator */}
        {currentStreak > 0 && (
          <div
            id="badge-quiz-streak"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold self-start sm:self-auto"
            title={`${currentStreak} consecutive day${currentStreak > 1 ? 's' : ''} of playing quizzes`}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>🔥 {currentStreak} Day Streak</span>
          </div>
        )}
      </div>

      {/* STATE 1: SETUP SCREEN */}
      {status === 'setup' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
          
          {/* Section 1: Topic Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              1. Choose Topic
            </label>

            {/* Technical Topics */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>Technical & Engineering</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TECH_TOPICS.map((topic) => {
                  const isSelected = !isCustom && selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleSelectPreset(topic)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                          : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entertainment / Fun Topics */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Film className="w-3.5 h-3.5 text-purple-500" />
                <span>Entertainment & Fun</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FUN_TOPICS.map((topic) => {
                  const isSelected = !isCustom && selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleSelectPreset(topic)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                          : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Topic Input */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <input
                  id="input-custom-quiz-topic"
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setIsCustom(true);
                  }}
                  onFocus={() => setIsCustom(true)}
                  placeholder="Or enter any custom topic (e.g., Marvel, Cricket, System Design)..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-mono border transition-all ${
                    isCustom && customTopic.trim()
                      ? 'bg-white dark:bg-[#02040a] border-blue-500 dark:border-cyan-400 ring-2 ring-blue-500/20 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Difficulty Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              2. Select Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-md">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => {
                const isSelected = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Number of Questions */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              3. Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-md">
              {([5, 10, 15] as QuestionCount[]).map((count) => {
                const isSelected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {count} Questions
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Start Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Ready to play: <strong className="text-slate-800 dark:text-slate-200">{activeTopicName}</strong> ({difficulty} • {questionCount} Qs)
            </div>
            <button
              id="btn-start-quiz"
              type="button"
              onClick={handleStartQuiz}
              disabled={isGenerating || status === 'generating' || !activeTopicName.trim()}
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating || status === 'generating' ? 'GENERATING...' : 'START QUIZ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: CLEAN MINIMAL WAITING SCREEN */}
      {status === 'generating' && (
        <div
          id="quiz-generating-loader"
          className="relative overflow-hidden rounded-[2.5rem] bg-[#07090e] border border-white/10 shadow-2xl p-10 sm:p-14 flex flex-col items-center justify-center text-center select-none min-h-[360px]"
        >
          {/* Subtle dark ambient radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.06),transparent_70%)] pointer-events-none" />

          {/* Badges: AI ENGINE ACTIVE + GENERATING QUIZ */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>AI ENGINE ACTIVE</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold tracking-wider uppercase">
              <span>GENERATING QUIZ</span>
            </div>
          </div>

          {/* Centered Circular Animated Orbit Loader */}
          <div className="relative z-10 w-24 h-24 my-4 flex items-center justify-center">
            {/* Outer subtle guide track */}
            <div className="absolute inset-0 rounded-full border border-slate-800/80" />

            {/* Orbiting track ring */}
            <div className="absolute inset-0 rounded-full border border-transparent border-t-cyan-400 border-r-blue-500/40 animate-spin [animation-duration:2.5s]" />

            {/* Orbiting satellite particle */}
            <div className="absolute inset-0 animate-spin [animation-duration:3s]">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] -top-1.5 left-1/2 -translate-x-1/2 absolute" />
            </div>

            {/* Inner glowing pulse core */}
            <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
          </div>

          {/* One short changing status line */}
          <div className="relative z-10 mt-6 space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 font-sans tracking-tight transition-all duration-300">
              {STATUS_LINES[statusLineIndex]}
            </h3>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {activeTopicName} • {difficulty} • {questionCount} Questions
            </p>
          </div>
        </div>
      )}

      {/* STATE 3: ERROR SCREEN */}
      {status === 'error' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0d1117] border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {errorMessage || "Couldn't generate the quiz. Please try again."}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {errorCode === 'RATE_LIMIT'
                ? 'Rate limit reached on the AI service. Please wait a few seconds before retrying.'
                : errorCode === 'TIMEOUT'
                ? 'The AI request timed out before finishing. Please check your connection and retry.'
                : errorCode === 'SERVICE_UNAVAILABLE'
                ? 'The AI service is temporarily experiencing high traffic. Please try again shortly.'
                : errorCode === 'MALFORMED_RESPONSE'
                ? 'Could not parse questions for this topic. Please try again or choose another topic.'
                : 'A temporary error occurred during quiz generation. Please try again.'}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={isGenerating || status === 'generating'}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('setup')}
              disabled={isGenerating || status === 'generating'}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Change Topic
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: ACTIVE PLAY SCREEN */}
      {status === 'active' && questions.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
          {/* Question progress and topic info */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {activeTopicName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5">
                {difficulty}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-cyan-400 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Current Question */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
              {questions[currentQuestionIndex].question}
            </h3>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {questions[currentQuestionIndex].options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    id={`btn-quiz-option-${optIdx}`}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-2xl text-left text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-cyan-400 text-blue-900 dark:text-cyan-200 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-600 dark:border-cyan-400 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action: Next or Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="text-[11px] font-mono text-slate-400">
              {selectedAnswers[currentQuestionIndex] === undefined ? (
                <span>Select an option to continue</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Answer selected</span>
              )}
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                id="btn-quiz-next"
                type="button"
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-quiz-submit"
                type="button"
                onClick={handleSubmitQuiz}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Quiz</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATE 5: RESULTS & SCORE SCREEN */}
      {status === 'completed' && (
        <div className="space-y-6">
          {/* Score Header Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-2xl font-black">
              {scorePercent}%
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {getCelebratoryMessage(scorePercent)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                You scored {correctCount} out of {totalQuestions} questions on {activeTopicName} ({difficulty}).
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Total</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {totalQuestions}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Correct</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {correctCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center">
                <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">Incorrect</div>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                  {incorrectCount}
                </div>
              </div>
            </div>

            {/* Streak Notice */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold mt-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Streak: 🔥 {latestStreak} Day{latestStreak > 1 ? 's' : ''} Active</span>
            </div>

            <div className="pt-4">
              <button
                id="btn-play-another-quiz"
                type="button"
                onClick={handlePlayAnother}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Another Quiz</span>
              </button>
            </div>
          </div>

          {/* Question-by-question Review */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4">
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Quiz Review
            </h4>

            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const userAnswerIdx = selectedAnswers[qIdx];
                const isCorrect = userAnswerIdx === q.correctAnswerIndex;
                return (
                  <div
                    key={qIdx}
                    className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
                      isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        <span className="font-mono text-slate-400 mr-2">Q{qIdx + 1}.</span>
                        {q.question}
                      </div>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                      <div className="p-2 rounded-xl bg-white/70 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                        <span className="text-slate-400 block mb-0.5">Your Answer:</span>
                        <span
                          className={
                            isCorrect
                              ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'text-rose-600 dark:text-rose-400 font-bold'
                          }
                        >
                          {userAnswerIdx !== undefined ? q.options[userAnswerIdx] : 'None'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="text-emerald-600 dark:text-emerald-400 block mb-0.5">Correct Answer:</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            {q.options[q.correctAnswerIndex]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
