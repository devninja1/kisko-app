import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Don't show loader for assets
  if (req.url.includes('/assets/')) return next(req);

  loadingService.show();
  return next(req).pipe(finalize(() => loadingService.hide()));
};