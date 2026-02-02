import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core'; // 改這裡

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }) // 改這裡
  ]
}).catch(err => console.error(err));
