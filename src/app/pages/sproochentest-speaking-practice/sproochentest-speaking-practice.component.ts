import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { PublicNavComponent } from '../../components/public-nav.component';

interface SpeakingQuestion {
  question: string;
  meaning: string;
  answer: string;
  followUp: string;
}

interface SpeakingRound {
  title: string;
  note: string;
  questions: SpeakingQuestion[];
}

@Component({
  selector: 'app-sproochentest-speaking-practice',
  standalone: true,
  imports: [RouterLink, PublicNavComponent, IconComponent, LogoComponent],
  template: `
    <app-public-nav></app-public-nav>

    <main>
      <section class="guide-hero speaking-hero">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="guide-kicker">A2 speaking practice</p>
            <h1>Sproochentest Speaking Practice: A2 Questions &amp; Answers</h1>
            <p class="lead">
              INLL describes the speaking test as 10 minutes total: an interview and a
              visual-description task, each around 5 minutes. This page focuses on the
              interview/conversation portion. Picture-description practice has its own
              dedicated guide.
            </p>
            <div class="hero-actions">
              <a routerLink="/app/speaking" class="btn btn-primary btn-lg">
                Start speaking practice
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/sproochentest-topics" class="btn btn-outline btn-lg">
                View Sproochentest topics
              </a>
            </div>
          </div>

          <aside class="exam-note" aria-label="Speaking practice facts">
            <div>
              <span>Oral level</span>
              <strong>A2</strong>
              <p>Simple, understandable answers about familiar subjects.</p>
            </div>
            <div>
              <span>Speaking test</span>
              <strong>2×5</strong>
              <p>Interview plus visual-medium description.</p>
            </div>
            <p class="source-note">
              INLL gives examples such as work, family and hobbies. It does not publish
              a definitive exhaustive list of every interview topic.
            </p>
          </aside>
        </div>
      </section>

      <article class="guide-body">
        <section class="section section-plain" aria-labelledby="a2-speaking">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="a2-speaking">What A2 speaking means in practice</h2>
            </div>
            <div class="section-copy">
              <p>
                A2 speaking is practical. You should be able to introduce yourself, talk
                simply about familiar everyday subjects, answer direct questions, add a
                relevant detail or reason, and respond to reasonable follow-up questions.
              </p>
              <p>
                You do not need perfect grammar or advanced vocabulary. The useful goal
                is to be clear, coherent and understandable while describing people,
                things and activities in simple language.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="free-practice">
          <div class="container practice-layout">
            <div class="section-heading practice-heading">
              <h2 id="free-practice">Free Sproochentest speaking practice</h2>
              <p>
                Read one question, answer aloud, then answer the follow-up. These are
                practice questions, not guaranteed exam questions.
              </p>
            </div>

            <div class="round-ledger">
              @for (round of rounds; track round.title) {
                <section class="round" [attr.aria-labelledby]="round.title">
                  <header>
                    <h3 [id]="round.title">{{ round.title }}</h3>
                    <p>{{ round.note }}</p>
                  </header>

                  @for (item of round.questions; track item.question) {
                    <article class="qa-item">
                      <div class="question-block">
                        <strong>{{ item.question }}</strong>
                        <span>{{ item.meaning }}</span>
                      </div>
                      <div class="answer-block">
                        <h4>Short A2-style answer</h4>
                        <p>{{ item.answer }}</p>
                      </div>
                      <div class="follow-up">
                        <h4>Follow-up</h4>
                        <p>{{ item.followUp }}</p>
                      </div>
                    </article>
                  }
                </section>
              }
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="answer-structure">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="answer-structure">How to build an answer</h2>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Answer the question directly.</li>
                <li>Add one detail.</li>
                <li>Give a simple reason or example when appropriate.</li>
                <li>Stop naturally and be ready for a follow-up.</li>
              </ol>
              <div class="worked-example">
                <h3>Worked example</h3>
                <p><strong>Question:</strong> Wat maacht Dir gär an Ärer Fräizäit?</p>
                <p><strong>Direct answer:</strong> A menger Fräizäit ginn ech gär trëppelen.</p>
                <p><strong>Detail:</strong> Ech ginn dacks an de Park bei mengem Haus.</p>
                <p><strong>Reason:</strong> Dat ass gutt fir mech, well ech frësch Loft kréien.</p>
              </div>
              <p>
                Do not memorise long scripts. Prepare flexible sentence patterns that
                you can adapt when the examiner asks something slightly different.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="clarification">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="clarification">When you do not understand</h2>
            </div>
            <div class="phrase-ledger">
              @for (phrase of clarificationPhrases; track phrase.lb) {
                <article>
                  <strong>{{ phrase.lb }}</strong>
                  <span>{{ phrase.en }}</span>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="follow-up-practice">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="follow-up-practice">Follow-up question practice</h2>
            </div>
            <div class="mini-drills">
              @for (drill of followUpDrills; track drill.question) {
                <article>
                  <h3>{{ drill.question }}</h3>
                  <p><strong>Answer:</strong> {{ drill.answer }}</p>
                  <p><strong>Follow-up:</strong> {{ drill.followUp }}</p>
                  <p><strong>Second answer:</strong> {{ drill.secondAnswer }}</p>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="self-check">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="self-check">Letz Speak practice checklist</h2>
            </div>
            <div class="section-copy">
              <p>
                This is a Letz Speak practice checklist, not an official INLL scoring
                grid.
              </p>
              <ul class="check-list">
                <li>Did I answer the actual question?</li>
                <li>Did I use a complete understandable sentence?</li>
                <li>Did I add a relevant detail?</li>
                <li>Could I respond to a follow-up?</li>
                <li>Was I understandable without switching languages?</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="picture-description">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="picture-description">Picture description</h2>
              <a routerLink="/sproochentest-picture-description" class="inline-cta">
                Open picture-description guide
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <p>
                Visual description is the second speaking component. Keep this page for
                interview practice, then use the dedicated picture-description guide for
                sentence starters, vocabulary and a model answer.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="routine">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="routine">A 10–15 minute practice routine</h2>
              <a routerLink="/app/speaking" class="inline-cta">
                Open Letz Speak speaking
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Choose one topic.</li>
                <li>Answer several questions aloud.</li>
                <li>Record yourself.</li>
                <li>Answer one unexpected follow-up.</li>
                <li>Repeat one answer with different wording.</li>
                <li>Use Letz Speak speaking practice for additional prompts.</li>
              </ol>
            </div>
          </div>
        </section>

        <section class="section section-official" aria-labelledby="official-source">
          <div class="container official-panel">
            <div>
              <h2 id="official-source">Official source and next practice</h2>
              <p>
                INLL is the official source for Sproochentest rules, registration,
                sample tests and current requirements. Letz Speak is independent and is
                not affiliated with INLL, MyINL, the Luxembourg government or any
                official exam body.
              </p>
              <p class="related-links">
                Continue with the
                <a routerLink="/sproochentest">main guide</a>,
                <a routerLink="/sproochentest-topics">topic guide</a>,
                <a routerLink="/sproochentest-picture-description">picture guide</a>
                or
                <a routerLink="/sproochentest-listening-practice">B1 listening practice</a>.
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
              <h2>Start speaking out loud.</h2>
              <p>One clear answer and one follow-up is a useful session.</p>
            </div>
            <a routerLink="/app/speaking" class="btn btn-accent btn-lg">
              Start speaking practice
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
    './sproochentest-speaking-practice.component.css',
  ],
})
export class SproochentestSpeakingPracticeComponent implements OnInit, OnDestroy {
  private readonly canonicalUrl =
    'https://letz-speak.com/sproochentest-speaking-practice';
  private readonly defaultCanonicalUrl = 'https://letz-speak.com/';
  private readonly defaultTitle =
    'Letz Speak | Learn Luxembourgish & Sproochentest Practice';
  private readonly defaultDescription =
    'Learn Luxembourgish with focused language practice for speaking, listening, vocabulary and Sproochentest preparation. Create short exercises and build confidence.';
  private readonly titleText =
    'Sproochentest Speaking Practice – A2 Questions | Letz Speak';
  private readonly description =
    'Practise Luxembourgish A2 speaking for the Sproochentest with example questions, short answers and follow-up drills.';
  private structuredDataElement?: HTMLScriptElement;

  readonly rounds: SpeakingRound[] = [
    {
      title: 'Round 1 — Introduction / personal life',
      note: 'Useful opening questions for introducing yourself and your situation.',
      questions: [
        {
          question: 'Wou wunnt Dir?',
          meaning: 'Where do you live?',
          answer: 'Ech wunnen zu Esch. Meng Wunneng ass no beim Bus, an dat ass praktesch.',
          followUp: 'Wunnt Dir gär do?',
        },
        {
          question: 'Wat maacht Dir berufflech?',
          meaning: 'What do you do for work?',
          answer: 'Ech schaffen am Büro. Ech schwätzen dacks mat Clienten a mat menge Kolleegen.',
          followUp: 'Schafft Dir léiwer eleng oder am Team?',
        },
        {
          question: 'Wéi laang wunnt Dir schonn zu Lëtzebuerg?',
          meaning: 'How long have you lived in Luxembourg?',
          answer: 'Ech wunnen zanter dräi Joer zu Lëtzebuerg. Ech fille mech hei gutt.',
          followUp: 'Wat gefällt Iech hei am beschten?',
        },
        {
          question: 'Firwat léiert Dir Lëtzebuergesch?',
          meaning: 'Why are you learning Luxembourgish?',
          answer: 'Ech léieren Lëtzebuergesch, well ech hei wunnen an d’Sprooch am Alldag benotze wëll.',
          followUp: 'Wéi übt Dir Lëtzebuergesch?',
        },
      ],
    },
    {
      title: 'Round 2 — Family / everyday life',
      note: 'Family is one of the example themes named by INLL.',
      questions: [
        {
          question: 'Kënnt Dir Är Famill beschreiwen?',
          meaning: 'Can you describe your family?',
          answer: 'Meng Famill ass net ganz grouss. Mir gesinn eis dacks um Weekend.',
          followUp: 'Wat maacht Dir zesummen?',
        },
        {
          question: 'Hutt Dir Kanner oder Geschwëster?',
          meaning: 'Do you have children or siblings?',
          answer: 'Jo, ech hunn eng Schwëster. Si wunnt net wäit vun mir.',
          followUp: 'Gesitt Dir hatt dacks?',
        },
        {
          question: 'Wéi gesäit Ären normale Weekend aus?',
          meaning: 'What is your normal weekend like?',
          answer: 'Samschdes kafen ech an. Sonndes raschten ech a kachen heiansdo mat der Famill.',
          followUp: 'Kacht Dir gär?',
        },
      ],
    },
    {
      title: 'Round 3 — Work / daily routine',
      note: 'Work is one of the example themes named by INLL.',
      questions: [
        {
          question: 'Wéi gesäit Ären Aarbechtsdag aus?',
          meaning: 'What is your workday like?',
          answer: 'Moies liesen ech meng E-Mailen. Duerno hunn ech Reuniounen oder schaffen um Computer.',
          followUp: 'Wéini fänkt Dir un?',
        },
        {
          question: 'Wéi kommt Dir op d’Aarbecht?',
          meaning: 'How do you get to work?',
          answer: 'Ech fuere meeschtens mam Bus op d’Aarbecht. Dat dauert ongeféier zwanzeg Minutten.',
          followUp: 'Ass den Transport praktesch?',
        },
        {
          question: 'Wat maacht Dir nom Schaffen?',
          meaning: 'What do you do after work?',
          answer: 'Nom Schaffen ginn ech heem. Ech iessen eppes a kucke kuerz d’Noriichten.',
          followUp: 'Gitt Dir och Sport maachen?',
        },
      ],
    },
    {
      title: 'Round 4 — Hobbies / free time',
      note: 'Hobbies are one of the example themes named by INLL.',
      questions: [
        {
          question: 'Wat maacht Dir gär an Ärer Fräizäit?',
          meaning: 'What do you like doing in your free time?',
          answer: 'A menger Fräizäit liesen ech gär a ginn ech gär trëppelen.',
          followUp: 'Maacht Dir dat eleng oder mat Frënn?',
        },
        {
          question: 'Hutt Dir en Hobby?',
          meaning: 'Do you have a hobby?',
          answer: 'Jo, ech kachen gär. Ech probéieren dacks nei Rezepter.',
          followUp: 'Wat kacht Dir am léifsten?',
        },
        {
          question: 'Gitt Dir gär eraus?',
          meaning: 'Do you like going out?',
          answer: 'Jo, heiansdo ginn ech mat Frënn an e Café. Dat ass flott a relax.',
          followUp: 'Wou gitt Dir normalerweis hin?',
        },
      ],
    },
  ];

  readonly clarificationPhrases = [
    { lb: 'Kënnt Dir dat widderhuelen, wann ech gelift?', en: 'Could you repeat that, please?' },
    { lb: 'Kënnt Dir e bësse méi lues schwätzen?', en: 'Could you speak a little more slowly?' },
    { lb: 'Ech hunn d’Fro net verstanen.', en: 'I did not understand the question.' },
    { lb: 'Wat heescht ___?', en: 'What does ___ mean?' },
  ];

  readonly followUpDrills = [
    {
      question: 'Wou wunnt Dir?',
      answer: 'Ech wunnen zu Diddeleng, an ech wunnen do zanter zwee Joer.',
      followUp: 'Firwat hutt Dir dës Stad gär?',
      secondAnswer: 'Ech hunn dës Stad gär, well se roueg ass an ech alles no bei mir hunn.',
    },
    {
      question: 'Wat maacht Dir gär an Ärer Fräizäit?',
      answer: 'Ech ginn dacks spadséieren, besonnesch owes no der Aarbecht.',
      followUp: 'Mat wiem gitt Dir spadséieren?',
      secondAnswer: 'Heiansdo ginn ech eleng, mee de Weekend ginn ech mat mengem Partner.',
    },
    {
      question: 'Wéi kommt Dir op d’Aarbecht?',
      answer: 'Ech huelen normalerweis den Zuch, well dat einfach ass.',
      followUp: 'Wat maacht Dir wann den Zuch ze spéit ass?',
      secondAnswer: 'Da waarden ech oder ech huelen de Bus. Dat geschitt net all Dag.',
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest speaking practice',
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest speaking practice',
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
        name: 'Luxembourgish A2 Sproochentest speaking practice',
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
