import { ExerciseLevel, ExerciseTopic, ExerciseType } from './models';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

export interface TopicOption extends SelectOption<ExerciseTopic> {
  level: ExerciseLevel;
}

export const PRACTICE_LEVELS: SelectOption<ExerciseLevel>[] = [
  {
    label: 'A1 - Beginner: Basic words, expressions and simple sentences',
    value: 'A1',
  },
  {
    label: 'A2 - Elementary: Target level for Sproochentest speaking',
    value: 'A2',
  },
  {
    label: 'B1 - Intermediate: Target level for Sproochentest listening',
    value: 'B1',
  },
];

export const PRACTICE_TOPICS: TopicOption[] = [
  {
    value: 'INTRODUCTION',
    label: 'Introduction & Personal Information',
    level: 'A1',
  },
  { value: 'FAMILY', label: 'Family & Relationships', level: 'A1' },
  { value: 'HOME', label: 'Home & Housing', level: 'A1' },
  { value: 'FOOD_AND_DRINK', label: 'Food & Drink', level: 'A1' },
  {
    value: 'TIME_AND_DATES',
    label: 'Time, Dates & Appointments',
    level: 'A1',
  },
  { value: 'DAILY_ROUTINE', label: 'Daily Routine', level: 'A1' },
  { value: 'WORK', label: 'Work & Profession', level: 'A2' },
  { value: 'SHOPPING', label: 'Shopping', level: 'A2' },
  { value: 'CLOTHES', label: 'Clothes', level: 'A2' },
  { value: 'HEALTH', label: 'Health', level: 'A2' },
  { value: 'SPORTS', label: 'Sports & Fitness', level: 'A2' },
  { value: 'HOBBIES', label: 'Hobbies & Free Time', level: 'A2' },
  { value: 'TRANSPORT', label: 'Transport', level: 'A2' },
  { value: 'TRAVEL', label: 'Travel & Holidays', level: 'A2' },
  { value: 'WEATHER', label: 'Weather', level: 'A2' },
  { value: 'NATURE', label: 'Nature & Environment', level: 'A2' },
  { value: 'CITY_AND_PLACES', label: 'City & Places', level: 'A2' },
  { value: 'LUXEMBOURG', label: 'Life in Luxembourg', level: 'A2' },
  {
    value: 'FRIENDS_AND_SOCIAL_LIFE',
    label: 'Friends & Social Life',
    level: 'A2',
  },
  {
    value: 'EVENTS_AND_CELEBRATIONS',
    label: 'Events & Celebrations',
    level: 'A2',
  },
  { value: 'PAST_EXPERIENCES', label: 'Past Experiences', level: 'A2' },
  {
    value: 'OPINIONS_AND_PREFERENCES',
    label: 'Opinions & Preferences',
    level: 'A2',
  },
  { value: 'EDUCATION', label: 'Education & Training', level: 'B1' },
  { value: 'PUBLIC_SERVICES', label: 'Public Services', level: 'B1' },
  {
    value: 'MEDIA_AND_TECHNOLOGY',
    label: 'Media & Technology',
    level: 'B1',
  },
  { value: 'FUTURE_PLANS', label: 'Future Plans', level: 'B1' },
];

export const EXERCISE_TYPES: SelectOption<ExerciseType>[] = [
  { label: 'Translation', value: 'TRANSLATION' },
  { label: 'Multiple choice', value: 'MULTIPLE_CHOICE' },
  { label: 'Fill in the blank', value: 'FILL_IN_THE_BLANK' },
  { label: 'Short answer', value: 'SHORT_ANSWER' },
];

export function topicLabel(topic: string): string {
  return (
    PRACTICE_TOPICS.find((option) => option.value === topic)?.label ||
    formatPracticeLabel(topic)
  );
}

export function formatPracticeLabel(value: string): string {
  if (!value) {
    return '';
  }

  if (!/[_-]/.test(value) && value !== value.toUpperCase()) {
    return value;
  }

  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
