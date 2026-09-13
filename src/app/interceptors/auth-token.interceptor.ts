import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api/api-url';

const tokenStorageKey = 'sproochen.authToken';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = getToken();
  const isApiRequest =
    request.url.startsWith(API_BASE_URL) || request.url.startsWith('/api');

  if (!isApiRequest) {
    return next(request);
  }

  const headers =
    token && !request.headers.has('Authorization')
      ? { Authorization: `Bearer ${normalizeToken(token)}` }
      : undefined;

  return next(request.clone({ setHeaders: headers, withCredentials: true }));
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
