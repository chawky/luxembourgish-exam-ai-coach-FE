import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { PublicNavComponent } from '../../components/public-nav.component';

@Component({
  selector: 'app-sproochentest',
  standalone: true,
  imports: [RouterLink, PublicNavComponent, IconComponent, LogoComponent],
  template: `
    <app-public-nav></app-public-nav>

    <main>
      <section class="guide-hero">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="guide-kicker">Sproochentest preparation</p>
            <h1>Prepare for the Luxembourgish Sproochentest</h1>
            <p class="lead">
              Letz Speak helps candidates prepare with focused Luxembourgish speaking,
              listening and picture-description practice. Use this guide to understand
              what to train, then start a short practice session.
            </p>
            <div class="hero-actions">
              <a routerLink="/signup" class="btn btn-primary btn-lg">
                Start practicing
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/app/speaking" class="btn btn-outline btn-lg">
                Open speaking practice
              </a>
            </div>
          </div>

          <aside class="exam-note" aria-label="Sproochentest overview">
            <div>
              <span>Speaking</span>
              <strong>A2</strong>
              <p>Conversation and description of a visual medium.</p>
            </div>
            <div>
              <span>Listening</span>
              <strong>B1</strong>
              <p>Understanding everyday spoken Luxembourgish.</p>
            </div>
            <p class="source-note">
              Always confirm current rules, registration and official sample tests with INLL.
            </p>
          </aside>
        </div>
      </section>

      <article class="guide-body">
        <section class="section section-plain" aria-labelledby="what-is-sproochentest">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="what-is-sproochentest">What is the Sproochentest?</h2>
            </div>
            <div class="section-copy">
              <p>
                The Sproochentest is the Luxembourgish language test used in the
                nationality procedure for candidates who need to prove Luxembourgish
                language competence. It is organised by INLL, the official source for
                registration, requirements, sample tests and exam rules.
              </p>
              <p>
                In practice, preparation should focus on using Luxembourgish in familiar
                daily situations: introducing yourself, talking about work or family,
                describing what you see, and understanding short spoken texts.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="exam-structure">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="exam-structure">Exam structure</h2>
            </div>
            <div class="skill-ledger">
              <article>
                <app-icon name="mic" [size]="24"></app-icon>
                <div>
                  <h3>A2 speaking</h3>
                  <p>
                    Candidates should expect spoken interaction on familiar A2 topics.
                    The official INLL information describes an interview-style part and
                    a visual-description part, so useful preparation means speaking out
                    loud, not only reading vocabulary lists.
                  </p>
                </div>
              </article>
              <article>
                <app-icon name="headphones" [size]="24"></app-icon>
                <div>
                  <h3>B1 listening</h3>
                  <p>
                    Listening practice should train the ability to follow clear everyday
                    speech and identify the main information in short audio situations,
                    such as messages, conversations or topic-based exchanges.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="speaking-preparation">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="speaking-preparation">Speaking preparation</h2>
              <a routerLink="/app/speaking" class="inline-cta">
                Practice speaking
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <p>
                The goal is to answer simply, clearly and naturally. Prepare short
                answers for everyday conversation topics, then practise expanding them
                with one reason, one example or one detail.
              </p>
              <p>
                For more speaking prompts by theme, use the
                <a routerLink="/sproochentest-topics" class="text-link">
                  Sproochentest topics and example questions guide</a
                >.
              </p>
              <div class="examples" aria-label="Luxembourgish speaking examples">
                <p>Wou wunnt Dir?</p>
                <p>Wat maacht Dir berufflech?</p>
                <p>Wat maacht Dir gär an Ärer Fräizäit?</p>
                <p>Firwat léiert Dir Lëtzebuergesch?</p>
              </div>
              <p>
                A good training session is short: listen to or read one prompt, answer
                aloud, record yourself if possible, then repeat with a clearer sentence.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="picture-description">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="picture-description">Picture description</h2>
              <a routerLink="/app/image-description" class="inline-cta">
                Practice image description
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <p>
                For an image task, avoid trying to name every object. Start with the
                main situation, then add visible details in a simple order.
              </p>
              <ol class="routine-list">
                <li>Say what you see: a street, a shop, a family, an office.</li>
                <li>Say where people are: at home, outside, at work, in town.</li>
                <li>Say what they are doing: walking, buying, talking, waiting.</li>
                <li>Add relevant details: weather, mood, objects, colours or time.</li>
              </ol>
              <p class="sample-answer">
                Example structure: “Op der Foto gesinn ech eng Famill. Si sinn an
                engem Park. D'Kanner spillen, an d'Eltere schwätzen zesummen.”
              </p>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="listening-preparation">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="listening-preparation">Listening preparation</h2>
              <a routerLink="/app/listening" class="inline-cta">
                Practice listening
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <p>
                B1 listening practice matters because candidates need to follow the
                meaning of spoken Luxembourgish, not translate every word. Train with
                short clips, listen once for the main idea, then listen again for names,
                places, times, opinions and actions.
              </p>
              <p>
                Letz Speak listening sessions pair Luxembourgish audio with the text
                and translation so you can check what you missed and repeat the same
                kind of situation later.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="preparation-routine">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="preparation-routine">A realistic preparation routine</h2>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Spend 10 minutes answering two speaking prompts aloud.</li>
                <li>Spend 10 minutes on one listening task and review missed words.</li>
                <li>Save five useful words or phrases from the session.</li>
                <li>Describe one image for two minutes using simple connected sentences.</li>
                <li>Repeat the same topics during the week until answers feel automatic.</li>
              </ol>
            </div>
          </div>
        </section>

        <section class="section section-official" aria-labelledby="official-information">
          <div class="container official-panel">
            <div>
              <h2 id="official-information">Official information</h2>
              <p>
                Letz Speak is an independent learning support tool. It is not affiliated
                with INLL, MyINL, the Luxembourg government or any official exam body.
                Always check current Sproochentest rules, requirements, registration
                details and sample materials directly with INLL.
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
              <h2>Start practicing with Letz Speak.</h2>
              <p>Choose one skill, complete one short session, and build from there.</p>
            </div>
            <a routerLink="/signup" class="btn btn-accent btn-lg">Create your free account</a>
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
  styleUrl: './sproochentest.component.css',
})
export class SproochentestComponent implements OnInit, OnDestroy {
  private readonly canonicalUrl = 'https://letz-speak.com/sproochentest';
  private readonly defaultCanonicalUrl = 'https://letz-speak.com/';
  private readonly defaultTitle =
    'Letz Speak | Learn Luxembourgish & Sproochentest Practice';
  private readonly defaultDescription =
    'Learn Luxembourgish with focused language practice for speaking, listening, vocabulary and Sproochentest preparation. Create short exercises and build confidence.';
  private readonly titleText = 'Sproochentest Preparation Guide | Letz Speak';
  private readonly description =
    'Prepare for the Luxembourgish Sproochentest with useful guidance for A2 speaking, picture description and B1 listening practice.';
  private structuredDataElement?: HTMLScriptElement;

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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest practice',
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest practice',
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
        name: 'Luxembourgish Sproochentest preparation',
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
