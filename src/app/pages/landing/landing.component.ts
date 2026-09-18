import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicNavComponent } from '../../components/public-nav.component';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { SupportComponent } from '../support/support.component';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PublicNavComponent,
    IconComponent,
    LogoComponent,
    SupportComponent,
  ],
  template: `
    <app-public-nav></app-public-nav>

    <!-- Hero -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="badge badge-sky">
            <app-icon name="shield" [size]="14"></app-icon>
            Luxembourgish practice for citizenship learners
          </span>
          <h1>Practice Luxembourgish with guided AI exercises.</h1>
          <p class="lead text-pretty">
            Generate speaking, listening, vocabulary, topic and image-description
            practice for your level, then review feedback where recordings are
            supported.
          </p>
          <div class="flex gap-2 wrap cta">
            <a routerLink="/signup" class="btn btn-primary btn-lg">
              Start preparing free
              <app-icon name="arrow" [size]="18"></app-icon>
            </a>
            <a routerLink="/login" class="btn btn-outline btn-lg">
              I already have an account
            </a>
          </div>
          <div class="trust flex items-center gap-3 wrap">
            <div class="flex items-center gap-1">
              <app-icon name="check" [size]="16"></app-icon> No credit card
            </div>
            <div class="flex items-center gap-1">
              <app-icon name="check" [size]="16"></app-icon> Audio and recording practice
            </div>
            <div class="flex items-center gap-1">
              <app-icon name="check" [size]="16"></app-icon> Lëtzebuergesch focused
            </div>
          </div>
        </div>
        <div class="hero-media">
          <img
            src="assets/luxembourg-hero.png"
            alt="View of Luxembourg City with the Adolphe Bridge and old town"
          />
          <div class="float-card">
            <span class="eyebrow">Sample activity</span>
            <strong>Speaking practice · B1</strong>
            <div class="progress"><span style="width: 68%"></span></div>
            <small class="text-muted">Generated prompt and feedback</small>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="strip">
      <div class="container flex items-center justify-between wrap gap-3">
        <span class="text-muted">Built around the practice modes in this app</span>
        <div class="flex gap-4 wrap stats">
          <div><strong>A1-B1</strong><span>Selectable levels</span></div>
          <div><strong>AI</strong><span>Generated tasks</span></div>
          <div><strong>Audio</strong><span>Listening clips</span></div>
          <div><strong>Progress</strong><span>Activity tracking</span></div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Everything in one place</span>
          <h2>Practice tools for Luxembourgish learners</h2>
          <p class="text-muted">
            Each mode maps to a real feature in the app: generated prompts, audio,
            images, vocabulary, recordings and progress tracking.
          </p>
        </div>
        <div class="feature-grid">
          @for (f of features; track f.title) {
            <article class="card card-pad feature">
              <span class="feature-icon"><app-icon [name]="f.icon" [size]="22"></app-icon></span>
              <h3>{{ f.title }}</h3>
              <p class="text-muted">{{ f.text }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section alt">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Simple by design</span>
          <h2>How your coaching works</h2>
        </div>
        <div class="steps">
          @for (s of steps; track s.n) {
            <div class="step">
              <span class="step-n">{{ s.n }}</span>
              <h3>{{ s.title }}</h3>
              <p class="text-muted">{{ s.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Exam info -->
    <section id="exam" class="section">
      <div class="container exam-grid">
        <div>
          <span class="eyebrow">About the test</span>
          <h2>What is the Sproochentest?</h2>
          <p class="text-muted">
            The Sproochentest Lëtzebuergesch is the official language assessment on
            the path to Luxembourgish nationality. It evaluates your spoken
            Luxembourgish and your listening comprehension across everyday
            situations.
          </p>
          <ul class="exam-list">
            <li>
              <app-icon name="mic" [size]="18"></app-icon>
              <div><strong>Speaking</strong><span> — assessed around level B1</span></div>
            </li>
            <li>
              <app-icon name="headphones" [size]="18"></app-icon>
              <div><strong>Listening</strong><span> — assessed around level A2</span></div>
            </li>
            <li>
              <app-icon name="clock" [size]="18"></app-icon>
              <div><strong>Real situations</strong><span> — shops, transport, admin and daily life</span></div>
            </li>
          </ul>
          <a routerLink="/signup" class="btn btn-primary btn-lg">Begin your prep</a>
        </div>
        <div class="card card-pad exam-card">
          <h3>Your activity snapshot</h3>
          <p class="text-muted small">Example of the activity your dashboard tracks.</p>
          @for (b of sampleBars; track b.label) {
            <div class="bar-row">
              <div class="flex justify-between">
                <span>{{ b.label }}</span><span class="text-muted">{{ b.value }}%</span>
              </div>
              <div class="progress"><span [style.width.%]="b.value"></span></div>
            </div>
          }
        </div>
      </div>
    </section>

    <app-support></app-support>

    <!-- CTA -->
    <section class="cta-band">
      <div class="container text-center">
        <h2>Start building consistent Luxembourgish practice.</h2>
        <p>Create an account and generate your first exercise.</p>
        <a routerLink="/signup" class="btn btn-accent btn-lg">Create your free account</a>
      </div>
    </section>

    <footer class="footer">
      <div class="container flex items-center justify-between wrap gap-3">
        <app-logo></app-logo>
        <p class="text-muted small">
          A learning support tool. Not affiliated with any government body.
          <a routerLink="/" fragment="support">Support</a>
        </p>
      </div>
    </footer>
  `,
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  features: Feature[] = [
    { icon: 'mic', title: 'Speaking practice', text: 'Generate a spoken prompt, listen to it, record your answer and review feedback.' },
    { icon: 'headphones', title: 'Listening comprehension', text: 'Create short audio tasks with questions, transcripts and translations.' },
    { icon: 'image', title: 'Image description', text: 'Describe generated scenes aloud and get feedback on your spoken answer.' },
    { icon: 'cards', title: 'Vocabulary cards', text: 'Generate useful words and example sentences for the selected level and topic.' },
    { icon: 'chart', title: 'Progress dashboard', text: 'Track activity counts, streaks, completed attempts and average ratings.' },
  ];

  steps = [
    { n: 1, title: 'Create your account', text: 'Sign up and verify your email so your progress can be saved.' },
    { n: 2, title: 'Choose a practice mode', text: 'Select a level and topic, then generate a focused activity.' },
    { n: 3, title: 'Review your progress', text: 'Use the dashboard to see activity, completions, ratings and streaks.' },
  ];

  sampleBars = [
    { label: 'Speaking', value: 68 },
    { label: 'Listening', value: 74 },
    { label: 'Vocabulary', value: 81 },
  ];
}
