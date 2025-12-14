import { Product, User, UserRole, Order, OrderStatus, Announcement } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCjkeRsHK4aorIAnzbJLZsoh_ATwRcyddg",
  authDomain: "gen-lang-client-0685987646.firebaseapp.com",
  projectId: "gen-lang-client-0685987646",
  storageBucket: "gen-lang-client-0685987646.firebasestorage.app",
  messagingSenderId: "542931685916",
  appId: "1:542931685916:web:2378d2bcae1f76984585d9",
  measurementId: "G-02F4PX5B9Z"
};

let db: Firestore | null = null;
let isDbEnabled = false;

try {
    // Standard modular initialization
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isDbEnabled = true;
    console.log('[System] Firebase initialized successfully. Multi-user mode active.');
} catch (e) {
    console.error('[System] Firebase initialization failed, falling back to local mode:', e);
}

const KEYS = {
  USERS: 'tiam_users',
  PRODUCTS: 'tiam_products',
  ANNOUNCEMENT: 'tiam_announcement',
  LOCAL_ORDERS: 'tiam_orders_fallback'
};

// Valid User List
const VALID_USERS = [
  'Cooper', 'Dio', 'Eagle', 'Benson', 'Ice', 'Fan', 
  'Sasa', 'Yuni', 'Gene', 'Reta', 'Jessica', 'Mina', 
  'Jax', '中平', '中正', '民生', '公司'
];

// Promotion Config for New Year
const NEW_YEAR_PROMO = { type: 'BUNDLE', buy: 2, get: 1, note: '新春優惠組' } as const;

const INITIAL_ANNOUNCEMENT: Announcement = {
  title: '系統公告',
  content: '歡迎使用 TiAM 物料管理系統',
  isActive: true
};

