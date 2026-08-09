export interface User {
  username: string;
  password: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SkillProgress {
  key: 'speaking' | 'listening' | 'vocabulary' | 'mock';
  label: string;
  score: number; // 0-100
  target: number; // 0-100
}

export interface SpeakingPrompt {
  id: string;
  topic: string;
  level: string;
  question: string;
  questionEn: string;
  tips: string[];
}

export interface ListeningExercise {
  id: string;
  title: string;
  level: string;
  durationSec: number;
  transcript: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface VocabCard {
  id: string;
  lb: string; // Luxembourgish
  en: string; // English
  example: string;
  theme: string;
}

export interface MockExamQuestion {
  id: string;
  section: 'Listening' | 'Speaking' | 'Reading';
  prompt: string;
  options: string[];
  answerIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  correction?: string;
}
