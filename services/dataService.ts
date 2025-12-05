
import { Product, User, UserRole, Order, OrderStatus, Announcement } from '../types';

const KEYS = {
  USERS: 'mono_users',
  PRODUCTS: 'mono_products',
  ORDERS: 'mono_orders',
  ANNOUNCEMENT: 'mono_announcement',
};

// Initial Mock Data (Traditional Chinese)
const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'p1', name: '高級和紙膠帶', brand: 'MT', costPrice: 100, isActive: true, isFeatured: true 
  },
  { 
    id: 'p2', name: '製圖自動鉛筆', brand: 'Pentel', costPrice: 250, isActive: true, isFeatured: false 
  },
  { 
    id: 'p3', name: '素描本 A4', brand: 'Maruman', costPrice: 180, isActive: true, isFeatured: true 
  },
  { 
    id: 'p4', name: '威傑士染膏 (紅色系)', brand: 'Wella', costPrice: 230, isActive: true, isFeatured: true,
    promotion: { type: 'BUNDLE', buy: 2, get: 1, avgPriceDisplay: 153, note: '買二送一優惠中' }
  },
  { 
    id: 'p5', name: 'Copic 麥克筆', brand: 'Copic', costPrice: 120, isActive: true, isFeatured: false 
  },
  { 
    id: 'p6', name: '歌薇燙髮一劑', brand: 'Goldwell', costPrice: 400, isActive: true, isFeatured: false
    // Removed legacy B2G1 promotion
  }, 
];

const INITIAL_ANNOUNCEMENT: Announcement = {
  title: '🐍 2025 新春囤貨節 - 買二送一特別企劃',
  content: '本次活動可分兩期付款，於一月及二月薪資扣除。\n請提前準備，務必於一月領料日完成安排。\n⚠️ 特別注意：二月無開放領料日！',
  isActive: true
};

export const dataService = {
  // Users (Simple Mock)
  login: (name: string): User => {
    const isAdmin = name.trim().toLowerCase() === 'admin';
    return {
      id: name.toLowerCase().replace(/\s/g, '_'),
      name: name,
      role: isAdmin ? UserRole.ADMIN : UserRole.DESIGNER,
    };
  },

  // Announcement
  getAnnouncement: (): Announcement => {
    const stored = localStorage.getItem(KEYS.ANNOUNCEMENT);
    if (!stored) {
      localStorage.setItem(KEYS.ANNOUNCEMENT, JSON.stringify(INITIAL_ANNOUNCEMENT));
      return INITIAL_ANNOUNCEMENT;
    }
    return JSON.parse(stored);
  },

  saveAnnouncement: (announcement: Announcement) => {
    localStorage.setItem(KEYS.ANNOUNCEMENT, JSON.stringify(announcement));
  },

  // Products
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProduct: (product: Product) => {
    const products = dataService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = dataService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Orders
  getOrders: (): Order[] => {
    const stored = localStorage.getItem(KEYS.ORDERS);
    return stored ? JSON.parse(stored) : [];
  },

  createOrder: (order: Order) => {
    const orders = dataService.getOrders();
    orders.unshift(order); // Newest first
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  updateOrder: (updatedOrder: Order) => {
    const orders = dataService.getOrders();
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index >= 0) {
      orders[index] = updatedOrder;
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    }
  },
  
  // Implemented batch update for Brand View operations
  updateOrderBatch: (updatedOrders: Order[]) => {
    console.log('[DataService] Batch updating orders:', updatedOrders.length);
    const currentOrders = dataService.getOrders();
    // Create a map for faster lookup of updates
    const updatesMap = new Map(updatedOrders.map(o => [o.id, o]));
    
    // Map through current orders, replacing with update if exists
    const newOrders = currentOrders.map(o => updatesMap.get(o.id) || o);
    
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(newOrders));
    console.log('[DataService] Batch update complete.');
  },

  deleteOrder: (id: string) => {
    const orders = dataService.getOrders().filter(o => o.id !== id);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  }
};