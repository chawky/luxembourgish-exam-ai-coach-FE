import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api/api-url';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest =
    request.url.startsWith(API_BASE_URL) || request.url.startsWith('/api');

  if (!isApiRequest) {
    return next(request);
  }

  return next(request.clone({ withCredentials: true }));
};
