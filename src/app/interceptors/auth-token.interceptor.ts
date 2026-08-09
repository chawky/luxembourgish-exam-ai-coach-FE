import { HttpInterceptorFn } from '@angular/common/http';

const apiBaseUrl = 'http://localhost:8080/api';
const tokenStorageKey = 'sproochen.authToken';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = getToken();
  const isApiRequest =
    request.url.startsWith(apiBaseUrl) || request.url.startsWith('/api');

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
