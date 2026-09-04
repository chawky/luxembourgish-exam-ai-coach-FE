import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api/api-url';

const tokenStorageKey = 'sproochen.authToken';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = getToken();
  const isApiRequest =
    request.url.startsWith(API_BASE_URL) || request.url.startsWith('/api');

  if (!token || !isApiRequest || request.headers.has('Authorization')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${normalizeToken(token)}`,
      },
    }),
  );
};

function getToken(): string | null {
  return (
    localStorage.getItem(tokenStorageKey) ||
    sessionStorage.getItem(tokenStorageKey)
  );
}

function normalizeToken(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}
