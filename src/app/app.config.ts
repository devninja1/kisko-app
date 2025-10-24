import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { registerLocaleData } from '@angular/common';
import localeIn from '@angular/common/locales/en-IN';
import { LOCALE_ID } from '@angular/core';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

// Register the locale data for 'en-IN'
registerLocaleData(localeIn);

const dbConfig: DBConfig = {
  name: 'KiskoAppDb',
  version: 1,
  objectStoresMeta: [{
    store: 'products',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'name', keypath: 'name', options: { unique: false } }
    ]
  }, {
    store: 'customers',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'name', keypath: 'name', options: { unique: false } }
    ]
  }, {
    store: 'sales',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'date', keypath: 'date', options: { unique: false } },
      { name: 'grandTotal', keypath: 'grandTotal', options: { unique: false } }
    ]
  }, {
    store: 'failed-sync-queue',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: []
  }, {
    store: 'sync-queue',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: []
  }]
};

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), 
    provideHttpClient(withInterceptors([httpErrorInterceptor, loadingInterceptor])),
     importProvidersFrom(NgxIndexedDBModule.forRoot(dbConfig)),
    // Provide the LOCALE_ID for the entire application
    {provide: LOCALE_ID, useValue: 'en-IN'},
  ]
};