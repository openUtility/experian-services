import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { ExperianServiceConfig, OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK } from '@openutility/experian-angular-services';
import { provideHttpClient } from '@angular/common/http';

const _Token: ExperianServiceConfig = {
  token: '{TOKEN}',
}

export const appConfig: ApplicationConfig = {
  providers: [
  
    { provide: OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, useValue: _Token },
    provideRouter(routes),
    provideHttpClient(),
  ]
};
