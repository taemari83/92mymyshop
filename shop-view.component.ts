import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, CartItem, Order, Member } from '../services/store.service';

@Component({
  selector: 'app-shop-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <!-- Shop Header -->
      <div class="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🛍️</span>
            <h1 class="text-xl font-bold text-gray-900 hidden sm:block">92mymy 就愛買買</h1>
          </div>
          
          <div class="flex-1 max-w-lg mx-4">
             <input type="text" [formControl]="searchControl" placeholder="搜尋商品..." 
               class="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition">
          </div>

          <div class="flex items-center gap-1">
            <button (click)="openMember()" class="p-2 text-gray-600 hover:text-pink-600 transition flex items-center gap-1">
              <span class="text-2xl">👤</span>
              @if (currentUser()) {
                <span class="text-xs font-medium hidden sm:block text-pink-600">{{ currentUser()?.name }}</span>
              }
            </button>
            <button (click)="openCart()" class="relative p-2 text-gray-600 hover:text-pink-600 transition">
              <span class="text-2xl">🛒</span>
              @if (cartCount() > 0) {
                <span class="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {{ cartCount() }}
                </span>
              }
            </button>
          </div>
        </div>
        
        <!-- Filters (Dropdown) -->
        <div class="max-w-7xl mx-auto px-4 py-3 flex justify-end text-sm border-t border-gray-100 bg-gray-50">
           <div class="flex items-center gap-2">
             <span class="text-gray-600 font-medium">排序方式:</span>
             <select (change)="onSortChange($event)" class="form-select block w-48 rounded-md border-gray-300 shadow-sm border p-1.5 text-gray-700 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50">
               <option value="popular">熱銷排行</option>
               <option value="price_asc">價格 (低到高)</option>
               <option value="price_desc">價格 (高到低)</option>
               <option value="date_desc">上架時間 (新到舊)</option>
               <option value="date_asc">上架時間 (舊到新)</option>
             </select>
           </div>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (product of filteredProducts(); track product.id) {
          <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col group">
            <div class="aspect-square bg-gray-200 relative overflow-hidden">
               <img [src]="product.image" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="text-lg font-medium text-gray-900 line-clamp-2">{{ product.name }}</h3>
              <div class="text-sm text-gray-500 mt-1 mb-2">{{ product.country }}</div>
              
              <div class="mt-auto">
                 <div class="flex justify-between items-baseline mb-3">
                   <span class="text-xl font-bold text-pink-600">\${{ product.price }}</span>
                   <!-- Sold count removed as requested -->
                 </div>
                 
                 <!-- Selection & Add -->
                 <div class="space-y-3">
                    <select #optSelect class="block w-full text-sm border-gray-300 rounded-md shadow-sm border p-2 bg-gray-50 focus:ring-pink-500 focus:border-pink-500">
                       @for (opt of product.options; track opt) {
                         <option [value]="opt">{{ opt }}</option>
                       }
                    </select>
                    
                    <div class="flex gap-2">
                       <div class="flex items-center border border-gray-300 rounded-md bg-white">
                          <button (click)="decrementQty(product.id)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l">-</button>
                          <span class="px-2 text-sm font-medium w-8 text-center">{{ getDraftQty(product.id) }}</span>
                          <button (click)="incrementQty(product.id)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r">+</button>
                       </div>
                       <button (click)="addToCart(product, optSelect.value)" 
                         class="flex-1 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition py-2">
                         加入購物車
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Member Modal -->
      @if (isMemberModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/50 transition-opacity" (click)="closeMember()"></div>
          
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
             <div class="bg-gray-900 p-4 text-white flex justify-between items-center">
               <h2 class="text-lg font-bold">會員中心</h2>
               <button (click)="closeMember()" class="text-gray-300 hover:text-white text-2xl">&times;</button>
             </div>
             
             <div class="p-6 overflow-y-auto">
               <!-- Login Mode -->
               @if (!currentUser() && memberMode() === 'login') {
                 <div class="text-center">
                   <div class="text-6xl mb-4">👤</div>
                   <h3 class="text-xl font-bold text-gray-800 mb-6">會員登入 / 註冊</h3>
                   
                   <div class="space-y-4">
                      <!-- LINE Login Button (Primary) -->
                      <button (click)="handleInitialLineLogin()" class="w-full bg-[#06C755] text-white py-3 rounded-lg font-bold hover:bg-[#05b64d] transition flex items-center justify-center gap-2 shadow-sm">
                        <span class="text-xl">💬</span>
                        <span>LINE 登入</span>
                      </button>

                      <div class="relative flex py-2 items-center">
                        <div class="flex-grow border-t border-gray-300"></div>
                        <span class="flex-shrink-0 mx-4 text-gray-400 text-sm">或使用手機號碼</span>
                        <div class="flex-grow border-t border-gray-300"></div>
                      </div>

                     <input type="tel" [formControl]="loginPhoneControl" placeholder="請輸入手機號碼" 
                       class="w-full border-gray-300 rounded-lg shadow-sm border p-3 text-center text-lg">
                     
                     <button (click)="handleLogin()" class="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition">
                       下一步
                     </button>
                   </div>
                 </div>
               }

               <!-- Register Mode -->
               @if (!currentUser() && memberMode() === 'register') {
                 <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">新會員註冊</h3>
                    @if (pendingLineId()) {
                      <div class="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm">
                        <span class="font-bold">✓ 已驗證 LINE 帳號</span><br>
                        請填寫基本資料以完成綁定
                      </div>
                    }
                    <div class="space-y-4">
                      <div>
                        <label class="block text-left text-sm font-medium text-gray-700 mb-1">姓名</label>
                        <input type="text" [formControl]="registerNameControl" placeholder="請輸入您的姓名" 
                          class="w-full border-gray-300 rounded-lg shadow-sm border p-3 text-lg">
                      </div>

                      <div>
                        <label class="block text-left text-sm font-medium text-gray-700 mb-1">手機號碼</label>
                        <input type="tel" [formControl]="loginPhoneControl" placeholder="請輸入手機號碼" 
                          class="w-full border-gray-300 rounded-lg shadow-sm border p-3 text-lg">
                      </div>
                      
                      <button (click)="handleRegister()" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition mt-4">
                        完成註冊
                      </button>
                      <button (click)="memberMode.set('login')" class="text-gray-500 underline text-sm">返回登入</button>
                    </div>
                 </div>
               }

               <!-- Profile Mode -->
               @if (currentUser()) {
                 <div class="space-y-6">
                    <!-- User Info Card -->
                    <div class="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                       <div class="relative z-10">
                          <p class="text-pink-100 text-sm mb-1">Welcome back,</p>
                          <h3 class="text-2xl font-bold mb-4">{{ currentUser()?.name }}</h3>
                          <div class="flex justify-between items-end">
                             <div>
                               <p class="text-pink-100 text-xs">會員電話</p>
                               <p class="font-mono">{{ currentUser()?.phone }}</p>
                               
                               @if (currentUser()?.lineId) {
                                 <div class="mt-3 pt-2 border-t border-white/20">
                                   <p class="text-pink-100 text-xs">已綁定 LINE 帳號</p>
                                   <p class="font-mono text-sm flex items-center gap-1">
                                     <span class="text-base">💬</span> {{ currentUser()?.lineId }}
                                   </p>
                                 </div>
                               }
                             </div>
                             <div class="text-right">
                               <p class="text-pink-100 text-xs">累積消費金額</p>
                               <p class="text-2xl font-bold">\${{ myTotalSpent() | number }}</p>
                             </div>
                          </div>
                       </div>
                       <!-- Decor -->
                       <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                    </div>

                    <!-- Order History -->
                    <div>
                      <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📦</span> 我的訂單與貨態
                      </h4>
                      @if (myOrders().length === 0) {
                        <p class="text-gray-500 text-center py-4 bg-gray-50 rounded">尚未有訂單記錄</p>
                      } @else {
                        <div class="space-y-3">
                           @for (order of myOrders(); track order.id) {
                             <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition">
                                <div class="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                                   <div>
                                      <span class="text-xs text-gray-400">#{{ order.id.substring(0,8) }}</span>
                                      <div class="text-xs text-gray-500">{{ order.createdAt | date:'yyyy/MM/dd' }}</div>
                                   </div>
                                   <div class="text-right">
                                      @if (order.status === 'pending_check') {
                                        <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">待對帳</span>
                                      } @else if (order.status === 'paid') {
                                        <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">已對帳 / 備貨中</span>
                                      } @else if (order.status === 'shipped') {
                                        <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">已出貨</span>
                                      }
                                   </div>
                                </div>
                                <div class="text-sm text-gray-700">
                                   <div class="line-clamp-1 text-gray-900 font-medium">
                                      {{ order.items[0].productName }} 
                                      @if (order.items.length > 1) { <span>...等 {{ order.items.length }} 項</span> }
                                   </div>
                                   <div class="flex justify-between mt-1 text-gray-500 text-xs">
                                     <span>總金額: \${{ order.finalAmount }}</span>
                                   </div>
                                </div>
                             </div>
                           }
                        </div>
                      }
                    </div>

                    <button (click)="logout()" class="w-full border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-50 transition text-sm">
                      登出會員
                    </button>
                 </div>
               }
             </div>
          </div>
        </div>
      }

      <!-- Shopping Cart Modal -->
      @if (isCartOpen()) {
        <div class="fixed inset-0 z-50 flex justify-end">
          <div class="fixed inset-0 bg-black/50 transition-opacity" (click)="closeCart()"></div>
          
          <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-slide-in">
             <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
               <h2 class="text-lg font-bold text-gray-900">您的購物車 ({{ cartCount() }})</h2>
               <button (click)="closeCart()" class="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
             </div>

             <div class="flex-1 overflow-y-auto p-4 space-y-4">
               @if (cart().length === 0) {
                 <div class="text-center py-20 text-gray-500">
                    <p class="text-4xl mb-2">🛒</p>
                    <p>購物車是空的</p>
                    <button (click)="closeCart()" class="mt-4 text-pink-600 font-medium hover:underline">去逛逛</button>
                 </div>
               } @else {
                  @for (item of cart(); track item.productId + item.option) {
                    <div class="flex gap-4 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                       <img [src]="item.image" class="w-20 h-20 object-cover rounded bg-gray-100">
                       <div class="flex-1">
                          <h4 class="font-medium text-gray-900 line-clamp-1">{{ item.productName }}</h4>
                          <p class="text-sm text-gray-500">{{ item.option }}</p>
                          <div class="flex justify-between items-center mt-2">
                             <div class="font-bold text-gray-900">\${{ item.price }}</div>
                             <div class="flex items-center gap-3">
                                <button (click)="updateCartQty(item, -1)" class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">-</button>
                                <span class="text-sm">{{ item.qty }}</span>
                                <button (click)="updateCartQty(item, 1)" class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">+</button>
                             </div>
                          </div>
                       </div>
                       <button (click)="removeCartItem(item)" class="text-gray-400 hover:text-red-500 self-start">&times;</button>
                    </div>
                  }
               }
             </div>
             
             <!-- Checkout Footer in Cart -->
             @if (cart().length > 0) {
               <div class="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>商品總金額</span>
                    <span>\${{ cartTotal() }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-green-600">
                    <span>賣貨便預扣金額</span>
                    <span>-$20</span>
                  </div>
                  <div class="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>應付金額</span>
                    <span>\${{ finalTotal() }}</span>
                  </div>
                  <button (click)="initCheckout()" class="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 shadow-lg transition transform active:scale-95">
                    前往結帳
                  </button>
               </div>
             }
          </div>
        </div>
      }

      <!-- Checkout Form Overlay (Fullscreen) -->
      @if (step() === 'checkout') {
        <div class="fixed inset-0 bg-white z-[60] overflow-y-auto">
          <div class="max-w-2xl mx-auto p-6">
            <button (click)="step.set('shop')" class="mb-6 flex items-center text-gray-600 hover:text-gray-900">
              <span class="mr-2">←</span> 返回購物
            </button>
            
            <h2 class="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b">結帳資訊填寫</h2>
            
            <form [formGroup]="checkoutForm" (ngSubmit)="submitOrder()" class="space-y-8">
              
              <!-- Payment Info -->
              <section class="bg-blue-50 p-6 rounded-lg border border-blue-100">
                 <h3 class="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                   <span>1.</span> 匯款資訊
                 </h3>
                 <div class="mb-4 bg-white p-4 rounded border border-blue-100 text-sm text-gray-700">
                    <p class="font-bold mb-1">匯款銀行: 822 中國信託</p>
                    <p class="font-bold mb-3">帳號: 123-456-789012</p>
                    <p class="text-red-600 font-bold text-lg">應匯金額: \${{ finalTotal() }}</p>
                    <p class="text-xs text-gray-500 mt-1">(商品總額 \${{ cartTotal() }} - 優惠 $20)</p>
                 </div>

                 <!-- Official Line Link -->
                 <div class="mb-6">
                   <a href="https://lin.ee/cw03qEj" target="_blank" class="flex items-center justify-center gap-2 w-full bg-[#06C755] text-white py-3 rounded-md font-bold hover:bg-[#05b64d] transition shadow-md">
                     <span class="text-2xl">💬</span>
                     <span>訂單有問題請與官方聯絡 (LINE)</span>
                   </a>
                 </div>

                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">匯款人姓名</label>
                      <input type="text" formControlName="customerName" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                      @if (checkoutForm.get('customerName')?.touched && checkoutForm.get('customerName')?.invalid) {
                        <p class="text-red-500 text-xs mt-1">必填</p>
                      }
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">匯款時間 (填寫範例: 10/25 14:30)</label>
                      <input type="text" formControlName="paymentTime" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                   </div>
                   <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">帳號後五碼</label>
                      <input type="text" formControlName="paymentLast5" maxlength="5" class="w-full border-gray-300 rounded-md shadow-sm border p-2" placeholder="12345">
                   </div>
                 </div>
              </section>

              <!-- Shipping Info -->
              <section class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   <span>2.</span> 寄件資訊 (7-11 賣貨便)
                 </h3>
                 
                 <div class="space-y-4">
                   <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">收件人真實姓名</label>
                      <input type="text" formControlName="shippingName" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">手機號碼 (將自動連結會員資料)</label>
                      <input type="tel" formControlName="shippingPhone" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">收件門市名稱 (例如: 公館門市)</label>
                      <input type="text" formControlName="shippingStore" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                   </div>
                 </div>
              </section>

              <button type="submit" [disabled]="checkoutForm.invalid" 
                class="w-full bg-gray-900 text-white py-4 rounded-lg text-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl">
                提交訂單 & 完成通知
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Order Success View -->
      @if (step() === 'success') {
        <div class="fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center p-6 text-center">
           <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6">
             ✓
           </div>
           <h2 class="text-3xl font-bold text-gray-900 mb-2">訂單提交成功！</h2>
           <p class="text-gray-600 mb-8 max-w-md">
             我們已收到您的匯款回報資訊。待後台確認對帳成功後 (約1-2個工作天)，您會收到對帳成功通知，我們將盡快安排出貨。
             <br><br>
             您可以至會員中心追蹤訂單狀態。
           </p>
           <button (click)="resetShop()" class="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition">
             回到首頁
           </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
    @keyframes pop-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-pop-in {
      animation: pop-in 0.2s ease-out;
    }
  `]
})
export class ShopViewComponent {
  store = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  
  // State
  searchControl = this.fb.control('');
  
  // Member State
  isMemberModalOpen = signal(false);
  memberMode = signal<'login' | 'register'>('login');
  loginPhoneControl = this.fb.control('', Validators.required);
  registerNameControl = this.fb.control('', Validators.required);
  
  // Line Login State
  pendingLineId = signal<string>('');
  
  currentUser = signal<Member | null>(null);

  // Sorting
  sortBy = signal<'popular' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'>('popular');
  
  cart = signal<CartItem[]>([]);
  isCartOpen = signal(false);
  step = signal<'shop' | 'checkout' | 'success'>('shop');
  draftQtys = signal<Map<string, number>>(new Map());

  checkoutForm: FormGroup;

  constructor() {
    this.checkoutForm = this.fb.group({
      customerName: ['', Validators.required],
      paymentTime: ['', Validators.required],
      paymentLast5: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]],
      shippingName: ['', Validators.required],
      shippingPhone: ['', Validators.required],
      shippingStore: ['', Validators.required]
    });
  }

  // Computed
  filteredProducts = computed(() => {
    let list = [...this.store.products()];
    const term = this.searchControl.value?.toLowerCase() || '';
    
    // Filter
    if (term) {
      list = list.filter(p => p.name.toLowerCase().includes(term));
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'popular') {
      list.sort((a, b) => b.sold - a.sold);
    } else if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'date_desc') {
      // Newest first (ID descenting assuming numeric IDs or timestamp IDs)
      list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    } else if (sort === 'date_asc') {
      // Oldest first
      list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    }

    return list;
  });

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.qty, 0));
  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.price * item.qty), 0));
  finalTotal = computed(() => Math.max(0, this.cartTotal() - 20));
  
  // Member Computeds
  myOrders = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.store.orders()
      .filter(o => o.shippingPhone === user.phone)
      .sort((a, b) => b.createdAt - a.createdAt);
  });

  myTotalSpent = computed(() => {
    return this.myOrders()
      .filter(o => o.status === 'paid' || o.status === 'shipped')
      .reduce((acc, curr) => acc + curr.finalAmount, 0);
  });

  // Methods
  onSortChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as any);
  }

  // --- Cart & Shop Methods ---
  getDraftQty(productId: string): number {
    return this.draftQtys().get(productId) || 1;
  }

  incrementQty(productId: string) {
    const map = new Map(this.draftQtys());
    const current = map.get(productId) || 1;
    map.set(productId, current + 1);
    this.draftQtys.set(map);
  }

  decrementQty(productId: string) {
    const map = new Map(this.draftQtys());
    const current = map.get(productId) || 1;
    if (current > 1) {
      map.set(productId, current - 1);
      this.draftQtys.set(map);
    }
  }

  addToCart(product: Product, option: string) {
    const qty = this.getDraftQty(product.id);
    this.cart.update(current => {
      const existing = current.find(i => i.productId === product.id && i.option === option);
      if (existing) {
        return current.map(i => i === existing ? { ...i, qty: i.qty + qty } : i);
      }
      return [...current, {
        productId: product.id,
        productName: product.name,
        image: product.image,
        option,
        price: product.price,
        qty
      }];
    });
    
    // Reset draft qty
    const map = new Map(this.draftQtys());
    map.set(product.id, 1);
    this.draftQtys.set(map);

    this.openCart();
  }

  updateCartQty(item: CartItem, delta: number) {
    this.cart.update(current => {
      return current.map(i => {
        if (i === item) {
          const newQty = Math.max(1, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      });
    });
  }

  removeCartItem(item: CartItem) {
    this.cart.update(current => current.filter(i => i !== item));
  }

  openCart() { this.isCartOpen.set(true); }
  closeCart() { this.isCartOpen.set(false); }
  
  // Member Methods
  openMember() { 
    this.isMemberModalOpen.set(true); 
    if (!this.currentUser()) {
      this.memberMode.set('login');
      this.loginPhoneControl.reset();
      this.registerNameControl.reset();
      this.pendingLineId.set('');
    }
  }
  closeMember() { this.isMemberModalOpen.set(false); }

  handleInitialLineLogin() {
    // Simulate Line Login Flow
    // 1. Authenticate with Line (Mock)
    const mockLineId = 'LINE_' + Date.now();
    
    // 2. Check if member exists
    const existingMember = this.store.members().find(m => m.lineId === mockLineId); // Note: store.members() needs to be up to date
    
    // Note: Since we are using mock data, and I just generated a random ID, it won't be found unless we hardcode one or previously registered.
    // For demo, we assume first time = register.
    
    if (existingMember) {
      this.currentUser.set(existingMember);
      this.memberMode.set('login');
    } else {
      // 3. Not found, go to register
      this.pendingLineId.set(mockLineId);
      this.memberMode.set('register');
    }
  }

  handleLogin() {
    if (this.loginPhoneControl.invalid || !this.loginPhoneControl.value) return;
    const phone = this.loginPhoneControl.value;
    
    // Find member by Phone
    const existingMember = this.store.members().find(m => m.phone === phone);
    
    if (existingMember) {
      this.currentUser.set(existingMember);
      this.memberMode.set('login'); // Reset
    } else {
      // Go to register
      this.memberMode.set('register');
      // No LINE ID pending if they came from phone login
      this.pendingLineId.set('');
    }
  }

  handleRegister() {
    if (this.registerNameControl.invalid || !this.registerNameControl.value) return;
    if (this.loginPhoneControl.invalid || !this.loginPhoneControl.value) return; // Phone is required

    const name = this.registerNameControl.value;
    const phone = this.loginPhoneControl.value;
    const lineId = this.pendingLineId();

    if (phone) {
       this.store.registerMember(name, phone, lineId);
       // Auto login
       const newMember = this.store.members().find(m => m.phone === phone);
       if (newMember) this.currentUser.set(newMember);
    }
  }

  logout() {
    this.currentUser.set(null);
    this.memberMode.set('login');
  }

  initCheckout() {
    this.step.set('checkout');
    // Pre-fill if logged in
    const user = this.currentUser();
    if (user) {
      this.checkoutForm.patchValue({
        customerName: user.name,
        shippingName: user.name,
        shippingPhone: user.phone
      });
    }
  }

  submitOrder() {
    if (this.checkoutForm.invalid) return;
    
    const val = this.checkoutForm.value;
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...this.cart()],
      subtotal: this.cartTotal(),
      discount: 20,
      finalAmount: this.finalTotal(),
      customerName: val.customerName,
      paymentTime: val.paymentTime,
      paymentLast5: val.paymentLast5,
      shippingName: val.shippingName,
      shippingPhone: val.shippingPhone,
      shippingStore: val.shippingStore,
      status: 'pending_check',
      createdAt: Date.now()
    };

    this.store.createOrder(newOrder);
    this.cart.set([]);
    this.step.set('success');
  }

  resetShop() {
    this.step.set('shop');
    this.isCartOpen.set(false);
    this.checkoutForm.reset();
  }
}