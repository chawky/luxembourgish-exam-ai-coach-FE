import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { PublicNavComponent } from '../../components/public-nav.component';

interface ListeningQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface ListeningPractice {
  title: string;
  intro: string;
  text: string;
  questions: ListeningQuestion[];
}

@Component({
  selector: 'app-sproochentest-listening-practice',
  standalone: true,
  imports: [RouterLink, PublicNavComponent, IconComponent, LogoComponent],
  template: `
    <app-public-nav></app-public-nav>

    <main>
      <section class="guide-hero listening-hero">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="guide-kicker">B1 listening practice</p>
            <h1>Sproochentest Listening Practice: Prepare for B1</h1>
            <p class="lead">
              The Sproochentest listening requirement is B1. INLL describes a 35-minute
              tablet-based listening test, and official guidance describes three
              listening-text types. The goal is to understand main information and
              relevant details, not translate every word.
            </p>
            <div class="hero-actions">
              <a routerLink="/app/listening" class="btn btn-primary btn-lg">
                Start listening practice
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/sproochentest" class="btn btn-outline btn-lg">
                Read the Sproochentest guide
              </a>
            </div>
          </div>

          <aside class="exam-note" aria-label="Listening test facts">
            <div>
              <span>Listening level</span>
              <strong>B1</strong>
              <p>Main points of clear standard speech on familiar topics.</p>
            </div>
            <div>
              <span>Official duration</span>
              <strong>35</strong>
              <p>INLL describes the listening test as 35 minutes on a tablet.</p>
            </div>
            <p class="source-note">
              Guichet describes three tracks: a radio news item, an everyday
              conversation, and a discussion or presentation on a specific topic.
            </p>
          </aside>
        </div>
      </section>

      <article class="guide-body">
        <section class="section section-plain" aria-labelledby="b1-listening">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="b1-listening">What B1 listening means</h2>
            </div>
            <div class="section-copy">
              <p>
                B1 listening practice should train you to catch the main idea, who is
                speaking, the situation, and important details such as times, places,
                actions, decisions, plans or problems.
              </p>
              <p>
                The goal is not word-for-word translation. In real listening, you often
                understand enough from context, signal words and repeated details.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="official-types">
          <div class="container listening-layout">
            <div class="section-heading listening-heading">
              <h2 id="official-types">The 3 official listening text types</h2>
              <p>
                These are Letz Speak practice examples, not official INLL questions.
                They are written to practise the kinds of listening tasks described by
                official guidance.
              </p>
            </div>

            <div class="listening-practice-stack">
              @for (practice of practices; track practice.title) {
                <section class="listening-practice" [attr.aria-label]="practice.title">
                  <header>
                    <h3>{{ practice.title }}</h3>
                    <p>{{ practice.intro }}</p>
                  </header>
                  <div class="practice-transcript">
                    <strong>Letz Speak practice example — not an official INLL question</strong>
                    <p>{{ practice.text }}</p>
                  </div>
                  <ol class="choice-list">
                    @for (question of practice.questions; track question.question) {
                      <li>
                        <strong>{{ question.question }}</strong>
                        <ul>
                          @for (option of question.options; track option) {
                            <li>{{ option }}</li>
                          }
                        </ul>
                      </li>
                    }
                  </ol>
                </section>
              }
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="answer-key">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="answer-key">Answer key</h2>
            </div>
            <div class="answer-key">
              @for (practice of practices; track practice.title) {
                <article>
                  <h3>{{ practice.title }}</h3>
                  <ol>
                    @for (question of practice.questions; track question.question) {
                      <li>{{ question.answer }}</li>
                    }
                  </ol>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="strategy">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="strategy">Listening strategy</h2>
            </div>
            <div class="section-copy">
              <ul class="check-list">
                <li>Identify the situation before focusing on details.</li>
                <li>Listen for the main message first.</li>
                <li>Notice names, numbers, times and places when they matter.</li>
                <li>Do not stop mentally because of one unknown word.</li>
                <li>Use surrounding context.</li>
                <li>Choose answers based on what was said, not what sounds plausible.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="training-method">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="training-method">How to train B1 listening</h2>
              <a routerLink="/app/listening" class="inline-cta">
                Open Letz Speak listening
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Listen once for the main idea.</li>
                <li>Answer comprehension questions without translating everything.</li>
                <li>During training, listen again to find evidence for your answers.</li>
                <li>Review words or phrases that blocked understanding.</li>
                <li>During training, replay a short difficult section.</li>
                <li>Later practise a fresh recording without pausing.</li>
              </ol>
              <p>
                This describes training behaviour. It is not a claim about pausing,
                replaying or timing rules in the real exam.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="signals">
          <div class="container listening-layout">
            <div class="section-heading listening-heading">
              <h2 id="signals">Useful listening signals</h2>
              <p>
                These small words and patterns often carry the answer. Practise hearing
                them in full sentences, not only reading them.
              </p>
            </div>
            <div class="signal-grid">
              @for (signal of signals; track signal.title) {
                <article>
                  <h3>{{ signal.title }}</h3>
                  <p>{{ signal.items.join(' · ') }}</p>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="common-mistakes">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="common-mistakes">Common listening mistakes</h2>
            </div>
            <div class="section-copy">
              <ul class="check-list">
                <li>Trying to translate every word.</li>
                <li>Panicking after missing one sentence.</li>
                <li>Recognising vocabulary but missing the overall meaning.</li>
                <li>Ignoring negation.</li>
                <li>Confusing similar numbers or times.</li>
                <li>Choosing an answer because it sounds plausible, not because the text supports it.</li>
                <li>Only reading Luxembourgish instead of regularly hearing it.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="official-sample">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="official-sample">Official sample material</h2>
            </div>
            <div class="section-copy">
              <p>
                INLL publishes official Sproochentest sample material for listening,
                including instructions, an MP3 audio file, an answer sheet and an answer
                key. Use the official sample alongside independent practice.
              </p>
              <p>
                Letz Speak does not copy or rehost INLL audio, answer sheets or answer
                keys. Always check INLL for current official material.
              </p>
              <a
                href="https://www.inll.lu/en/sproochentest-en/"
                class="inline-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit the INLL Sproochentest page
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="speaking-vs-listening">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="speaking-vs-listening">Speaking vs listening</h2>
            </div>
            <div class="section-copy">
              <p>
                Speaking is assessed at A2. Listening is required at B1. They train
                different skills, so it is useful to practise both.
              </p>
              <p class="related-links">
                Continue with
                <a routerLink="/sproochentest-speaking-practice">A2 speaking practice</a>,
                <a routerLink="/sproochentest-topics">speaking topics</a>,
                <a routerLink="/sproochentest-picture-description">picture description</a>
                or the
                <a routerLink="/sproochentest">main Sproochentest guide</a>.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-official" aria-labelledby="independence">
          <div class="container official-panel">
            <div>
              <h2 id="independence">Official source and independence</h2>
              <p>
                INLL is the official source for Sproochentest rules, registration,
                sample tests and current requirements. Letz Speak is independent and is
                not affiliated with INLL, MyINL, the Luxembourg government or any
                official examination body.
              </p>
            </div>
            <a
              href="https://guichet.public.lu/en/citoyens/citoyennete/nationalite-luxembourgeoise/acquisition-recouvrement/conditions-prealables.html"
              class="btn btn-outline btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Guichet nationality guidance
            </a>
          </div>
        </section>

        <section class="cta-band">
          <div class="container cta-inner">
            <div>
              <h2>Train with fresh listening prompts.</h2>
              <p>Use Letz Speak for generated Luxembourgish listening practice.</p>
            </div>
            <a routerLink="/app/listening" class="btn btn-accent btn-lg">
              Start listening practice
            </a>
          </div>
        </section>
      </article>
    </main>

    <footer class="footer">
      <div class="container flex items-center justify-between wrap gap-3">
        <app-logo></app-logo>
        <p class="text-muted small">
          A learning support tool. Not affiliated with INLL or any government body.
        </p>
      </div>
    </footer>
  `,
  styleUrls: [
    '../sproochentest/sproochentest.component.css',
    './sproochentest-listening-practice.component.css',
  ],
})
export class SproochentestListeningPracticeComponent implements OnInit, OnDestroy {
  private readonly canonicalUrl =
    'https://letz-speak.com/sproochentest-listening-practice';
  private readonly defaultCanonicalUrl = 'https://letz-speak.com/';
  private readonly defaultTitle =
    'Letz Speak | Learn Luxembourgish & Sproochentest Practice';
  private readonly defaultDescription =
    'Learn Luxembourgish with focused language practice for speaking, listening, vocabulary and Sproochentest preparation. Create short exercises and build confidence.';
  private readonly titleText =
    'Sproochentest Listening Practice – B1 Luxembourgish | Letz Speak';
  private readonly description =
    'Practise B1 Luxembourgish listening for the Sproochentest with radio news, everyday conversation and presentation-style exercises.';
  private structuredDataElement?: HTMLScriptElement;

