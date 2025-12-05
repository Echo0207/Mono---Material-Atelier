
export enum UserRole {
  ADMIN = 'ADMIN',
  DESIGNER = 'DESIGNER',
}

export enum PricingMode {
  DAILY = 'DAILY', // 50% of cost
  SPECIAL = 'SPECIAL', // 80% of cost
}

export enum OrderStatus {
  PENDING = 'PENDING',      // Designer: Editable. Admin: "未處理"
  LOCKED = 'LOCKED',        // Designer: Read-only. Admin: "已受理" (Accepted)
  PACKED = 'PACKED',        // Designer: Read-only. Admin: "已整理" (Processed)
  OUT_OF_STOCK = 'OUT_OF_STOCK', // Item level flag mainly. Admin: "缺貨中"
  COMPLETED = 'COMPLETED',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Promotion {
  type: 'BUNDLE'; // Forced set (e.g. 1 Set = 3 items, Pay for 2)
  buy: number; // Paid quantity (e.g. 2)
  get: number; // Free quantity (e.g. 1)
  avgPriceDisplay?: number; // Manual override for display (e.g., 153)
  note?: string; // e.g., "Angel perm 2/3 can replace TGB"
}

export interface Announcement {
  title: string;
  content: string; // Supports multi-line
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  costPrice: number;
  isActive: boolean;
  isFeatured: boolean; // For "New Year" top section
  promotion?: Promotion; // Optional promotion config
}

export interface CartItem {
  productId: string;
  quantity: number; // Store as "Sets" if Bundle, otherwise Units
  pricingMode: PricingMode;
  snapshotPrice: number; // Unit Price
  isBundle?: boolean; // Flag to indicate this cart item is a bundle set
  freeQuantity?: number; // Optional property for legacy logic compatibility (unused now)
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  status: OrderStatus; // Overall Order Status
  pricingMode: PricingMode;
  items: {
    productId: string;
    productName: string;
    quantity: number; // Paid quantity (Units)
    freeQuantity: number; // Free quantity (Units)
    bundleQuantity?: number; // IF BUNDLE: Number of Sets ordered
    unitPrice: number;
    totalPrice: number;
    brand: string;
    status?: OrderStatus; // Item specific status (e.g., OUT_OF_STOCK)
    note?: string; // Promotion note copy
  }[];
  totalAmount: number; // Sum of items NOT marked as OUT_OF_STOCK
}