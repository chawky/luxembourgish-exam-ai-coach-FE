import { Component, OnInit, inject } from '@angular/core';
import {
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly chunkReloadKey = 'sproochen.chunkReloaded';

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        sessionStorage.removeItem(this.chunkReloadKey);
        return;
      }

      if (
        event instanceof NavigationError &&
        this.isChunkLoadError(event.error) &&
        !sessionStorage.getItem(this.chunkReloadKey)
      ) {
        sessionStorage.setItem(this.chunkReloadKey, 'true');
        window.location.reload();
      }
    });
  }

  private isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);

    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      message.includes('Importing a module script failed')
    );
  }
}
