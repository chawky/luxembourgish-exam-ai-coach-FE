import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="audio-player" [class.is-loading]="loading()" [class.is-playing]="playing()">
      <div class="audio-top">
        <button
          type="button"
          class="play-btn"
          [disabled]="!ready() || !!error()"
          (click)="togglePlay()"
          [attr.aria-label]="playing() ? 'Pause audio' : 'Play audio'"
        >
          @if (loading()) {
            <app-icon class="inline-loading-icon" name="sparkles" [size]="22"></app-icon>
          } @else {
            <app-icon [name]="playing() ? 'pause' : 'play'" [size]="22"></app-icon>
          }
        </button>

        <div class="audio-copy">
          <strong>{{ title }}</strong>
          <span class="text-muted">{{ statusText() }}</span>
        </div>

        <span class="audio-time">{{ progressLabel() }}</span>
      </div>

      <div class="waveform-shell">
        <div
          #waveform
          class="waveform"
          aria-label="Audio waveform. Click or drag to seek."
        ></div>
      </div>

      <div class="audio-actions">
        <button type="button" (click)="restart()" [disabled]="!ready()">Start</button>
        <button type="button" (click)="skip(-skipSeconds)" [disabled]="!ready()">
          -{{ skipSeconds }} sec
        </button>
        <button type="button" (click)="skip(skipSeconds)" [disabled]="!ready()">
          +{{ skipSeconds }} sec
        </button>
      </div>

      @if (error()) {
        <div class="audio-error" role="alert">{{ error() }}</div>
      }
    </div>
  `,
  styleUrl: './audio-player.component.css',
})
export class AudioPlayerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() src = '';
  @Input() title = 'Audio';
  @Input() subtitle = 'Click or drag the waveform to seek.';
  @Input() skipSeconds = 5;

  @ViewChild('waveform', { static: true })
  private waveform?: ElementRef<HTMLDivElement>;

  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private waveSurfer: WaveSurfer | null = null;
  private viewReady = false;

  loading = signal(false);
  ready = signal(false);
  playing = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  error = signal('');

  progressLabel = computed(
    () => `${this.formatTime(this.currentTime())} / ${this.formatTime(this.duration())}`,
  );

  statusText = computed(() => {
    if (this.error()) {
      return 'Audio is unavailable.';
    }

    if (this.loading()) {
      return 'Loading audio...';
    }

    return this.subtitle;
  });

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && this.viewReady) {
      this.loadSource();
    }
  }

  togglePlay(): void {
    if (!this.waveSurfer || !this.ready()) {
      return;
    }

    void this.waveSurfer.playPause().catch(() => {
      this.zone.run(() => {
        this.playing.set(false);
        this.error.set('Could not play this audio.');
      });
    });
  }

  restart(): void {
    if (!this.waveSurfer || !this.ready()) {
      return;
    }

    this.waveSurfer.setTime(0);
    this.currentTime.set(0);
  }

  skip(seconds: number): void {
    if (!this.waveSurfer || !this.ready()) {
      return;
    }

    const nextTime = Math.min(
      Math.max(this.currentTime() + seconds, 0),
      this.duration(),
    );

    this.waveSurfer.setTime(nextTime);
    this.currentTime.set(nextTime);
  }

  pause(): void {
    this.waveSurfer?.pause();
  }

  private loadSource(): void {
    this.destroyWaveSurfer();
    this.resetState();

    if (!this.src || !this.waveform) {
      return;
    }

    const container = this.waveform.nativeElement;
    container.replaceChildren();
    this.loading.set(true);

    const waveSurfer = WaveSurfer.create({
      container,
      url: this.src,
      height: 58,
      waveColor: this.cssVar('--slate-300', '#536178'),
      progressColor: this.cssVar('--blue-700', '#5aa2ff'),
      cursorColor: this.cssVar('--ink', '#e8eef7'),
      cursorWidth: 2,
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      barMinHeight: 3,
      normalize: true,
      dragToSeek: true,
      interact: true,
    });

    this.waveSurfer = waveSurfer;

    waveSurfer.on('ready', (duration) => {
      this.zone.run(() => {
        this.duration.set(duration);
        this.loading.set(false);
        this.ready.set(true);
      });
    });
    waveSurfer.on('play', () => this.zone.run(() => this.playing.set(true)));
    waveSurfer.on('pause', () => this.zone.run(() => this.playing.set(false)));
    waveSurfer.on('finish', () => {
      this.zone.run(() => {
        this.playing.set(false);
        this.currentTime.set(this.duration());
      });
    });
    waveSurfer.on('timeupdate', (currentTime) => {
      this.zone.run(() => this.currentTime.set(currentTime));
    });
    waveSurfer.on('seeking', (currentTime) => {
      this.zone.run(() => this.currentTime.set(currentTime));
    });
    waveSurfer.on('interaction', (currentTime) => {
      this.zone.run(() => this.currentTime.set(currentTime));
    });
    waveSurfer.on('error', () => {
      this.zone.run(() => {
        this.loading.set(false);
        this.ready.set(false);
        this.playing.set(false);
        this.error.set('Could not load this audio. Try generating it again.');
      });
    });
  }

  private resetState(): void {
    this.loading.set(false);
    this.ready.set(false);
    this.playing.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
    this.error.set('');
  }

  private destroyWaveSurfer(): void {
    if (!this.waveSurfer) {
      return;
    }

    this.waveSurfer.destroy();
    this.waveSurfer = null;
  }

  private cssVar(name: string, fallback: string): string {
    return (
      getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim() ||
      fallback
    );
  }

  private formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }

  ngOnDestroy(): void {
    this.destroyWaveSurfer();
  }
}
