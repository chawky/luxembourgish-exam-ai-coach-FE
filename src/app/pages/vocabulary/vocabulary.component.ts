import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { friendlyErrorMessage } from '../../error-message';
import {
  GenerateVocabularyRequest,
  VocabularyExerciseDto,
} from '../../models';
import {
  SelectOption,
  TopicOption,
  topicLabel,
} from '../../practice-options';
import { AiQuotaService, AiQuotaStatus } from '../../services/ai-quota.service';
import { ExerciseService } from '../../services/exercise.service';
import { PracticeConfigService } from '../../services/practice-config.service';
import { VocabularyService } from '../../services/vocabulary.service';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Vocabulary practice</span>
        <h1>Build everyday Luxembourgish</h1>
        <p class="text-muted">
          Choose a level and topic to create useful vocabulary with example
          sentences.
        </p>
      </div>
    </header>

    <div class="layout">
      <section class="card card-pad generator">
        <div class="section-title">
          <span class="stat-icon sky">
            <app-icon name="cards" [size]="22"></app-icon>
          </span>
          <div>
            <h2>Generate vocabulary</h2>
            <p class="text-muted">
              Topics follow the selected level, so each vocabulary set stays
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

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }
          @if (quotaMessage()) {
            <div class="form-error" role="alert">{{ quotaMessage() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loading() || configLoading() || form.invalid || quotaBlocked()"
          >
            @if (configLoading()) {
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Loading options...
            } @else if (loading()) {
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Generating vocabulary...
            } @else {
              <app-icon name="sparkles" [size]="18"></app-icon>
              Generate vocabulary
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
              Preparing useful vocabulary and example sentences for your
              selection.
            </p>
          </div>
        } @else {
          @if (vocabulary()) {
            @if (currentSentence(); as sentence) {
              <div class="exercise-head">
                <div>
                  <span class="eyebrow">Vocabulary deck</span>
                  <h2>{{ exerciseTopicLabel() }} vocabulary</h2>
                </div>
                <div class="badges">
                  <span class="badge badge-sky">{{ exerciseLevel() }}</span>
                  <span class="badge">{{ exerciseTopicLabel() }}</span>
                </div>
              </div>

              <div class="flash-area">
                <button
                  type="button"
                  class="arrow-btn"
                  [disabled]="sentences().length < 2"
                  aria-label="Previous card"
                  (click)="prev()"
                >
                  <app-icon name="arrow" [size]="20" class="flip"></app-icon>
                </button>

                <div
                  class="flashcard"
                  [class.flipped]="flipped()"
                  role="button"
                  tabindex="0"
                  aria-label="Reveal translation"
                  (click)="flip()"
                  (keydown.enter)="flip()"
                  (keydown.space)="$event.preventDefault(); flip()"
                >
                  <div class="face front">
                    <span class="badge badge-sky">{{ exerciseTopicLabel() }}</span>
                    <strong class="lb-word">
                      {{ sentence.vocabularyWord || 'Vocabulary word' }}
                    </strong>
                    @if (sentence.sentence) {
                      <p class="example">{{ sentence.sentence }}</p>
                    }
                    <span class="text-muted">Tap to reveal the translation</span>
                  </div>
                  <div class="face back">
                    <span class="en-word">
                      {{ sentence.wordTranslation || 'Translation unavailable' }}
                    </span>
                    @if (sentence.sentenceTranslation) {
                      <p class="example">{{ sentence.sentenceTranslation }}</p>
                    }
                  </div>
                </div>

                <button
                  type="button"
                  class="arrow-btn"
                  [disabled]="sentences().length < 2"
                  aria-label="Next card"
                  (click)="next()"
                >
                  <app-icon name="arrow" [size]="20"></app-icon>
                </button>
              </div>

              <div class="counter">
                <span class="text-muted">
                  Card {{ index() + 1 }} of {{ sentences().length }}
                </span>
                <div class="dots">
                  @for (item of sentences(); track $index; let i = $index) {
                    <span class="dot" [class.active]="i === index()"></span>
                  }
                </div>
              </div>

              <div class="answer-actions">
                <button type="button" class="btn btn-outline" (click)="flip()">
                  {{ flipped() ? 'Hide translation' : 'Reveal translation' }}
                </button>
                <button type="button" class="btn btn-ghost" (click)="generate()">
                  Generate another set
                </button>
              </div>
            } @else {
              <div class="empty-state">
                <span class="stat-icon sky">
                  <app-icon name="cards" [size]="22"></app-icon>
                </span>
                <h2>No vocabulary returned</h2>
                <p class="text-muted">
                  Try generating a new set or choose another topic.
                </p>
              </div>
            }
          } @else {
            <div class="empty-state">
              <span class="stat-icon sky">
                <app-icon name="cards" [size]="22"></app-icon>
              </span>
              <h2>No vocabulary generated yet</h2>
              <p class="text-muted">
                Start with A1 and Daily Routine, or choose another valid topic
                for your current level.
              </p>
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './vocabulary.component.css',
})
export class VocabularyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vocabularyService = inject(VocabularyService);
  private practiceConfig = inject(PracticeConfigService);
  private exercises = inject(ExerciseService);
  private aiQuota = inject(AiQuotaService);

  levels: SelectOption[] = [];
  topics: TopicOption[] = [];

  configLoading = signal(false);
  loading = signal(false);
  errorMsg = signal('');
  quota = signal<AiQuotaStatus | null>(null);
  vocabulary = signal<VocabularyExerciseDto | null>(null);
  requestContext = signal<GenerateVocabularyRequest | null>(null);
  index = signal(0);
  flipped = signal(false);
  completedAttemptIds = new Set<number>();

  form = this.fb.nonNullable.group({
    level: ['', [Validators.required]],
    topic: ['', [Validators.required]],
  });

  sentences = computed(() => this.vocabulary()?.usefulSentences ?? []);

  currentSentence = computed(() => this.sentences()[this.index()] ?? null);

  ngOnInit(): void {
    this.loadPracticeConfig();
    this.loadQuota();
  }

  generate(): void {
    this.errorMsg.set('');

    if (this.quotaBlocked()) {
      this.errorMsg.set(this.quotaMessage());
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ensureTopicMatchesLevel();
    this.loading.set(true);
    this.index.set(0);
    this.flipped.set(false);
    const request = this.request();

    this.vocabularyService.generateVocabulary(request).subscribe({
      next: (vocabulary) => {
        this.vocabulary.set(vocabulary);
        this.requestContext.set(request);
        this.loadQuota(true);
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.loadQuota(true);
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  flip(): void {
    this.flipped.update((value) => !value);

    if (this.flipped()) {
      this.completeCurrentAttempt();
    }
  }

  next(): void {
    const count = this.sentences().length;
    if (count < 2) {
      return;
    }

    this.flipped.set(false);
    this.index.update((value) => (value + 1) % count);
  }

  prev(): void {
    const count = this.sentences().length;
    if (count < 2) {
      return;
    }

    this.flipped.set(false);
    this.index.update((value) => (value - 1 + count) % count);
  }

  onLevelChange(): void {
    this.ensureTopicMatchesLevel();
  }

  topicsForSelectedLevel(): TopicOption[] {
    const level = this.form.controls.level.value;
    return this.topics.filter((topic) => topic.level === level);
  }

  exerciseLevel(): string {
    return this.requestContext()?.level || this.form.controls.level.value;
  }

  exerciseTopicLabel(): string {
    return topicLabel(
      this.requestContext()?.topic || this.form.controls.topic.value,
      this.topics,
    );
  }

  quotaBlocked(): boolean {
    return this.aiQuota.isExhausted(this.quota(), 'CHAT');
  }

  quotaMessage(): string {
    return this.quotaBlocked()
      ? this.aiQuota.blockedMessage(this.quota(), 'CHAT')
      : '';
  }

  private request(): GenerateVocabularyRequest {
    const { level, topic } = this.form.getRawValue();
    return { level, topic };
  }

  private loadPracticeConfig(): void {
    this.configLoading.set(true);

    this.practiceConfig.getConfig().subscribe({
      next: (config) => {
        this.levels = config.levels;
        this.topics = config.topics;
        this.applySelectionDefaults();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.configLoading.set(false);
      },
      complete: () => {
        this.configLoading.set(false);
      },
    });
  }

  private loadQuota(refresh = false): void {
    this.aiQuota.getMyQuota(refresh).subscribe({
      next: (quota) => this.quota.set(quota),
      error: () => undefined,
    });
  }

  private applySelectionDefaults(): void {
    if (!this.form.controls.level.value && this.levels[0]) {
      this.form.controls.level.setValue(this.levels[0].value);
    }

    this.ensureTopicMatchesLevel();
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

  private completeCurrentAttempt(): void {
    const attemptId = this.vocabulary()?.attemptId;

    if (!attemptId || this.completedAttemptIds.has(attemptId)) {
      return;
    }

    this.completedAttemptIds.add(attemptId);
    this.exercises.completeAttempt(attemptId).subscribe({
      error: (error) => {
        this.completedAttemptIds.delete(attemptId);
        this.errorMsg.set(this.errorMessage(error));
      },
    });
  }

  private errorMessage(error: unknown): string {
    return friendlyErrorMessage(error);
  }
}
