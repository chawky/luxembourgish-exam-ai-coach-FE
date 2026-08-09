import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicNavComponent } from '../../components/public-nav.component';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';

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
  ],
  template: `
    <app-public-nav></app-public-nav>

    <!-- Hero -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="badge badge-sky">
            <app-icon name="shield" [size]="14"></app-icon>
            Built for the Luxembourgish citizenship path
          </span>
          <h1>Pass the Sproochentest with your own AI language coach.</h1>
          <p class="lead text-pretty">
            Practice speaking, listening, vocabulary and full mock exams modelled
            on the official Luxembourgish language test — at your own pace, with
            instant feedback.
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
              <app-icon name="check" [size]="16"></app-icon> Mock-exam ready
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
            <span class="eyebrow">Today’s goal</span>
            <strong>Speaking drill · B1</strong>
            <div class="progress"><span style="width: 68%"></span></div>
            <small class="text-muted">68% to your target score</small>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="strip">
      <div class="container flex items-center justify-between wrap gap-3">
        <span class="text-muted">Designed around the official test structure</span>
        <div class="flex gap-4 wrap stats">
          <div><strong>A2</strong><span>Listening level</span></div>
          <div><strong>B1</strong><span>Speaking level</span></div>
          <div><strong>4</strong><span>Practice modes</span></div>
          <div><strong>12</strong><span>Day study streak</span></div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Everything in one place</span>
          <h2>A complete toolkit for the Sproochentest</h2>
          <p class="text-muted">
            Each mode targets a skill the examiners assess, so nothing catches you
            by surprise on exam day.
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
          <h3>Your readiness snapshot</h3>
          <p class="text-muted small">Example of what your dashboard tracks.</p>
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

    <!-- CTA -->
    <section class="cta-band">
      <div class="container text-center">
        <h2>Your citizenship journey deserves real preparation.</h2>
        <p>Join today and turn exam anxiety into confidence.</p>
        <a routerLink="/signup" class="btn btn-accent btn-lg">Create your free account</a>
      </div>
    </section>

    <footer class="footer">
      <div class="container flex items-center justify-between wrap gap-3">
        <app-logo></app-logo>
        <p class="text-muted small">
          A practice tool with mock content. Not affiliated with any government body.
        </p>
      </div>
    </footer>
  `,
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  features: Feature[] = [
    { icon: 'mic', title: 'Speaking practice', text: 'Answer real exam-style prompts and get structured coaching tips for each one.' },
    { icon: 'headphones', title: 'Listening comprehension', text: 'Authentic everyday dialogues with comprehension questions and transcripts.' },
    { icon: 'clipboard', title: 'Mock exam simulator', text: 'Timed full exams that mirror the structure and pressure of the real test.' },
    { icon: 'cards', title: 'Vocabulary & flashcards', text: 'Themed Luxembourgish vocab decks with examples to build lasting recall.' },
    { icon: 'chart', title: 'Progress dashboard', text: 'Track your scores, streaks and readiness toward your target levels.' },
    { icon: 'chat', title: 'AI chat tutor', text: 'Have a guided conversation in Luxembourgish and receive gentle corrections.' },
  ];

  steps = [
    { n: 1, title: 'Create your account', text: 'Sign up in seconds and tell the coach where you are starting from.' },
    { n: 2, title: 'Practice every skill', text: 'Work through speaking, listening, vocabulary and mock exams at your pace.' },
    { n: 3, title: 'Track your readiness', text: 'Watch your dashboard climb toward exam-day confidence.' },
  ];

  sampleBars = [
    { label: 'Speaking', value: 68 },
    { label: 'Listening', value: 74 },
    { label: 'Vocabulary', value: 81 },
  ];
}
