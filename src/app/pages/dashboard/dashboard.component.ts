import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { ProgressDashboardDto, SkillProgressDto } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { formatPracticeLabel } from '../../practice-options';

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
    </header>

    @if (loading()) {
      <section class="card card-pad loading-panel">
        <span class="stat-icon sky loading-icon">
          <app-icon name="sparkles" [size]="20"></app-icon>
        </span>
        <div>
          <strong>Loading your progress...</strong>
          <p class="text-muted">
            Getting your latest activity history and practice ratings.
          </p>
        </div>
      </section>
    }

    @if (errorMsg()) {
      <section class="dashboard-error" role="alert">
        {{ errorMsg() }}
      </section>
    }

    <section class="stats-grid">
      <div class="card card-pad stat">
        <span class="stat-icon blue">
          <app-icon name="flame" [size]="20"></app-icon>
        </span>
        <div>
          <strong>{{ currentStreakDays() }} days</strong>
          <span class="text-muted">Current streak</span>
          @if (lastActiveLabel()) {
            <span class="stat-note text-muted">{{ lastActiveLabel() }}</span>
          }
        </div>
      </div>
      <div class="card card-pad stat">
        <span class="stat-icon amber">
          <app-icon name="clock" [size]="20"></app-icon>
        </span>
        <div>
          <strong>{{ loggedInDays() }}</strong>
          <span class="text-muted">Days logged in</span>
        </div>
      </div>
      <div class="card card-pad stat">
        <span class="stat-icon sky">
          <app-icon name="chart" [size]="20"></app-icon>
        </span>
        <div>
          <strong>{{ totalActivities() }}</strong>
          <span class="text-muted">Total activities</span>
        </div>
      </div>
      <div class="card card-pad stat">
        <span class="stat-icon green">
          <app-icon name="check" [size]="20"></app-icon>
        </span>
        <div>
          <strong>{{ averageRating() }}</strong>
          <span class="text-muted">Average rating</span>
        </div>
      </div>
    </section>

    <div class="cols">
      <section class="card card-pad">
        <div class="flex items-center justify-between">
          <h2 class="card-title">Skill activity</h2>
          <span class="badge badge-sky">{{ evaluatedActivities() }} evaluated</span>
        </div>

        @if (skillProgress().length) {
          <div class="skills">
            @for (p of skillProgress(); track skillTrack(p, $index)) {
              <div class="skill">
                <div class="flex items-center justify-between">
                  <span class="skill-label">{{ skillLabel(p) }}</span>
                  <span class="text-muted small">
                    {{ evaluatedCount(p) }}/{{ totalCount(p) }} evaluated
                  </span>
                </div>
                <div class="progress">
                  <span [style.width.%]="evaluatedPercent(p)"></span>
                </div>
                <div class="skill-meta">
                  <span>Average rating: {{ skillAverageRating(p) }}</span>
                  @if (p.latestExerciseName) {
                    <span>Latest: {{ latestExerciseLabel(p) }}</span>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="stat-icon sky">
              <app-icon name="chart" [size]="20"></app-icon>
            </span>
            <h3>No progress yet</h3>
            <p class="text-muted">
              Complete a practice activity to start filling this section.
            </p>
          </div>
        }
      </section>

      <section class="card card-pad">
        <h2 class="card-title">Continue practising</h2>
        <div class="quick">
          @for (q of quickLinks; track q.path) {
            <a [routerLink]="q.path" class="quick-item">
              <span class="quick-icon">
                <app-icon [name]="q.icon" [size]="20"></app-icon>
              </span>
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

    <section class="card card-pad tip">
      <span class="stat-icon sky">
        <app-icon name="sparkles" [size]="20"></app-icon>
      </span>
      <div>
        <strong>Tip of the day</strong>
        <p class="text-muted">
          In the speaking test, take a breath before answering. A calm, clear
          “Also...” buys you a second to organise your thoughts and sounds
          natural in Luxembourgish.
        </p>
      </div>
    </section>
  `,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(false);
  errorMsg = signal('');
  dashboard = signal<ProgressDashboardDto | null>(null);

  skillProgress = computed(() => this.dashboard()?.skillProgress ?? []);

  quickLinks = [
    {
      path: '/app/speaking',
      icon: 'mic',
      title: 'Speaking drill',
      text: 'Practice an exam-style prompt',
    },
    {
      path: '/app/listening',
      icon: 'headphones',
      title: 'Listening exercise',
      text: 'Sharpen your comprehension',
    },
    {
      path: '/app/exercises',
      icon: 'book',
      title: 'Topic exercises',
      text: 'Generate practice by level and topic',
    },
    {
      path: '/app/image-description',
      icon: 'image',
      title: 'Image description',
      text: 'Describe a generated scene aloud',
    },
    {
      path: '/app/vocabulary',
      icon: 'cards',
      title: 'Vocabulary practice',
      text: 'Review useful words and sentences',
    },
    {
      path: '/app/chat',
      icon: 'chat',
      title: 'Chat with your tutor',
      text: 'Have a guided conversation',
    },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    this.dashboardService.getMyProgress().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
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

  firstName(): string {
    const name =
      this.dashboard()?.username || this.auth.currentUser()?.username || '';

    return name.trim().split(/\s+/)[0] || 'there';
  }

  totalActivities(): number {
    return this.dashboard()?.totalActivities ?? 0;
  }

  loggedInDays(): number {
    return this.dashboard()?.loggedInDays ?? 0;
  }

  currentStreakDays(): number {
    return this.dashboard()?.currentStreakDays ?? 0;
  }

  lastActiveLabel(): string {
    const value = this.dashboard()?.lastLoginDate;
    if (!value) {
      return '';
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return `Last active ${date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })}`;
  }

  evaluatedActivities(): number {
    return this.dashboard()?.evaluatedActivities ?? 0;
  }

  averageRating(): string {
    return this.formatRating(this.dashboard()?.averageRatingOverall);
  }

  skillLabel(progress: SkillProgressDto): string {
    return progress.exerciseType
      ? formatPracticeLabel(progress.exerciseType)
      : 'Practice';
  }

  totalCount(progress: SkillProgressDto): number {
    return progress.totalActivities ?? 0;
  }

  evaluatedCount(progress: SkillProgressDto): number {
    return progress.evaluatedActivities ?? 0;
  }

  evaluatedPercent(progress: SkillProgressDto): number {
    const total = this.totalCount(progress);
    if (total <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((this.evaluatedCount(progress) / total) * 100));
  }

  skillAverageRating(progress: SkillProgressDto): string {
    return this.formatRating(progress.averageRatingOverall);
  }

  latestExerciseLabel(progress: SkillProgressDto): string {
    return progress.latestExerciseName
      ? this.formatBackendLabel(progress.latestExerciseName)
      : '';
  }

  skillTrack(progress: SkillProgressDto, index: number): string {
    return `${progress.exerciseType || 'skill'}-${index}`;
  }

  private formatBackendLabel(value: string): string {
    return value
      .trim()
      .split(/\s+/)
      .map((part) => formatPracticeLabel(part))
      .join(' · ');
  }

  private formatRating(value: number | undefined): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '—';
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'We could not load your progress. Please try again.';
  }
}