// Parsed from CSV
const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod_001', brand: 'EX', name: 'O2髮油', costPrice: 450, isActive: true, isFeatured: false },
  { id: 'prod_002', brand: 'EX', name: 'O2 洗浴組', costPrice: 1800, isActive: true, isFeatured: false },
  { id: 'prod_003', brand: 'EX', name: '漂粉400g', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_004', brand: 'EX', name: '『活動』原辮髮45cm（18) 吋', costPrice: 4800, isActive: true, isFeatured: false },
  { id: 'prod_005', brand: 'EX', name: '『活動』原辮髮50cm（20）吋', costPrice: 4900, isActive: true, isFeatured: false },
  { id: 'prod_006', brand: 'EX', name: '『活動』原辮髮55cm（22）吋', costPrice: 5350, isActive: true, isFeatured: false },
  { id: 'prod_007', brand: 'EX', name: '『活動』原辮髮60cm（24）吋', costPrice: 5450, isActive: true, isFeatured: false },
  { id: 'prod_008', brand: 'EX', name: '『活動』原辮髮65cm（26）吋', costPrice: 6200, isActive: true, isFeatured: false },
  { id: 'prod_009', brand: 'EX', name: '金髮好髮原辮髮55cm（22）吋', costPrice: 6150, isActive: true, isFeatured: false },
  { id: 'prod_010', brand: 'EX', name: '好髮原辮髮55cm（22）吋', costPrice: 5650, isActive: true, isFeatured: false },
  { id: 'prod_011', brand: 'EX', name: '好髮原辮髮45cm（18) 吋', costPrice: 5100, isActive: true, isFeatured: false },
  { id: 'prod_012', brand: 'Fiole', name: '8GP', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_013', brand: 'Fiole', name: 'MB8', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_014', brand: 'Fiole', name: 'G6', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_015', brand: 'Fiole', name: 'V10', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_16', brand: 'Fiole', name: '10GP', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_017', brand: 'Fiole', name: 'BV8', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_018', brand: 'Fiole', name: 'BV6', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_019', brand: 'Fiole', name: 'RADICE 4NB', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_020', brand: 'Fiole', name: '綻放柔妝燙Sc1', costPrice: 500, isActive: true, isFeatured: false },
  { id: 'prod_021', brand: 'Fiole', name: '蜜桃粉 6', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_022', brand: 'Fiole', name: '綻放染劑2nn', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_023', brand: 'Fiole', name: '10GNB', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_024', brand: 'Fiole', name: '羅馬紅7Red7', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_025', brand: 'Fiole', name: '8NB 120ml (Fiole)', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_026', brand: 'Fiole', name: '露西亞5', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_027', brand: 'Fiole', name: 'B8', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_028', brand: 'Fiole', name: '3MT', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_029', brand: 'Fiole', name: '12NN', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_030', brand: 'Fiole', name: 'B6', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_031', brand: 'Fiole', name: '12MT', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_032', brand: 'Fiole', name: '黑曜光感1', costPrice: 1300, isActive: true, isFeatured: false },
  { id: 'prod_033', brand: 'Fiole', name: '黑曜光感2M', costPrice: 1800, isActive: true, isFeatured: false },
  { id: 'prod_034', brand: 'Fiole', name: '黑曜光感3', costPrice: 1300, isActive: true, isFeatured: false },
  { id: 'prod_035', brand: 'Fiole', name: '2s 黑曜光感2S', costPrice: 1800, isActive: true, isFeatured: false },
  { id: 'prod_036', brand: 'Fiole', name: '4 黑曜光感４', costPrice: 1800, isActive: true, isFeatured: false },
  { id: 'prod_037', brand: 'Fiole', name: '露西亞增色髮露-仙氣粉250ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_038', brand: 'Fiole', name: '露西亞增色髮露-清水灰 250ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_039', brand: 'Fiole', name: '露西亞矯色髮露-極光紫250ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_040', brand: 'Fiole', name: '增色髮露極光紫1000ml', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_041', brand: 'Fiole', name: '增色髮露仙氣粉1000ml', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_042', brand: 'Fiole', name: '增色髮露清水灰1000ml', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_043', brand: 'Fiole', name: '一日之計。日出花語', costPrice: 1200, isActive: true, isFeatured: false },
  { id: 'prod_044', brand: 'Fiole', name: '露西亞增色髮露-琥珀橘250ML', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_045', brand: 'Fiole', name: '露西亞增色髮露-琥珀橘1L', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_046', brand: 'Fiole', name: '原子隔離噴霧', costPrice: 350, isActive: true, isFeatured: false },
  { id: 'prod_047', brand: 'Fiole', name: '噴噴造型噴霧', costPrice: 385, isActive: true, isFeatured: false },
  { id: 'prod_048', brand: 'Fiole', name: '強力造型蠟', costPrice: 475, isActive: true, isFeatured: false },
  { id: 'prod_049', brand: 'Fiole', name: '露西亞矯色髮露-(大瓶）奶霜棕1000ml', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_050', brand: 'Fiole', name: '艾得極潤護補充包800ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_051', brand: 'Fiole', name: '布朗棕', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_052', brand: 'Fiole', name: '布朗棕', costPrice: 1050, isActive: true, isFeatured: false },
  { id: 'prod_053', brand: 'Fiole', name: '漂漂惹人愛油', costPrice: 650, isActive: true, isFeatured: false },
  { id: 'prod_054', brand: 'Fiole', name: '露西亞矯色髮露-奶霜色250ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_055', brand: 'KH', name: 'KH魔術直髮霜1劑', costPrice: 630, isActive: true, isFeatured: false },
  { id: 'prod_056', brand: 'KH', name: '珍珠燙1劑', costPrice: 520, isActive: true, isFeatured: false },
  { id: 'prod_057', brand: 'KH', name: '珍珠燙2劑', costPrice: 160, isActive: true, isFeatured: false },
  { id: 'prod_058', brand: 'KH', name: 'Magic pink粉紅護髮', costPrice: 1500, isActive: true, isFeatured: false },
  { id: 'prod_059', brand: 'KORI', name: '水光系列角蛋白 500ml', costPrice: 1650, isActive: true, isFeatured: false },
  { id: 'prod_060', brand: 'KORI', name: '角蛋白護色免沖洗250ml', costPrice: 550, isActive: true, isFeatured: false },
  { id: 'prod_061', brand: 'KORI', name: '氧氣前導凝膠 250ml', costPrice: 900, isActive: true, isFeatured: false },
  { id: 'prod_062', brand: 'KORI', name: '角蛋白水乳', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_063', brand: 'KORI', name: '仙杜瑞拉深層洗髮精1000ml', costPrice: 1000, isActive: true, isFeatured: false },
  { id: 'prod_064', brand: 'KORI', name: '仙杜瑞拉離子護-直髮1000ml', costPrice: 12000, isActive: true, isFeatured: false },
  { id: 'prod_065', brand: 'KORI', name: '仙杜瑞拉離子噴霧250ml', costPrice: 1000, isActive: true, isFeatured: false },
  { id: 'prod_066', brand: 'KORI', name: '豐盈護理敷膜 500ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_067', brand: 'KORI', name: '角蛋白髮膜300ml', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_068', brand: 'KORI', name: '角蛋白髮膜500ml', costPrice: 1000, isActive: true, isFeatured: false },
  { id: 'prod_069', brand: 'TiAM', name: 'C60淨化平衡液', costPrice: 200, isActive: true, isFeatured: false },
  { id: 'prod_070', brand: 'TiAM', name: '網紅飲料杯套', costPrice: 100, isActive: true, isFeatured: false },
  { id: 'prod_071', brand: 'TiAM', name: '電風扇', costPrice: 250, isActive: true, isFeatured: false },
  { id: 'prod_072', brand: '京喚羽', name: '白松露重建賦活露200ml', costPrice: 640, isActive: true, isFeatured: false },
  { id: 'prod_073', brand: '京喚羽', name: '(新) 京喚羽恆潤', costPrice: 528, isActive: true, isFeatured: false },
  { id: 'prod_074', brand: '京喚羽', name: '喚羽凝脂 200g', costPrice: 780, isActive: true, isFeatured: false },
  { id: 'prod_075', brand: '京喚羽', name: '(新) 喚羽凝脂 400g', costPrice: 1320, isActive: true, isFeatured: false },
  { id: 'prod_076', brand: '京喚羽', name: '(新)喚羽精華 100ml', costPrice: 1020, isActive: true, isFeatured: false },
  { id: 'prod_077', brand: '京喚羽', name: '(新) 金喚羽京澤100ml', costPrice: 1140, isActive: true, isFeatured: false },
  { id: 'prod_078', brand: '京喚羽', name: '(新) 金喚羽凝脂 400g', costPrice: 1620, isActive: true, isFeatured: false },
  { id: 'prod_079', brand: '京喚羽', name: '(新) 金喚羽淨露400g', costPrice: 1620, isActive: true, isFeatured: false },
  { id: 'prod_080', brand: '京喚羽', name: '金喚羽凝脂200ml', costPrice: 900, isActive: true, isFeatured: false },
  { id: 'prod_081', brand: '京喚羽', name: '金喚羽淨露200g', costPrice: 900, isActive: true, isFeatured: false },
  { id: 'prod_082', brand: '京喚羽', name: '(新) 喚羽淨露 400ml', costPrice: 1320, isActive: true, isFeatured: false },
  { id: 'prod_083', brand: '京喚羽', name: '(新)TOKIO 3M', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_084', brand: '京喚羽', name: '(新)TOKIO 4M', costPrice: 1500, isActive: true, isFeatured: false },
  { id: 'prod_085', brand: '京喚羽', name: '(新) TOKIO 0', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_086', brand: '京喚羽', name: '(新) TOKIO１', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_087', brand: '京喚羽', name: '(新)TOKIO 2M', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_088', brand: '京喚羽', name: '(新)TOKIO 2S', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_089', brand: '京喚羽', name: '（新）京喚羽淨露補充包700ml', costPrice: 1860, isActive: true, isFeatured: false },
  { id: 'prod_090', brand: '京喚羽', name: '金喚羽京澤（補)', costPrice: 2000, isActive: true, isFeatured: false },
  { id: 'prod_091', brand: '京喚羽', name: 'JRD1EX400 D1EX 400g', costPrice: 1300, isActive: true, isFeatured: false },
  { id: 'prod_092', brand: '京喚羽', name: 'JRD1H1L D1H 1000g', costPrice: 2300, isActive: true, isFeatured: false },
  { id: 'prod_093', brand: '京喚羽', name: 'D1N 1000g', costPrice: 2300, isActive: true, isFeatured: false },
  { id: 'prod_094', brand: '京喚羽', name: 'D1S 1000g', costPrice: 2300, isActive: true, isFeatured: false },
  { id: 'prod_095', brand: '京喚羽', name: 'D2 1000g', costPrice: 2300, isActive: true, isFeatured: false },
  { id: 'prod_096', brand: '京喚羽', name: 'D3c 1000g', costPrice: 1900, isActive: true, isFeatured: false },
  { id: 'prod_097', brand: '京喚羽', name: 'D3EX 400g', costPrice: 750, isActive: true, isFeatured: false },
  { id: 'prod_098', brand: '京喚羽', name: 'D3L 1000g', costPrice: 2300, isActive: true, isFeatured: false },
  { id: 'prod_099', brand: '京喚羽', name: 'D4 250g', costPrice: 1400, isActive: true, isFeatured: false },
  { id: 'prod_100', brand: '京喚羽', name: '(新) 前導喚羽淨露1000ml', costPrice: 1700, isActive: true, isFeatured: false },
  { id: 'prod_101', brand: '京喚羽', name: '(新)TOKIO 3S', costPrice: 2800, isActive: true, isFeatured: false },
  { id: 'prod_102', brand: '京喚羽', name: '(新)TOKIO 4S', costPrice: 1500, isActive: true, isFeatured: false },
  { id: 'prod_103', brand: '京喚羽', name: 'Buffer 酸鹼平衡劑 1000ml', costPrice: 1900, isActive: true, isFeatured: false },
  { id: 'prod_104', brand: '京喚羽', name: '熱導京煥羽恆潤 50g', costPrice: 440, isActive: true, isFeatured: false },
  { id: 'prod_105', brand: '吉樂多多行銷', name: '吹風機', costPrice: 2564, isActive: true, isFeatured: false },
  { id: 'prod_106', brand: '吉樂多多行銷', name: '風罩', costPrice: 200, isActive: true, isFeatured: false },
  { id: 'prod_107', brand: '哥德式', name: 'NL-SH1閃亮溫塑燙（一劑）', costPrice: 500, isActive: true, isFeatured: false },
  { id: 'prod_108', brand: '哥德式', name: '水光系列Ｍ4一劑（紫） 400ml', costPrice: 700, isActive: true, isFeatured: false },
  { id: 'prod_109', brand: '哥德式', name: '水光系列Ｍ4二劑（紫） 400ml', costPrice: 350, isActive: true, isFeatured: false },
  { id: 'prod_110', brand: '哥德式', name: '13-Am(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_111', brand: '哥德式', name: '13-SI(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_112', brand: '哥德式', name: 'P-BE(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_113', brand: '哥德式', name: 'P-BL(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_114', brand: '哥德式', name: 'P-OR(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_115', brand: '哥德式', name: 'P-PK(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_116', brand: '哥德式', name: '9-Sa(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_117', brand: '哥德式', name: '9-Am(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_118', brand: '哥德式', name: '9-S1(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_119', brand: '哥德式', name: '13-Gp(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_120', brand: '哥德式', name: '13-Sa(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_121', brand: '哥德式', name: 'b6-SB(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_122', brand: '哥德式', name: 'b7-SB(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_123', brand: '哥德式', name: 'b9-SB(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_124', brand: '哥德式', name: '13-CL(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_125', brand: '哥德式', name: 'BL(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_126', brand: '哥德式', name: 'YL(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_127', brand: '哥德式', name: '喚癮染膏-OR 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_128', brand: '哥德式', name: '7N-CR 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_129', brand: '哥德式', name: '13N-WM 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_130', brand: '哥德式', name: '喚癮染膏BR 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_131', brand: '哥德式', name: '7-Sa 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_132', brand: '哥德式', name: '7-Am 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_133', brand: '哥德式', name: '7-S1 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_134', brand: '哥德式', name: '13N-CR 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_135', brand: '哥德式', name: 'P-SI 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_136', brand: '哥德式', name: 'P-VL 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_137', brand: '哥德式', name: 'b6-NB(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_138', brand: '哥德式', name: '晶采雙氧乳3%', costPrice: 380, isActive: true, isFeatured: false },
  { id: 'prod_139', brand: '哥德式', name: '晶采雙氧乳6%', costPrice: 385, isActive: true, isFeatured: false },
  { id: 'prod_140', brand: '哥德式', name: 'b7-PB', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_141', brand: '哥德式', name: 'b7-AB', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_142', brand: '哥德式', name: '喚癮雙氧乳9%', costPrice: 385, isActive: true, isFeatured: false },
  { id: 'prod_143', brand: '哥德式', name: '喚癮雙氧乳12%', costPrice: 385, isActive: true, isFeatured: false },
  { id: 'prod_144', brand: '哥德式', name: 'b5-BB 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_145', brand: '哥德式', name: 'b5-SB 80g', costPrice: 185, isActive: true, isFeatured: false },
  { id: 'prod_146', brand: '哥德式', name: 'b7-BB 80g', costPrice: 185, isActive: true, isFeatured: false },
  { id: 'prod_147', brand: '哥德式', name: '7N-WM 80g', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_148', brand: '哥德式', name: 'b6-BB(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_149', brand: '哥德式', name: '7-Em', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_150', brand: '哥德式', name: 'B5-NB', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_151', brand: '哥德式', name: 'B9-NB', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_152', brand: '哥德式', name: '9-Em(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_153', brand: '哥德式', name: 'VL(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_154', brand: '哥德式', name: 'RD(80g)', costPrice: 195, isActive: true, isFeatured: false },
  { id: 'prod_155', brand: '哥德式', name: 'GL柔漾護髮1+ (600g)', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_156', brand: '哥德式', name: 'GL柔漾護髮1X (600g)', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_157', brand: '哥德式', name: 'GL柔漾護髮2劑 (600g)', costPrice: 1200, isActive: true, isFeatured: false },
  { id: 'prod_158', brand: '哥德式', name: 'GL柔漾護髮3+ (600g)', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_159', brand: '哥德式', name: 'GL柔漾護髮3X (600g)', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_160', brand: '哥德式', name: 'GL柔漾護髮4+ (9gx4x10排)', costPrice: 1500, isActive: true, isFeatured: false },
  { id: 'prod_161', brand: '哥德式', name: 'GL柔漾護髮4X(9gx4x10排)', costPrice: 1500, isActive: true, isFeatured: false },
  { id: 'prod_162', brand: '哥德式', name: 'My Force NO.4 300ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_163', brand: '哥德式', name: 'My Force NO.5 300ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_164', brand: '哥德式', name: 'My Force NO.7 500g', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_165', brand: '哥德式', name: 'My Force NO.10 500g', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_166', brand: '哥德式', name: 'My Force NO.11 300ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_167', brand: '哥德式', name: 'My Force NO.12 36g', costPrice: 180, isActive: true, isFeatured: false },
  { id: 'prod_168', brand: '哥德式', name: '生命果乳GE (粉)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_169', brand: '哥德式', name: '生命果油LS (黃)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_170', brand: '哥德式', name: '生命果油GS (橘)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_171', brand: '哥德式', name: '極潤果油BC (紫)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_172', brand: '哥德式', name: '極潤果露BG (紫)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_173', brand: '哥德式', name: '生命果油MS (綠)', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_174', brand: '哥德式', name: '四重奏雪球藍（R)200g', costPrice: 450, isActive: true, isFeatured: false },
  { id: 'prod_175', brand: '哥德式', name: '水光系列CMC 200ml', costPrice: 800, isActive: true, isFeatured: false },
  { id: 'prod_176', brand: '哥德式', name: '啞光5D噴霧120g', costPrice: 425, isActive: true, isFeatured: false },
  { id: 'prod_177', brand: '哥德式', name: '舞動造型噴霧（180g)塑型藍', costPrice: 300, isActive: true, isFeatured: false },
  { id: 'prod_178', brand: '哥德式', name: '凝光髮霜 40g', costPrice: 425, isActive: true, isFeatured: false },
  { id: 'prod_179', brand: '哥德式', name: 'GL柔漾護髮素VL 500g', costPrice: 1000, isActive: true, isFeatured: false },
  { id: 'prod_180', brand: '哥德式', name: '凝光髮油90ml', costPrice: 425, isActive: true, isFeatured: false },
  { id: 'prod_181', brand: '哥德式', name: '柔光感造型慕斯 NO.7', costPrice: 300, isActive: true, isFeatured: false },
  { id: 'prod_182', brand: '哥德式', name: '柔光感造型慕斯 NO.4', costPrice: 300, isActive: true, isFeatured: false },
  { id: 'prod_183', brand: '哥德式', name: '凝光髮膠150g', costPrice: 425, isActive: true, isFeatured: false },
  { id: 'prod_184', brand: '哥德式', name: '柔光感造型慕斯 NO.5', costPrice: 300, isActive: true, isFeatured: false },
  { id: 'prod_185', brand: '哥德式', name: 'GL柔漾洗髮精SL 200ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_186', brand: '哥德式', name: 'GL柔漾洗髮精SL 500ml', costPrice: 850, isActive: true, isFeatured: false },
  { id: 'prod_187', brand: '哥德式', name: 'GL柔漾洗髮精VL 200ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_188', brand: '哥德式', name: 'GL柔漾洗髮精VL', costPrice: 850, isActive: true, isFeatured: false },
  { id: 'prod_189', brand: '哥德式', name: 'GL柔漾洗髮精WL 200ml', costPrice: 400, isActive: true, isFeatured: false },
  { id: 'prod_190', brand: '哥德式', name: 'GL柔漾洗髮精WL 500ml', costPrice: 850, isActive: true, isFeatured: false },
  { id: 'prod_191', brand: '哥德式', name: 'GL柔漾護髮素SL 200g', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_192', brand: '哥德式', name: 'GL柔漾護髮素SL 500g', costPrice: 1000, isActive: true, isFeatured: false },
  { id: 'prod_193', brand: '哥德式', name: 'GL柔漾護髮素VL 200g', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_194', brand: '哥德式', name: 'GL柔漾護髮素WL 200g', costPrice: 600, isActive: true, isFeatured: false },
  { id: 'prod_195', brand: '哥德式', name: 'GL柔漾護髮素WL 500g', costPrice: 1000, isActive: true, isFeatured: false },
  // Wajass New Year Bundles (Simplified for brevity, assuming full list exists in real deployment)
  { id: 'prod_196', brand: '威傑士', name: '7/713 NEW ZERO', costPrice: 230, isActive: true, isFeatured: false, promotion: NEW_YEAR_PROMO },
];

export const dataService = {
  // Check if Firebase is ready
  isFirebaseReady: () => isDbEnabled,

  // Users
  login: (inputName: string): User | null => {
    const normalizedInput = inputName.trim().toLowerCase();
    const match = VALID_USERS.find(u => u.toLowerCase() === normalizedInput);
    if (!match) return null;
    const role = match.toLowerCase() === 'cooper' ? UserRole.ADMIN : UserRole.DESIGNER;
    return { id: match, name: match, role };
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

  // Products (Keep local for now as it's static catalog)
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      // In a real app, we might seed this to Firestore once
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProduct: (product: Product) => {
    const products = dataService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) products[index] = product;
    else products.push(product);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = dataService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // --- REAL-TIME ORDER SYSTEM (FIRESTORE) ---

  // Subscribe to orders (Real-time listener)
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    if (!isDbEnabled || !db) {
        // Fallback to local storage if no DB
        const stored = localStorage.getItem(KEYS.LOCAL_ORDERS);
        callback(stored ? JSON.parse(stored) : []);
        
        // Polling to simulate simple updates in local mode
        const interval = setInterval(() => {
             const current = localStorage.getItem(KEYS.LOCAL_ORDERS);
             if (current) callback(JSON.parse(current));
        }, 2000);
        return () => clearInterval(interval);
    }

    // Modular Syntax
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      callback(orders);
    }, (error) => {
        console.error("Error fetching orders:", error);
    });

    return unsubscribe;
  },

  createOrder: async (order: Order) => {
    if (isDbEnabled && db) {
        // We use setDoc with order.id to ensure ID consistency if generated on client
        await setDoc(doc(db, "orders", order.id), order);
    } else {
        const orders = dataService.getOrdersLocalFallback();
        orders.unshift(order);
        localStorage.setItem(KEYS.LOCAL_ORDERS, JSON.stringify(orders));
    }
  },

  updateOrder: async (updatedOrder: Order) => {
    if (isDbEnabled && db) {
        const orderRef = doc(db, "orders", updatedOrder.id);
        await updateDoc(orderRef, { ...updatedOrder });
    } else {
        const orders = dataService.getOrdersLocalFallback();
        const index = orders.findIndex(o => o.id === updatedOrder.id);
        if (index >= 0) {
            orders[index] = updatedOrder;
            localStorage.setItem(KEYS.LOCAL_ORDERS, JSON.stringify(orders));
        }
    }
  },

  updateOrderBatch: async (updatedOrders: Order[]) => {
      if (isDbEnabled && db) {
          const promises = updatedOrders.map(o => {
             const orderRef = doc(db, "orders", o.id);
             return updateDoc(orderRef, { ...o });
          });
          await Promise.all(promises);
      } else {
        const currentOrders = dataService.getOrdersLocalFallback();
        const updatesMap = new Map(updatedOrders.map(o => [o.id, o]));
        const newOrders = currentOrders.map(o => updatesMap.get(o.id) || o);
        localStorage.setItem(KEYS.LOCAL_ORDERS, JSON.stringify(newOrders));
      }
  },

  deleteOrder: async (id: string) => {
      if (isDbEnabled && db) {
          await deleteDoc(doc(db, "orders", id));
      } else {
          const orders = dataService.getOrdersLocalFallback().filter(o => o.id !== id);
          localStorage.setItem(KEYS.LOCAL_ORDERS, JSON.stringify(orders));
      }
  },

  // Helper for fallback mode
  getOrdersLocalFallback: (): Order[] => {
      const stored = localStorage.getItem(KEYS.LOCAL_ORDERS);
      return stored ? JSON.parse(stored) : [];
  }
};