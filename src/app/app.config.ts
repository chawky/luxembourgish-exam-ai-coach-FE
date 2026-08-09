import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { authTokenInterceptor } from './interceptors/auth-token.interceptor';

function initializeAuth(auth: AuthService): () => Promise<void> {
  return () => auth.initializeSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
  ],
};
