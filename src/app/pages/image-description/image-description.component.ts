import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import {
  ExerciseLevel,
  ExerciseTopic,
  GenerateExerciseRequest,
  GeneratedImageDto,
  SpeakingEvaluationDto,
} from '../../models';
import {
  PRACTICE_LEVELS,
  PRACTICE_TOPICS,
  TopicOption,
  topicLabel,
} from '../../practice-options';
import { ImageDescriptionService } from '../../services/image-description.service';

interface ImageDescriptionExerciseView {
  id: string;
  level: string;
  topic: string;
  imageUrl: string;
  imageDescription: string;
}

@Component({
  selector: 'app-image-description',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Image description</span>
        <h1>Describe what you see</h1>
        <p class="text-muted">
          Choose a level and topic, generate an image, then record your
          Luxembourgish description for feedback.
        </p>
      </div>
    </header>

    <div class="layout">
      <section class="card card-pad generator">
        <div class="section-title">
          <span class="stat-icon sky">
            <app-icon name="image" [size]="22"></app-icon>
          </span>
          <div>
            <h2>Generate image practice</h2>
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
            class="btn btn-primary btn-block"
            type="submit"
            [disabled]="loading() || recording() || uploadingRecording()"
          >
            @if (loading()) {
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Generating image...
            } @else {
              <app-icon name="sparkles" [size]="18"></app-icon>
              Generate image
            }
          </button>
        </form>
      </section>

      <section class="card card-pad panel">
        @if (loading()) {
          <div class="empty-state">
            <span class="stat-icon sky loading-icon">
              <app-icon name="sparkles" [size]="24"></app-icon>
            </span>
            <h2>Generating...</h2>
            <p class="text-muted">
              Creating an image description task for your selected level and topic.
            </p>
          </div>
        } @else {
          @if (current(); as exercise) {
            <div class="exercise-head">
              <div>
                <span class="eyebrow">Generated image</span>
                <h2>{{ topicLabel(exercise.topic) }}</h2>
              </div>
              <div class="badges">
                <span class="badge badge-sky">{{ exercise.level }}</span>
                <span class="badge">{{ topicLabel(exercise.topic) }}</span>
              </div>
            </div>

            @if (exercise.imageUrl) {
              <figure class="image-frame">
                <img
                  [src]="exercise.imageUrl"
                  alt="Generated image for Luxembourgish description practice"
                />
              </figure>
            } @else {
              <div class="form-error" role="alert">
                The generated image could not be displayed. Generate a new image.
              </div>
            }

            @if (imageError()) {
              <div class="form-error" role="alert">{{ imageError() }}</div>
            }

            <div class="task-card">
              <span class="eyebrow">Your task</span>
              <h3>Describe the image in Luxembourgish.</h3>
              <p class="text-muted">
                Mention the setting, people, objects, actions and details you can see.
              </p>
            </div>

            <div class="recorder">
              <button
                class="record-btn"
                [class.recording]="recording()"
                (click)="toggleRecord()"
                [disabled]="uploadingRecording() || !exercise.imageDescription"
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
                  Record new description
                </button>
              </div>
            }

            <div class="tips">
              <h3>What to include</h3>
              <ul>
                <li><app-icon name="check" [size]="16"></app-icon> Start with the place or situation.</li>
                <li><app-icon name="check" [size]="16"></app-icon> Describe what people are doing.</li>
                <li><app-icon name="check" [size]="16"></app-icon> Add colors, positions and useful details.</li>
              </ul>
            </div>
          } @else {
            <div class="empty-state">
              <span class="stat-icon sky">
                <app-icon name="image" [size]="24"></app-icon>
              </span>
              <h2>No image generated yet</h2>
              <p class="text-muted">
                Pick a level and topic, then generate an image description task.
                Recording and feedback will appear here with the generated image.
              </p>

              <div class="practice-flow" aria-label="Image description practice flow">
                <div>
                  <span>1</span>
                  <strong>Generate</strong>
                  <p class="text-muted">Create a topic-based image.</p>
                </div>
                <div>
                  <span>2</span>
                  <strong>Describe</strong>
                  <p class="text-muted">Record what you see in Luxembourgish.</p>
                </div>
                <div>
                  <span>3</span>
                  <strong>Improve</strong>
                  <p class="text-muted">Review transcript, score and corrections.</p>
                </div>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './image-description.component.css',
})
export class ImageDescriptionComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private imageDescription = inject(ImageDescriptionService);

  levels = PRACTICE_LEVELS;
  topics = PRACTICE_TOPICS;
  loading = signal(false);
  errorMsg = signal('');
  imageError = signal('');
  current = signal<ImageDescriptionExerciseView | null>(null);
  recording = signal(false);
  uploadingRecording = signal(false);
  evaluation = signal<SpeakingEvaluationDto | null>(null);
  recordingError = signal('');
  retryableRecording = signal(false);
  elapsed = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private imageObjectUrl: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private lastRecordingAudio: Blob | null = null;
  private shouldUploadStoppedRecording = false;

  form = this.fb.nonNullable.group({
    level: ['B1' as ExerciseLevel, [Validators.required]],
    topic: ['CITY_AND_PLACES' as ExerciseTopic, [Validators.required]],
  });

  generate(): void {
    this.errorMsg.set('');
    this.imageError.set('');

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

    this.imageDescription.generateImage(request).subscribe({
      next: (image) => {
        this.current.set(this.toView(image, request));
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

  correctionItems(evaluation: SpeakingEvaluationDto): string[] {
    return (evaluation.corrections ?? []).filter(
      (correction) => correction.trim().length > 0,
    );
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

  private toView(
    image: GeneratedImageDto,
    request: GenerateExerciseRequest,
  ): ImageDescriptionExerciseView {
    return {
      id: `${request.level}-${request.topic}-${Date.now()}`,
      level: request.level,
      topic: request.topic,
      imageUrl: this.toImageUrl(image),
      imageDescription: image.imageDescription || '',
    };
  }

  private toImageUrl(image: GeneratedImageDto): string {
    if (!image.image) {
      return '';
    }

    try {
      const bytes = Array.isArray(image.image)
        ? new Uint8Array(image.image)
        : this.base64ToBytes(image.image);
      const blob = new Blob([bytes], { type: this.imageMimeType(bytes) });
      const imageUrl = URL.createObjectURL(blob);

      this.imageObjectUrl = imageUrl;
      return imageUrl;
    } catch {
      this.imageError.set('Generated image could not be loaded.');
      return '';
    }
  }

  private imageMimeType(bytes: Uint8Array): string {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return 'image/png';
    }

    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      return 'image/jpeg';
    }

    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'image/gif';
    }

    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return 'image/webp';
    }

    return 'image/png';
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

  private clearImage(): void {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
      this.imageObjectUrl = null;
    }
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
    this.clearImage();
    this.evaluation.set(null);
    this.recordingError.set('');
    this.retryableRecording.set(false);
    this.lastRecordingAudio = null;
    this.elapsed.set(0);
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
    const currentExercise = this.current();

    if (!currentExercise?.imageDescription) {
      this.recordingError.set('Please generate a new image before recording.');
      return;
    }

    this.lastRecordingAudio = audio;
    this.uploadingRecording.set(true);
    this.retryableRecording.set(false);
    this.evaluation.set(null);
    this.recordingError.set('');

    this.imageDescription
      .uploadRecording(audio, currentExercise.imageDescription)
      .subscribe({
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
    this.clearImage();
  }
}
