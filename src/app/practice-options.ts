import { ExerciseLevel, ExerciseTopic } from './models';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
  enabled?: boolean;
}

export interface TopicOption extends SelectOption<ExerciseTopic> {
  level: ExerciseLevel;
}

export function topicLabel(topic: string, topics: TopicOption[] = []): string {
  return (
    topics.find((option) => option.value === topic)?.label ||
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
