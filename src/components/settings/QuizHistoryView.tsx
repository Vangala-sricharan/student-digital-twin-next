import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  X,
  Award,
} from 'lucide-react';
import { QuizHistoryRecord } from '../../types/quiz';
import { QuizScoreChart } from './QuizScoreChart';

interface QuizHistoryViewProps {
  history: QuizHistoryRecord[];
  onStartNewQuiz: () => void;
  onRetryQuiz: (record: QuizHistoryRecord) => void;
  isDemo?: boolean;
}

export const QuizHistoryView: React.FC<QuizHistoryViewProps> = ({
  history,
  onStartNewQuiz,
  onRetryQuiz,
  isDemo = false,
}) => {
  const [selectedRecordForReview, setSelectedRecordForReview] = useState<QuizHistoryRecord | null>(null);

  // Empty State Check
  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-10 sm:p-14 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
          <History className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          No quizzes completed yet.
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Play your first quiz to start building your history.
        </p>
        <button
          type="button"
          onClick={onStartNewQuiz}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Play Your First Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice if in Demo Mode */}
      {isDemo && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Demo Visitor Mode:</strong> Quizzes completed in demo mode are kept in temporary session storage and never overwrite the creator&apos;s database. Sign in for permanent cloud storage.
          </span>
        </div>
      )}

      {/* Real Quiz Score Progress Chart */}
      <QuizScoreChart history={history} />

      {/* History Records Table / Cards */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              Completed Quizzes ({history.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed chronological record of your individual quiz attempts
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewQuiz}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New Quiz
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((record) => {
                const dateObj = new Date(record.completedAt);
                const formattedDate = isNaN(dateObj.getTime())
                  ? 'Recent'
                  : dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                const formattedTime = isNaN(dateObj.getTime())
                  ? ''
                  : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {record.topic}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                        record.difficulty === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : record.difficulty === 'Expert'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {record.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        {record.quizMode === 'timed' ? (
                          <>
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span>Timed {record.timeTakenFormatted ? `(${record.timeTakenFormatted})` : ''}</span>
                          </>
                        ) : (
                          <span>Untimed</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {record.numberOfQuestions} Qs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {record.correctAnswers}/{record.numberOfQuestions}
                        </span>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                          record.percentage >= 70
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : record.percentage >= 40
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {record.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{formattedTime}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.questions && record.questions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForReview(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[11px]"
                            title="Review questions and answers"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRetryQuiz(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors text-[11px] font-medium"
                          title="Generate fresh questions for this topic & difficulty"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {history.map((record) => {
            const dateObj = new Date(record.completedAt);
            const formattedDate = isNaN(dateObj.getTime())
              ? 'Recent'
              : dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

            return (
              <div key={record.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {record.topic}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        record.difficulty === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : record.difficulty === 'Expert'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {record.difficulty}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {record.quizMode === 'timed' ? '⏱️ Timed' : 'Untimed'}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {record.correctAnswers}/{record.numberOfQuestions}
                    </span>
                    <div className={`text-[11px] font-bold ${
                      record.percentage >= 70 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {record.percentage}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {record.questions && record.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRecordForReview(record)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRetryQuiz(record)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry Quiz
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal for Past Attempts */}
      {selectedRecordForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Quiz Review: {selectedRecordForReview.topic}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {selectedRecordForReview.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scored {selectedRecordForReview.correctAnswers} of {selectedRecordForReview.numberOfQuestions} ({selectedRecordForReview.percentage}%)
                  {selectedRecordForReview.timeTakenFormatted && ` • ${selectedRecordForReview.timeTakenFormatted}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {selectedRecordForReview.questions?.map((q, qIndex) => {
                const selected = selectedRecordForReview.selectedAnswers?.[qIndex];
                const isCorrect = selected === q.correctAnswerIndex;

                return (
                  <div
                    key={qIndex}
                    className={`rounded-xl border p-4 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {qIndex + 1}. {q.question}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs shrink-0">
                          <XCircle className="h-4 w-4" />
                          Incorrect
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIndex) => {
                        const isThisCorrect = optIndex === q.correctAnswerIndex;
                        const isThisSelected = optIndex === selected;

                        let style = 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/40';
                        if (isThisCorrect) {
                          style = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold';
                        } else if (isThisSelected && !isThisCorrect) {
                          style = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold';
                        }

                        return (
                          <div
                            key={optIndex}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isThisCorrect && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Correct</span>
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">✗ Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const rec = selectedRecordForReview;
                  setSelectedRecordForReview(null);
                  onRetryQuiz(rec);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry This Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
