import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: string; // Internal ID
  code: string; // Public SKU
  name: string;
  image: string; // Primary thumbnail (kept for backward compatibility)
  images?: string[]; // New: Gallery images
  category: string;
  options: string[]; 
  country: string;
  
  // Costing
  localPrice: number;
  exchangeRate: number;
  costMaterial: number; 
  weight: number; 
  shippingCostPerKg: number; 
  
  // Pricing
  priceGeneral: number;   
  priceVip: number;       
  priceWholesale: number; 

  priceType: 'normal' | 'event' | 'clearance'; 
  bulkDiscount?: { count: number, total: number }; 
  
  // Logistics Config
  allowPayment?: {
    cash: boolean;
    bankTransfer: boolean;
    cod: boolean;
  };
  allowShipping?: {
    meetup: boolean;
    myship: boolean;
    family: boolean;
    delivery: boolean;
  };

  stock: number;
  note: string;
  soldCount: number;
  buyUrl?: string; // Optional
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  option: string;
  price: number;
  quantity: number;
}

export interface User {
  id: string; 
  phone: string;
  name: string;
  totalSpend: number;
  isAdmin: boolean;
  address?: string;
  birthday?: string; 
  tier: 'general' | 'vip' | 'wholesale'; 
  credits: number;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number; 
  shippingFee: number; 
  usedCredits: number; 
  finalTotal: number;
  
  paymentMethod: 'cash' | 'bank_transfer' | 'cod'; 
  paymentName?: string;
  paymentTime?: string;
  paymentLast5?: string;
  
  shippingMethod: 'meetup' | 'myship' | 'family' | 'delivery'; 
  shippingName?: string;
  shippingPhone?: string;
  shippingStore?: string; 
  shippingAddress?: string; 
  shippingLink?: string; 
  
