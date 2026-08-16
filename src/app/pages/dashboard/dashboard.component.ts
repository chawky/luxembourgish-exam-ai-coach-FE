import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Dashboard</span>
        <h1>Moien, {{ firstName() }}</h1>
        <p class="text-muted">
          Here is where you stand on your road to the Sproochentest.
        </p>
      </div>
      <a routerLink="/app/mock-exam" class="btn btn-primary">
        <app-icon name="clipboard" [size]="18"></app-icon> Take a mock exam
      </a>
    </header>

    <!-- Stat cards -->
    <section class="stats-grid">
      <div class="card card-pad stat">
        <span class="stat-icon blue"><app-icon name="flame" [size]="20"></app-icon></span>
        <div>
          <strong>{{ streak }} days</strong>
          <span class="text-muted">Current study streak</span>
        </div>
      </div>
      <div class="card card-pad stat">
        <span class="stat-icon sky"><app-icon name="chart" [size]="20"></app-icon></span>
        <div>
          <strong>{{ overall() }}%</strong>
          <span class="text-muted">Overall readiness</span>
        </div>
      </div>
      <div class="card card-pad stat">
        <span class="stat-icon green"><app-icon name="check" [size]="20"></app-icon></span>
        <div>
          <strong>{{ onTrack() }}/{{ progress.length }}</strong>
          <span class="text-muted">Skills on target</span>
        </div>
      </div>
    </section>

    <div class="cols">
      <!-- Skill progress -->
      <section class="card card-pad">
        <div class="flex items-center justify-between">
          <h2 class="card-title">Skill readiness</h2>
          <span class="badge badge-sky">Target levels</span>
        </div>
        <div class="skills">
          @for (p of progress; track p.key) {
            <div class="skill">
              <div class="flex items-center justify-between">
                <span class="skill-label">{{ p.label }}</span>
                <span class="text-muted small">{{ p.score }}% / {{ p.target }}%</span>
              </div>
              <div class="progress">
                <span
                  [style.width.%]="p.score"
                  [style.background]="p.score >= p.target ? 'var(--green)' : 'var(--sky)'"
                ></span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Continue practising -->
      <section class="card card-pad">
        <h2 class="card-title">Continue practising</h2>
        <div class="quick">
          @for (q of quickLinks; track q.path) {
            <a [routerLink]="q.path" class="quick-item">
              <span class="quick-icon"><app-icon [name]="q.icon" [size]="20"></app-icon></span>
              <div class="grow">
                <strong>{{ q.title }}</strong>
                <span class="text-muted small">{{ q.text }}</span>
              </div>
              <app-icon name="arrow" [size]="18"></app-icon>
            </a>
          }
        </div>
      </section>
    </div>

    <!-- Tip of the day -->
    <section class="card card-pad tip">
      <span class="stat-icon sky"><app-icon name="sparkles" [size]="20"></app-icon></span>
      <div>
        <strong>Tip of the day</strong>
        <p class="text-muted">
          In the speaking test, take a breath before answering. A calm, clear
          “Also…” buys you a second to organise your thoughts — and sounds natural
          in Luxembourgish.
        </p>
      </div>
    </section>
  `,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  progress = this.data.getProgress();
  streak = this.data.getStudyStreak();

  quickLinks = [
    { path: '/app/speaking', icon: 'mic', title: 'Speaking drill', text: 'Practice an exam-style prompt' },
    { path: '/app/listening', icon: 'headphones', title: 'Listening exercise', text: 'Sharpen your comprehension' },
    { path: '/app/exercises', icon: 'book', title: 'Topic exercises', text: 'Generate practice by level and topic' },
    { path: '/app/vocabulary', icon: 'cards', title: 'Flashcards', text: 'Review everyday vocabulary' },
    { path: '/app/chat', icon: 'chat', title: 'Chat with your tutor', text: 'Have a guided conversation' },
  ];

  firstName(): string {
    return this.auth.currentUser()?.username?.split(' ')[0] ?? 'there';
  }

  overall(): number {
    return Math.round(
      this.progress.reduce((s, p) => s + p.score, 0) / this.progress.length,
    );
  }

  onTrack(): number {
    return this.progress.filter((p) => p.score >= p.target).length;
  }
}
