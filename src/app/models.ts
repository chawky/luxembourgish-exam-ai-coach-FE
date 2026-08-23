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
  key: 'speaking' | 'listening' | 'vocabulary' | 'image';
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
  audioUrl?: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  correction?: string;
}

export type ExerciseLevel = 'A1' | 'A2' | 'B1';

export type ExerciseTopic =
  | 'INTRODUCTION'
  | 'FAMILY'
  | 'HOME'
  | 'DAILY_ROUTINE'
  | 'WORK'
  | 'EDUCATION'
  | 'FOOD_AND_DRINK'
  | 'SHOPPING'
  | 'CLOTHES'
  | 'HEALTH'
  | 'SPORTS'
  | 'HOBBIES'
  | 'TRANSPORT'
  | 'TRAVEL'
  | 'WEATHER'
  | 'NATURE'
  | 'CITY_AND_PLACES'
  | 'PUBLIC_SERVICES'
  | 'LUXEMBOURG'
  | 'FRIENDS_AND_SOCIAL_LIFE'
  | 'MEDIA_AND_TECHNOLOGY'
  | 'EVENTS_AND_CELEBRATIONS'
  | 'TIME_AND_DATES'
  | 'PAST_EXPERIENCES'
  | 'FUTURE_PLANS'
  | 'OPINIONS_AND_PREFERENCES';

export type ExerciseType =
  | 'TRANSLATION'
  | 'MULTIPLE_CHOICE'
  | 'FILL_IN_THE_BLANK'
  | 'SHORT_ANSWER';

export interface GenerateExerciseRequest {
  level: ExerciseLevel;
  topic: ExerciseTopic;
  type: ExerciseType;
}

export interface ExerciseOptionDto {
  id?: string;
  label?: string;
  text?: string;
  correct?: boolean;
}

export interface ExerciseDto {
  id?: string;
  level?: ExerciseLevel | string;
  topic?: string;
  type?: ExerciseType | string;
  title?: string;
  instruction?: string;
  prompt?: string;
  question?: string;
  sourceText?: string;
  targetLanguage?: string;
  options?: Array<string | ExerciseOptionDto>;
  expectedAnswer?: string;
  hint?: string;
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  hints?: string[];
}

export type GeneratedExerciseDto = ExerciseDto;

export interface AudioExerciseDto extends GeneratedExerciseDto {
  questionTranslation?: string;
  hintTranslation?: string;
  audio?: string | number[];
  audioContentType?: string;
  audioMimeType?: string;
}

export interface ListeningExerciseDto extends AudioExerciseDto {}

export interface SpeakingPracticeDto extends AudioExerciseDto {
  questionsTranslations?: string;
  questionEn?: string;
  promptEn?: string;
}

export interface GeneratedImageDto {
  image?: string | number[];
  imageDescription?: string;
}

export interface SpeakingEvaluationDto {
  transcript?: string;
  score?: number;
  feedback?: string;
  corrections?: string[];
}
