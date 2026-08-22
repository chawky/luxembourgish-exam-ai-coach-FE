import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ExerciseService } from '../../services/exercise.service';
import { IconComponent } from '../../components/icon.component';
import {
  ExerciseDto,
  ExerciseLevel,
  ExerciseTopic,
  ExerciseOptionDto,
  ExerciseType,
  GenerateExerciseRequest,
} from '../../models';
import {
  EXERCISE_TYPES,
  PRACTICE_LEVELS,
  PRACTICE_TOPICS,
  TopicOption,
  formatPracticeLabel,
  topicLabel,
} from '../../practice-options';

interface NormalizedOption {
  label: string;
  text: string;
  correct?: boolean;
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">AI-generated exercises</span>
        <h1>Exercises by topic</h1>
        <p class="text-muted">
          Choose a level, topic and exercise type to create focused
          Luxembourgish practice.
        </p>
      </div>
    </header>

    <div class="layout">
      <section class="card card-pad generator">
        <div class="section-title">
          <span class="stat-icon blue">
            <app-icon name="book" [size]="22"></app-icon>
          </span>
          <div>
            <h2>Generate practice</h2>
            <p class="text-muted">
              Topics are matched to the selected level, so each exercise stays
              appropriate for your current goal.
            </p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="generate()" novalidate>
          <div class="field">
            <label for="level">Level</label>
            <select
              id="level"
              class="input"
              formControlName="level"
              (change)="onLevelChange()"
            >
              @for (level of levels; track level.value) {
                <option [value]="level.value">{{ level.label }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label for="topic">Topic</label>
            <select id="topic" class="input" formControlName="topic">
              @for (topic of topicsForSelectedLevel(); track topic.value) {
                <option [value]="topic.value">{{ topic.label }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label for="type">Exercise type</label>
            <select id="type" class="input" formControlName="type">
              @for (type of exerciseTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </div>

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loading()"
          >
            @if (loading()) {
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Generating exercise...
            } @else {
              <app-icon name="sparkles" [size]="18"></app-icon>
              Generate exercise
            }
          </button>
        </form>

      </section>

      <section class="card card-pad exercise">
        @if (loading()) {
          <div class="empty-state">
            <span class="stat-icon sky loading-icon">
              <app-icon name="sparkles" [size]="22"></app-icon>
            </span>
            <h2>Generating...</h2>
            <p class="text-muted">
              Preparing a fresh exercise for your selected practice area.
            </p>
          </div>
        } @else {
          @if (exercise(); as ex) {
            <div class="exercise-head">
              <div>
                <span class="eyebrow">{{ exerciseTypeLabel(ex) }}</span>
                <h2>{{ exerciseTitle(ex) }}</h2>
              </div>
              <div class="badges">
                <span class="badge badge-sky">{{ exerciseLevel(ex) }}</span>
                <span class="badge">{{ exerciseTopicLabel(ex) }}</span>
              </div>
            </div>

            @if (ex.instruction) {
              <div class="callout">
                <strong>Instruction</strong>
                <p>{{ ex.instruction }}</p>
              </div>
            }

            @if (ex.prompt) {
              <div class="prompt-block">
                <span class="text-muted small">Prompt</span>
                <p>{{ ex.prompt }}</p>
              </div>
            }

            @if (ex.question) {
              <div class="prompt-block">
                <span class="text-muted small">Question</span>
                <p>{{ ex.question }}</p>
              </div>
            }

            @if (ex.sourceText) {
              <blockquote class="source-text">{{ ex.sourceText }}</blockquote>
            }

            @if (normalizedOptions().length) {
              <div class="options">
                @for (option of normalizedOptions(); track option.label; let i = $index) {
                  <button
                    type="button"
                    class="option"
                    [attr.data-state]="optionState(option, i)"
                    (click)="selectOption(i)"
                  >
                    <span class="option-marker">{{ option.label }}</span>
                    <span>{{ option.text }}</span>
                  </button>
                }
              </div>
            } @else {
              <label class="answer-field" for="answer">
                <span>Your answer</span>
                <textarea
                  id="answer"
                  class="input answer-input"
                  placeholder="Write your answer here..."
                  [(ngModel)]="draftAnswer"
                  [ngModelOptions]="{ standalone: true }"
                ></textarea>
              </label>
            }

            @if (hintItems().length) {
              <div class="hints">
                <strong>{{ hintItems().length === 1 ? 'Hint' : 'Hints' }}</strong>
                <ul>
                  @for (hint of hintItems(); track hint) {
                    <li>
                      <app-icon name="check" [size]="15"></app-icon>
                      <span>{{ hint }}</span>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (answerText()) {
              <div class="answer-actions">
                <button
                  type="button"
                  class="btn btn-outline"
                  (click)="showAnswer.set(!showAnswer())"
                >
                  {{ showAnswer() ? 'Hide answer' : 'Reveal answer' }}
                </button>
              </div>

              @if (showAnswer()) {
                <div class="answer-box">
                  <strong>Expected answer</strong>
                  <p>{{ answerText() }}</p>
                  @if (ex.explanation) {
                    <span>{{ ex.explanation }}</span>
                  }
                </div>
              }
            }
          } @else {
            <div class="empty-state">
              <span class="stat-icon blue">
                <app-icon name="sparkles" [size]="22"></app-icon>
              </span>
              <h2>No exercise generated yet</h2>
              <p class="text-muted">
                Start with A1, Daily Routine and translation, or switch levels
                to see only the topics valid for that level.
              </p>
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './exercises.component.css',
})
export class ExercisesComponent {
  private fb = inject(FormBuilder);
  private exercises = inject(ExerciseService);

  levels = PRACTICE_LEVELS;
  topics = PRACTICE_TOPICS;
  exerciseTypes = EXERCISE_TYPES;

  loading = signal(false);
  errorMsg = signal('');
  exercise = signal<ExerciseDto | null>(null);
  selectedOption = signal<number | null>(null);
  showAnswer = signal(false);
  draftAnswer = '';

  form = this.fb.nonNullable.group({
    level: ['A1' as ExerciseLevel, [Validators.required]],
    topic: ['DAILY_ROUTINE' as ExerciseTopic, [Validators.required]],
    type: ['TRANSLATION' as ExerciseType, [Validators.required]],
  });

  normalizedOptions = computed<NormalizedOption[]>(() => {
    const options = this.exercise()?.options ?? [];

    return options.map((option, index) => {
      if (typeof option === 'string') {
        return {
          label: this.optionLabel(index),
          text: option,
        };
      }

      return {
        label: option.label || option.id || this.optionLabel(index),
        text: this.optionText(option, index),
        correct: option.correct,
      };
    });
  });

  hintItems = computed<string[]>(() => {
    const exercise = this.exercise();
    if (!exercise) {
      return [];
    }

    const hints = exercise.hints ?? [];
    return exercise.hint ? [exercise.hint, ...hints] : hints;
  });

  generate(): void {
    this.errorMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ensureTopicMatchesLevel();
    this.loading.set(true);
    this.showAnswer.set(false);
    this.selectedOption.set(null);
    this.draftAnswer = '';
    const request = this.request();

    this.exercises.generateExercise(request).subscribe({
      next: (exercise) => {
        this.exercise.set({
          ...exercise,
          level: exercise.level || request.level,
          topic: exercise.topic || request.topic,
          type: exercise.type || request.type,
        });
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  selectOption(index: number): void {
    this.selectedOption.set(index);
  }

  onLevelChange(): void {
    this.ensureTopicMatchesLevel();
  }

  topicsForSelectedLevel(): TopicOption[] {
    const level = this.form.controls.level.value;
    return this.topics.filter((topic) => topic.level === level);
  }

  exerciseLevel(exercise: ExerciseDto): string {
    return exercise.level || this.form.controls.level.value;
  }

  exerciseTypeLabel(exercise: ExerciseDto): string {
    return this.typeLabel(exercise.type || this.form.controls.type.value);
  }

  exerciseTopicLabel(exercise: ExerciseDto): string {
    return this.topicLabel(exercise.topic || this.form.controls.topic.value);
  }

  exerciseTitle(exercise: ExerciseDto): string {
    return exercise.title || `${this.exerciseTypeLabel(exercise)} practice`;
  }

  typeLabel(type: string): string {
    return formatPracticeLabel(type);
  }

  topicLabel(topic: string): string {
    return topicLabel(topic);
  }

  answerText(): string {
    const exercise = this.exercise();
    return (
      exercise?.expectedAnswer ||
      exercise?.correctAnswer ||
      exercise?.answer ||
      ''
    );
  }

  optionState(option: NormalizedOption, index: number): string {
    if (!this.showAnswer()) {
      return this.selectedOption() === index ? 'selected' : '';
    }

    if (this.isCorrectOption(option)) {
      return 'correct';
    }

    return this.selectedOption() === index ? 'wrong' : '';
  }

  private request(): GenerateExerciseRequest {
    const { level, topic, type } = this.form.getRawValue();
    return { level, topic, type };
  }

  private ensureTopicMatchesLevel(): void {
    const availableTopics = this.topicsForSelectedLevel();
    const selectedTopic = this.form.controls.topic.value;

    if (availableTopics.some((topic) => topic.value === selectedTopic)) {
      return;
    }

    const firstTopic = availableTopics[0];
    if (firstTopic) {
      this.form.controls.topic.setValue(firstTopic.value);
    }
  }

  private optionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private optionText(option: ExerciseOptionDto, index: number): string {
    return option.text || option.label || option.id || `Option ${index + 1}`;
  }

  private isCorrectOption(option: NormalizedOption): boolean {
    if (option.correct === true) {
      return true;
    }

    const answer = this.answerText().trim().toLowerCase();
    return (
      !!answer &&
      [option.label, option.text].some(
        (value) => value.trim().toLowerCase() === answer,
      )
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
