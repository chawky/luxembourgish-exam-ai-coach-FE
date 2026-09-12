import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheRegistryService {
  private readonly clearers = new Set<() => void>();

  register(clearCache: () => void): void {
    this.clearers.add(clearCache);
  }

  clearUserScopedCaches(): void {
    [...this.clearers].forEach((clearCache) => clearCache());
  }
}
