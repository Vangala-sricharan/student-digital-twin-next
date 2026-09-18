import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Award, Clock } from 'lucide-react';
import { QuizHistoryRecord } from '../../types/quiz';

interface QuizScoreChartProps {
  history: QuizHistoryRecord[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs text-slate-100 min-w-[180px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
        <span className="font-semibold text-slate-200">{data.topic}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {data.difficulty}
        </span>
      </div>
      <div className="space-y-1 text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Score:</span>
          <span className="font-bold text-emerald-400">{data.scoreFormatted} ({data.percentage}%)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Mode:</span>
          <span className="capitalize">{data.mode}</span>
        </div>
        {data.timeTaken && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Time:</span>
            <span>{data.timeTaken}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span>Date:</span>
          <span>{data.fullDate}</span>
        </div>
      </div>
    </div>
  );
};

export const QuizScoreChart: React.FC<QuizScoreChartProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return null;
  }

  // Sort chronologically (oldest to newest) to show progress over time
  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const chartData = sorted.map((record, index) => {
    const d = new Date(record.completedAt);
    const dateLabel = isNaN(d.getTime())
      ? `Quiz ${index + 1}`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      index: index + 1,
      displayLabel: sorted.length === 1 ? 'Quiz 1' : dateLabel,
      fullDate: isNaN(d.getTime()) ? '' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      percentage: record.percentage,
      scoreFormatted: `${record.correctAnswers}/${record.numberOfQuestions}`,
      topic: record.topic,
      difficulty: record.difficulty,
      mode: record.quizMode,
      timeTaken: record.timeTakenFormatted,
    };
  });

  const latestScore = sorted[sorted.length - 1]?.percentage ?? 0;
  const avgScore = Math.round(
    sorted.reduce((acc, curr) => acc + curr.percentage, 0) / sorted.length
  );
  const bestScore = Math.max(...sorted.map((s) => s.percentage));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Quiz Score Progress
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real performance tracking across {sorted.length} completed {sorted.length === 1 ? 'quiz' : 'quizzes'}
          </p>
        </div>

        {/* Real Summary Metrics from User History */}
        <div className="flex items-center gap-4 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">Average: </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{avgScore}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
            <span className="text-emerald-700 dark:text-emerald-400">Best: </span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">{bestScore}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
            <span className="text-indigo-700 dark:text-indigo-400">Latest: </span>
            <span className="font-bold text-indigo-800 dark:text-indigo-300">{latestScore}%</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.25}
              vertical={false}
            />
            <XAxis
              dataKey="displayLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569', opacity: 0.3 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              unit="%"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569', opacity: 0.3 }}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{
                r: sorted.length === 1 ? 7 : 4,
                fill: '#6366f1',
                strokeWidth: 2,
                stroke: '#ffffff',
              }}
              activeDot={{
                r: 7,
                fill: '#4f46e5',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
