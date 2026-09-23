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
  mode: string;
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

    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <div class="phrase-strip" aria-label="Luxembourgish practice phrase">
              <span>Moien</span>
              <span>Ech prepar&eacute;iere mech</span>
              <span>Sproochentest</span>
            </div>

            <h1>Practice for the Sproochentest with Luxembourgish that feels close to the test.</h1>
            <p class="lead text-pretty">
              Build short sessions for speaking, listening, vocabulary and image description.
              Choose your level, generate a task, then use audio and recording feedback to keep moving.
            </p>

            <div class="hero-actions">
              <a routerLink="/signup" class="btn btn-primary btn-lg">
                Start preparing free
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/login" class="btn btn-outline btn-lg">
                I already have an account
              </a>
            </div>

            <div class="trust-panel" aria-label="Practice support">
              <div>
                <strong>A1-B1</strong>
                <span>Level-based practice</span>
              </div>
              <div>
                <strong>Audio</strong>
                <span>Listening and speaking clips</span>
              </div>
              <div>
                <strong>No card</strong>
                <span>Start without payment details</span>
              </div>
            </div>
          </div>

          <div class="exam-desk" aria-label="Sproochentest practice preview">
            <img
              src="assets/luxembourg-hero.png"
              alt="View of Luxembourg City with the Adolphe Bridge and old town"
            />
            <div class="prompt-card">
              <div class="prompt-topline">
                <span>B1 speaking</span>
                <span>2 min</span>
              </div>
              <p class="prompt-question">Beschreif däin Alldag zu Lëtzebuerg.</p>
              <div class="audio-line">
                <app-icon name="mic" [size]="18"></app-icon>
                <span></span>
                <span></span>
                <span></span>
                <small>Record answer</small>
              </div>
            </div>
            <div class="translation-note">
              <strong>Prompt translation</strong>
              <span>Describe your daily life in Luxembourg.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="section practice-section">
        <div class="container practice-layout">
          <div class="section-intro">
            <h2>Practice modes shaped around the test.</h2>
            <p class="text-muted">
              Letz Speak keeps each session small: one task, one skill, one next action.
              That makes daily practice easier to repeat.
            </p>
          </div>

          <div class="practice-workbench" aria-label="Practice mode preview">
            <div class="workbench-main">
              <div class="workbench-header">
                <span>{{ primaryFeature.mode }}</span>
                <strong>B1 prompt</strong>
              </div>
              <h3>{{ primaryFeature.title }}</h3>
              <p>{{ primaryFeature.text }}</p>
              <div class="sample-session">
                <div>
                  <span>Topic</span>
                  <strong>Daily life in Luxembourg</strong>
                </div>
                <div>
                  <span>Action</span>
                  <strong>Listen, answer, review</strong>
                </div>
              </div>
            </div>

            <div class="mode-ledger">
              @for (f of supportingFeatures; track f.title) {
                <article class="mode-row">
                  <app-icon [name]="f.icon" [size]="22"></app-icon>
                  <div>
                    <span>{{ f.mode }}</span>
                    <h3>{{ f.title }}</h3>
                    <p>{{ f.text }}</p>
                  </div>
                </article>
              }
            </div>
          </div>
        </div>
      </section>

      <section id="how" class="section preparation-section">
        <div class="container prep-layout">
          <div class="prep-copy">
            <h2>A preparation rhythm you can repeat.</h2>
            <p class="text-muted">
              The product flow is deliberately simple: pick a level and topic, complete
              one generated activity, then review progress from your dashboard.
            </p>
          </div>
          <div class="prep-map">
            @for (s of steps; track s.title) {
              <article class="step">
                <span class="step-n">{{ s.n }}</span>
                <div>
                  <h3>{{ s.title }}</h3>
                  <p>{{ s.text }}</p>
                </div>
              </article>
            }
          </div>
        </div>
      </section>

      <section id="exam" class="section exam-section">
        <div class="container exam-grid">
          <div class="exam-copy">
            <h2>Built for the Luxembourgish nationality language test.</h2>
            <p class="text-muted">
              The Sproochentest L&euml;tzebuergesch checks whether you can understand
              everyday speech and speak about familiar situations. This page avoids
              generic language drills and points practice toward those skills.
            </p>
            <ul class="exam-list">
              <li>
                <app-icon name="mic" [size]="18"></app-icon>
                <div><strong>Speaking</strong><span>Assessed around level B1</span></div>
              </li>
              <li>
                <app-icon name="headphones" [size]="18"></app-icon>
                <div><strong>Listening</strong><span>Assessed around level A2</span></div>
              </li>
              <li>
                <app-icon name="clock" [size]="18"></app-icon>
                <div><strong>Everyday topics</strong><span>Work, shops, transport, family and admin</span></div>
              </li>
            </ul>
            <a routerLink="/signup" class="btn btn-primary btn-lg">Begin your prep</a>
          </div>

          <div class="exam-proof" aria-label="Example dashboard progress">
            <div class="dashboard-shot">
              <div class="dashboard-top">
                <div>
                  <span>Dashboard</span>
                  <strong>Practice evidence</strong>
                </div>
                <small>This week</small>
              </div>
              @for (b of sampleBars; track b.label) {
                <div class="bar-row">
                  <div class="flex justify-between">
                    <span>{{ b.label }}</span><span>{{ b.value }}%</span>
                  </div>
                  <div class="progress"><span [style.width.%]="b.value"></span></div>
                </div>
              }
            </div>

            <div class="attempt-note">
              <strong>Recent session</strong>
              <p>Listening practice finished with transcript review and saved progress.</p>
              <div>
                <span>A2 listening</span>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <app-support></app-support>

      <section class="cta-band">
        <div class="container cta-inner">
          <div>
            <h2>Make Luxembourgish practice a small daily habit.</h2>
            <p>Create an account and generate your first exercise.</p>
          </div>
          <a routerLink="/signup" class="btn btn-accent btn-lg">Create your free account</a>
        </div>
      </section>
    </main>

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
    {
      icon: 'mic',
      mode: 'Speaking',
      title: 'Answer prompts out loud',
      text: 'Generate a spoken prompt, listen first, record your answer and review feedback where recordings are supported.',
    },
    {
      icon: 'headphones',
      mode: 'Listening',
      title: 'Train your ear for short clips',
      text: 'Create listening tasks with Luxembourgish text, questions, transcripts and English translations.',
    },
    {
      icon: 'image',
      mode: 'Image',
      title: 'Describe real-life scenes',
      text: 'Practice the kind of everyday description that helps with shops, transport, appointments and local life.',
    },
    {
      icon: 'cards',
      mode: 'Words',
      title: 'Build useful vocabulary',
      text: 'Generate words and example sentences for your selected level and topic instead of memorising random lists.',
    },
    {
      icon: 'chart',
      mode: 'Progress',
      title: 'See what you actually did',
      text: 'Track activity counts, completed attempts, streaks and ratings from your dashboard.',
    },
  ];

  steps = [
    { n: 1, title: 'Choose level and topic', text: 'Pick A1, A2 or B1, then choose the situation you want to practise.' },
    { n: 2, title: 'Complete one focused task', text: 'Generate speaking, listening, vocabulary or image-description practice.' },
    { n: 3, title: 'Review and repeat', text: 'Use feedback and dashboard activity to decide what to practise next.' },
  ];

  sampleBars = [
    { label: 'Speaking', value: 68 },
    { label: 'Listening', value: 74 },
    { label: 'Vocabulary', value: 81 },
  ];

  get primaryFeature(): Feature {
    return this.features[0];
  }

  get supportingFeatures(): Feature[] {
    return this.features.slice(1);
  }
}