  readonly practices: ListeningPractice[] = [
    {
      title: '1. Radio news item',
      intro:
        'Practise listening for what happened, where, when, who was involved and the key consequence.',
      text:
        'Gëschter Owend gouf et zu Ettelbréck e klenge Brand an enger Bäckerei. D’Pompjeeë waren no zéng Minutten op der Plaz. Keen ass blesséiert ginn, mee d’Geschäft bleift haut zou. D’Police seet, datt d’Ursaach nach net kloer ass.',
      questions: [
        {
          question: 'Wat ass geschitt?',
          options: ['A. Eng Bäckerei hat e Brand.', 'B. Eng Schoul war zou.', 'C. E Bus hat en Accident.'],
          answer: '1: A. Eng Bäckerei hat e Brand.',
        },
        {
          question: 'Wou ass et geschitt?',
          options: ['A. Zu Esch', 'B. Zu Ettelbréck', 'C. Um Findel'],
          answer: '2: B. Zu Ettelbréck.',
        },
        {
          question: 'Wat ass d’Konsequenz?',
          options: ['A. D’Geschäft bleift haut zou.', 'B. D’Strooss bleift eng Woch zou.', 'C. D’Police huet eng Persoun verhaft.'],
          answer: '3: A. D’Geschäft bleift haut zou.',
        },
      ],
    },
    {
      title: '2. Everyday conversation between two people',
      intro:
        'Practise identifying the situation, plans, times, changes and practical details.',
      text:
        'Tom: Moien Sara, kënne mir eis haut um sechs Auer treffen? Sara: Haut geet et net gutt. Ech muss méi laang schaffen. Kënne mir muer um hallwer siwen an de Café beim Kino goen? Tom: Jo, dat passt. Soll ech en Dësch reservéieren? Sara: Jo, fir zwou Persounen, wann ech gelift.',
      questions: [
        {
          question: 'Firwat kann d’Sara haut net kommen?',
          options: ['A. Si ass krank.', 'B. Si muss méi laang schaffen.', 'C. Si huet keen Auto.'],
          answer: '1: B. Si muss méi laang schaffen.',
        },
        {
          question: 'Wéini wëlle si sech treffen?',
          options: ['A. Haut um sechs Auer', 'B. Muer um hallwer siwen', 'C. Muer de Moien'],
          answer: '2: B. Muer um hallwer siwen.',
        },
        {
          question: 'Wat soll den Tom maachen?',
          options: ['A. En Dësch reservéieren', 'B. Ticketen kafen', 'C. D’Sara ofhuelen'],
          answer: '3: A. En Dësch reservéieren.',
        },
      ],
    },
    {
      title: '3. Exchange or presentation on a specific topic',
      intro:
        'Practise following a short explanation and identifying the main recommendation.',
      text:
        'An eiser Gemeng gëtt et vun nächste Méindeg un en neie Velosatelier. Leit kënnen do léieren, wéi een e Vëlo kontrolléiert an kleng Reparature mécht. Den Atelier ass all Mëttwochowend am Kulturzentrum. D’Participatioun ass gratis, mee eng Umeldung ass néideg, well d’Plaze limitéiert sinn.',
      questions: [
        {
          question: 'Wat gëtt et an der Gemeng?',
          options: ['A. En neie Velosatelier', 'B. Eng nei Buslinn', 'C. E Musekscours'],
          answer: '1: A. En neie Velosatelier.',
        },
        {
          question: 'Wéini ass den Atelier?',
          options: ['A. All Méindegmoien', 'B. All Mëttwochowend', 'C. All Samschdeg'],
          answer: '2: B. All Mëttwochowend.',
        },
        {
          question: 'Firwat muss een sech umellen?',
          options: ['A. Well et deier ass', 'B. Well d’Plaze limitéiert sinn', 'C. Well een en eegene Vëlo brauch'],
          answer: '3: B. Well d’Plaze limitéiert sinn.',
        },
      ],
    },
  ];

