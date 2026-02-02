import 'zone.js';  // <--- 加入這一行 (非常重要！)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideZoneChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
}).catch(err => console.error(err));
