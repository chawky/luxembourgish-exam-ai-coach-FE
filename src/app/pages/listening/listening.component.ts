import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { IconComponent } from '../../components/icon.component';
import { ListeningExercise } from '../../models';

@Component({
  selector: 'app-listening',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Listening comprehension</span>
        <h1>Train your ear</h1>
        <p class="text-muted">
          Listen to everyday Luxembourgish situations, then answer the question.
        </p>
      </div>
    </header>

    <div class="layout">
      <aside class="exercise-list">
        @for (ex of exercises; track ex.id) {
          <button
            class="exercise-pill"
            [class.active]="ex.id === current().id"
            (click)="select(ex)"
          >
            <span class="pill-title">{{ ex.title }}</span>
            <span class="badge">{{ ex.level }}</span>
          </button>
        }
      </aside>

      <section class="card card-pad">
        <div class="player">
          <button
            class="play-btn"
            [class.playing]="playing()"
            (click)="togglePlay()"
            [attr.aria-label]="playing() ? 'Pause audio' : 'Play audio'"
          >
            <app-icon [name]="playing() ? 'pause' : 'play'" [size]="22"></app-icon>
          </button>
          <div class="track">
            <div class="track-info">
              <span class="track-title">{{ current().title }}</span>
              <span class="text-muted">{{ formatDuration(current().durationSec) }}</span>
            </div>
            <div class="waveform" aria-hidden="true">
              @for (b of bars; track $index) {
                <span [style.height.%]="b" [class.lit]="playing()"></span>
              }
            </div>
          </div>
        </div>

        <p class="transcript-note text-muted">
          <app-icon name="info" [size]="14"></app-icon>
          Audio is simulated in this demo. Reveal the transcript if you need help.
        </p>

        @if (showTranscript()) {
          <blockquote class="transcript">{{ current().transcript }}</blockquote>
        } @else {
          <button class="link-btn" (click)="showTranscript.set(true)">
            Show transcript
          </button>
        }

        <div class="question">
          <h3>{{ current().question }}</h3>
          <div class="options">
            @for (opt of current().options; track $index) {
              <button
                class="option"
                [attr.data-state]="optionState($index)"
                (click)="answer($index)"
              >
                <span class="option-marker">{{ letters[$index] }}</span>
                <span>{{ opt }}</span>
              </button>
            }
          </div>
        </div>

        @if (submitted()) {
          <div class="result">
            @if (selected() === current().answerIndex) {
              <strong class="ok"><app-icon name="check" [size]="18"></app-icon> Correct!</strong>
            } @else {
              <strong class="no">Not quite — the right answer is {{ letters[current().answerIndex] }}.</strong>
            }
            <button class="btn btn-outline" (click)="reset()">Try another</button>
          </div>
        }
      </section>
    </div>
  `,
  styleUrl: './listening.component.css',
})
export class ListeningComponent {
  private data = inject(DataService);

  exercises = this.data.getListeningExercises();
  letters = ['A', 'B', 'C', 'D'];
  bars = Array.from({ length: 40 }, () => 25 + Math.random() * 70);

  current = signal<ListeningExercise>(this.exercises[0]);
  playing = signal(false);
  showTranscript = signal(false);
  selected = signal<number | null>(null);
  submitted = signal(false);

  select(ex: ListeningExercise): void {
    this.current.set(ex);
    this.reset();
    this.showTranscript.set(false);
    this.playing.set(false);
  }

  togglePlay(): void {
    this.playing.update((v) => !v);
  }

  answer(i: number): void {
    if (this.submitted()) return;
    this.selected.set(i);
    this.submitted.set(true);
  }

  optionState(i: number): string {
    if (!this.submitted()) return this.selected() === i ? 'selected' : '';
    if (i === this.current().answerIndex) return 'correct';
    if (this.selected() === i) return 'wrong';
    return '';
  }

  reset(): void {
    this.selected.set(null);
    this.submitted.set(false);
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
