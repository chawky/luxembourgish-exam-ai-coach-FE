import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LogoComponent } from '../../components/logo.component';
import { PublicNavComponent } from '../../components/public-nav.component';

interface TopicExample {
  title: string;
  luxembourgish: string;
  context: string;
  questions: Array<{ lb: string; en: string }>;
  answer: string;
  phrases: string[];
}

@Component({
  selector: 'app-sproochentest-topics',
  standalone: true,
  imports: [RouterLink, PublicNavComponent, IconComponent, LogoComponent],
  template: `
    <app-public-nav></app-public-nav>

    <main>
      <section class="guide-hero topics-hero">
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="guide-kicker">A2 speaking reference</p>
            <h1>Sproochentest Topics &amp; Example Questions</h1>
            <p class="lead">
              Prepare flexible short answers for everyday Luxembourgish conversation
              themes. These examples are for practice; they are not a guaranteed exam
              question list.
            </p>
            <div class="hero-actions">
              <a routerLink="/app/speaking" class="btn btn-primary btn-lg">
                Practise a speaking prompt
                <app-icon name="arrow" [size]="18"></app-icon>
              </a>
              <a routerLink="/sproochentest" class="btn btn-outline btn-lg">
                Read the Sproochentest guide
              </a>
            </div>
          </div>

          <aside class="exam-note" aria-label="Important topic facts">
            <div>
              <span>Official level</span>
              <strong>A2</strong>
              <p>Speaking is assessed at A2 level.</p>
            </div>
            <div>
              <span>Interview choice</span>
              <strong>2</strong>
              <p>INLL says candidates choose between two proposed topics.</p>
            </div>
            <p class="source-note">
              INLL gives examples such as work, family and hobbies, but does not publish
              a definitive complete topic list.
            </p>
          </aside>
        </div>
      </section>

      <article class="guide-body">
        <section class="section section-plain" aria-labelledby="how-to-use-this-page">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="how-to-use-this-page">Use these as preparation themes.</h2>
            </div>
            <div class="section-copy">
              <p>
                The Sproochentest speaking interview is A2. According to INLL, the
                candidate chooses between two topics proposed by the examiner. INLL gives
                examples such as work, family and hobbies; it does not publish a
                definitive complete list of all possible topics.
              </p>
              <p>
                This page therefore gives useful everyday themes, example questions and
                short answer patterns. Treat them as preparation material, not as
                guaranteed exam questions. The useful skill is answering clearly, then
                handling a follow-up question without memorising a long script.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="official-and-practice">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="official-and-practice">Official examples vs practice themes</h2>
            </div>
            <div class="skill-ledger">
              <article>
                <app-icon name="info" [size]="24"></app-icon>
                <div>
                  <h3>Official INLL information</h3>
                  <p>
                    INLL describes an interview on an A2 topic, with a choice between
                    two topics proposed to the candidate. Examples named by INLL include
                    work, family and hobbies.
                  </p>
                </div>
              </article>
              <article>
                <app-icon name="book" [size]="24"></app-icon>
                <div>
                  <h3>Preparation themes</h3>
                  <p>
                    The themes below are common everyday areas learners practise for A2
                    conversation. They help you build reusable answers and vocabulary,
                    but they are not an official exhaustive list.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="topic-examples">
          <div class="container topics-layout">
            <div class="section-heading topics-heading">
              <h2 id="topic-examples">Example Sproochentest speaking topics</h2>
              <p>
                Practise short answers. One direct answer plus one reason is usually
                more useful than a memorised paragraph.
              </p>
            </div>

            <div class="topic-ledger">
              @for (topic of topics; track topic.title) {
                <article class="topic-row">
                  <header>
                    <div>
                      <h3>{{ topic.title }}</h3>
                      <p>{{ topic.luxembourgish }}</p>
                    </div>
                    <span>{{ topic.context }}</span>
                  </header>

                  <div class="topic-body">
                    <div class="questions">
                      <h4>Example questions</h4>
                      <ul>
                        @for (question of topic.questions; track question.lb) {
                          <li>
                            <strong>{{ question.lb }}</strong>
                            <span>{{ question.en }}</span>
                          </li>
                        }
                      </ul>
                    </div>

                    <div class="answer-block">
                      <h4>Short A2-style answer</h4>
                      <p>{{ topic.answer }}</p>
                    </div>

                    <div class="phrase-block">
                      <h4>Useful words and phrases</h4>
                      <p>{{ topic.phrases.join(' · ') }}</p>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="section section-tinted" aria-labelledby="compact-topic-list">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="compact-topic-list">More themes worth rotating</h2>
            </div>
            <div class="section-copy">
              <p>
                These are also useful for everyday A2 speaking practice: food, shopping,
                transport, health, sport, holidays and travel, weather and seasons,
                languages and learning Luxembourgish, media and technology, reading,
                gifts and social life.
              </p>
              <p>
                Do not try to prepare one perfect answer for every theme. Prepare a few
                flexible sentence patterns: what you usually do, what you like or do not
                like, what you did recently, and why. For question-and-answer drills,
                use the
                <a routerLink="/sproochentest-speaking-practice" class="text-link">
                  Sproochentest speaking practice page</a
                >.
              </p>
            </div>
          </div>
        </section>

        <section class="section section-plain" aria-labelledby="practice-method">
          <div class="container guide-grid">
            <div class="section-heading">
              <h2 id="practice-method">How to practise a topic</h2>
              <a routerLink="/app/speaking" class="inline-cta">
                Open speaking practice
                <app-icon name="arrow" [size]="16"></app-icon>
              </a>
            </div>
            <div class="section-copy">
              <ol class="routine-list">
                <li>Read one question and make sure you understand the verb.</li>
                <li>Answer aloud without notes, even if the answer is short.</li>
                <li>Add one reason, time, place or personal detail.</li>
                <li>Practise one follow-up question on the same topic.</li>
                <li>Repeat later with different wording so the answer stays flexible.</li>
              </ol>
              <p class="sample-answer">
                For picture-description preparation, start from the same everyday
                vocabulary and practise describing what people are doing in a scene.
                Use the
                <a routerLink="/sproochentest-picture-description">
                  dedicated picture-description guide</a
                >.
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
              <h2>Practise one topic now.</h2>
              <p>Pick a theme, answer aloud, then try a follow-up question.</p>
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
    './sproochentest-topics.component.css',
  ],
})
export class SproochentestTopicsComponent implements OnInit, OnDestroy {
  private readonly canonicalUrl = 'https://letz-speak.com/sproochentest-topics';
  private readonly defaultCanonicalUrl = 'https://letz-speak.com/';
  private readonly defaultTitle =
    'Letz Speak | Learn Luxembourgish & Sproochentest Practice';
  private readonly defaultDescription =
    'Learn Luxembourgish with focused language practice for speaking, listening, vocabulary and Sproochentest preparation. Create short exercises and build confidence.';
  private readonly titleText = 'Sproochentest Topics & Example Questions | Letz Speak';
  private readonly description =
    'Prepare for A2 Sproochentest speaking topics with Luxembourgish example questions, short answers and useful everyday phrases.';
  private structuredDataElement?: HTMLScriptElement;

  readonly topics: TopicExample[] = [
    {
      title: 'Family',
      luxembourgish: 'D’Famill',
      context: 'Official INLL example theme',
      questions: [
        { lb: 'Kënnt Dir Är Famill beschreiwen?', en: 'Can you describe your family?' },
        { lb: 'Wéi oft gesitt Dir Är Famill?', en: 'How often do you see your family?' },
        { lb: 'Wat maacht Dir gär zesummen?', en: 'What do you like doing together?' },
      ],
      answer:
        'Ech hunn eng kleng Famill. Mir gesinn eis de Weekend, an heiansdo iesse mir zesummen. Dat ass fir mech wichteg.',
      phrases: ['meng Famill', 'meng Kanner', 'zesummen iessen', 'de Weekend'],
    },
    {
      title: 'Work',
      luxembourgish: 'D’Aarbecht',
      context: 'Official INLL example theme',
      questions: [
        { lb: 'Wat maacht Dir berufflech?', en: 'What do you do for work?' },
        { lb: 'Wéi gesäit Ären Aarbechtsdag aus?', en: 'What is your workday like?' },
        { lb: 'Schafft Dir léiwer eleng oder am Team?', en: 'Do you prefer working alone or in a team?' },
      ],
      answer:
        'Ech schaffen am Büro. Moies liesen ech meng E-Mailen, an duerno schwätzen ech mat menge Kolleegen. Ech schaffen gär am Team.',
      phrases: ['am Büro', 'meng Kolleegen', 'eng Reunioun', 'ech schaffen als'],
    },
    {
      title: 'Home and housing',
      luxembourgish: 'Wunnen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wou wunnt Dir?', en: 'Where do you live?' },
        { lb: 'Wéi ass Är Wunneng oder Äert Haus?', en: 'What is your flat or house like?' },
        { lb: 'Wat hutt Dir gär un Ärer Géigend?', en: 'What do you like about your area?' },
      ],
      answer:
        'Ech wunnen zu Lëtzebuerg an enger Wunneng. Si ass net ganz grouss, mee si ass roueg. Ech hunn d’Géigend gär, well et Busser a Geschäfter ginn.',
      phrases: ['eng Wunneng', 'en Haus', 'roueg', 'no beim Bus'],
    },
    {
      title: 'Daily routine',
      luxembourgish: 'Den Alldag',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wat maacht Dir moies?', en: 'What do you do in the morning?' },
        { lb: 'Wéi kommt Dir op d’Aarbecht?', en: 'How do you get to work?' },
        { lb: 'Wat maacht Dir owes?', en: 'What do you do in the evening?' },
      ],
      answer:
        'Moies stinn ech fréi op an drénken e Kaffi. Duerno fueren ech mam Bus op d’Aarbecht. Owes kachen ech a kucke kuerz Televisioun.',
      phrases: ['moies', 'owes', 'ech stinn op', 'ech fuere mam Bus'],
    },
    {
      title: 'Hobbies and free time',
      luxembourgish: 'Fräizäit an Hobbyen',
      context: 'Official INLL example theme',
      questions: [
        { lb: 'Wat maacht Dir gär an Ärer Fräizäit?', en: 'What do you like doing in your free time?' },
        { lb: 'Hutt Dir en Hobby?', en: 'Do you have a hobby?' },
        { lb: 'Maacht Dir dat eleng oder mat anere Leit?', en: 'Do you do that alone or with other people?' },
      ],
      answer:
        'A menger Fräizäit ginn ech gär trëppelen. Dat ass gutt fir mech, well ech frësch Loft kréien. Heiansdo ginn ech mat Frënn.',
      phrases: ['an der Fräizäit', 'trëppelen', 'mat Frënn', 'ech hunn dat gär'],
    },
    {
      title: 'Food',
      luxembourgish: 'Iessen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wat iesst Dir gär?', en: 'What do you like eating?' },
        { lb: 'Kacht Dir dacks doheem?', en: 'Do you often cook at home?' },
        { lb: 'Gitt Dir gär an de Restaurant?', en: 'Do you like going to restaurants?' },
      ],
      answer:
        'Ech kachen dacks doheem, well et méi praktesch ass. Ech iesse gär Zopp a Geméis. De Weekend ginn ech heiansdo an e Restaurant.',
      phrases: ['ech kachen', 'doheem', 'e Restaurant', 'de Weekend'],
    },
    {
      title: 'Shopping',
      luxembourgish: 'Akafen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wou kaaft Dir normalerweis an?', en: 'Where do you usually shop?' },
        { lb: 'Wat kaaft Dir all Woch?', en: 'What do you buy every week?' },
        { lb: 'Bezuelt Dir léiwer mat Kaart oder boer?', en: 'Do you prefer paying by card or cash?' },
      ],
      answer:
        'Ech kafen normalerweis am Supermarché an. All Woch kafen ech Brout, Mëllech a Geméis. Ech bezuelen meeschtens mat Kaart.',
      phrases: ['am Supermarché', 'bezuelen', 'mat Kaart', 'boer'],
    },
    {
      title: 'Transport',
      luxembourgish: 'Transport',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wéi beweegt Dir Iech am Alldag?', en: 'How do you travel day to day?' },
        { lb: 'Huelt Dir dacks den Zuch oder de Bus?', en: 'Do you often take the train or bus?' },
        { lb: 'Fuert Dir gär mam Auto?', en: 'Do you like driving?' },
      ],
      answer:
        'Ech huelen dacks de Bus, well en no bei mengem Haus hält. Heiansdo fueren ech mam Auto, mee an der Stad ass de Bus méi einfach.',
      phrases: ['de Bus', 'den Zuch', 'mam Auto', 'an der Stad'],
    },
    {
      title: 'Health',
      luxembourgish: 'Gesondheet',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wat maacht Dir fir gesond ze bleiwen?', en: 'What do you do to stay healthy?' },
        { lb: 'Gitt Dir heiansdo bei den Dokter?', en: 'Do you sometimes go to the doctor?' },
        { lb: 'Schlooft Dir genuch?', en: 'Do you sleep enough?' },
      ],
      answer:
        'Ech probéieren gesond ze iessen an ze trëppelen. Wann ech krank sinn, ginn ech bei den Dokter. Schlof ass och wichteg fir mech.',
      phrases: ['gesond bleiwen', 'krank sinn', 'bei den Dokter goen', 'schlofen'],
    },
    {
      title: 'Sport',
      luxembourgish: 'Sport',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Maacht Dir Sport?', en: 'Do you do sport?' },
        { lb: 'Wéi eng Sportaart hutt Dir gär?', en: 'Which sport do you like?' },
        { lb: 'Kuckt Dir Sport op der Televisioun?', en: 'Do you watch sport on TV?' },
      ],
      answer:
        'Ech maachen net all Dag Sport, mee ech ginn dacks spadséieren. Ech kucken och gär Fussball mat Frënn, wann ech Zäit hunn.',
      phrases: ['Sport maachen', 'spadséieren', 'Fussball', 'wann ech Zäit hunn'],
    },
    {
      title: 'Holidays and travel',
      luxembourgish: 'Vakanz a Reesen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wou gitt Dir gär an d’Vakanz?', en: 'Where do you like going on holiday?' },
        { lb: 'Reest Dir léiwer mam Auto oder mam Fliger?', en: 'Do you prefer travelling by car or plane?' },
        { lb: 'Wat hutt Dir an Ärer leschter Vakanz gemaach?', en: 'What did you do on your last holiday?' },
      ],
      answer:
        'Ech ginn am Summer gär un d’Mier. Meng lescht Vakanz war roueg. Ech sinn vill spadséiert an hunn Zäit mat menger Famill verbruecht.',
      phrases: ['an d’Vakanz goen', 'd’Mier', 'mam Fliger', 'leschte Summer'],
    },
    {
      title: 'Weather and seasons',
      luxembourgish: 'Wieder a Joreszäiten',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wéi ass d’Wieder haut?', en: 'What is the weather like today?' },
        { lb: 'Wéi eng Joreszäit hutt Dir am léifsten?', en: 'Which season do you like best?' },
        { lb: 'Wat maacht Dir wann et reent?', en: 'What do you do when it rains?' },
      ],
      answer:
        'Ech hunn de Fréijoer gär, well et méi waarm gëtt. Wann et reent, bleiwen ech léiwer doheem a liesen oder kachen.',
      phrases: ['et reent', 'et ass waarm', 'de Fréijoer', 'doheem bleiwen'],
    },
    {
      title: 'Languages and learning Luxembourgish',
      luxembourgish: 'Sproochen a Lëtzebuergesch léieren',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wéi eng Sprooche schwätzt Dir?', en: 'Which languages do you speak?' },
        { lb: 'Firwat léiert Dir Lëtzebuergesch?', en: 'Why are you learning Luxembourgish?' },
        { lb: 'Wéi léiert Dir nei Wierder?', en: 'How do you learn new words?' },
      ],
      answer:
        'Ech léieren Lëtzebuergesch, well ech hei wunnen an d’Sprooch am Alldag benotze wëll. Ech üben e bëssen all Dag.',
      phrases: ['eng Sprooch léieren', 'nei Wierder', 'am Alldag', 'all Dag üben'],
    },
    {
      title: 'Media and technology',
      luxembourgish: 'Medien an Technik',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Benotzt Dir dacks Ären Handy?', en: 'Do you often use your phone?' },
        { lb: 'Kuckt Dir Neiegkeeten online?', en: 'Do you watch or read news online?' },
        { lb: 'Ass Technik wichteg an Ärem Alldag?', en: 'Is technology important in your daily life?' },
      ],
      answer:
        'Ech benotzen mäin Handy all Dag. Ech liesen Neiegkeeten a schreiwen Messagen. Technik ass praktesch, mee ech maachen och Pausen.',
      phrases: ['mäin Handy', 'online', 'Neiegkeeten', 'eng Paus maachen'],
    },
    {
      title: 'Reading',
      luxembourgish: 'Liesen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Liest Dir gär?', en: 'Do you like reading?' },
        { lb: 'Wat liest Dir normalerweis?', en: 'What do you usually read?' },
        { lb: 'Liest Dir op Lëtzebuergesch?', en: 'Do you read in Luxembourgish?' },
      ],
      answer:
        'Ech liesen heiansdo Artikelen online. Op Lëtzebuergesch liesen ech kuerz Texter, well ech nei Wierder léiere wëll.',
      phrases: ['e Buch', 'en Artikel', 'kuerz Texter', 'nei Wierder léieren'],
    },
    {
      title: 'Gifts and social life',
      luxembourgish: 'Kaddoen a sozialt Liewen',
      context: 'Common preparation theme',
      questions: [
        { lb: 'Wéini gitt Dir engem e Kaddo?', en: 'When do you give someone a gift?' },
        { lb: 'Wat maacht Dir gär mat Frënn?', en: 'What do you like doing with friends?' },
        { lb: 'Feiert Dir gär Gebuertsdeeg?', en: 'Do you like celebrating birthdays?' },
      ],
      answer:
        'Ech ginn e Kaddo fir e Gebuertsdag oder fir Chrëschtdag. Mat Frënn drénken ech gär e Kaffi oder mir iessen zesummen.',
      phrases: ['e Kaddo', 'Gebuertsdag', 'mat Frënn', 'zesummen iessen'],
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest topic practice',
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
      content: 'Luxembourg City view representing Luxembourgish Sproochentest topic practice',
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
        name: 'Sproochentest topics and Luxembourgish speaking questions',
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
