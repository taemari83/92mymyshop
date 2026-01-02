import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { ShopViewComponent } from './components/shop-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AdminDashboardComponent, ShopViewComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  currentView = signal<'shop' | 'admin'>('shop');

  toggleView() {
    this.currentView.update(v => v === 'shop' ? 'admin' : 'shop');
  }
}