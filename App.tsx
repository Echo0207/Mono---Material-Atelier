import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  X, 
  Filter, 
  ChevronRight, 
  Plus, 
  Minus, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Box,
  ArrowRight,
  RefreshCw,
  Gift,
  Megaphone,
  Zap,
  ArrowUp,
  ArrowDown,
  List,
  BarChart2,
  Download,
  Clock,
  Cloud,
  CloudOff,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { dataService } from './services/dataService';
import { User, Product, PricingMode, CartItem, Order, OrderStatus, UserRole, Announcement, Promotion } from './types';

// --- Helper Functions ---
const formatCurrency = (amount: number) => `NT$${amount.toLocaleString()}`;

const calculatePrice = (cost: number, mode: PricingMode): number => {
  return mode === PricingMode.DAILY ? Math.floor(cost * 0.5) : Math.floor(cost * 0.8);
};

const formatDate = (ts: number) => new Date(ts).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const recalculateOrderTotal = (items: Order['items']): number => {
    return items.reduce((sum, item) => {
        if (item.status === OrderStatus.OUT_OF_STOCK) return sum;
        return sum + (item.unitPrice * item.quantity); // Paid Quantity * Unit Price
    }, 0);
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-gray-200">未處理</span>;
    case OrderStatus.LOCKED:
      return <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-200">已受理</span>;
    case OrderStatus.PACKED:
      return <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200">已整理</span>;
    case OrderStatus.OUT_OF_STOCK:
      return <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100">缺貨中</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{status}</span>;
  }
};

// --- Sub-Components ---

