import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpeakingService } from '../../services/speaking.service';
import { IconComponent } from '../../components/icon.component';
import {
  GenerateExerciseRequest,
  ExerciseLevel,
  ExerciseTopic,
  SpeakingEvaluationDto,
  SpeakingPracticeDto,
  SpeakingPrompt,
} from '../../models';
import {
  PRACTICE_LEVELS,
  PRACTICE_TOPICS,
  TopicOption,
  topicLabel,
} from '../../practice-options';

@Component({
  selector: 'app-speaking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Speaking practice</span>
        <h1>Speak like the exam</h1>
        <p class="text-muted">
          Choose a level and topic, generate a prompt, then record your answer.
        </p>
      </div>
    </header>

    <div class="layout">
      <section class="card card-pad generator">
        <div class="section-title">
          <span class="stat-icon blue">
            <app-icon name="mic" [size]="22"></app-icon>
          </span>
          <div>
            <h2>Generate speaking practice</h2>
            <p class="text-muted">
              Topics are matched to the selected level, using the same topic
              set as exercises.
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

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loading() || recording() || uploadingRecording()"
          >
            @if (loading()) {
              Generating prompt...
            } @else {
              <app-icon name="sparkles" [size]="18"></app-icon>
              Generate prompt
            }
          </button>
        </form>
      </section>

      <section class="card card-pad panel">
        @if (loading()) {
          <div class="empty-state">
            <span class="stat-icon sky">
              <app-icon name="sparkles" [size]="22"></app-icon>
            </span>
            <h2>Generating...</h2>
            <p class="text-muted">
              Preparing a speaking prompt for your selected level and topic.
            </p>
          </div>
        } @else {
          @if (current(); as prompt) {
            <span class="badge badge-sky">
              {{ promptTopicLabel(prompt) }} &middot; {{ prompt.level }}
            </span>

            @if (prompt.audioUrl) {
              <div class="prompt-audio">
                <button
                  type="button"
                  class="listen-btn"
                  [class.playing]="promptAudioPlaying()"
                  (click)="togglePromptAudio()"
                  [attr.aria-label]="
                    promptAudioPlaying()
                      ? 'Pause question audio'
                      : 'Play question audio'
                  "
                >
                  <app-icon
                    [name]="promptAudioPlaying() ? 'pause' : 'play'"
                    [size]="22"
                  ></app-icon>
                </button>
                <div class="prompt-audio-copy">
                  <strong>
                    {{
                      promptAudioPlaying()
                        ? 'Playing question audio'
                        : 'Listen to the question'
                    }}
                  </strong>
                  <span class="text-muted">
                    Play the Luxembourgish question before revealing the text.
                  </span>
                </div>
              </div>
            } @else {
              <div class="form-error" role="alert">
                Generated prompt did not include audio.
              </div>
            }

            @if (promptAudioError()) {
              <div class="form-error" role="alert">{{ promptAudioError() }}</div>
            }

            <div class="prompt-actions">
              <button
                type="button"
                class="btn btn-primary prompt-action-btn"
                (click)="showQuestion.set(!showQuestion())"
              >
                {{ showQuestion() ? 'Hide original' : 'See original' }}
              </button>

              @if (prompt.questionEn) {
                <button
                  type="button"
                  class="btn btn-outline prompt-action-btn"
                  (click)="showTranslation.set(!showTranslation())"
                >
                  {{ showTranslation() ? 'Hide translation' : 'Translate' }}
                </button>
              } @else {
                <button type="button" class="btn btn-outline prompt-action-btn" disabled>
                  Translation unavailable
                </button>
              }
            </div>

            @if (showQuestion()) {
              <h2 class="lb-question">{{ prompt.question }}</h2>
            }

            @if (showTranslation()) {
              <p class="text-muted translation">{{ prompt.questionEn }}</p>
            }

            <div class="recorder">
              <button
                class="record-btn"
                [class.recording]="recording()"
                (click)="toggleRecord()"
                [disabled]="uploadingRecording()"
                [attr.aria-label]="recording() ? 'Stop recording' : 'Start recording'"
              >
                <app-icon [name]="recording() ? 'check' : 'mic'" [size]="26"></app-icon>
              </button>
              <div class="recorder-meta">
                <strong>
                  {{
                    recording()
                      ? 'Recording...'
                      : uploadingRecording()
                        ? 'Uploading recording...'
                        : evaluation()
                          ? 'Evaluation ready'
                        : 'Ready when you are'
                  }}
                </strong>
                <span class="text-muted">{{ formattedTime() }}</span>
              </div>
            </div>

            @if (recordingError()) {
              <div class="form-error recording-error" role="alert">
                {{ recordingError() }}
              </div>
            }

            @if (retryableRecording()) {
              <button
                type="button"
                class="btn btn-outline retry-recording-btn"
                [disabled]="uploadingRecording()"
                (click)="resendRecording()"
              >
                Resend recording
              </button>
            }

            @if (evaluation(); as result) {
              <div class="feedback">
                <div class="flex items-center gap-2 fb-head">
                  <app-icon name="sparkles" [size]="18"></app-icon>
                  <strong>Coach evaluation</strong>
                  <span class="badge badge-green">Score {{ result.score ?? 0 }}/100</span>
                </div>
                @if (result.transcript) {
                  <div class="evaluation-block">
                    <strong>Transcript</strong>
                    <p>{{ result.transcript }}</p>
                  </div>
                }
                @if (result.feedback) {
                  <div class="evaluation-block">
                    <strong>Feedback</strong>
                    <p>{{ result.feedback }}</p>
                  </div>
                }
                @if (correctionItems(result).length) {
                  <div class="evaluation-block">
                    <strong>Corrections</strong>
                    <ul>
                      @for (correction of correctionItems(result); track correction) {
                        <li>{{ correction }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>

              <div class="record-again-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="recording() || uploadingRecording()"
                  (click)="recordNewAnswer()"
                >
                  <app-icon name="mic" [size]="18"></app-icon>
                  Record new answer
                </button>
              </div>
            }

            @if (prompt.tips.length) {
              <div class="tips">
                <h3>Coaching tips for this prompt</h3>
                <ul>
                  @for (tip of prompt.tips; track tip) {
                    <li><app-icon name="check" [size]="16"></app-icon> {{ tip }}</li>
                  }
                </ul>
              </div>
            }
          } @else {
            <div class="empty-state">
              <span class="stat-icon blue">
                <app-icon name="mic" [size]="22"></app-icon>
              </span>
              <h2>No prompt generated yet</h2>
              <p class="text-muted">
                Pick a level and topic, then generate a speaking practice prompt.
              </p>
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './speaking.component.css',
})
export class SpeakingComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private speaking = inject(SpeakingService);

  levels = PRACTICE_LEVELS;
  topics = PRACTICE_TOPICS;
  loading = signal(false);
  errorMsg = signal('');
  current = signal<SpeakingPrompt | null>(null);
  recording = signal(false);
  uploadingRecording = signal(false);
  evaluation = signal<SpeakingEvaluationDto | null>(null);
  recordingError = signal('');
  retryableRecording = signal(false);
  elapsed = signal(0);
  showQuestion = signal(false);
  showTranslation = signal(false);
  promptAudioPlaying = signal(false);
  promptAudioError = signal('');

  private timer: ReturnType<typeof setInterval> | null = null;
  private promptAudio: HTMLAudioElement | null = null;
  private promptAudioObjectUrl: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private lastRecordingAudio: Blob | null = null;
  private shouldUploadStoppedRecording = false;

  form = this.fb.nonNullable.group({
    level: ['A2' as ExerciseLevel, [Validators.required]],
    topic: ['WORK' as ExerciseTopic, [Validators.required]],
  });

  generate(): void {
    this.errorMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ensureTopicMatchesLevel();
    this.stopRecording(false);
    this.loading.set(true);
    this.resetPracticeSession();
    this.current.set(null);
    const request = this.request();

    this.speaking.generatePractice(request).subscribe({
      next: (practice) => {
        this.current.set(this.toPrompt(practice, request));
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

  promptTopicLabel(prompt: SpeakingPrompt): string {
    return topicLabel(prompt.topic);
  }

  togglePromptAudio(): void {
    const audioUrl = this.current()?.audioUrl;

    if (!audioUrl) {
      this.promptAudioError.set('No generated audio is available for this prompt.');
      return;
    }

    this.promptAudioError.set('');

    if (!this.promptAudio || this.promptAudio.src !== audioUrl) {
      this.promptAudio = new Audio(audioUrl);
      this.promptAudio.addEventListener('play', () =>
        this.promptAudioPlaying.set(true),
      );
      this.promptAudio.addEventListener('pause', () =>
        this.promptAudioPlaying.set(false),
      );
      this.promptAudio.addEventListener('ended', () =>
        this.promptAudioPlaying.set(false),
      );
      this.promptAudio.addEventListener('error', () => {
        this.promptAudioPlaying.set(false);
        this.promptAudioError.set('Could not play the generated question audio.');
      });
    }

    if (this.promptAudio.paused) {
      void this.promptAudio.play().catch(() => {
        this.promptAudioPlaying.set(false);
        this.promptAudioError.set('Could not play the generated question audio.');
      });
      return;
    }

    this.promptAudio.pause();
  }

  toggleRecord(): void {
    if (!this.current() || this.loading() || this.uploadingRecording()) {
      return;
    }

    if (this.recording()) {
      this.stopRecording(true);
    } else {
      void this.startRecording();
    }
  }

  resendRecording(): void {
    if (!this.lastRecordingAudio || this.uploadingRecording()) {
      return;
    }

    this.uploadRecordedAudio(this.lastRecordingAudio);
  }

  recordNewAnswer(): void {
    if (!this.current() || this.loading() || this.recording() || this.uploadingRecording()) {
      return;
    }

    this.promptAudio?.pause();
    this.evaluation.set(null);
    this.recordingError.set('');
    this.retryableRecording.set(false);
    this.lastRecordingAudio = null;
    this.elapsed.set(0);

    void this.startRecording();
  }

  formattedTime(): string {
    const seconds = this.elapsed();
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private stopRecording(uploadRecording: boolean): void {
    this.shouldUploadStoppedRecording = uploadRecording;
    this.recording.set(false);
    this.clearTimer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      return;
    }

    this.cleanupRecordingResources();
  }

  private resetPracticeSession(): void {
    this.clearPromptAudio();
    this.evaluation.set(null);
    this.recordingError.set('');
    this.retryableRecording.set(false);
    this.lastRecordingAudio = null;
    this.elapsed.set(0);
    this.showQuestion.set(false);
    this.showTranslation.set(false);
    this.promptAudioError.set('');
  }

  private async startRecording(): Promise<void> {
    this.recordingError.set('');
    this.evaluation.set(null);
    this.retryableRecording.set(false);
    this.lastRecordingAudio = null;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.recordingError.set('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeType = this.supportedAudioMimeType();

      this.mediaStream = mediaStream;
      this.recordedChunks = [];
      this.mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      });
      this.mediaRecorder.addEventListener(
        'stop',
        () => this.handleRecordingStop(),
        { once: true },
      );

      this.mediaRecorder.start();
      this.recording.set(true);
      this.elapsed.set(0);
      this.timer = setInterval(() => this.elapsed.update((value) => value + 1), 1000);
    } catch (error) {
      this.recordingError.set(this.microphoneErrorMessage(error));
      this.cleanupRecordingResources();
    }
  }

  private handleRecordingStop(): void {
    const shouldUploadRecording = this.shouldUploadStoppedRecording;
    const recordedChunks = [...this.recordedChunks];
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';

    this.shouldUploadStoppedRecording = false;
    this.cleanupRecordingResources();

    if (!shouldUploadRecording) {
      return;
    }

    if (!recordedChunks.length) {
      this.recordingError.set('No audio was captured. Please try again.');
      return;
    }

    const audio = new Blob(recordedChunks, { type: mimeType });
    this.uploadRecordedAudio(audio);
  }

  private uploadRecordedAudio(audio: Blob): void {
    this.lastRecordingAudio = audio;
    this.uploadingRecording.set(true);
    this.retryableRecording.set(false);
    this.evaluation.set(null);
    this.recordingError.set('');

    this.speaking.uploadRecording(audio).subscribe({
      next: (evaluation) => {
        this.evaluation.set(evaluation);
        this.lastRecordingAudio = null;
      },
      error: (error) => {
        this.recordingError.set(this.errorMessage(error));
        this.retryableRecording.set(true);
        this.uploadingRecording.set(false);
      },
      complete: () => {
        this.uploadingRecording.set(false);
      },
    });
  }

  private supportedAudioMimeType(): string | undefined {
    return ['audio/webm;codecs=opus', 'audio/webm'].find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    );
  }

  private cleanupRecordingResources(): void {
    this.recordedChunks = [];
    this.mediaRecorder = null;

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  private request(): GenerateExerciseRequest {
    const { level, topic } = this.form.getRawValue();
    return { level, topic, type: 'SHORT_ANSWER' };
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

  private toPrompt(
    practice: SpeakingPracticeDto,
    request: GenerateExerciseRequest,
  ): SpeakingPrompt {
    const practiceTopic = practice.topic || practice.title || request.topic;

    return {
      id: practice.id || `${request.level}-${request.topic}-${Date.now()}`,
      topic: practiceTopic,
      level: practice.level || request.level,
      question:
        practice.question ||
        practice.prompt ||
        practice.instruction ||
        'Generated prompt did not include a question.',
      questionEn:
        this.translationText(practice) ||
        (practice.title && practice.title !== practiceTopic ? practice.title : ''),
      audioUrl: this.toPromptAudioUrl(practice),
      tips: this.collectTips(practice),
    };
  }

  private toPromptAudioUrl(practice: SpeakingPracticeDto): string {
    const audio = practice.audio;

    if (!audio) {
      return '';
    }

    try {
      const bytes = Array.isArray(audio)
        ? new Uint8Array(audio)
        : this.base64ToBytes(audio);
      const blob = new Blob([bytes], {
        type: practice.audioMimeType || practice.audioContentType || 'audio/mpeg',
      });
      const audioUrl = URL.createObjectURL(blob);

      this.promptAudioObjectUrl = audioUrl;
      return audioUrl;
    } catch {
      this.promptAudioError.set('Generated audio could not be loaded.');
      return '';
    }
  }

  private base64ToBytes(value: string): Uint8Array {
    const base64 = value.includes(',') ? value.split(',').pop() || '' : value;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  private clearPromptAudio(): void {
    this.promptAudio?.pause();
    this.promptAudio = null;
    this.promptAudioPlaying.set(false);

    if (this.promptAudioObjectUrl) {
      URL.revokeObjectURL(this.promptAudioObjectUrl);
      this.promptAudioObjectUrl = null;
    }
  }

  private translationText(practice: SpeakingPracticeDto): string {
    return (
      practice.questionsTranslations ||
      practice.questionTranslation ||
      practice.questionEn ||
      practice.promptEn ||
      ''
    );
  }

  private collectTips(practice: SpeakingPracticeDto): string[] {
    const hints = practice.hints ?? [];
    return practice.hint ? [practice.hint, ...hints] : hints;
  }

  correctionItems(evaluation: SpeakingEvaluationDto): string[] {
    return (evaluation.corrections ?? []).filter(
      (correction) => correction.trim().length > 0,
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }

  private microphoneErrorMessage(error: unknown): string {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'Microphone permission was denied.';
    }

    return this.errorMessage(error);
  }

  ngOnDestroy(): void {
    this.stopRecording(false);
    this.clearTimer();
    this.clearPromptAudio();
  }
}
