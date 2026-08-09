import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { IconComponent } from '../../components/icon.component';
import { SpeakingPrompt } from '../../models';

@Component({
  selector: 'app-speaking',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Speaking practice</span>
        <h1>Speak like the exam</h1>
        <p class="text-muted">
          Pick a prompt, record your answer, and review structured coaching tips.
        </p>
      </div>
    </header>

    <div class="layout">
      <!-- Prompt list -->
      <aside class="prompt-list">
        @for (p of prompts; track p.id) {
          <button
            class="prompt-card"
            [class.active]="p.id === current().id"
            (click)="select(p)"
          >
            <div class="flex items-center justify-between">
              <span class="badge">{{ p.level }}</span>
              <app-icon name="mic" [size]="16"></app-icon>
            </div>
            <strong>{{ p.topic }}</strong>
            <span class="text-muted small">{{ p.questionEn }}</span>
          </button>
        }
      </aside>

      <!-- Practice panel -->
      <section class="card card-pad panel">
        <span class="badge badge-sky">{{ current().topic }} · {{ current().level }}</span>
        <h2 class="lb-question">{{ current().question }}</h2>
        <p class="text-muted translation">{{ current().questionEn }}</p>

        <div class="recorder">
          <button
            class="record-btn"
            [class.recording]="recording()"
            (click)="toggleRecord()"
            [attr.aria-label]="recording() ? 'Stop recording' : 'Start recording'"
          >
            <app-icon [name]="recording() ? 'check' : 'mic'" [size]="26"></app-icon>
          </button>
          <div class="recorder-meta">
            <strong>{{ recording() ? 'Recording…' : feedback() ? 'Recorded' : 'Ready when you are' }}</strong>
            <span class="text-muted">{{ formattedTime() }}</span>
          </div>
        </div>

        @if (feedback()) {
          <div class="feedback">
            <div class="flex items-center gap-2 fb-head">
              <app-icon name="sparkles" [size]="18"></app-icon>
              <strong>Coach feedback</strong>
              <span class="badge badge-green">Score {{ score() }}/100</span>
            </div>
            <ul>
              <li><strong>Fluency:</strong> Good pace overall — try to reduce long pauses before connectors.</li>
              <li><strong>Vocabulary:</strong> Nice use of everyday words. Add one or two linking words like “duerno”.</li>
              <li><strong>Pronunciation:</strong> Clear vowels. Watch the soft “ch” sound in “ech”.</li>
            </ul>
          </div>
        }

        <div class="tips">
          <h3>Coaching tips for this prompt</h3>
          <ul>
            @for (t of current().tips; track t) {
              <li><app-icon name="check" [size]="16"></app-icon> {{ t }}</li>
            }
          </ul>
        </div>
      </section>
    </div>
  `,
  styleUrl: './speaking.component.css',
})
export class SpeakingComponent implements OnDestroy {
  private data = inject(DataService);
  prompts = this.data.getSpeakingPrompts();

  current = signal<SpeakingPrompt>(this.prompts[0]);
  recording = signal(false);
  elapsed = signal(0);
  feedback = signal(false);
  score = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;

  select(p: SpeakingPrompt): void {
    if (this.recording()) this.toggleRecord();
    this.current.set(p);
    this.feedback.set(false);
    this.elapsed.set(0);
  }

  toggleRecord(): void {
    if (this.recording()) {
      this.recording.set(false);
      this.clearTimer();
      // simulate AI scoring
      this.score.set(64 + Math.floor(Math.random() * 26));
      this.feedback.set(true);
    } else {
      this.recording.set(true);
      this.feedback.set(false);
      this.elapsed.set(0);
      this.timer = setInterval(() => this.elapsed.update((v) => v + 1), 1000);
    }
  }

  formattedTime(): string {
    const s = this.elapsed();
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
