import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, Order } from '../services/store.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex h-full flex-col bg-gray-50">
      <!-- Admin Header -->
      <div class="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center">
        <h2 class="text-xl font-bold flex items-center gap-2">
          <span>🛠️</span> 後台管理系統
        </h2>
        <div class="flex gap-2">
          <button (click)="activeTab.set('products')" 
            [class.bg-indigo-700]="activeTab() === 'products'"
            class="px-4 py-2 rounded hover:bg-indigo-700 transition">商品管理</button>
          <button (click)="activeTab.set('accounting')"
            [class.bg-indigo-700]="activeTab() === 'accounting'" 
            class="px-4 py-2 rounded hover:bg-indigo-700 transition">會計報表</button>
          <button (click)="activeTab.set('reconcile')"
            [class.bg-indigo-700]="activeTab() === 'reconcile'" 
            class="px-4 py-2 rounded hover:bg-indigo-700 transition">對帳 & 寄件</button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-auto p-6">
        
        <!-- PRODUCT MANAGEMENT TAB -->
        @if (activeTab() === 'products') {
          <div class="space-y-6">
            <div class="flex justify-between items-center">
              <h3 class="text-2xl font-bold text-gray-800">商品列表</h3>
              <button (click)="openProductForm()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                <span>+</span> 新增商品
              </button>
            </div>

            <!-- Add/Edit Form Overlay -->
            @if (showProductForm()) {
              <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h3 class="text-xl font-bold text-gray-800">{{ isEditing() ? '編輯商品' : '新增商品' }}</h3>
                    <button (click)="closeProductForm()" class="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
                  </div>
                  <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Column 1 -->
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">商品名稱</label>
                        <input type="text" formControlName="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500">
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">圖片</label>
                        <div class="mt-1 flex items-center gap-4">
                          <input type="file" (change)="onFileSelected($event)" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                        </div>
                        @if (currentImagePreview) {
                           <img [src]="currentImagePreview" class="mt-2 h-32 w-32 object-cover rounded border">
                        }
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">選項 - 以逗號分隔</label>
                        <input type="text" formControlName="options" placeholder="紅色, 藍色, 綠色" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">國家</label>
                        <input type="text" formControlName="country" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">購買網址</label>
                        <input type="text" formControlName="purchaseUrl" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                      </div>
                    </div>

                    <!-- Column 2 -->
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">當地售價</label>
                          <input type="number" formControlName="localPrice" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">匯率</label>
                          <input type="number" step="0.001" formControlName="exchangeRate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                        </div>
                      </div>
                      
                      <div class="p-3 bg-gray-50 rounded border text-sm text-gray-600">
                         換算價格: <span class="font-bold text-gray-900">{{ calculateConvertedPrice() | number:'1.0-2' }}</span>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                         <div>
                          <label class="block text-sm font-medium text-gray-700">成本 (換算價格+耗材+包材)</label>
                          <input type="number" formControlName="cost" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">販賣售價</label>
                          <input type="number" formControlName="price" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                        </div>
                      </div>

                      <div>
                         <label class="block text-sm font-medium text-gray-700">庫存數量</label>
                         <input type="number" formControlName="stock" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">備註</label>
                        <textarea formControlName="notes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"></textarea>
                      </div>
                    </div>

                    <div class="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                      <button type="button" (click)="closeProductForm()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">取消</button>
                      <button type="submit" [disabled]="productForm.invalid" class="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400">儲存</button>
                    </div>
                  </form>
                </div>
              </div>
            }

            <!-- Product Table -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">圖片</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名 / 選項</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">國家 / 匯率</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">售價 / 成本</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存 / 已售</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (product of store.products(); track product.id) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-4 whitespace-nowrap">
                          <img [src]="product.image" class="h-12 w-12 rounded object-cover border">
                        </td>
                        <td class="px-4 py-4">
                          <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                          <div class="text-xs text-gray-500 truncate max-w-xs">{{ product.options.join(', ') }}</div>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-500">
                          <div>{{ product.country }}</div>
                          <div class="text-xs">匯率: {{ product.exchangeRate }}</div>
                          <div class="text-xs">當地: {{ product.localPrice }}</div>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-500">
                          <div class="text-indigo-600 font-bold">\${{ product.price }}</div>
                          <div class="text-xs">成本: \${{ product.cost }}</div>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-500">
                           <div [class.text-red-500]="product.stock < 10" class="font-medium">存: {{ product.stock }}</div>
                           <div class="text-xs">售: {{ product.sold }}</div>
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button (click)="editProduct(product)" class="text-indigo-600 hover:text-indigo-900 mr-3">編輯</button>
                          <button (click)="deleteProduct(product.id)" class="text-red-600 hover:text-red-900">刪除</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ACCOUNTING TAB -->
        @if (activeTab() === 'accounting') {
          <div class="space-y-6">
            <h3 class="text-2xl font-bold text-gray-800">會計營收報表</h3>
            <div class="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-emerald-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">商品名</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">國家</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-emerald-800 uppercase">單一營收</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-emerald-800 uppercase">總銷量</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-emerald-800 uppercase">總營收</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-emerald-800 uppercase">淨收益</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (data of store.accountingData(); track data.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ data.name }}</td>
                      <td class="px-4 py-4 text-sm text-gray-500">{{ data.country }}</td>
                      <td class="px-4 py-4 text-sm text-right text-gray-500">\${{ data.price }}</td>
                      <td class="px-4 py-4 text-sm text-right text-gray-900">{{ data.totalSold }}</td>
                      <td class="px-4 py-4 text-sm text-right font-medium text-blue-600">\${{ data.totalRevenue | number }}</td>
                      <td class="px-4 py-4 text-right">
                         <span class="inline-flex px-2 py-1 text-xs font-semibold leading-5 rounded-full"
                          [class.bg-green-100]="data.profit > 0" [class.text-green-800]="data.profit > 0"
                          [class.bg-red-100]="data.profit <= 0" [class.text-red-800]="data.profit <= 0">
                           \${{ data.profit | number:'1.0-0' }}
                         </span>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-gray-50 font-bold">
                   <tr>
                     <td colspan="4" class="px-4 py-3 text-right">總計:</td>
                     <td class="px-4 py-3 text-right text-blue-700">\${{ totalRevenue() | number }}</td>
                     <td class="px-4 py-3 text-right text-green-700">\${{ totalProfit() | number }}</td>
                   </tr>
                </tfoot>
              </table>
            </div>
            <div class="text-sm text-gray-500 italic">
               * 收益計算公式：營收 - (總成本 * 數量)
            </div>
          </div>
        }

        <!-- RECONCILE & SHIPPING TAB -->
        @if (activeTab() === 'reconcile') {
          <div class="space-y-8">
            
            <!-- Reconciliation Section -->
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span> 對帳 (待確認付款)
              </h3>
              <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-amber-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-bold text-amber-800">姓名</th>
                      <th class="px-4 py-3 text-left text-xs font-bold text-amber-800">匯款時間 / 後五碼</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-amber-800">應付金額</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-amber-800">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                     @for (order of pendingOrders(); track order.id) {
                       <tr>
                         <td class="px-4 py-4 text-sm font-medium">{{ order.customerName }}</td>
                         <td class="px-4 py-4 text-sm text-gray-600">
                           <div>{{ order.paymentTime }}</div>
                           <div class="font-mono bg-gray-100 px-1 rounded inline-block">末五碼: {{ order.paymentLast5 }}</div>
                         </td>
                         <td class="px-4 py-4 text-sm text-right font-bold text-red-600">\${{ order.finalAmount }}</td>
                         <td class="px-4 py-4 text-right">
                           <button (click)="store.verifyOrderPayment(order.id)" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 shadow-sm">
                             對帳成功
                           </button>
                         </td>
                       </tr>
                     }
                     @if (pendingOrders().length === 0) {
                       <tr><td colspan="4" class="p-6 text-center text-gray-500">目前沒有待對帳的訂單</td></tr>
                     }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Shipping Section -->
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📦</span> 寄件管理 (已對帳，待出貨)
              </h3>
              <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-purple-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-bold text-purple-800">收件資訊</th>
                      <th class="px-4 py-3 text-left text-xs font-bold text-purple-800">門市</th>
                      <th class="px-4 py-3 text-left text-xs font-bold text-purple-800">訂單內容</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-purple-800">外部連結</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-purple-800">狀態</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                     @for (order of paidOrders(); track order.id) {
                       <tr>
                         <td class="px-4 py-4 text-sm">
                           <div class="font-bold">{{ order.shippingName }}</div>
                           <div class="text-gray-500">{{ order.shippingPhone }}</div>
                         </td>
                         <td class="px-4 py-4 text-sm text-gray-700">{{ order.shippingStore }}</td>
                         <td class="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                           {{ order.items.length }} 項商品 ({{ order.id.substring(0,6) }})
                         </td>
                         <td class="px-4 py-4 text-right">
                           <a href="https://myship.7-11.com.tw/" target="_blank" 
                              class="text-indigo-600 hover:text-indigo-800 underline text-sm flex items-center justify-end gap-1">
                              賣貨便開單 <span class="text-xs">↗</span>
                           </a>
                         </td>
                         <td class="px-4 py-4 text-right">
                           <button (click)="store.shipOrder(order.id)" 
                             class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 shadow-sm">
                             標記已出貨
                           </button>
                         </td>
                       </tr>
                     }
                     @if (paidOrders().length === 0) {
                       <tr><td colspan="5" class="p-6 text-center text-gray-500">目前沒有待出貨的訂單</td></tr>
                     }
                  </tbody>
                </table>
              </div>
            </div>

             <!-- History Section -->
             <div>
              <h3 class="text-xl font-bold text-gray-800 mb-4 opacity-75">📜 歷史訂單 (已出貨)</h3>
              <div class="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                 @for (order of shippedOrders(); track order.id) {
                   <div class="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 text-sm text-gray-600">
                     <span>#{{ order.id.substring(0,8) }} - {{ order.shippingName }}</span>
                     <span>已於 {{ order.shippedAt | date:'MM/dd HH:mm' }} 出貨</span>
                   </div>
                 }
              </div>
             </div>

          </div>
        }

      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  store = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  
  activeTab = signal<'products' | 'accounting' | 'reconcile'>('products');
  showProductForm = signal(false);
  isEditing = signal(false);
  currentImagePreview = '';

  productForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      image: [''],
      options: ['', Validators.required],
      country: ['', Validators.required],
      purchaseUrl: [''],
      localPrice: [0, [Validators.required, Validators.min(0)]],
      exchangeRate: [0.25, [Validators.required, Validators.min(0.0001)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  // --- Computed Helpers ---
  pendingOrders = computed(() => this.store.orders().filter(o => o.status === 'pending_check'));
  paidOrders = computed(() => this.store.orders().filter(o => o.status === 'paid'));
  shippedOrders = computed(() => this.store.orders().filter(o => o.status === 'shipped'));
  
  totalRevenue = computed(() => this.store.accountingData().reduce((acc, curr) => acc + curr.totalRevenue, 0));
  totalProfit = computed(() => this.store.accountingData().reduce((acc, curr) => acc + curr.profit, 0));

  // --- Actions ---
  
  openProductForm() {
    this.isEditing.set(false);
    this.productForm.reset({
      options: '',
      localPrice: 0,
      exchangeRate: 1,
      cost: 0,
      price: 0,
      stock: 0
    });
    this.currentImagePreview = '';
    this.showProductForm.set(true);
  }

  editProduct(product: Product) {
    this.isEditing.set(true);
    this.productForm.patchValue({
      ...product,
      options: product.options.join(', ')
    });
    this.currentImagePreview = product.image;
    this.showProductForm.set(true);
  }

  closeProductForm() {
    this.showProductForm.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentImagePreview = e.target?.result as string;
        this.productForm.patchValue({ image: this.currentImagePreview });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  calculateConvertedPrice(): number {
    const val = this.productForm.value;
    return (val.localPrice || 0) * (val.exchangeRate || 0);
  }

  saveProduct() {
    if (this.productForm.invalid) return;
    const val = this.productForm.value;
    const productData: Product = {
      ...val,
      id: val.id || Date.now().toString(),
      options: val.options.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      image: this.currentImagePreview || 'https://picsum.photos/400/400' // Fallback
    };

    if (this.isEditing()) {
      this.store.updateProduct(productData);
    } else {
      this.store.addProduct(productData);
    }
    this.closeProductForm();
  }

  deleteProduct(id: string) {
    if (confirm('確定要刪除這個商品嗎?')) {
      this.store.deleteProduct(id);
    }
  }
}