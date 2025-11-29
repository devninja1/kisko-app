import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeIn from '@angular/common/locales/en-IN';
import { LOCALE_ID } from '@angular/core';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from './core/services/environment';

// Register the locale data for 'en-IN'
registerLocaleData(localeIn);

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), 
    provideHttpClient(withInterceptors([httpErrorInterceptor, loadingInterceptor])),
    provideFirebaseApp(() => initializeApp(validateFirebaseConfig(environment.firebase))),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    // Provide the LOCALE_ID for the entire application
    {provide: LOCALE_ID, useValue: 'en-IN'},
  ]
};

function validateFirebaseConfig(cfg: any) {
  if (!cfg || !cfg.apiKey) {
    console.error('Firebase configuration missing or invalid', cfg);
    throw new Error('Missing Firebase configuration. Check src/app/core/services/environment.ts');
  }
  return cfg;
}