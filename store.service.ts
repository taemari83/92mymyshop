import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  image: string; // Base64 or URL
  options: string[]; // Splittable by comma
  country: string;
  purchaseUrl: string;
  localPrice: number;
  exchangeRate: number;
  // Computed on save/update: convertedPrice = localPrice * exchangeRate
  cost: number; // Materials + Packaging + Converted Price (Total Cost)
  price: number; // Selling Price
  stock: number; // Quantity Selection (Inventory)
  sold: number; // For popularity
  notes: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  option: string;
  price: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // Usually 20
  finalAmount: number;
  customerName: string;
  paymentTime: string;
  paymentLast5: string;
  shippingName: string;
  shippingPhone: string; // Used to link to Member
  shippingStore: string;
  status: 'pending_check' | 'paid' | 'shipped';
  createdAt: number; // Timestamp
  shippedAt?: number;
}

export interface Member {
  name: string;
  phone: string; // Unique Identifier
  lineId?: string; // New field for Line Account binding
  joinedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // --- State ---
  readonly products = signal<Product[]>(this.getInitialProducts());
  readonly orders = signal<Order[]>([]);
  readonly members = signal<Member[]>([]);
  
  // --- Computed for Accounting ---
  readonly accountingData = computed(() => {
    const products = this.products();
    const orders = this.orders();
    
    // Aggregate sales data per product
    // We map product ID to stats
    const stats = new Map<string, { soldQty: number, revenue: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const current = stats.get(item.productId) || { soldQty: 0, revenue: 0 };
        current.soldQty += item.qty;
        current.revenue += item.price * item.qty;
        stats.set(item.productId, current);
      });
    });

    return products.map(p => {
      const stat = stats.get(p.id) || { soldQty: 0, revenue: 0 };
      const convertedCost = p.localPrice * p.exchangeRate;
      // Profit = Revenue - (TotalCost * Qty)
      // Note: 'cost' field now represents Total Cost (Converted + Materials) based on new requirements
      const totalRevenue = stat.revenue;
      const totalCost = p.cost * stat.soldQty;
      const profit = totalRevenue - totalCost;

      return {
        ...p,
        totalSold: stat.soldQty,
        totalRevenue: totalRevenue,
        profit: profit,
        convertedPrice: convertedCost
      };
    });
  });

  // --- Actions ---

  addProduct(p: Product) {
    this.products.update(list => [...list, p]);
  }

  updateProduct(updated: Product) {
    this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
  }

  deleteProduct(id: string) {
    this.products.update(list => list.filter(p => p.id !== id));
  }

  createOrder(order: Order) {
    this.orders.update(list => [order, ...list]);
    
    // Update stock and sold count
    this.products.update(products => {
      return products.map(p => {
        const soldItem = order.items.find(i => i.productId === p.id);
        if (soldItem) {
          return {
            ...p,
            stock: p.stock - soldItem.qty,
            sold: p.sold + soldItem.qty
          };
        }
        return p;
      });
    });
  }

  verifyOrderPayment(orderId: string) {
    this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: 'paid' } : o));
  }

  shipOrder(orderId: string) {
    this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: 'shipped', shippedAt: Date.now() } : o));
  }

  // --- Member Actions ---
  registerMember(name: string, phone: string, lineId: string = '') {
    const exists = this.members().some(m => m.phone === phone);
    if (!exists) {
      this.members.update(list => [...list, { name, phone, lineId, joinedAt: Date.now() }]);
    }
  }

  // --- Seed Data ---
  private getInitialProducts(): Product[] {
    return [
      {
        id: '1',
        name: '韓國KF94立體口罩',
        image: 'https://picsum.photos/400/400?random=1',
        options: ['白色', '黑色', '粉色'],
        country: '韓國',
        purchaseUrl: 'https://example.com/kr/mask',
        localPrice: 500,
        exchangeRate: 0.024,
        cost: 17, // Converted(12) + Mat(5)
        price: 25,
        stock: 100,
        sold: 250,
        notes: '熱銷商品，需常補貨'
      },
      {
        id: '2',
        name: '日本蒸汽眼罩 (12入)',
        image: 'https://picsum.photos/400/400?random=2',
        options: ['薰衣草', '無香', '玫瑰'],
        country: '日本',
        purchaseUrl: 'https://example.com/jp/eye',
        localPrice: 980,
        exchangeRate: 0.22,
        cost: 230, // Converted(215.6) + Mat(15) approx
        price: 350,
        stock: 45,
        sold: 80,
        notes: '體積大，運費較高'
      },
      {
        id: '3',
        name: '泰國手標泰式茶',
        image: 'https://picsum.photos/400/400?random=3',
        options: ['紅色(紅茶)', '金色(特級)', '綠色(奶綠)'],
        country: '泰國',
        purchaseUrl: 'https://example.com/th/tea',
        localPrice: 140,
        exchangeRate: 0.9,
        cost: 136, // Converted(126) + Mat(10)
        price: 220,
        stock: 200,
        sold: 500,
        notes: ''
      }
    ];
  }
}