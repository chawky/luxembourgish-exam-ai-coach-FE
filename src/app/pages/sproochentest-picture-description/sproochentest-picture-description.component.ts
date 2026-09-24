import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { PublicNavComponent } from '../../components/public-nav.component';

@Component({
  selector: 'app-sproochentest-picture-description',
  standalone: true,
  imports: [RouterLink, PublicNavComponent, IconComponent, LogoComponent],
  template: `
    <app-public-nav></app-public-nav>

    <main>
      <section class="guide-hero picture-hero">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="guide-kicker">A2 visual-description practice</p>
            <h1>How to Describe a Picture in the Sproochentest</h1>
            <p class="lead">
              The visual-description task is part of the A2 speaking test. The goal is
              simple, understandable Luxembourgish. Use a repeatable structure instead
              of memorising one fixed description.
            </p>
            <div class="hero-actions">
              <a routerLink="/app/image-description" class="btn btn-primary btn-lg">
                Practice picture description
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/sproochentest" class="btn btn-outline btn-lg">
                Read the Sproochentest guide
              </a>
            </div>
          </div>

          <aside class="exam-note" aria-label="Picture-description exam facts">
            <div>
              <span>Speaking level</span>
              <strong>A2</strong>
              <p>Visual description belongs to the speaking test.</p>
            </div>
            <div>
              <span>Speaking time</span>
              <strong>10</strong>
              <p>INLL describes 10 minutes total, split into two 5-minute parts.</p>
            </div>
            <p class="source-note">
              INLL describes an interview and a visual-medium description. Evaluation
              considers vocabulary, fluency, clarity, A1 grammatical structures,
              coherence, intelligibility and interaction.
            </p>
          </aside>
        </div>
      </section>

      <article class="guide-body">
        <section class="section section-plain" aria-labelledby="official-context">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="official-context">What this part tests</h2>
            </div>
            <div class="section-copy">
              <p>
                In the official Sproochentest speaking test, candidates complete an A2
                interview and describe a visual medium chosen from the options presented
                to them. The practical target is not a perfect speech: it is clear,
                connected Luxembourgish about visible people, actions and details.
              </p>
              <p>
                This page is a learning guide, not an official INLL sample. Always
                confirm current rules, sample materials and registration details with
                INLL.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="framework">
          <div class="container picture-layout">
            <div class="section-heading picture-heading">
              <h2 id="framework">A repeatable picture-description framework</h2>
              <p>
                Move from the whole scene to specific visible details. If you get stuck,
                return to people, actions, positions and objects.
              </p>
            </div>

            <ol class="framework-list">
              <li>
                <strong>Start with the whole scene</strong>
                <span>Say what kind of place or situation you see.</span>
              </li>
              <li>
                <strong>Say where the people are</strong>
                <span>Use simple places: in a park, at home, in a shop, outside.</span>
              </li>
              <li>
                <strong>Describe who you can see</strong>
                <span>Name people generally: a man, a woman, children, a family.</span>
              </li>
              <li>
                <strong>Describe what they are doing</strong>
                <span>Use everyday action verbs before adding detail.</span>
              </li>
              <li>
                <strong>Add visible details</strong>
                <span>Mention clothes, colours, objects, weather or mood if visible.</span>
              </li>
              <li>
                <strong>Use positions when useful</strong>
                <span>Say what is left, right, in the middle, in front or behind.</span>
              </li>
              <li>
                <strong>Add a simple interpretation</strong>
                <span>Use “Ech mengen ...” only for reasonable guesses from the image.</span>
              </li>
            </ol>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="sentence-starters">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="sentence-starters">Luxembourgish sentence starters</h2>
            </div>
            <div class="starter-ledger" aria-label="Luxembourgish sentence starters">
              @for (group of sentenceStarterGroups; track group.title) {
                <article>
                  <h3>{{ group.title }}</h3>
                  <ul>
                    @for (starter of group.items; track starter) {
                      <li>{{ starter }}</li>
                    }
                  </ul>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="model-example">
          <div class="container model-layout">
            <div class="section-heading model-heading">
              <h2 id="model-example">Model example: family in a park</h2>
              <p>
                This is a generic practice scene, not an actual INLL exam picture. The
                sections show how the framework becomes a short A2-level answer.
              </p>
            </div>

            <div class="model-example">
              <article>
                <h3>Opening</h3>
                <p>Op dëser Foto gesinn ech eng Famill an engem Park.</p>
                <span>In this photo I see a family in a park.</span>
              </article>
              <article>
                <h3>People</h3>
                <p>Do sinn eng Fra, e Mann an zwee Kanner.</p>
                <span>There is a woman, a man and two children.</span>
              </article>
              <article>
                <h3>Actions</h3>
                <p>D’Kanner spillen um Gras. De Mann sëtzt op enger Bänk.</p>
                <span>The children are playing on the grass. The man is sitting on a bench.</span>
              </article>
              <article>
                <h3>Positions and details</h3>
                <p>
                  Am Virdergrond gesinn ech eng Decken an eng Täsch. Am Hannergrond
                  sinn Beem. D’Fra steet nieft de Kanner.
                </p>
                <span>
                  In the foreground I see a blanket and a bag. In the background there
                  are trees. The woman is standing next to the children.
                </span>
              </article>
              <article>
                <h3>Simple interpretation</h3>
                <p>Ech mengen, si maachen eng Paus an hunn eng gutt Zäit zesummen.</p>
                <span>I think they are taking a break and having a good time together.</span>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="vocabulary">
          <div class="container picture-layout">
            <div class="section-heading picture-heading">
              <h2 id="vocabulary">Focused vocabulary for image description</h2>
              <p>
                Keep a small active vocabulary you can use in many pictures. Accuracy
                and clarity matter more than rare words.
              </p>
            </div>

            <div class="vocab-reference">
              @for (group of vocabularyGroups; track group.title) {
                <article>
                  <h3>{{ group.title }}</h3>
                  <p>{{ group.items.join(' · ') }}</p>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="stuck">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="stuck">What if I get stuck?</h2>
            </div>
            <div class="section-copy">
              <p>
                Move in a simple order: people → actions → clothes → objects →
                positions → weather or environment. Short sentences are fine. It is
                better to stay understandable than to attempt grammar far above A2.
              </p>
              <p>
                Do not invent precise facts that cannot be seen. For reasonable
                interpretation, use phrases such as “Ech mengen ...” or “Et gesäit aus
                wéi ...” and keep the guess simple.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="common-mistakes">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="common-mistakes">Common mistakes</h2>
            </div>
            <div class="mistake-list">
              <ul>
                <li>Trying to memorise one perfect script for every picture.</li>
                <li>Only listing nouns instead of forming simple sentences.</li>
                <li>Attempting long sentences far above your current level.</li>
                <li>Stopping after two or three sentences when more visible detail is available.</li>
                <li>Making unsupported assumptions instead of describing what is visible.</li>
                <li>Forgetting basic location and action vocabulary.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="practice-method">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="practice-method">Practice method</h2>
              <a routerLink="/app/image-description" class="inline-cta">
                Open image-description practice
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Look at an image for a few seconds.</li>
                <li>Start with one overview sentence.</li>
                <li>Describe people and actions.</li>
                <li>Add positions and visible details.</li>
                <li>Continue for as long as you reasonably can.</li>
                <li>Record yourself and listen for unclear parts.</li>
                <li>Repeat the same image using different wording.</li>
              </ol>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="reported-scenes">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="reported-scenes">Scenes learners report encountering</h2>
            </div>
            <div class="section-copy">
              <p>
                Learners commonly report practising or encountering everyday scenes such
                as a park or playground, a family or people in a garden, a restaurant or
                café, a street or public place, camping, or a fair or event.
              </p>
              <p>
                These are learner-reported examples. They are not an official INLL list
                and they do not predict what any candidate will receive.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-official" aria-labelledby="official-source">
          <div class="container official-panel">
            <div>
              <h2 id="official-source">Check the official source</h2>
              <p>
                INLL is the official source for Sproochentest rules, registration,
                sample tests and current requirements. Letz Speak is independent and is
                not affiliated with INLL, MyINL, the Luxembourg government or any
                official exam body.
              </p>
              <p class="related-links">
                Continue with the
                <a routerLink="/sproochentest">main Sproochentest guide</a>
                or the
                <a routerLink="/sproochentest-topics">speaking topics guide</a>.
              </p>
            </div>
            <a
              href="https://www.inll.lu/en/sproochentest-en/"
              class="btn btn-outline btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit the INLL Sproochentest page
            </a>
          </div>
        </section>

        <section class="cta-band">
          <div class="container cta-inner">
            <div>
              <h2>Practise describing one picture now.</h2>
              <p>Use the framework, record your answer, then try different wording.</p>
            </div>
            <a routerLink="/app/image-description" class="btn btn-accent btn-lg">
              Practice picture description
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
    './sproochentest-picture-description.component.css',
  ],
})
export class SproochentestPictureDescriptionComponent implements OnInit, OnDestroy {
  private readonly canonicalUrl =
    'https://letz-speak.com/sproochentest-picture-description';
  private readonly defaultCanonicalUrl = 'https://letz-speak.com/';
  private readonly defaultTitle =
    'Letz Speak | Learn Luxembourgish & Sproochentest Practice';
  private readonly defaultDescription =
    'Learn Luxembourgish with focused language practice for speaking, listening, vocabulary and Sproochentest preparation. Create short exercises and build confidence.';
  private readonly titleText =
    'Sproochentest Picture Description Practice | Letz Speak';
  private readonly description =
    'Practise Luxembourgish A2 picture description for the Sproochentest with sentence starters, vocabulary, a model answer and a repeatable speaking framework.';
  private structuredDataElement?: HTMLScriptElement;

  readonly sentenceStarterGroups = [
    {
      title: 'Opening the description',
      items: [
        'Op dësem Bild gesinn ech ...',
        'Op der Foto gesinn ech ...',
        'Et ass eng Situatioun an engem Park / an engem Café / op der Strooss.',
      ],
    },
    {
      title: 'Position and place',
      items: [
        'Am Virdergrond ...',
        'Am Hannergrond ...',
        'Lénks ...',
        'Riets ...',
        'An der Mëtt ...',
      ],
    },
    {
      title: 'People and actions',
      items: [
        'D’Fra / De Mann / D’Kand ...',
        'D’Persoun huet ... un.',
        'Si schwätzen.',
        'Hie sëtzt.',
        'Si steet.',
      ],
    },
    {
      title: 'Careful interpretation',
      items: [
        'Ech mengen, si sinn ...',
        'Et gesäit aus wéi ...',
        'Vläicht ass et Summer / Weekend / eng Paus.',
      ],
    },
  ];

  readonly vocabularyGroups = [
    {
      title: 'People',
      items: ['Mann', 'Fra', 'Kand', 'Kanner', 'Famill', 'Frënn', 'Leit', 'Persoun'],
    },
    {
      title: 'Actions',
      items: [
        'sëtzen',
        'stoen',
        'schwätzen',
        'iessen',
        'drénken',
        'spillen',
        'liesen',
        'trëppelen',
      ],
    },
    {
      title: 'Position',
      items: ['lénks', 'riets', 'an der Mëtt', 'virun', 'hannert', 'nieft'],
    },
    {
      title: 'Useful details',
      items: [
        'd’Wieder',
        'Kleeder',
        'Faarwen',
        'Saachen',
        'd’Plaz',
        'Alter',
        'Gesiichtsausdrock',
        'Stëmmung',
      ],
    },
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest picture description practice',
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest picture description practice',
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
        name: 'Luxembourgish Sproochentest picture description practice',
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
    this.meta.updateTag({
      property: 'og:description',
      content: this.defaultDescription,
    });
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
    this.meta.updateTag({
      name: 'twitter:description',
      content: this.defaultDescription,
    });
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
