import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import {
  AudioExerciseDto,
  ExerciseLevel,
  ExerciseOptionDto,
  ExerciseTopic,
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
import { ListeningService } from '../../services/listening.service';
import { AudioPlayerComponent } from '../../components/audio-player.component';

interface NormalizedOption {
  label: string;
  text: string;
  correct?: boolean;
}

interface ListeningExerciseView {
  id: string;
  level: string;
  topic: string;
  type: string;
  transcript: string;
  translation: string;
  hint: string;
  expectedAnswer: string;
  audioUrl: string;
  options: Array<string | ExerciseOptionDto>;
}

@Component({
  selector: 'app-listening',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    AudioPlayerComponent,
  ],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Listening comprehension</span>
        <h1>Train your ear</h1>
        <p class="text-muted">
          Generate a Luxembourgish audio clip from your selected level and
          topic, then answer from what you hear.
        </p>
      </div>
    </header>

    <div class="layout">
      <section class="card card-pad generator">
        <div class="section-title">
          <span class="stat-icon sky">
            <app-icon name="headphones" [size]="22"></app-icon>
          </span>
          <div>
            <h2>Generate listening practice</h2>
            <p class="text-muted">
              Choose your focus, then create a short audio task for ear
              training.
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
            <label for="type">Answer type</label>
            <select id="type" class="input" formControlName="type">
              @for (type of exerciseTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </div>

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            @if (loading()) {
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Generating audio...
            } @else {
              <app-icon name="sparkles" [size]="18"></app-icon>
              Generate listening exercise
            }
          </button>
        </form>
      </section>

      <section class="card card-pad exercise">
        @if (loading()) {
          <div class="empty-state">
            <span class="stat-icon sky loading-icon">
              <app-icon name="sparkles" [size]="24"></app-icon>
            </span>
            <h2>Generating...</h2>
            <p class="text-muted">
              Creating a listening text and audio clip for your selection.
            </p>
          </div>
        } @else {
          @if (current(); as exercise) {
            <div class="exercise-head">
              <div>
                <span class="eyebrow">{{ typeLabel(exercise.type) }}</span>
                <h2>{{ topicLabel(exercise.topic) }} listening</h2>
              </div>
              <div class="badges">
                <span class="badge badge-sky">{{ exercise.level }}</span>
                <span class="badge">{{ topicLabel(exercise.topic) }}</span>
              </div>
            </div>

            @if (exercise.audioUrl) {
              <app-audio-player
                [src]="exercise.audioUrl"
                title="Generated audio"
                subtitle="Click or drag the waveform to seek through the clip."
              ></app-audio-player>
            } @else {
              <div class="callout">
                <strong>No audio returned</strong>
                <p>
                  The exercise text is ready, but audio is not available for
                  this attempt. Try generating a new one.
                </p>
              </div>
            }

            @if (audioError()) {
              <div class="form-error" role="alert">{{ audioError() }}</div>
            }

            <p class="transcript-note text-muted">
              <app-icon name="info" [size]="14"></app-icon>
              Listen first. Reveal the transcript or translation only when needed.
            </p>

            <div class="reveal-actions">
              <button class="link-btn" type="button" (click)="showTranscript.update(toggle)">
                {{ showTranscript() ? 'Hide transcript' : 'Show transcript' }}
              </button>
              @if (exercise.translation) {
                <button class="link-btn" type="button" (click)="showTranslation.update(toggle)">
                  {{ showTranslation() ? 'Hide translation' : 'Show translation' }}
                </button>
              }
            </div>

            @if (showTranscript()) {
              <blockquote class="transcript">{{ exercise.transcript }}</blockquote>
            }

            @if (showTranslation() && exercise.translation) {
              <div class="translation">
                <strong>English translation</strong>
                <p>{{ exercise.translation }}</p>
              </div>
            }

            <div class="question">
              <span class="eyebrow">Your task</span>
              <h3>{{ exercise.hint || defaultTaskText }}</h3>

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
                <label class="answer-field">
                  <span>Your answer</span>
                  <textarea
                    class="input answer-input"
                    [(ngModel)]="draftAnswer"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Write what you understood from the audio..."
                  ></textarea>
                </label>
              }
            </div>

            <div class="answer-actions">
              <button
                class="btn btn-outline"
                type="button"
                (click)="showAnswer.set(true)"
                [disabled]="showAnswer()"
              >
                Show model answer
              </button>
              <button class="btn btn-ghost" type="button" (click)="resetAttempt()">
                Reset answer
              </button>
            </div>

            @if (showAnswer()) {
              <div class="answer-box">
                <strong>Expected answer</strong>
                <p>{{ exercise.expectedAnswer || 'No model answer was returned.' }}</p>
              </div>
            }
          } @else {
            <div class="empty-state">
              <span class="stat-icon sky">
                <app-icon name="headphones" [size]="24"></app-icon>
              </span>
              <h2>No listening exercise yet</h2>
              <p class="text-muted">
                Pick a level, topic and answer type, then generate a listening
                exercise.
              </p>
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './listening.component.css',
})
export class ListeningComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private listening = inject(ListeningService);

  levels = PRACTICE_LEVELS;
  topics = PRACTICE_TOPICS;
  exerciseTypes = EXERCISE_TYPES;
  letters = ['A', 'B', 'C', 'D'];
  defaultTaskText = 'Listen to the audio and answer from what you hear.';
  toggle = (value: boolean): boolean => !value;

  loading = signal(false);
  errorMsg = signal('');
  audioError = signal('');
  current = signal<ListeningExerciseView | null>(null);
  showTranscript = signal(false);
  showTranslation = signal(false);
  showAnswer = signal(false);
  selectedOption = signal<number | null>(null);
  draftAnswer = '';

  private audioObjectUrl: string | null = null;

  form = this.fb.nonNullable.group({
    level: ['B1' as ExerciseLevel, [Validators.required]],
    topic: ['PUBLIC_SERVICES' as ExerciseTopic, [Validators.required]],
    type: ['MULTIPLE_CHOICE' as ExerciseType, [Validators.required]],
  });

  normalizedOptions = computed<NormalizedOption[]>(() => {
    const options = this.current()?.options ?? [];

    return options.map((option, index) => {
      if (typeof option === 'string') {
        return {
          label: this.letters[index] ?? `${index + 1}`,
          text: option,
        };
      }

      return {
        label: option.label || option.id || this.letters[index] || `${index + 1}`,
        text: option.text || option.label || '',
        correct: option.correct,
      };
    });
  });

  generate(): void {
    this.errorMsg.set('');
    this.audioError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ensureTopicMatchesLevel();
    this.loading.set(true);
    this.current.set(null);
    this.resetAttempt();
    this.clearAudio();

    const request = this.request();

    this.listening.generateListeningExercise(request).subscribe({
      next: (exercise) => {
        this.current.set(this.toView(exercise, request));
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

  onLevelChange(): void {
    this.ensureTopicMatchesLevel();
  }

  topicsForSelectedLevel(): TopicOption[] {
    const level = this.form.controls.level.value;
    return this.topics.filter((topic) => topic.level === level);
  }

  topicLabel(topic: string): string {
    return topicLabel(topic);
  }

  typeLabel(type: string): string {
    return formatPracticeLabel(type);
  }

  selectOption(index: number): void {
    if (this.showAnswer()) {
      return;
    }

    this.selectedOption.set(index);
    this.showAnswer.set(true);
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

  resetAttempt(): void {
    this.selectedOption.set(null);
    this.showAnswer.set(false);
    this.draftAnswer = '';
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

  private toView(
    exercise: AudioExerciseDto,
    request: GenerateExerciseRequest,
  ): ListeningExerciseView {
    const exerciseTopic = exercise.topic || request.topic;

    return {
      id: exercise.id || `${request.level}-${request.topic}-${Date.now()}`,
      level: exercise.level || request.level,
      topic: exerciseTopic,
      type: exercise.type || request.type,
      transcript:
        exercise.question ||
        exercise.prompt ||
        exercise.instruction ||
        'Generated exercise did not include a listening text.',
      translation: exercise.questionTranslation || '',
      hint: exercise.hint || '',
      expectedAnswer:
        exercise.expectedAnswer || exercise.correctAnswer || exercise.answer || '',
      audioUrl: this.toAudioUrl(exercise),
      options: exercise.options ?? [],
    };
  }

  private toAudioUrl(exercise: AudioExerciseDto): string {
    const audio = exercise.audio;

    if (!audio) {
      return '';
    }

    try {
      const bytes = Array.isArray(audio)
        ? new Uint8Array(audio)
        : this.base64ToBytes(audio);
      const blob = new Blob([bytes], {
        type: exercise.audioMimeType || exercise.audioContentType || 'audio/mpeg',
      });
      const audioUrl = URL.createObjectURL(blob);

      this.audioObjectUrl = audioUrl;
      return audioUrl;
    } catch {
      this.audioError.set('Generated audio could not be loaded.');
      return '';
    }
  }

  private base64ToBytes(value: string): Uint8Array {
    const base64 = (value.includes(',') ? value.split(',').pop() || '' : value)
      .replace(/\s/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  private clearAudio(): void {
    if (this.audioObjectUrl) {
      URL.revokeObjectURL(this.audioObjectUrl);
      this.audioObjectUrl = null;
    }
  }

  private isCorrectOption(option: NormalizedOption): boolean {
    if (option.correct === true) {
      return true;
    }

    const expectedAnswer = this.current()?.expectedAnswer.trim().toLowerCase();
    const optionText = option.text.trim().toLowerCase();
    const optionLabel = option.label.trim().toLowerCase();

    if (!expectedAnswer || !optionText) {
      return false;
    }

    return (
      expectedAnswer === optionText ||
      expectedAnswer.includes(optionText) ||
      expectedAnswer === optionLabel ||
      expectedAnswer.startsWith(`${optionLabel}.`) ||
      expectedAnswer.startsWith(`${optionLabel})`)
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }

  ngOnDestroy(): void {
    this.clearAudio();
  }
}
