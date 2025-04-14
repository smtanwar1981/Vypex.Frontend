import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import en from '@angular/common/locales/en';
import zh from '@angular/common/locales/zh';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NZ_I18N, en_US, provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { routes } from './app.routes';
import { NzMessageService } from 'ng-zorro-antd/message';
import { VypexHttpInterceptor } from './core/vypex-http-interceptor';


const CURRENT_LOCALE = 'en'; // Or 'zh'

// Register Angular locale data
if (CURRENT_LOCALE === 'en') {
  registerLocaleData(en);
} else if (CURRENT_LOCALE === 'zh') {
  registerLocaleData(zh);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([VypexHttpInterceptor])),
    provideNzI18n(CURRENT_LOCALE === 'en' ? en_US : zh_CN),
    { provide: NZ_I18N, useValue: CURRENT_LOCALE === 'en' ? en_US : zh_CN },
    provideAnimationsAsync(),
    NzMessageService
  ]
};
