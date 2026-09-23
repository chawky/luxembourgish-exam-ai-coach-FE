import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { GoogleSignInService } from '../services/google-sign-in.service';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  template: `
    @if (configured) {
      <div #buttonHost class="google-button-host"></div>
      @if (errorMsg()) {
        <p class="google-button-error">{{ errorMsg() }}</p>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
      }

      .google-button-host {
        display: block;
        max-width: 100%;
        width: 100%;
        min-height: 44px;
      }

      .google-button-error {
        color: var(--slate-500);
        font-size: 13px;
        margin: 8px 0 0;
        text-align: center;
      }
    `,
  ],
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  private googleSignIn = inject(GoogleSignInService);
  private zone = inject(NgZone);

  @Input() text: GoogleButtonText = 'continue_with';
  @Input() unavailableMessage =
    'Google sign-in is not available right now. Try again later.';
  @Output() credential = new EventEmitter<string>();
  @ViewChild('buttonHost') private buttonHost?: ElementRef<HTMLElement>;

  readonly configured = this.googleSignIn.isConfigured;
  readonly errorMsg = signal('');

  ngAfterViewInit(): void {
    const host = this.buttonHost?.nativeElement;
    if (!this.configured || !host) {
      return;
    }

    this.googleSignIn
      .renderButton(
        host,
        (idToken) => {
          this.zone.run(() => this.credential.emit(idToken));
        },
        this.text,
        Math.min(Math.floor(host.getBoundingClientRect().width), 400) || 400,
      )
      .catch(() => {
        this.zone.run(() => {
          this.errorMsg.set(this.unavailableMessage);
        });
      });
  }
}