  // Added 'cancelled' status
  status: 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'shipped' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface StoreSettings {
  birthdayGiftGeneral: number;
  birthdayGiftVip: number;
  
  // Mapping Category Name -> Code Prefix (e.g. '服飾' -> 'A')
  categoryCodes: { [key: string]: string };

  paymentMethods: {
    cash: boolean;
    bankTransfer: boolean;
    cod: boolean;
  };

  shipping: {
    freeThreshold: number; 
    methods: {
      meetup: { enabled: boolean, fee: number };
      myship: { enabled: boolean, fee: number }; 
      family: { enabled: boolean, fee: number }; 
      delivery: { enabled: boolean, fee: number }; 
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // Default Settings
  private defaultSettings: StoreSettings = {
    birthdayGiftGeneral: 100,
    birthdayGiftVip: 500,
    categoryCodes: {
      '熱銷精選': 'H',
      '服飾': 'C',
      '包包': 'B',
      '生活小物': 'L'
    },
    paymentMethods: {
      cash: false,
      bankTransfer: true,
      cod: true
    },
    shipping: {
      freeThreshold: 2000,
      methods: {
        meetup: { enabled: true, fee: 0 },
        myship: { enabled: true, fee: 35 },
        family: { enabled: true, fee: 39 },
        delivery: { enabled: false, fee: 100 }
      }
    }
  };

  settings = signal<StoreSettings>(this.defaultSettings);
  categories = signal<string[]>(['熱銷精選', '服飾', '包包', '生活小物']);
  products = signal<Product[]>([
    {
      id: 'p1',
      code: 'L250520001',
      name: '可愛貓咪馬克杯',
      image: 'https://picsum.photos/300/300?random=1',
      images: ['https://picsum.photos/300/300?random=1', 'https://picsum.photos/300/300?random=11'],
      category: '生活小物',
      options: ['白色', '粉色'],
      country: 'Japan',
      localPrice: 1000,
      exchangeRate: 0.22,
      costMaterial: 50,
      weight: 0.5,
      shippingCostPerKg: 200,
      priceGeneral: 450,
      priceVip: 400,
      priceWholesale: 350,
      priceType: 'normal',
      stock: 20,
      note: '易碎品',
      soldCount: 5,
      allowPayment: { cash: true, bankTransfer: true, cod: true },
      allowShipping: { meetup: true, myship: true, family: true, delivery: true }
    },
    {
      id: 'p2',
      code: 'B250520001',
      name: '韓系質感托特包',
      image: 'https://picsum.photos/300/300?random=2',
      images: ['https://picsum.photos/300/300?random=2', 'https://picsum.photos/300/300?random=22', 'https://picsum.photos/300/300?random=23'],
      category: '包包',
      options: ['黑色', '米白', '奶茶'],
      country: 'Korea',
      localPrice: 25000,
      exchangeRate: 0.024,
      costMaterial: 30,
      weight: 0.8,
      shippingCostPerKg: 200,
      priceGeneral: 890,
      priceVip: 800,
      priceWholesale: 700,
      priceType: 'event',
      stock: 10,
      note: '熱銷款',
      soldCount: 12,
      allowPayment: { cash: true, bankTransfer: true, cod: true },
      allowShipping: { meetup: true, myship: true, family: true, delivery: true }
    }
  ]);
  currentUser = signal<User | null>(null);
  users = signal<User[]>([
    { id: 'M001', phone: '0900000000', name: 'Admin User', totalSpend: 0, isAdmin: true, address: '台北市信義區', birthday: '1990-01-01', tier: 'vip', credits: 9999 },
    { id: 'M123', phone: '0912345678', name: '王小美', totalSpend: 1500, isAdmin: false, address: '新北市板橋區', birthday: '1995-05-20', tier: 'general', credits: 100 }
  ]);
  cart = signal<CartItem[]>([]);
  orders = signal<Order[]>([]);

  // Computed
  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0));
  cartCount = computed(() => this.cart().reduce((count, item) => count + item.quantity, 0));

  constructor() {
    // Load Data
    const load = (key: string) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    };

    const savedProds = load('92mymy_products');
    if (savedProds) this.products.set(savedProds);

    const savedOrders = load('92mymy_orders');
    if (savedOrders) {
      this.orders.set(savedOrders);
    } else {
      // Mock Orders for initial visibility
      const mockOrders: Order[] = [
        { id: '202405200001', userId: 'M123', items: [{ productId: 'p1', productName: '可愛貓咪馬克杯', productImage: 'https://picsum.photos/300/300?random=1', option: '白色', price: 450, quantity: 1 }], subtotal: 450, discount: 0, shippingFee: 60, usedCredits: 0, finalTotal: 510, paymentMethod: 'bank_transfer', shippingMethod: 'delivery', status: 'pending_payment', createdAt: Date.now() - 86400000 },
        { id: '202405210002', userId: 'M123', items: [{ productId: 'p2', productName: '韓系質感托特包', productImage: 'https://picsum.photos/300/300?random=2', option: '黑色', price: 890, quantity: 1 }], subtotal: 890, discount: 20, shippingFee: 0, usedCredits: 50, finalTotal: 820, paymentMethod: 'cod', shippingMethod: 'myship', status: 'payment_confirmed', createdAt: Date.now() - 3600000 },
        { id: '202405220003', userId: 'M123', items: [{ productId: 'p1', productName: '可愛貓咪馬克杯', productImage: 'https://picsum.photos/300/300?random=1', option: '粉色', price: 450, quantity: 2 }], subtotal: 900, discount: 0, shippingFee: 0, usedCredits: 0, finalTotal: 900, paymentMethod: 'bank_transfer', shippingMethod: 'meetup', status: 'paid_verifying', paymentLast5: '12345', paymentName: '王小美', createdAt: Date.now() }
      ];
      this.orders.set(mockOrders);
    }

    const savedUsers = load('92mymy_users');
    if (savedUsers) this.users.set(savedUsers);

    const savedCats = load('92mymy_categories');
    if (savedCats) this.categories.set(savedCats);

    const savedCart = load('92mymy_cart');
    if (savedCart) this.cart.set(savedCart);

    // Robust Settings Load
    const savedSettings = localStorage.getItem('92mymy_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Deep merge to ensure all config exists
        const merged: StoreSettings = {
          ...this.defaultSettings,
          ...parsed,
          categoryCodes: { ...this.defaultSettings.categoryCodes, ...(parsed.categoryCodes || {}) },
          paymentMethods: { ...this.defaultSettings.paymentMethods, ...(parsed.paymentMethods || {}) },
          shipping: {
             ...this.defaultSettings.shipping,
             ...(parsed.shipping || {}),
             methods: {
                ...this.defaultSettings.shipping.methods,
                ...(parsed.shipping?.methods || {})
             }
          }
        };
        this.settings.set(merged);
      } catch (e) {
        console.error('Settings load error', e);
        this.settings.set(this.defaultSettings);
      }
    }

