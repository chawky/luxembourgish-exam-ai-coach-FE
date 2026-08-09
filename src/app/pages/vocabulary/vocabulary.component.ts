import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Vocabulary &amp; flashcards</span>
        <h1>Everyday Luxembourgish</h1>
        <p class="text-muted">
          Flip through themed flashcards and test what you remember.
        </p>
      </div>
    </header>

    <div class="themes">
      @for (t of themes; track t) {
        <button class="theme-chip" [class.active]="theme() === t" (click)="setTheme(t)">
          {{ t }}
        </button>
      }
    </div>

    <section class="flash-area">
      <button class="arrow-btn" (click)="prev()" aria-label="Previous card">
        <app-icon name="arrow" [size]="20" class="flip"></app-icon>
      </button>

      <div class="flashcard" [class.flipped]="flipped()" (click)="flip()">
        <div class="face front">
          <span class="badge badge-sky">{{ card().theme }}</span>
          <strong class="lb-word">{{ card().lb }}</strong>
          <span class="text-muted">Tap to reveal meaning</span>
        </div>
        <div class="face back">
          <span class="en-word">{{ card().en }}</span>
          <p class="example">“{{ card().example }}”</p>
        </div>
      </div>

      <button class="arrow-btn" (click)="next()" aria-label="Next card">
        <app-icon name="arrow" [size]="20"></app-icon>
      </button>
    </section>

    <div class="counter">
      <span class="text-muted">Card {{ index() + 1 }} of {{ filtered().length }}</span>
      <div class="dots">
        @for (c of filtered(); track c.id; let i = $index) {
          <span class="dot" [class.active]="i === index()"></span>
        }
      </div>
    </div>
  `,
  styleUrl: './vocabulary.component.css',
})
export class VocabularyComponent {
  private data = inject(DataService);

  allCards = this.data.getVocabCards();
  themes = ['All', ...Array.from(new Set(this.allCards.map((c) => c.theme)))];

  theme = signal('All');
  index = signal(0);
  flipped = signal(false);

  filtered = computed(() =>
    this.theme() === 'All'
      ? this.allCards
      : this.allCards.filter((c) => c.theme === this.theme()),
  );

  card = computed(() => this.filtered()[this.index()]);

  setTheme(t: string): void {
    this.theme.set(t);
    this.index.set(0);
    this.flipped.set(false);
  }

  flip(): void {
    this.flipped.update((v) => !v);
  }

  next(): void {
    this.flipped.set(false);
    this.index.update((v) => (v + 1) % this.filtered().length);
  }

  prev(): void {
    this.flipped.set(false);
    this.index.update((v) => (v - 1 + this.filtered().length) % this.filtered().length);
  }
}