  readonly signals = [
    { title: 'Time', items: ['haut', 'muer', 'gëschter', 'um sechs Auer', 'nächst Woch'] },
    { title: 'Dates and frequency', items: ['all Dag', 'all Mëttwoch', 'de Weekend', 'am Summer'] },
    { title: 'Numbers', items: ['eng Persoun', 'zwou Persounen', 'zéng Minutten', 'dräi Deeg'] },
    { title: 'Negation', items: ['net', 'keen', 'keng', 'näischt'] },
    { title: 'Contrast', items: ['mee', 'awer', 'trotzdem'] },
    { title: 'Cause and reason', items: ['well', 'dofir', 'wéinst'] },
    { title: 'Change of plan', items: ['et geet net', 'amplaz', 'kënne mir muer ...?'] },
    { title: 'Location and direction', items: ['zu', 'am', 'beim', 'an der Géigend', 'lénks', 'riets'] },
  ];

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  ngOnInit(): void {
    this.title.setTitle(this.titleText);
    this.meta.updateTag({ name: 'description', content: this.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Letz Speak' });
    this.meta.updateTag({ property: 'og:title', content: this.titleText });
    this.meta.updateTag({ property: 'og:description', content: this.description });
    this.meta.updateTag({ property: 'og:url', content: this.canonicalUrl });
    this.meta.updateTag({
      property: 'og:image',
      content: 'https://letz-speak.com/assets/luxembourg-hero.png',
    });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: 'Luxembourg City view representing Luxembourgish Sproochentest listening practice',
    });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: this.titleText });
    this.meta.updateTag({ name: 'twitter:description', content: this.description });
    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://letz-speak.com/assets/luxembourg-hero.png',
    });
    this.meta.updateTag({
      name: 'twitter:image:alt',
      content: 'Luxembourg City view representing Luxembourgish Sproochentest listening practice',
    });
    this.setCanonical(this.canonicalUrl);
    this.addStructuredData();
  }

  ngOnDestroy(): void {
    this.structuredDataElement?.remove();
    this.restoreDefaultMetadata();
  }

  private setCanonical(url: string): void {
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', url);
  }

  private addStructuredData(): void {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${this.canonicalUrl}#webpage`,
      url: this.canonicalUrl,
      name: this.titleText,
      description: this.description,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://letz-speak.com/#website',
        name: 'Letz Speak',
        url: 'https://letz-speak.com/',
      },
      about: {
        '@type': 'Thing',
        name: 'Luxembourgish B1 Sproochentest listening practice',
      },
    });
    this.document.head.appendChild(script);
    this.structuredDataElement = script;
  }

  private restoreDefaultMetadata(): void {
    this.title.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Letz Speak' });
    this.meta.updateTag({ property: 'og:title', content: this.defaultTitle });
    this.meta.updateTag({ property: 'og:description', content: this.defaultDescription });
    this.meta.updateTag({ property: 'og:url', content: this.defaultCanonicalUrl });
    this.meta.updateTag({
      property: 'og:image',
      content: 'https://letz-speak.com/assets/luxembourg-hero.png',
    });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: 'Luxembourg City view representing Luxembourgish language practice',
    });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: this.defaultTitle });
    this.meta.updateTag({ name: 'twitter:description', content: this.defaultDescription });
    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://letz-speak.com/assets/luxembourg-hero.png',
    });
    this.meta.updateTag({
      name: 'twitter:image:alt',
      content: 'Luxembourg City view representing Luxembourgish language practice',
    });
    this.setCanonical(this.defaultCanonicalUrl);
  }
}
