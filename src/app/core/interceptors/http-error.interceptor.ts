import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';
      if (error.error instanceof ErrorEvent) {
        // A client-side or network error occurred.
        errorMessage = `An error occurred: ${error.error.message}`;
      } else {
        // The backend returned an unsuccessful response code.
        errorMessage = `Server returned code ${error.status}, error message is: ${error.message}`;
      }

      snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['warn-snackbar'] // Optional: for custom styling
      });

      return throwError(() => error);
    })
  );
};