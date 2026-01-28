
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  description: string;
  topic: string;
  difficulty: Difficulty;
  questions: Question[];
}

export interface QuizConfig {
  prompt: string;
  numQuestions: number;
  difficulty: Difficulty;
}

export interface AuthState {
  user: { email: string; name: string } | null;
  isAuthenticated: boolean;
}