interface AnnouncementModalProps {
  announcement: Announcement;
  onClose: () => void;
}
const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onClose }) => {
  if (!announcement.isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[#FFFDF5] w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border-2 border-accent/20">
         <div className="bg-accent text-white p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <Gift size={32} className="mx-auto mb-2 animate-bounce" />
            <h2 className="font-serif text-xl font-bold tracking-widest">{announcement.title}</h2>
         </div>
         <div className="p-6">
            <div className="text-ink font-serif leading-relaxed whitespace-pre-line text-sm border-l-4 border-accent/30 pl-4 mb-6">
              {announcement.content}
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-ink text-white py-3 rounded uppercase text-xs font-bold tracking-widest hover:bg-ink-light transition-colors"
            >
              我已知悉 (I Understand)
            </button>
         </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  mode: PricingMode;
  cartQty: number; // For Bundles, this is # of SETS. For regular, # of UNITS.
  onUpdateCart: (product: Product, delta: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  mode, 
  cartQty,
  onUpdateCart 
}) => {
  const isBundle = product.promotion?.type === 'BUNDLE';
  const baseUnitPrice = isBundle ? product.costPrice : calculatePrice(product.costPrice, mode);
  
  const bundlePaidQty = isBundle ? product.promotion!.buy : 0;
  const bundleFreeQty = isBundle ? product.promotion!.get : 0;
  const bundleTotalQty = bundlePaidQty + bundleFreeQty;
  const bundlePrice = isBundle ? baseUnitPrice * bundlePaidQty : 0;

  let displayPrice = baseUnitPrice;
  let originalPrice = product.costPrice;

  if (isBundle) {
      displayPrice = bundlePrice;
      // Calculate total value of the bundle (including free items) at base cost
      originalPrice = product.costPrice * bundleTotalQty;
  }
  
  const borderClass = 'border border-transparent hover:border-ink-light/20';

  return (
    <div className={`group relative flex flex-col justify-between bg-white transition-all duration-300 ${borderClass} ${isBundle ? 'bg-red-50/10' : ''} p-4 h-full min-h-[160px]`}>
        
        {isBundle && (
           <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 font-bold z-10 shadow-sm flex items-center gap-1 rounded-sm">
             <Zap size={10} fill="currentColor" /> 🧨 新春優惠組
           </div>
        )}
        
        <div className="flex-1 flex flex-col">
            <p className="text-[10px] text-ink-light tracking-widest uppercase mb-1">{product.brand}</p>
            <h3 className="font-serif text-lg leading-tight mb-2 line-clamp-2 font-bold text-ink">
                {product.name}
            </h3>
            
            <div className="text-xs text-ink-light mb-3">
                {isBundle && (
                    <span className="text-ink font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px] inline-block mb-1">
                        內含 {bundleTotalQty} 支
                    </span>
                )}
                {isBundle && (
                    <div className="text-[10px] text-gray-500">
                        單組 {bundleTotalQty} 入 (買{bundlePaidQty}送{bundleFreeQty})
                    </div>
                )}
            </div>
        </div>

        <div className="mt-auto flex justify-between items-end pt-2 border-t border-dashed border-gray-100">
           <div className="flex flex-col">
               {/* Original Price (Crossed out) */}
               {originalPrice > displayPrice && (
                   <span className="text-xs text-gray-400 line-through decoration-gray-300 font-sans mb-0.5">
                       {formatCurrency(originalPrice)}
                   </span>
               )}
               {/* Sale Price */}
               <span className={`font-serif text-xl leading-none ${isBundle ? 'text-red-600 font-bold' : 'text-accent'}`}>
                {formatCurrency(displayPrice)}
               </span>
               <span className="text-[10px] text-gray-400 mt-1">
                    {isBundle ? '組合價' : '設購日價'}
               </span>
           </div>

            <div className="flex items-end justify-end">
                {cartQty === 0 ? (
                    <button 
                    onClick={() => onUpdateCart(product, 1)}
                    className={`text-ink w-8 h-8 rounded-full shadow-sm border active:scale-95 transition-transform flex items-center justify-center ${isBundle ? 'bg-accent text-white border-accent' : 'bg-white border-gray-200'}`}
                    >
                    <Plus size={16} strokeWidth={1.5} />
                    </button>
                ) : (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full px-1 py-0.5 gap-2 shadow-sm animate-in slide-in-from-right-2 duration-200">
                    <button 
                        onClick={() => onUpdateCart(product, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-ink active:scale-90 transition"
                    >
                        <Minus size={14} />
                    </button>
                    <span className={`font-serif font-bold text-sm min-w-[1.2rem] text-center ${isBundle ? 'text-accent' : ''}`}>{cartQty}</span>
                    <button 
                        onClick={() => onUpdateCart(product, 1)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition ${isBundle ? 'bg-accent text-white' : 'bg-ink text-white'}`}
                    >
                        <Plus size={14} />
                    </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

interface ShopViewProps {
  products: Product[];
  pricingMode: PricingMode;
  cart: CartItem[];
  updateCartItem: (product: Product, delta: number) => void;
  onLogout: () => void;
}

const ShopView: React.FC<ShopViewProps> = ({ products, pricingMode, cart, updateCartItem, onLogout }) => {
    const [filterBrand, setFilterBrand] = useState<string>('');
    
    // Calculate active products first
    const activeProducts = (products || []).filter(p => p.isActive);
    
    // Derive brands ONLY from active products
    const brands: string[] = Array.from<string>(new Set(activeProducts.map(p => p.brand))).sort();
    
    // Filter the already active products by brand
    const visibleProducts: Product[] = activeProducts
      .filter(p => !filterBrand || p.brand === filterBrand)
      .sort((a, b) => {
          const aIsBundle = a.promotion?.type === 'BUNDLE' ? 1 : 0;
          const bIsBundle = b.promotion?.type === 'BUNDLE' ? 1 : 0;
          
          if (aIsBundle !== bIsBundle) return bIsBundle - aIsBundle;
          return Number(b.isFeatured) - Number(a.isFeatured);
      });

    return (
      <div className="pb-24">
        <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-md border-b border-ink-light/10 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
             <h2 className="font-serif text-xl font-bold tracking-widest">CATALOG</h2>
             <div className="flex items-center gap-2">
                <div className="text-[10px] font-serif text-accent font-bold tracking-wider border border-accent/30 px-2 py-1 rounded bg-accent/5">
                    設購日 (8折)
                </div>
                <button onClick={onLogout} className="p-1 text-gray-400 hover:text-ink transition-colors" title="登出">
                    <LogOut size={16} />
                </button>
             </div>
          </div>
          
          <div className="px-4 pb-3">
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select 
                    value={filterBrand} 
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm font-serif focus:outline-none focus:border-ink transition-colors"
                >
                    <option value="">所有品牌 (All Brands)</option>
                    {brands.map((b: string) => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>
            </div>
          </div>
        </div>

         <div className="mx-4 mt-4 bg-accent/5 p-4 border border-accent/20 rounded-sm">
           <h3 className="text-accent text-sm font-serif font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
             <Calendar size={14}/>
             設購日特別優惠
           </h3>
           <p className="text-xs text-ink-light">目前全館商品以成本 8 折計算。新春優惠組熱賣中。</p>
         </div>

        <div className="grid grid-cols-2 gap-px bg-gray-200 p-px mt-4">
          {visibleProducts.map((p: Product) => {
              const cartItem = cart.find(i => i.productId === p.id && i.pricingMode === pricingMode);
              const qty = cartItem ? cartItem.quantity : 0;
              return (
                <ProductCard 
                    key={p.id} 
                    product={p} 
                    mode={pricingMode} 
                    cartQty={qty}
                    onUpdateCart={updateCartItem} 
                />
              )
          })}
        </div>
      </div>
    );
};

interface MyOrdersViewProps {
  orders: Order[];
  user: User;
  loading: boolean;
}

const MyOrdersView: React.FC<MyOrdersViewProps> = ({ orders, user, loading }) => {
    const myOrders = orders.filter(o => o.userId === user.id);

    const deleteOrder = async (id: string) => {
      if(window.confirm('確定要取消這筆訂單嗎？')) {
        await dataService.deleteOrder(id);
      }
    };

    const updateQuantity = async (order: Order, itemIndex: number, delta: number) => {
        const newItems = [...order.items];
        const item = newItems[itemIndex];
        
        if (item.bundleQuantity) {
            const oldSetQty = item.bundleQuantity;
            const newSetQty = oldSetQty + delta;
            
            if (newSetQty <= 0) {
                 newItems.splice(itemIndex, 1);
            } else {
                 const ratioBuy = item.quantity / oldSetQty;
                 const ratioFree = item.freeQuantity / oldSetQty;
                 item.bundleQuantity = newSetQty;
                 item.quantity = newSetQty * ratioBuy;
                 item.freeQuantity = newSetQty * ratioFree;
                 item.totalPrice = item.unitPrice * item.quantity;
            }
        } else {
            item.quantity += delta;
            if (item.quantity <= 0) {
                newItems.splice(itemIndex, 1);
            } else {
                 item.totalPrice = item.unitPrice * item.quantity;
            }
        }

        if (newItems.length === 0) {
            await deleteOrder(order.id);
            return;
        }

        const newTotal = recalculateOrderTotal(newItems);
        const updatedOrder = { ...order, items: newItems, totalAmount: newTotal };
        await dataService.updateOrder(updatedOrder);
    };

    return (
      <div className="pb-24 px-4 pt-4 min-h-screen">
        <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
            我的領料單
            {loading && <Loader2 className="animate-spin text-gray-400" size={20} />}
        </h2>
        {myOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Package size={48} className="mb-4" />
            <p>目前沒有訂單紀錄</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map(order => {
                const isLocked = order.status === OrderStatus.LOCKED || order.status === OrderStatus.PACKED || order.status === OrderStatus.COMPLETED;
                
                return (
                  <div key={order.id} className={`bg-white p-4 shadow-sm border rounded-lg transition-colors ${isLocked ? 'border-green-100 bg-green-50/10' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                      <div>
                        {getStatusBadge(order.status)}
                        <p className="text-xs text-ink-light mt-1">{formatDate(order.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] text-ink-light uppercase">
                            {order.pricingMode === PricingMode.DAILY ? '日常價' : '設購日價'}
                        </p>
                      </div>
                    </div>
    
                    <ul className="space-y-3">
                      {order.items.map((item, idx) => {
                        const isOOS = item.status === OrderStatus.OUT_OF_STOCK;
                        return (
                        <li key={idx} className={`flex justify-between items-center text-sm ${isOOS ? 'opacity-50' : ''}`}>
                          <div className="flex-1 flex items-center gap-2">
                             {item.status && item.status !== OrderStatus.PENDING && (
                                <span className="scale-75 origin-left">
                                    {getStatusBadge(item.status)}
                                </span>
                             )}
                             <div>
                                <p className={`font-medium line-clamp-1 ${isOOS ? 'line-through text-red-400' : ''}`}>{item.productName}</p>
                                <div className="text-xs text-ink-light flex items-center gap-2">
                                    {item.note && <span className="text-amber-600 bg-amber-50 px-1 rounded">{item.note}</span>}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {!isLocked && !isOOS ? (
                              <div className="flex items-center border border-gray-200 rounded">
                                <button onClick={() => updateQuantity(order, idx, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50">-</button>
                                <span className="w-6 text-center text-xs font-bold">
                                    {item.bundleQuantity ? item.bundleQuantity : item.quantity}
                                </span>
                                <button onClick={() => updateQuantity(order, idx, 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50">+</button>
                              </div>
                            ) : (
                              <div className="text-right">
                                  {item.bundleQuantity ? (
                                      <>
                                         <span className="text-xs font-bold px-2 block">x{item.bundleQuantity} 組</span>
                                         <span className="text-[10px] text-gray-400 block">共 {item.quantity + item.freeQuantity} 支</span>
                                      </>
                                  ) : (
                                      <>
                                          <span className="text-xs font-bold px-2 block">x{item.quantity}</span>
                                          {item.freeQuantity > 0 && (
                                            <span className="text-[10px] text-red-500 block">+ {item.freeQuantity} (Free)</span>
                                          )}
                                      </>
                                  )}
                              </div>
                            )}
                            <div className="w-16 text-right">
                                <span className={`text-xs block ${isOOS ? 'line-through' : ''}`}>{formatCurrency(item.totalPrice)}</span>
                            </div>
                          </div>
                        </li>
                      )})}
                    </ul>
    
                    {!isLocked && (
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="mt-4 w-full py-2 border border-red-200 text-red-500 text-xs uppercase tracking-widest hover:bg-red-50 transition-colors rounded"
                      >
                        取消訂單
                      </button>
                    )}
                  </div>
                )
            })}
          </div>
        )}
      </div>
    );
};

interface AdminViewProps {
  orders: Order[];
  products: Product[];
  onRefresh: () => void;
  onLogout: () => void;
  announcement: Announcement; // Changed: Pass as prop
}

const AdminView: React.FC<AdminViewProps> = ({ orders, products, onRefresh, onLogout, announcement }) => {
    const [subTab, setSubTab] = useState<'orders' | 'inventory' | 'dashboard'>('orders');
    const [viewMode, setViewMode] = useState<'person' | 'brand'>('person');
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [rankViewMode, setRankViewMode] = useState<'list' | 'chart'>('list');
    const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc'); 
    
    // New State for Inventory Brand Filter
    const [inventoryFilterBrand, setInventoryFilterBrand] = useState<string>('');
    const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set());

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', brand: '', costPrice: 0, isActive: true, isFeatured: false
    });
    const [promoType, setPromoType] = useState<'NONE' | 'BUNDLE'>('NONE');
    const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
        buy: 2, get: 1, avgPriceDisplay: 0, note: ''
    });

    const [announcementForm, setAnnouncementForm] = useState<Announcement>(announcement);
    const [editAnnouncement, setEditAnnouncement] = useState(false);
    
    // Sync announcement prop to local form when not editing
    useEffect(() => {
        if(!editAnnouncement) {
            setAnnouncementForm(announcement);
        }
    }, [announcement, editAnnouncement]);

    const [lockDate, setLockDate] = useState<string>('');
    const [scheduledLockInfo, setScheduledLockInfo] = useState<string | null>(null);

    const toggleOrderSelection = (id: string) => {
      const newSet = new Set(selectedOrders);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedOrders(newSet);
    };

    const toggleProductSelection = (productId: string) => {
      const newSet = new Set(selectedProducts);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      setSelectedProducts(newSet);
    };

    const toggleInventorySelection = (id: string) => {
        const newSet = new Set(selectedInventoryIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedInventoryIds(newSet);
    };

    const performOrderAction = async (action: 'ACCEPTED' | 'PACKED') => {
      let status: OrderStatus;
      if (action === 'ACCEPTED') status = OrderStatus.LOCKED; 
      else status = OrderStatus.PACKED;

      const toUpdate = orders.filter(o => selectedOrders.has(o.id));
      const updated = toUpdate.map(o => ({ ...o, status }));
      await dataService.updateOrderBatch(updated);
      setSelectedOrders(new Set());
    };

    const performBrandAction = async (action: 'ACCEPTED' | 'PACKED' | 'OUT_OF_STOCK' | 'RESTORE') => {
      const ordersToUpdate = orders.filter(o => {
          return o.items.some(item => selectedProducts.has(item.productId));
      });
      
      if (ordersToUpdate.length === 0) {
          alert('沒有相關的訂單');
          return;
      }

      try {
        const updatedOrders = ordersToUpdate.map(o => {
            const newOrder = { ...o };
            let shouldLockOrder = false;
            let targetStatus: OrderStatus = OrderStatus.PENDING;

            if (action === 'ACCEPTED') {
                shouldLockOrder = true;
                targetStatus = OrderStatus.LOCKED;
            } else if (action === 'PACKED') {
                shouldLockOrder = true;
                targetStatus = OrderStatus.PACKED;
            }

            newOrder.items = o.items.map(item => {
                if (selectedProducts.has(item.productId)) {
                    let newItemStatus = OrderStatus.PENDING;
                    if (action === 'ACCEPTED') newItemStatus = OrderStatus.LOCKED;
                    else if (action === 'PACKED') newItemStatus = OrderStatus.PACKED;
                    else if (action === 'OUT_OF_STOCK') newItemStatus = OrderStatus.OUT_OF_STOCK;
                    else if (action === 'RESTORE') newItemStatus = OrderStatus.PENDING;
                    return { ...item, status: newItemStatus };
                }
                return item;
            });

            if (shouldLockOrder) {
                newOrder.status = targetStatus;
            }
            newOrder.totalAmount = recalculateOrderTotal(newOrder.items);
            return newOrder;
        });
        
        await dataService.updateOrderBatch(updatedOrders);
        setSelectedProducts(new Set());
      } catch (error) {
        console.error('[Debug] Error performing brand action:', error);
      }
    };

    const performInventoryBatchAction = async (action: 'ACTIVATE' | 'DEACTIVATE') => {
        if (!window.confirm(`確定要將選取的 ${selectedInventoryIds.size} 項商品${action === 'ACTIVATE' ? '上架' : '下架'}嗎？`)) return;

        const isActive = action === 'ACTIVATE';
        const productsToUpdate = products
            .filter(p => selectedInventoryIds.has(p.id))
            .map(p => ({ ...p, isActive }));
        
        await dataService.updateProductBatch(productsToUpdate);
        setSelectedInventoryIds(new Set());
        onRefresh();
    };

    const runAutoLock = () => {
        if (!lockDate) {
            alert('請選擇自動鎖單時間');
            return;
        }
        
        const targetTime = new Date(lockDate).getTime();
        const now = Date.now();
        const delay = targetTime - now;

        if (delay < 0) {
            executeLock();
            setScheduledLockInfo(null);
            alert('自動鎖單執行完成');
            return;
        }

        const intervalId = setInterval(() => {
             const currentTime = Date.now();
             if (currentTime >= targetTime) {
                 executeLock();
                 clearInterval(intervalId);
                 setScheduledLockInfo(null);
             }
        }, 10000);

        setScheduledLockInfo(lockDate);
        alert('自動鎖單設定成功');
    };

    const executeLock = async () => {
         const currentOrders = orders;
         const toLock = currentOrders.filter(o => o.status === OrderStatus.PENDING);
         if (toLock.length > 0) {
             const updated = toLock.map(o => {
                 const newOrder = {...o, status: OrderStatus.LOCKED};
                 newOrder.items = o.items.map(i => ({...i, status: OrderStatus.LOCKED}));
                 return newOrder;
             });
             await dataService.updateOrderBatch(updated);
         }
    };

    const exportMonthlyDetails = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyOrders = orders.filter(o => {
            const d = new Date(o.timestamp);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (monthlyOrders.length === 0) {
            alert('本月無訂單資料');
            return;
        }

        const allUsersSet = new Set<string>();
        monthlyOrders.forEach(o => allUsersSet.add(o.userName));
        const userColumns = Array.from<string>(allUsersSet).sort();

        const productMap = new Map<string, any>();
        monthlyOrders.forEach(o => {
            o.items.forEach(item => {
                if (!productMap.has(item.productId)) {
                    productMap.set(item.productId, {
                        brand: item.brand,
                        name: item.productName,
                        userQuantities: new Map<string, number>(),
                        total: 0,
                        note: item.note || ''
                    });
                }
                const pData = productMap.get(item.productId);
                const qty = item.quantity + (item.freeQuantity || 0);
                const currentQty = pData.userQuantities.get(o.userName) || 0;
                pData.userQuantities.set(o.userName, currentQty + qty);
                pData.total += qty;
            });
        });

        let csvContent = "\uFEFF"; 
        csvContent += `品牌,品名,${userColumns.join(',')},總和,備註\n`;

        Array.from(productMap.values()).forEach(p => {
            const userValues = userColumns.map(u => p.userQuantities.get(u) || 0);
            const safeName = `"${p.name.replace(/"/g, '""')}"`;
            const safeNote = `"${p.note.replace(/"/g, '""')}"`;
            csvContent += `${p.brand},${safeName},${userValues.join(',')},${p.total},${safeNote}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Monthly_Export_${currentYear}_${currentMonth+1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetDatabase = async () => {
        if(window.confirm('警告：此操作將清除資料庫中所有現有商品，並重新寫入程式碼中的預設商品清單。\n\n這通常用於更新商品目錄。\n\n確定要繼續嗎？')) {
            await dataService.resetProductDatabase();
        }
    };

    const handleInventorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const promotion = promoType === 'NONE' ? undefined : { type: promoType, ...promoForm };
        const newProduct = {
            id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
            ...formData,
            promotion: promotion as Promotion | undefined
        } as Product;

        await dataService.saveProduct(newProduct);
        setEditingProduct(null);
        setFormData({ name: '', brand: '', costPrice: 0, isActive: true, isFeatured: false });
        setPromoType('NONE');
        onRefresh();
    };

    const handleAnnouncementSave = async () => {
        await dataService.saveAnnouncement(announcementForm);
        setEditAnnouncement(false);
        alert('公告已更新');
    };

    const PersonActionBar = ({ selectedCount, onAction }: { selectedCount: number, onAction: (action: 'ACCEPTED' | 'PACKED') => void }) => (
        <div className="bg-white p-4 shadow-sm space-y-4 rounded-lg mb-6">
            <div className="flex gap-2">
                <button onClick={() => onAction('ACCEPTED')} disabled={selectedCount===0} className="flex-1 flex flex-col items-center justify-center bg-green-600 text-white py-3 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <CheckCircle size={18} className="mb-1"/><span className="text-xs font-bold">已受理 (鎖單)</span>
                </button>
                <button onClick={() => onAction('PACKED')} disabled={selectedCount===0} className="flex-1 flex flex-col items-center justify-center bg-blue-600 text-white py-3 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <Box size={18} className="mb-1"/><span className="text-xs font-bold">已整理 (鎖單)</span>
                </button>
            </div>
        </div>
    );

    const BrandActionBar = ({ selectedCount, onAction }: { selectedCount: number, onAction: (action: 'ACCEPTED' | 'PACKED' | 'OUT_OF_STOCK' | 'RESTORE') => void }) => (
        <div className="bg-white p-4 shadow-sm space-y-4 rounded-lg mb-6">
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => onAction('ACCEPTED')} disabled={selectedCount===0} className="flex flex-col items-center justify-center bg-green-600 text-white py-2 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <CheckCircle size={16} className="mb-1"/><span className="text-[10px] font-bold">已受理</span>
                </button>
                <button onClick={() => onAction('PACKED')} disabled={selectedCount===0} className="flex flex-col items-center justify-center bg-blue-600 text-white py-2 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <Box size={16} className="mb-1"/><span className="text-[10px] font-bold">已整理</span>
                </button>
                <button onClick={() => onAction('OUT_OF_STOCK')} disabled={selectedCount===0} className="flex flex-col items-center justify-center bg-red-600 text-white py-2 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <AlertCircle size={16} className="mb-1"/><span className="text-[10px] font-bold">標記缺貨</span>
                </button>
                 <button onClick={() => onAction('RESTORE')} disabled={selectedCount===0} className="flex flex-col items-center justify-center bg-gray-600 text-white py-2 px-1 rounded disabled:opacity-50 active:scale-95 transition-transform">
                    <RefreshCw size={16} className="mb-1"/><span className="text-[10px] font-bold">恢復供貨</span>
                </button>
            </div>
             <div className="flex items-center gap-2 pt-3 border-t text-xs text-gray-500">
                <AlertCircle size={12} />
                <p>注意：「受理」與「整理」將強制鎖定相關訂單。「缺貨」不影響訂單狀態。</p>
             </div>
        </div>
    );

    const InventoryActionBar = ({ selectedCount, onAction }: { selectedCount: number, onAction: (action: 'ACTIVATE' | 'DEACTIVATE') => void }) => (
        <div className="bg-white p-3 shadow-sm border border-gray-200 rounded-lg mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-xs font-bold text-gray-500 ml-2">已選取 {selectedCount} 項</span>
            <div className="flex gap-2">
                <button onClick={() => onAction('ACTIVATE')} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1">
                    <CheckCircle size={14} /> 上架
                </button>
                <button onClick={() => onAction('DEACTIVATE')} className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1">
                    <X size={14} /> 下架
                </button>
            </div>
        </div>
    );

    const itemsByBrand = subTab === 'orders' && viewMode === 'brand' 
      ? orders.reduce((acc, order) => {
            order.items.forEach(item => {
                if (!acc[item.brand]) acc[item.brand] = {};
                if (!acc[item.brand][item.productId]) {
                    acc[item.brand][item.productId] = {
                        id: item.productId,
                        name: item.productName,
                        totalQty: 0,
                        orders: []
                    };
                }
                const physicalQty = item.quantity + (item.freeQuantity || 0);
                acc[item.brand][item.productId].totalQty += physicalQty;
                acc[item.brand][item.productId].orders.push({ 
                    orderId: order.id, 
                    userName: order.userName, 
                    qty: item.quantity, 
                    freeQty: item.freeQuantity || 0,
                    status: order.status,
                    itemStatus: item.status
                });
            });
            return acc;
        }, {} as any)
      : {};

    const totalOrders = orders.length;
    const totalItems = orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity + (i.freeQuantity || 0), 0), 0);
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

    const productRankingMap = orders.flatMap(o => o.items).reduce((acc, item) => {
        if (!acc[item.productId]) {
            acc[item.productId] = {
                id: item.productId,
                name: item.productName,
                displayName: item.productName.replace(' (優惠組合包)', ''),
                brand: item.brand,
                quantity: 0
            };
        }
        acc[item.productId].quantity += (item.quantity + (item.freeQuantity || 0));
        return acc;
    }, {} as Record<string, {id: string, name: string, displayName: string, brand: string, quantity: number}>);

    const productRanking = (Object.values(productRankingMap) as {id: string, name: string, displayName: string, brand: string, quantity: number}[]).sort((a, b) => {
        if (sortDirection === 'desc') {
            return b.quantity - a.quantity;
        } else {
            return a.quantity - b.quantity;
        }
    });

    const toggleSort = () => {
        setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="pb-24">
            <div className="bg-ink text-paper p-4 sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-serif tracking-widest text-lg">物料管理後台</h2>
                    <div className="flex items-center gap-3">
                         {dataService.isFirebaseReady() ? (
                            <span className="text-[10px] flex items-center gap-1 text-green-400"><Cloud size={12}/> 線上</span>
                         ) : (
                            <span className="text-[10px] flex items-center gap-1 text-amber-500"><CloudOff size={12}/> 單機</span>
                         )}
                        <button onClick={onLogout}><LogOut size={16}/></button>
                    </div>
                </div>
                <div className="flex gap-4 text-xs overflow-x-auto no-scrollbar">
                    <button onClick={() => {setSubTab('orders'); setViewMode('person')}} className={`uppercase tracking-wider pb-1 border-b-2 ${subTab === 'orders' && viewMode === 'person' ? 'border-accent text-white' : 'border-transparent text-gray-400'}`}>人員檢視</button>
                    <button onClick={() => {setSubTab('orders'); setViewMode('brand')}} className={`uppercase tracking-wider pb-1 border-b-2 ${subTab === 'orders' && viewMode === 'brand' ? 'border-accent text-white' : 'border-transparent text-gray-400'}`}>品牌檢視</button>
                    <button onClick={() => setSubTab('inventory')} className={`uppercase tracking-wider pb-1 border-b-2 ${subTab === 'inventory' ? 'border-accent text-white' : 'border-transparent text-gray-400'}`}>物料管理</button>
                    <button onClick={() => setSubTab('dashboard')} className={`uppercase tracking-wider pb-1 border-b-2 ${subTab === 'dashboard' ? 'border-accent text-white' : 'border-transparent text-gray-400'}`}>數據報表</button>
                </div>
            </div>
            
            <div className="p-4">
                <div className="mb-6 bg-white border border-accent/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-serif font-bold text-accent flex items-center gap-2"><Megaphone size={16}/> 活動公告設定</h3>
                        <button onClick={() => setEditAnnouncement(!editAnnouncement)} className="text-xs underline text-gray-500">{editAnnouncement ? '取消' : '編輯'}</button>
                    </div>
                    {editAnnouncement ? (
                        <div className="space-y-3">
                            <input className="w-full border p-2 text-sm rounded" placeholder="標題" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} />
                            <textarea className="w-full border p-2 text-sm rounded h-24" placeholder="公告內容 (支援多行)" value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} />
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={announcementForm.isActive} onChange={e => setAnnouncementForm({...announcementForm, isActive: e.target.checked})} /> 啟用公告</label>
                            <button onClick={handleAnnouncementSave} className="bg-accent text-white px-4 py-1.5 text-xs rounded">儲存公告</button>
                        </div>
                    ) : (
                        <div className="text-sm">
                            <p className="font-bold">{announcementForm.title} <span className={`text-[10px] px-1 rounded ${announcementForm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{announcementForm.isActive ? '顯示中' : '已隱藏'}</span></p>
                            <p className="text-gray-500 line-clamp-1">{announcementForm.content}</p>
                        </div>
                    )}
                </div>

                {subTab === 'orders' && (
                    <>
                        <div className="bg-white p-4 shadow-sm rounded-lg mb-6 border border-yellow-100 bg-yellow-50/30">
                            <h4 className="font-bold text-sm mb-3 text-ink flex items-center gap-2">
                                <Clock size={16} className="text-amber-600"/> 自動鎖單排程 (Auto Lock)
                            </h4>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="datetime-local" 
                                        className="w-full text-xs border border-gray-300 p-2 rounded bg-white focus:outline-none focus:border-ink" 
                                        value={lockDate} 
                                        onChange={(e) => setLockDate(e.target.value)} 
                                    />
                                </div>
                                <button 
                                    onClick={runAutoLock} 
                                    className="bg-ink hover:bg-ink-light text-white px-4 py-2 rounded text-xs font-bold whitespace-nowrap transition-colors"
                                >
                                    設定排程
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                <AlertCircle size={10} /> 設定後系統將於指定時間自動將所有「未處理」訂單轉為「已受理」
                            </p>
                            
                            {scheduledLockInfo && (
                                <div className="mt-3 text-xs text-green-700 bg-green-100 border border-green-200 p-2 rounded flex items-center justify-center gap-2 font-bold animate-in fade-in">
                                    <CheckCircle size={14}/>
                                    已排程於 {new Date(scheduledLockInfo).toLocaleString('zh-TW', {hour12: false})} 執行自動鎖單
                                </div>
                            )}
                        </div>

                        {viewMode === 'person' && (
                            <div className="space-y-4">
                                <PersonActionBar selectedCount={selectedOrders.size} onAction={performOrderAction} />
                                {Array.from(new Set(orders.map(o => o.userName))).map(uName => {
                                    const userOrders = orders.filter(o => o.userName === uName);
                                    return (
                                        <div key={uName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-serif font-bold flex justify-between">
                                                <span>{uName}</span>
                                                <span className="text-xs font-sans font-normal text-gray-500">{userOrders.length} 筆訂單</span>
                                            </div>
                                            <div>
                                                {userOrders.map(o => (
                                                    <label key={o.id} className="flex gap-3 p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                                                        <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={() => toggleOrderSelection(o.id)} className="mt-1 w-4 h-4" />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                {getStatusBadge(o.status)}
                                                                <span className="text-gray-400">{formatDate(o.timestamp)}</span>
                                                            </div>
                                                            <ul className="text-sm space-y-1">
                                                                {o.items.map((item, i) => (
                                                                    <li key={i} className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            {item.status && item.status !== OrderStatus.PENDING && (
                                                                                <span className="scale-75 origin-left">{getStatusBadge(item.status)}</span>
                                                                            )}
                                                                            <span className={`text-gray-700 ${item.status === OrderStatus.OUT_OF_STOCK ? 'line-through opacity-50' : ''}`}>{item.productName}</span>
                                                                        </div>
                                                                        <span className="text-gray-400">
                                                                            {item.bundleQuantity ? `x${item.bundleQuantity} 組` : `x${item.quantity}`}
                                                                            {item.freeQuantity > 0 && <span className="text-red-500 text-[10px] ml-1">+{item.freeQuantity}</span>}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {viewMode === 'brand' && (
                            <div className="space-y-6">
                                <BrandActionBar selectedCount={selectedProducts.size} onAction={performBrandAction} />
                                
                                {Object.entries(itemsByBrand).map(([brand, products]: [string, any]) => (
                                    <div key={brand} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-ink text-paper px-4 py-2 font-serif uppercase tracking-widest text-sm font-bold">{brand}</div>
                                        <div className="divide-y divide-gray-100">
                                            {(Object.values(products || {}) as any[]).map((item: any, idx: number) => {
                                                const p = item;
                                                return (
                                                <div key={idx} className="group hover:bg-gray-50">
                                                    <div className="flex items-center p-3 gap-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedProducts.has(p.id)} 
                                                            onChange={() => toggleProductSelection(p.id)}
                                                            onClick={(e) => e.stopPropagation()} 
                                                            className="w-4 h-4 cursor-pointer" 
                                                        />
                                                        <details className="flex-1 group/details" open={false}>
                                                            <summary className="flex justify-between items-center cursor-pointer list-none">
                                                                <div>
                                                                    <p className="font-bold text-sm text-gray-800">{p.name}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-lg font-serif font-bold text-ink" title="總領料數 (付費+贈品)">{p.totalQty}</span>
                                                                    <ChevronRight size={14} className="text-gray-300 group-open/details:rotate-90 transition-transform"/>
                                                                </div>
                                                            </summary>
                                                            <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1 cursor-default">
                                                                {p.orders.map((o: any, i: number) => (
                                                                    <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                                                                        <span>{o.userName}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            {o.itemStatus && o.itemStatus !== OrderStatus.PENDING ? getStatusBadge(o.itemStatus) : getStatusBadge(o.status)}
                                                                            <span className="font-mono">
                                                                                {o.freeQty > 0 ? (
                                                                                    <span className="font-bold text-ink">
                                                                                        {o.qty} <span className="text-red-500">+{o.freeQty}</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    `x${o.qty}`
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="mt-8 border-t pt-6 text-center">
                                    <button 
                                        onClick={exportMonthlyDetails}
                                        className="inline-flex items-center gap-2 bg-ink text-white px-6 py-3 rounded-full shadow-lg hover:bg-ink-light transition-colors text-sm font-bold tracking-widest"
                                    >
                                        <Download size={16} /> 匯出當月明細
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {subTab === 'inventory' && (
                    <div className="space-y-8">
                        <form onSubmit={handleInventorySubmit} className="bg-white p-6 shadow-sm border border-gray-100 space-y-4 rounded-lg">
                            <h3 className="font-serif font-bold border-b pb-2">{editingProduct ? '編輯商品' : '新增商品'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-2 text-sm w-full rounded" placeholder="品名" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                <input className="border p-2 text-sm w-full rounded" placeholder="品牌" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required />
                                <input type="number" className="border p-2 text-sm w-full rounded" placeholder="成本價" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} required />
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="flex gap-4 mb-2">
                                    <label className="text-sm font-bold flex items-center gap-1">
                                        <input type="radio" name="promoType" value="NONE" checked={promoType === 'NONE'} onChange={() => setPromoType('NONE')} /> 無活動
                                    </label>
                                    <label className="text-sm font-bold flex items-center gap-1 text-red-600">
                                        <input type="radio" name="promoType" value="BUNDLE" checked={promoType === 'BUNDLE'} onChange={() => setPromoType('BUNDLE')} /> 🧨 強制組合包 (Bundle)
                                    </label>
                                </div>

                                {promoType !== 'NONE' && (
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border border-gray-200">
                                        {promoType === 'BUNDLE' && (
                                            <>
                                                <div className="col-span-2 text-gray-500 mb-1">
                                                    強制將商品以「組」為單位販售。設定 1 組內含的付費與贈送數量。
                                                </div>
                                                <div><label>付費數量 (Buy)</label><input type="number" value={promoForm.buy} onChange={e => setPromoForm({...promoForm, buy: Number(e.target.value)})} className="w-full border p-1 rounded" /></div>
                                                <div><label>贈送數量 (Get)</label><input type="number" value={promoForm.get} onChange={e => setPromoForm({...promoForm, get: Number(e.target.value)})} className="w-full border p-1 rounded" /></div>
                                                <div><label>均價提示 (選填)</label><input type="number" value={promoForm.avgPriceDisplay} onChange={e => setPromoForm({...promoForm, avgPriceDisplay: Number(e.target.value)})} className="w-full border p-1 rounded" /></div>
                                            </>
                                        )}
                                        <div><label>備註</label><input type="text" value={promoForm.note || ''} onChange={e => setPromoForm({...promoForm, note: e.target.value})} className="w-full border p-1 rounded" placeholder="例如：新春活動" /></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />上架</label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} />活動置頂</label>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="bg-ink text-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-ink-light rounded">儲存</button>
                                {editingProduct && <button type="button" onClick={() => { 
                                    setEditingProduct(null); 
                                    setFormData({name: '', brand: '', costPrice: 0, isActive: true, isFeatured: false}); 
                                    setPromoType('NONE');
                                }} className="border px-4 py-2 text-sm uppercase rounded">取消</button>}
                            </div>
                        </form>
                        
                        {/* New Reset Button */}
                        <div className="border-b border-gray-200 pb-6 mb-6">
                            <button 
                                onClick={handleResetDatabase}
                                className="w-full py-3 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={16} /> ⚠️ 重置並同步商品資料庫 (從程式碼更新)
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-2">
                                注意：這將刪除目前資料庫中的所有商品，並重新匯入程式碼中定義的清單。
                            </p>
                        </div>

                        {/* Filter Section */}
                        {selectedInventoryIds.size > 0 && (
                            <InventoryActionBar 
                                selectedCount={selectedInventoryIds.size} 
                                onAction={performInventoryBatchAction} 
                            />
                        )}

                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-ink focus:ring-ink cursor-pointer"
                                    onChange={(e) => {
                                        const visibleIds = products
                                            .filter(p => !inventoryFilterBrand || p.brand === inventoryFilterBrand)
                                            .map(p => p.id);
                                        if (e.target.checked) {
                                            setSelectedInventoryIds(new Set(visibleIds));
                                        } else {
                                            setSelectedInventoryIds(new Set());
                                        }
                                    }}
                                    checked={
                                        selectedInventoryIds.size > 0 && 
                                        selectedInventoryIds.size === products.filter(p => !inventoryFilterBrand || p.brand === inventoryFilterBrand).length
                                    }
                                />
                                <h4 className="font-bold text-sm text-gray-500">商品列表 ({products.filter(p => !inventoryFilterBrand || p.brand === inventoryFilterBrand).length})</h4>
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <select 
                                    value={inventoryFilterBrand} 
                                    onChange={(e) => setInventoryFilterBrand(e.target.value)}
                                    className="pl-7 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-ink transition-colors"
                                >
                                    <option value="">全部品牌</option>
                                    {Array.from(new Set(products.map(p => p.brand))).sort().map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {products
                                .filter(p => !inventoryFilterBrand || p.brand === inventoryFilterBrand)
                                .map(p => (
                                <div key={p.id} className={`bg-white p-3 flex justify-between items-center border rounded ${p.promotion?.type === 'BUNDLE' ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedInventoryIds.has(p.id)} 
                                            onChange={() => toggleInventorySelection(p.id)} 
                                            className="w-4 h-4 rounded border-gray-300 text-ink focus:ring-ink cursor-pointer" 
                                        />
                                        <div>
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                {p.name}
                                                {p.promotion?.type === 'BUNDLE' && <span className="text-[10px] bg-red-600 text-white px-1 rounded">組合包</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{p.brand} | 成本: {formatCurrency(p.costPrice)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        {p.isFeatured && <span className="text-[10px] border border-accent text-accent px-1 rounded-sm">熱門</span>}
                                        <button onClick={() => { 
                                            setEditingProduct(p); 
                                            setFormData(p); 
                                            if (p.promotion) {
                                                setPromoType(p.promotion.type);
                                                setPromoForm(p.promotion);
                                            } else {
                                                setPromoType('NONE');
                                            }
                                            window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                        }} className="text-xs border px-2 py-1 ml-2 rounded">編輯</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {subTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 text-center border border-gray-100 rounded-lg"><p className="text-[10px] uppercase tracking-widest text-gray-500">總訂單數</p><p className="text-2xl font-serif">{totalOrders}</p></div>
                            <div className="bg-white p-4 text-center border border-gray-100 rounded-lg"><p className="text-[10px] uppercase tracking-widest text-gray-500">總支數/件</p><p className="text-2xl font-serif">{totalItems}</p></div>
                            <div className="bg-white p-4 text-center border border-gray-100 rounded-lg"><p className="text-[10px] uppercase tracking-widest text-gray-500">總金額</p><p className="text-2xl font-serif">{totalRevenue.toLocaleString()}</p></div>
                        </div>

                        <div className="bg-white p-4 border border-gray-100 rounded-lg min-h-[400px]">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                                    <Zap size={16} className="text-accent"/>
                                    熱門品項排行 (總銷量)
                                </h3>
                                <div className="flex bg-gray-100 rounded p-1 gap-1">
                                    <button 
                                        onClick={() => setRankViewMode('list')} 
                                        className={`p-1 rounded ${rankViewMode === 'list' ? 'bg-white shadow text-ink' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <List size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => setRankViewMode('chart')} 
                                        className={`p-1 rounded ${rankViewMode === 'chart' ? 'bg-white shadow text-ink' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <BarChart2 size={14}/>
                                    </button>
                                </div>
                            </div>

                            {rankViewMode === 'list' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-3 py-2 w-10">#</th>
                                                <th className="px-3 py-2">品名 / 規格</th>
                                                <th 
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-200 transition-colors select-none text-right"
                                                    onClick={toggleSort}
                                                >
                                                    <div className="flex items-center justify-end gap-1">
                                                        數量 (支)
                                                        {sortDirection === 'desc' ? <ArrowUp size={12} className="text-ink"/> : <ArrowDown size={12} className="text-ink"/>}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {productRanking.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-3 font-mono text-gray-400 text-xs">{index + 1}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="font-bold text-ink">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.brand}</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-serif font-bold text-lg">
                                                        {item.quantity}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-[400px] w-full text-xs">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={productRanking.slice(0, 15)} 
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="displayName" 
                                                type="category" 
                                                width={120} 
                                                tick={{fontSize: 10}}
                                                interval={0}
                                            />
                                            <Tooltip 
                                                cursor={{fill: '#f9f9f9'}}
                                                contentStyle={{borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Bar dataKey="quantity" fill="#2b2b2b" barSize={15} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#666' }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入您的姓名');
      return;
    }
    
    const user = dataService.login(name);
    
    if (!user) {
        setError('無此帳號，請確認名稱是否正確 (Not found)');
        return;
    }
    
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-serif font-bold text-center mb-2 tracking-widest">TiAM</h1>
        <p className="text-center text-ink-light mb-12 font-serif text-sm tracking-wider uppercase">延平店 物料室管理系統</p>
        
        {!dataService.isFirebaseReady() && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-xs text-amber-800 flex gap-2 items-start">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                    <strong>注意：尚未設定雲端資料庫</strong><br/>
                    目前為「單機試用模式」，其他人無法看到您的訂單。若需多人連線，請於程式碼中設定 Firebase API。
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative border-b border-ink-light/50 focus-within:border-accent transition-colors">
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="請輸入姓名進入系統" className="w-full bg-transparent py-3 px-2 outline-none text-lg font-serif placeholder:text-ink-light/50" />
          </div>
          {error && <p className="text-accent text-xs mt-2">{error}</p>}
          <button type="submit" className="w-full bg-ink text-paper py-4 mt-8 font-bold tracking-widest hover:bg-ink-light transition-colors uppercase text-sm">進入系統</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'admin'>('shop');
  const [pricingMode, setPricingMode] = useState<PricingMode>(PricingMode.SPECIAL);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement>(dataService.getAnnouncement()); // Initial state fallback
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutPreviewOpen, setIsCheckoutPreviewOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    setIsLoadingOrders(true);
    const unsubscribeOrders = dataService.subscribeToOrders((newOrders) => {
        setOrders(newOrders);
        setIsLoadingOrders(false);
    });

    // Subscribe to Products
    const unsubscribeProducts = dataService.subscribeToProducts((newProducts) => {
        setProducts(newProducts);
    });

    // Subscribe to Announcement (Cloud Sync)
    const unsubscribeAnnouncement = dataService.subscribeToAnnouncement((newAnnouncement) => {
        setAnnouncement(newAnnouncement);
    });

    return () => {
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeProducts) unsubscribeProducts();
        if (unsubscribeAnnouncement) unsubscribeAnnouncement();
    };
  }, []);

  const refreshData = () => {
     // No need to fetch manually for subscribed data
     // Trigger any other UI refresh if needed, or leave empty
  };

  const handleLogin = (u: User) => {
    setUser(u);
    // Use the current state of announcement (populated by subscription or local fallback)
    if (announcement && announcement.isActive) {
        setShowAnnouncement(true);
    }
  };

  const updateCartItem = (product: Product, delta: number) => {
    setCart((prev: CartItem[]) => {
      const isBundle = product.promotion?.type === 'BUNDLE';
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.pricingMode === pricingMode);
      
      if (existingIndex >= 0) {
        const updatedCart = [...prev];
        const newQty = updatedCart[existingIndex].quantity + delta;
        
        if (newQty <= 0) {
           updatedCart.splice(existingIndex, 1);
        } else {
           updatedCart[existingIndex] = { 
               ...updatedCart[existingIndex], 
               quantity: newQty,
               freeQuantity: 0
           };
        }
        return updatedCart;
      } else {
        if (delta > 0) {
          const isBundle = product.promotion?.type === 'BUNDLE';
          const priceSnapshot = isBundle ? product.costPrice : calculatePrice(product.costPrice, pricingMode);
          
          return [...prev, { 
            productId: product.id, 
            quantity: 1, 
            pricingMode: pricingMode,
            snapshotPrice: priceSnapshot,
            freeQuantity: 0,
            isBundle: isBundle
          }];
        }
        return prev;
      }
    });
  };

  const placeOrder = async () => {
    if (!user || cart.length === 0) return;

    const itemsByMode = cart.reduce((acc, item) => {
      if (!acc[item.pricingMode]) acc[item.pricingMode] = [];
      acc[item.pricingMode].push(item);
      return acc;
    }, {} as Record<PricingMode, CartItem[]>);

    const orderPromises: Promise<void>[] = [];

    Object.entries(itemsByMode).forEach(([mode, items]) => {
      const orderItems = (items as CartItem[]).map((item): Order['items'][0] | null => {
        const product = products.find(p => p.id === item.productId);
        // Safety check if product was removed while in cart
        if (!product) return null;

        const isBundle = item.isBundle;

        if (isBundle && product.promotion?.type === 'BUNDLE') {
            const sets = item.quantity;
            const unitPaid = product.promotion.buy;
            const unitFree = product.promotion.get;
            
            return {
                productId: product.id,
                productName: `${product.name} (優惠組合包)`,
                quantity: sets * unitPaid,
                freeQuantity: sets * unitFree, 
                bundleQuantity: sets, 
                unitPrice: item.snapshotPrice, 
                totalPrice: (item.snapshotPrice * unitPaid) * sets,
                brand: product.brand,
                status: OrderStatus.PENDING,
                note: product.promotion?.note || '新春優惠組'
            };
        } else {
            return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                freeQuantity: 0,
                unitPrice: item.snapshotPrice,
                totalPrice: item.snapshotPrice * item.quantity,
                brand: product.brand,
                status: OrderStatus.PENDING,
                note: product.promotion?.note
            };
        }
      }).filter((item) => item !== null) as Order['items'];

      if (orderItems.length > 0) {
          const totalAmount = recalculateOrderTotal(orderItems);

          const newOrder: Order = {
            id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            userId: user.id,
            userName: user.name,
            timestamp: Date.now(),
            status: OrderStatus.PENDING,
            pricingMode: mode as PricingMode,
            items: orderItems,
            totalAmount
          };

          orderPromises.push(dataService.createOrder(newOrder));
      }
    });

    await Promise.all(orderPromises);

    setCart([]);
    setIsCheckoutPreviewOpen(false);
    setIsCartOpen(false);
    refreshData();
    setActiveTab('orders');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const CartModal = () => {
    if (!isCartOpen) return null;
    
    const total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (item.isBundle && product?.promotion?.type === 'BUNDLE') {
            const bundlePrice = item.snapshotPrice * product.promotion.buy;
            return sum + (bundlePrice * item.quantity);
        }
        return sum + (item.snapshotPrice * item.quantity);
    }, 0);

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-paper w-full max-w-md h-[80vh] sm:h-[600px] shadow-2xl flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center bg-white">
            <h2 className="font-serif text-lg font-bold">購物車 ({cart.length})</h2>
            <button onClick={() => setIsCartOpen(false)}><X size={24} className="text-gray-400 hover:text-ink"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400"><ShoppingBag size={48} className="mb-2 opacity-20"/><p>購物車是空的</p></div>
            ) : (
                cart.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;

                    const isBundle = item.isBundle;
                    let displayTotal = 0;
                    let displayQty = item.quantity;
                    let bundleTotalItems = 0;
                    let avgPrice = 0;

                    if (isBundle && product.promotion?.type === 'BUNDLE') {
                         const bundlePrice = item.snapshotPrice * product.promotion.buy;
                         displayTotal = bundlePrice * item.quantity;
                         bundleTotalItems = (product.promotion.buy + product.promotion.get) * item.quantity;
                         avgPrice = Math.round(displayTotal / bundleTotalItems);
                    } else {
                         displayTotal = item.snapshotPrice * item.quantity;
                    }

                    return (
                        <div key={idx} className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
                            <div className="flex-1">
                                <p className="font-bold flex items-center gap-2">
                                    {product.name}
                                    {isBundle && <span className="text-[10px] bg-red-600 text-white px-1 rounded">優惠組合</span>}
                                </p>
                                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-1 rounded">{item.pricingMode === PricingMode.DAILY ? '日常' : '設購日'}</span>
                                    <span>{product.brand}</span>
                                </div>
                                {isBundle && (
                                    <div className="text-gray-500 text-xs mt-1 bg-gray-50 p-1 rounded inline-block">
                                        共 {bundleTotalItems} 支，平均單價約 <span className="text-ink font-bold font-serif">{formatCurrency(avgPrice)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="font-serif text-base">{formatCurrency(displayTotal)}</span>
                                <div className="flex items-center bg-gray-50 rounded-full border border-gray-200">
                                    <button onClick={() => updateCartItem(product, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full"><Minus size={12}/></button>
                                    <span className="w-6 text-center text-xs font-bold">{displayQty}{isBundle ? '組' : ''}</span>
                                    <button onClick={() => updateCartItem(product, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full"><Plus size={12}/></button>
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
          </div>
          <div className="p-4 bg-white border-t safe-area-bottom">
            <div className="flex justify-between items-center mb-4"><span className="text-sm text-gray-500">預估總額</span><span className="font-serif text-2xl font-bold">{formatCurrency(total)}</span></div>
            <button onClick={() => { setIsCartOpen(false); setIsCheckoutPreviewOpen(true); }} disabled={cart.length === 0} className="w-full bg-ink text-white py-3 font-bold tracking-widest hover:bg-ink-light transition-colors disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">前往結帳 <ArrowRight size={16}/></button>
          </div>
        </div>
      </div>
    );
  };

  const CheckoutPreviewModal = () => {
      if (!isCheckoutPreviewOpen) return null;
      
      const total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (item.isBundle && product?.promotion?.type === 'BUNDLE') {
            const bundlePrice = item.snapshotPrice * product.promotion.buy;
            return sum + (bundlePrice * item.quantity);
        }
        return sum + (item.snapshotPrice * item.quantity);
      }, 0);
  
      return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center items-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-white"><h2 className="font-serif text-lg font-bold flex items-center gap-2"><CheckCircle size={20} className="text-green-600"/> 確認訂單內容</h2><button onClick={() => setIsCheckoutPreviewOpen(false)}><X size={24} className="text-gray-400 hover:text-ink"/></button></div>
            <div className="p-6 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-4">請確認以下商品無誤，送出後將產生領料單。</p>
                
                {announcement && announcement.isActive && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-xs text-red-700 leading-relaxed font-bold flex items-start gap-2">
                        <Megaphone size={16} className="shrink-0 mt-0.5" />
                        <div>
                           本次款項將分兩期於 1、2 月薪資扣除。
                        </div>
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 mb-6">
                    {cart.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;

                        const isBundle = item.isBundle;
                        let displayTotal = 0;
                        let displayAvgText = null;

                        if (isBundle && product.promotion?.type === 'BUNDLE') {
                             const bundlePrice = item.snapshotPrice * product.promotion.buy;
                             displayTotal = bundlePrice * item.quantity;
                             const totalUnits = (product.promotion.buy + product.promotion.get) * item.quantity;
                             const avgPrice = Math.round(displayTotal / totalUnits);
                             displayAvgText = `共 ${totalUnits} 支，平均單價約 ${formatCurrency(avgPrice)}`;
                        } else {
                             displayTotal = item.snapshotPrice * item.quantity;
                        }

                        return (
                            <div key={idx} className="p-3 flex justify-between text-sm">
                                <div>
                                    <span className="font-bold flex items-center gap-2">
                                        {product.name}
                                        {isBundle && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">優惠組</span>}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div>x{item.quantity} {isBundle ? '組' : ''}</div>
                                    <div className="font-serif">{formatCurrency(displayTotal)}</div>
                                    {displayAvgText && (
                                        <div className="text-[10px] text-gray-400 mt-1 bg-gray-50 px-1 rounded">
                                            {displayAvgText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between items-end border-t border-dashed border-gray-300 pt-4 mb-2"><span className="text-sm font-bold">總計金額</span><span className="text-3xl font-serif font-bold text-accent">{formatCurrency(total)}</span></div>
            </div>
            <div className="p-4 bg-white border-t flex gap-3 safe-area-bottom">
                <button onClick={() => setIsCheckoutPreviewOpen(false)} className="flex-1 bg-white border border-gray-300 text-ink py-3 font-bold rounded-lg">再想想</button>
                <button onClick={placeOrder} className="flex-[2] bg-ink text-white py-3 font-bold tracking-widest rounded-lg hover:bg-ink-light">確認下單</button>
            </div>
          </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent selection:text-white pb-safe">
      <main className="w-full max-w-md md:max-w-lg mx-auto min-h-screen bg-white shadow-xl relative overflow-hidden transition-all duration-300">
        
        {activeTab === 'shop' && (
          <ShopView 
            products={products} 
            pricingMode={pricingMode} 
            cart={cart} 
            updateCartItem={updateCartItem} 
            onLogout={() => { setUser(null); }}
          />
        )}
        {activeTab === 'orders' && (
          <MyOrdersView 
            orders={orders} 
            user={user} 
            loading={isLoadingOrders}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView 
            orders={orders} 
            products={products} 
            onRefresh={refreshData}
            onLogout={() => { setUser(null); setActiveTab('shop'); }}
            announcement={announcement}
          />
        )}

        {activeTab === 'shop' && (
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`fixed bottom-24 right-4 md:right-[calc(50%-28px+256px)] bg-ink text-white w-14 h-14 rounded-full shadow-xl z-30 flex items-center justify-center transition-transform active:scale-95 ${cart.length > 0 ? 'animate-bounce-subtle' : 'opacity-80'}`}
            >
                <ShoppingBag size={24} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </button>
        )}

        <nav className="fixed bottom-0 w-full max-w-md md:max-w-lg bg-white border-t border-gray-200 flex justify-around py-3 pb-safe z-40 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <button onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 ${activeTab === 'shop' ? 'text-ink' : 'hover:text-gray-600'}`}><ShoppingBag size={20} strokeWidth={activeTab === 'shop' ? 2 : 1.5} /><span>商店</span></button>
            <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-ink' : 'hover:text-gray-600'}`}><UserIcon size={20} strokeWidth={activeTab === 'orders' ? 2 : 1.5} /><span>我的訂單</span></button>
            {user.role === UserRole.ADMIN && (
                <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 ${activeTab === 'admin' ? 'text-ink' : 'hover:text-gray-600'}`}><Settings size={20} strokeWidth={activeTab === 'admin' ? 2 : 1.5} /><span>管理後台</span></button>
            )}
        </nav>

        <CartModal />
        <CheckoutPreviewModal />
        
        {announcement && showAnnouncement && (
            <AnnouncementModal announcement={announcement} onClose={() => setShowAnnouncement(false)} />
        )}

      </main>
    </div>
  );
}