import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode: 'popup';
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme: 'outline';
      size: 'large';
      text: GoogleButtonText;
      shape: 'rectangular';
      width: number;
    },
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
    SPROOCHEN_GOOGLE_CLIENT_ID?: string;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleSignInService {
  private scriptPromise?: Promise<void>;

  get isConfigured(): boolean {
    return !!this.clientId;
  }

  renderButton(
    host: HTMLElement,
    onCredential: (idToken: string) => void,
    text: GoogleButtonText = 'continue_with',
  ): Promise<void> {
    if (!this.clientId) {
      return Promise.reject(new Error('Google sign-in is not configured.'));
    }

    return this.loadScript().then(() => {
      const googleSignIn = window.google?.accounts?.id;
      if (!googleSignIn) {
        throw new Error('Google sign-in is not available.');
      }

      host.replaceChildren();
      googleSignIn.initialize({
        client_id: this.clientId,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });
      googleSignIn.renderButton(host, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: 320,
      });
    });
  }

  private get clientId(): string {
    return (
      window.SPROOCHEN_GOOGLE_CLIENT_ID ||
      environment.googleClientId ||
      ''
    ).trim();
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Google sign-in could not be loaded.'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
