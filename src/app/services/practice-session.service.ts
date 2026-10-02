import { Injectable } from '@angular/core';
import { User } from '../models';

export type PracticeFeature =
  | 'SPEAKING'
  | 'LISTENING'
  | 'IMAGE_DESCRIPTION'
  | 'VOCABULARY'
  | 'TOPIC_EXERCISE';

@Injectable({ providedIn: 'root' })
export class PracticeSessionService {
  private readonly prefix = 'sproochen.practice-session.';

  save<T>(feature: PracticeFeature, user: User | null, state: T): void {
    const key = this.key(feature, user);
    if (!key) {
      return;
    }

    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Practice can continue when browser storage is unavailable or full.
    }
  }

  restore<T>(feature: PracticeFeature, user: User | null): T | null {
    const key = this.key(feature, user);
    if (!key) {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : null;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  clear(feature: PracticeFeature, user: User | null): void {
    const key = this.key(feature, user);
    if (key) {
      sessionStorage.removeItem(key);
    }
  }

  clearAll(): void {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  }

  private key(feature: PracticeFeature, user: User | null): string | null {
    const userKey = user?.id ?? user?.email?.trim().toLowerCase();
    return userKey ? `${this.prefix}${userKey}.${feature}` : null;
  }
}
