import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-mock-exam',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Mock exam simulator</span>
        <h1>Full practice exam</h1>
        <p class="text-muted">
          A timed run-through mixing listening, reading and speaking items.
        </p>
      </div>
      @if (started() && !finished()) {
        <div class="timer" [class.low]="timeLeft() <= 15">
          <app-icon name="clock" [size]="18"></app-icon>
          {{ formattedTime() }}
        </div>
      }
    </header>

    <!-- Intro -->
    @if (!started()) {
      <section class="card card-pad intro">
        <span class="stat-icon blue"><app-icon name="clipboard" [size]="22"></app-icon></span>
        <h2>Ready to begin?</h2>
        <p class="text-muted">
          This mock exam has {{ questions.length }} questions and a
          {{ totalTime }} second timer. Answer at your own pace — you can review
          your score at the end.
        </p>
        <button class="btn btn-primary" (click)="start()">
          <app-icon name="play" [size]="18"></app-icon> Start mock exam
        </button>
      </section>
    }

    <!-- Question flow -->
    @if (started() && !finished()) {
      <section class="card card-pad">
        <div class="q-progress">
          <span class="badge badge-sky">{{ currentQ().section }}</span>
          <span class="text-muted small">
            Question {{ index() + 1 }} of {{ questions.length }}
          </span>
        </div>
        <div class="progress">
          <span [style.width.%]="((index() + 1) / questions.length) * 100"></span>
        </div>

        <h2 class="q-prompt">{{ currentQ().prompt }}</h2>
        <div class="options">
          @for (opt of currentQ().options; track $index) {
            <button
              class="option"
              [class.selected]="answers()[index()] === $index"
              (click)="choose($index)"
            >
              <span class="option-marker">{{ letters[$index] }}</span>
              <span>{{ opt }}</span>
            </button>
          }
        </div>

        <div class="nav">
          <button class="btn btn-outline" [disabled]="index() === 0" (click)="prev()">
            Previous
          </button>
          @if (index() < questions.length - 1) {
            <button class="btn btn-primary" [disabled]="answers()[index()] === undefined" (click)="next()">
              Next question
            </button>
          } @else {
            <button class="btn btn-primary" [disabled]="answers()[index()] === undefined" (click)="finish()">
              Finish exam
            </button>
          }
        </div>
      </section>
    }

    <!-- Results -->
    @if (finished()) {
      <section class="card card-pad results">
        <div class="score-ring" [style.--pct]="scorePct()">
          <span>{{ scorePct() }}%</span>
        </div>
        <h2>{{ verdict() }}</h2>
        <p class="text-muted">
          You answered {{ score() }} of {{ questions.length }} questions correctly.
        </p>

        <div class="review">
          @for (q of questions; track q.id; let i = $index) {
            <div class="review-item" [class.ok]="answers()[i] === q.answerIndex">
              <app-icon [name]="answers()[i] === q.answerIndex ? 'check' : 'info'" [size]="16"></app-icon>
              <div>
                <strong>{{ q.prompt }}</strong>
                <span class="text-muted small">
                  Correct answer: {{ q.options[q.answerIndex] }}
                </span>
              </div>
            </div>
          }
        </div>

        <button class="btn btn-primary" (click)="restart()">
          <app-icon name="clipboard" [size]="18"></app-icon> Retake exam
        </button>
      </section>
    }
  `,
  styleUrl: './mock-exam.component.css',
})
export class MockExamComponent implements OnDestroy {
  private data = inject(DataService);

  questions = this.data.getMockExamQuestions();
  letters = ['A', 'B', 'C', 'D'];
  totalTime = 120;

  started = signal(false);
  finished = signal(false);
  index = signal(0);
  answers = signal<Record<number, number>>({});
  timeLeft = signal(this.totalTime);

  private timer: ReturnType<typeof setInterval> | null = null;

  currentQ = computed(() => this.questions[this.index()]);

  score = computed(() => {
    const a = this.answers();
    return this.questions.reduce(
      (s, q, i) => (a[i] === q.answerIndex ? s + 1 : s),
      0,
    );
  });

  scorePct = computed(() =>
    Math.round((this.score() / this.questions.length) * 100),
  );

  verdict = computed(() => {
    const p = this.scorePct();
    if (p >= 75) return 'Strong — you are exam ready!';
    if (p >= 50) return 'Good progress — keep practising.';
    return 'Keep going — review the basics.';
  });

  start(): void {
    this.started.set(true);
    this.finished.set(false);
    this.index.set(0);
    this.answers.set({});
    this.timeLeft.set(this.totalTime);
    this.timer = setInterval(() => {
      this.timeLeft.update((v) => v - 1);
      if (this.timeLeft() <= 0) this.finish();
    }, 1000);
  }

  choose(i: number): void {
    this.answers.update((a) => ({ ...a, [this.index()]: i }));
  }

  next(): void {
    if (this.index() < this.questions.length - 1) this.index.update((v) => v + 1);
  }

  prev(): void {
    if (this.index() > 0) this.index.update((v) => v - 1);
  }

  finish(): void {
    this.clearTimer();
    this.finished.set(true);
    this.started.set(false);
  }

  restart(): void {
    this.start();
  }

  formattedTime(): string {
    const s = this.timeLeft();
    const m = Math.floor(s / 60).toString().padStart(2, '0');
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
