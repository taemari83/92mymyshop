import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from './services/store.service';
import { ShopFrontComponent } from './components/shop-front.component';
import { CartComponent } from './components/cart.component';
import { MemberAreaComponent } from './components/member-area.component';
import { AdminPanelComponent } from './components/admin-panel.component';

type View = 'shop' | 'cart' | 'member' | 'admin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ShopFrontComponent, CartComponent, MemberAreaComponent, AdminPanelComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-cream-50 font-sans selection:bg-brand-200">
      <!-- Navbar (Clean & Minimal) -->
      <nav class="bg-cream-50/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-brand-100/50">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            
            <!-- Logo -->
            <button (click)="view.set('shop')" class="text-left group">
              <h1 class="text-xl font-black text-brand-900 tracking-tighter leading-none group-hover:opacity-70 transition-opacity">92mymy<br>就愛買買</h1>
            </button>

            <!-- Nav Text Links -->
            <div class="flex items-center gap-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
              <button 
                (click)="view.set('shop')" 
                class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50"
                [class.bg-brand-900]="view() === 'shop'"
                [class.text-white]="view() === 'shop'"
                [class.text-brand-900]="view() !== 'shop'"
              >
                首頁
              </button>
              
              <button 
                (click)="view.set('member')" 
                class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 relative"
                [class.bg-brand-900]="view() === 'member'"
                [class.text-white]="view() === 'member'"
                [class.text-brand-900]="view() !== 'member'"
              >
                會員
                @if(store.currentUser()) {
                  <span class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-white"></span>
                }
              </button>

              @if (store.currentUser()?.isAdmin) {
                 <button 
                  (click)="view.set('admin')" 
                  class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50"
                  [class.bg-brand-900]="view() === 'admin'"
                  [class.text-white]="view() === 'admin'"
                  [class.text-brand-900]="view() !== 'admin'"
                >
                  後台
                </button>
              }
            </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-4">
        @switch (view()) {
          @case ('shop') {
            <app-shop-front />
          }
          @case ('cart') {
            <app-cart (goShop)="view.set('shop')" (finished)="view.set('member')" />
          }
          @case ('member') {
            <app-member-area (goShop)="view.set('shop')" />
          }
          @case ('admin') {
            <app-admin-panel />
          }
        }
      </main>

      <!-- Floating Cart Button (SVG Icon) -->
      @if (view() === 'shop') {
        <button 
          (click)="view.set('cart')"
          class="fixed bottom-8 right-6 bg-brand-900 text-white rounded-full shadow-2xl flex items-center gap-3 px-6 py-4 hover:scale-105 active:scale-95 transition-all z-50 group"
        >
          <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          @if (store.cartCount() > 0) {
             <span class="font-bold border-l border-white/20 pl-3">
               {{ store.cartCount() }}
             </span>
          }
        </button>
      }

    </div>
  `
})
export class AppComponent {
  store = inject(StoreService);
  view = signal<View>('shop');
}