    // Persist
    effect(() => localStorage.setItem('92mymy_products', JSON.stringify(this.products())));
    effect(() => localStorage.setItem('92mymy_orders', JSON.stringify(this.orders())));
    effect(() => localStorage.setItem('92mymy_users', JSON.stringify(this.users())));
    effect(() => localStorage.setItem('92mymy_categories', JSON.stringify(this.categories())));
    effect(() => localStorage.setItem('92mymy_settings', JSON.stringify(this.settings())));
    effect(() => localStorage.setItem('92mymy_cart', JSON.stringify(this.cart())));
  }

  // Generates SKU: [Prefix][YY][MM][DD][XXX]
  // e.g., A250520001
  generateProductCode(prefix: string): string {
    if (!prefix) prefix = 'Z';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    
    // Filter existing products that match this pattern
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{3})$`);
    
    let maxSeq = 0;
    this.products().forEach(p => {
       const match = p.code.match(pattern);
       if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
       }
    });

    const newSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${datePart}${newSeq}`;
  }

  // Fallback for legacy calls or missing category
  generateNextProductCode(): string {
    return this.generateProductCode('P');
  }

  // Basic Actions
  addCategory(name: string) { 
    const n = name.trim();
    if (n && !this.categories().includes(n)) this.categories.update(l => [...l, n]); 
  }
  removeCategory(name: string) { this.categories.update(l => l.filter(c => c !== name)); }
  updateSettings(s: StoreSettings) { this.settings.set(s); }
  addProduct(p: Product) { this.products.update(l => [...l, p]); }
  updateProduct(p: Product) { this.products.update(l => l.map(i => i.id === p.id ? p : i)); }
  deleteProduct(id: string) { this.products.update(l => l.filter(i => i.id !== id)); }

  // Cart
  addToCart(product: Product, option: string, quantity: number) {
    const user = this.currentUser();
    let finalPrice = product.priceGeneral;
    if (user?.tier === 'wholesale' && product.priceWholesale > 0) finalPrice = product.priceWholesale;
    else if (user?.tier === 'vip' && product.priceVip > 0) finalPrice = product.priceVip;

    this.cart.update(current => {
      const exist = current.find(i => i.productId === product.id && i.option === option);
      if (exist) {
        return current.map(i => i === exist ? { ...i, quantity: i.quantity + quantity, price: finalPrice } : i);
      }
      return [...current, { productId: product.id, productName: product.name, productImage: product.image, option, price: finalPrice, quantity }];
    });
  }

  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  
  updateCartQty(index: number, delta: number) {
    this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  clearCart() { this.cart.set([]); }

  // Order
  createOrder(
    paymentInfo: any, 
    shippingInfo: any, 
    usedCredits: number, 
    paymentMethod: 'cash'|'bank_transfer'|'cod',
    shippingMethod: 'meetup'|'myship'|'family'|'delivery',
    shippingFee: number,
    checkoutItems: CartItem[]
  ) {
    const user = this.currentUser();
    if (!user) return null;

    const sub = checkoutItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    // Discount rule: -20 for Store Shipping (Myship/Family) automatically
    // "開單預扣"
    let discount = 0;
    if (shippingMethod === 'myship' || shippingMethod === 'family') {
      discount = 20;
    }

    let final = Math.max(0, sub + shippingFee - discount - usedCredits);
    
    // Generate Order ID
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = this.orders().filter(o => o.id.startsWith(datePrefix)).length;
    const orderId = `${datePrefix}${String(count + 1).padStart(4, '0')}`;

    // Determine Status
    // Bank Transfer logic: If last5 is provided, assume paid_verifying. If empty, pending_payment.
    const initialStatus: Order['status'] = paymentMethod === 'bank_transfer' 
        ? (paymentInfo.last5 ? 'paid_verifying' : 'pending_payment') 
        : (paymentMethod === 'cod' ? 'payment_confirmed' : 'pending_payment');

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      items: [...checkoutItems],
      subtotal: sub,
      discount,
      shippingFee,
      usedCredits,
      finalTotal: final,
      paymentMethod,
      paymentName: paymentInfo.name,
      paymentTime: paymentInfo.time,
      paymentLast5: paymentInfo.last5,
      shippingMethod,
      shippingName: shippingInfo.name,
      shippingPhone: shippingInfo.phone,
      shippingStore: shippingInfo.store,
      shippingAddress: shippingInfo.address,
      status: initialStatus,
      createdAt: Date.now()
    };

    this.orders.update(l => [...l, newOrder]);
    
    // Update User
    this.users.update(l => l.map(u => u.id === user.id ? { ...u, totalSpend: u.totalSpend + sub, credits: u.credits - usedCredits } : u));
    this.currentUser.set(this.users().find(u => u.id === user.id) || user);

    // Update Stock
    checkoutItems.forEach(item => {
      this.products.update(l => l.map(p => p.id === item.productId ? { ...p, stock: p.stock - item.quantity, soldCount: p.soldCount + item.quantity } : p));
    });

    // Remove ONLY checkout items from cart
    this.cart.update(current => current.filter(c => 
      !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)
    ));

    return newOrder;
  }

  updateOrderStatus(id: string, status: Order['status'], extra: Partial<Order> = {}) {
    this.orders.update(l => l.map(o => o.id === id ? { ...o, status, ...extra } : o));
  }

  reportPayment(id: string, info: any) {
    this.orders.update(l => l.map(o => o.id === id ? { ...o, status: 'paid_verifying', paymentName: info.name, paymentTime: info.time, paymentLast5: info.last5 } : o));
  }

  // Auth
  login(phone: string) {
    const u = this.users().find(user => user.phone === phone);
    if (u) this.currentUser.set(u);
    return u;
  }

  register(phone: string, name: string) {
    // Generate Member ID: M + YYMMDD + XXXX (4 digit sequence)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    const prefix = 'M';
    
    // Find sequence for today for Members
    // Look for M250520XXXX
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{4})$`);
    let maxSeq = 0;
    this.users().forEach(u => {
       const match = u.id.match(pattern);
       if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
       }
    });
    
    const newSeq = String(maxSeq + 1).padStart(4, '0'); // 4 digits
    const id = `${prefix}${datePart}${newSeq}`;

    const newUser: User = { id, phone, name, totalSpend: 0, isAdmin: false, tier: 'general', credits: 0 };
    this.users.update(l => [...l, newUser]);
    this.currentUser.set(newUser);
    return newUser;
  }

  updateUser(u: User) {
    this.users.update(l => l.map(x => x.id === u.id ? u : x));
    if (this.currentUser()?.id === u.id) this.currentUser.set(u);
  }

  logout() { this.currentUser.set(null); }

  getAccountingStats() {
    // Exclude cancelled/refunded/pending/cancelled from 'Valid Sales'
    const validOrders = this.orders().filter(o => o.status !== 'pending_payment' && o.status !== 'unpaid_alert' && o.status !== 'refunded' && o.status !== 'cancelled');
    let totalSales = 0;
    let totalCost = 0;
    validOrders.forEach(o => {
      totalSales += o.finalTotal;
      o.items.forEach(i => {
        const p = this.products().find(x => x.id === i.productId);
        if (p) {
          const cost = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg);
          totalCost += cost * i.quantity;
        }
      });
    });
    return { totalSales, totalCost, totalProfit: totalSales - totalCost, profitMargin: totalSales ? ((totalSales-totalCost)/totalSales)*100 : 0 };
  }
}