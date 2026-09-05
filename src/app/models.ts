import type { components } from './api/backend-schema';

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  addressInfo?: string;
  emailVerified?: boolean;
  adminDisabled?: boolean;
  roles?: string[];
  subscription?: SubscriptionInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SubscriptionInfo {
  subscribed?: boolean;
  status?: string;
  startedAt?: string;
  currentPeriodEnd?: string;
}

export interface LocationSuggestion {
  id?: string;
  label?: string;
  layerName?: string;
}

export interface SkillProgress {
  key: 'speaking' | 'listening' | 'vocabulary' | 'image';
  label: string;
  score: number; // 0-100
  target: number; // 0-100
}

export interface SpeakingPrompt {
  id: string;
  attemptId?: number;
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

export type ExerciseLevel = string;

export type ExerciseTopic = string;

export type ExerciseType = string;

export interface GenerateExerciseRequest {
  level: ExerciseLevel;
  topic: ExerciseTopic;
  type: ExerciseType;
}

export type GenerateVocabularyRequest =
  components['schemas']['VocabularyRequestDto'];

export interface VocabularySentenceDto {
  vocabularyWord?: string;
  wordTranslation?: string;
  sentence?: string;
  sentenceTranslation?: string;
}

export interface VocabularyExerciseDto {
  attemptId?: number;
  usefulSentences?: VocabularySentenceDto[];
}

export interface SkillProgressDto {
  exerciseType?: string;
  totalActivities?: number;
  completedActivities?: number;
  evaluatedActivities?: number;
  averageRatingOverall?: number;
  latestExerciseName?: string;
}

export interface ProgressDashboardDto {
  userId?: number;
  username?: string;
  email?: string;
  loggedInDays?: number;
  currentStreakDays?: number;
  lastLoginDate?: string;
  totalActivities?: number;
  completedActivities?: number;
  evaluatedActivities?: number;
  averageRatingOverall?: number;
  latestExerciseName?: string;
  skillProgress?: SkillProgressDto[];
}

export interface ExerciseOptionDto {
  id?: string;
  label?: string;
  text?: string;
  correct?: boolean;
}

export interface ExerciseDto {
  attemptId?: number;
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
  attemptId?: number;
  image?: string | number[];
  imageDescription?: string;
}

export interface SpeakingEvaluationDto {
  transcript?: string;
  score?: number;
  feedback?: string;
  corrections?: string[];
}
