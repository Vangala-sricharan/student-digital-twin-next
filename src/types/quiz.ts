export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Expert';
export type QuizMode = 'untimed' | 'timed';
export type QuestionCount = 5 | 10 | 15;

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizHistoryRecord {
  id: string; // Unique quiz attempt UUID
  userId: string; // Scoped strictly to authenticated user (or 'demo_visitor')
  studentProfileId?: string;
  topic: string;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  percentage: number; // 0 to 100
  quizMode: QuizMode;
  timeTakenSeconds?: number;
  timeTakenFormatted?: string; // e.g. "42s", "1m 15s", "Timed out"
  completedAt: string; // ISO 8601 string
  questions?: QuizQuestion[];
  selectedAnswers?: Record<number, number>;
}
