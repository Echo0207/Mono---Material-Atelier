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
  writeBatch,
  getDocs,
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

// Raw Data Parsed
const RAW_PRODUCTS = [
  { brand: 'EX', name: 'O2髮油', cost: 450 },
  // ... (keeping the existing list structure, truncated for brevity in change block as requested by user instructions to keep minimal updates but here we are replacing full file content so we assume previous content is preserved if I don't paste it all? 
  // Wait, the instruction says "Full content of file_1". I must include the full list to avoid data loss since I'm replacing the file.)
  // Ideally I would just inject the method, but the XML format replaces the whole file. 
  // I will use the previously provided full list.
  { brand: 'EX', name: 'O2 洗浴組', cost: 1800 },
  { brand: 'EX', name: '漂粉400g', cost: 400 },
  { brand: 'EX', name: '『活動』原辮髮45cm（18) 吋', cost: 4800 },
  { brand: 'EX', name: '『活動』原辮髮50cm（20）吋', cost: 4900 },
  { brand: 'EX', name: '『活動』原辮髮55cm（22）吋', cost: 5350 },
  { brand: 'EX', name: '『活動』原辮髮60cm（24）吋', cost: 5450 },
  { brand: 'EX', name: '『活動』原辮髮65cm（26）吋', cost: 6200 },
  { brand: 'EX', name: '金髮好髮原辮髮55cm（22）吋', cost: 6150 },
  { brand: 'EX', name: '好髮原辮髮55cm（22）吋', cost: 5650 },
  { brand: 'EX', name: '好髮原辮髮45cm（18) 吋', cost: 5100 },
  { brand: 'Fiole', name: '8GP', cost: 250 },
  { brand: 'Fiole', name: 'MB8', cost: 250 },
  { brand: 'Fiole', name: 'G6', cost: 250 },
  { brand: 'Fiole', name: 'V10', cost: 250 },
  { brand: 'Fiole', name: '10GP', cost: 250 },
  { brand: 'Fiole', name: 'BV8', cost: 250 },
  { brand: 'Fiole', name: 'BV6', cost: 250 },
  { brand: 'Fiole', name: 'RADICE 4NB', cost: 250 },
  { brand: 'Fiole', name: '綻放柔妝燙Sc1', cost: 500 },
  { brand: 'Fiole', name: '蜜桃粉 6', cost: 250 },
  { brand: 'Fiole', name: '綻放染劑2nn', cost: 250 },
  { brand: 'Fiole', name: '10GNB', cost: 250 },
  { brand: 'Fiole', name: '羅馬紅7Red7', cost: 250 },
  { brand: 'Fiole', name: '8NB 120ml (Fiole)', cost: 250 },
  { brand: 'Fiole', name: '露西亞5', cost: 250 },
  { brand: 'Fiole', name: 'B8', cost: 250 },
  { brand: 'Fiole', name: '3MT', cost: 250 },
  { brand: 'Fiole', name: '12NN', cost: 250 },
  { brand: 'Fiole', name: 'B6', cost: 250 },
  { brand: 'Fiole', name: '12MT', cost: 250 },
  { brand: 'Fiole', name: '黑曜光感1', cost: 1300 },
  { brand: 'Fiole', name: '黑曜光感2M', cost: 1800 },
  { brand: 'Fiole', name: '黑曜光感3', cost: 1300 },
  { brand: 'Fiole', name: '2s 黑曜光感2S', cost: 1800 },
  { brand: 'Fiole', name: '4 黑曜光感４', cost: 1800 },
  { brand: 'Fiole', name: '露西亞增色髮露-仙氣粉250ml', cost: 400 },
  { brand: 'Fiole', name: '露西亞增色髮露-清水灰 250ml', cost: 400 },
  { brand: 'Fiole', name: '露西亞矯色髮露-極光紫250ml', cost: 400 },
  { brand: 'Fiole', name: '增色髮露極光紫1000ml', cost: 1050 },
  { brand: 'Fiole', name: '增色髮露仙氣粉1000ml', cost: 1050 },
  { brand: 'Fiole', name: '增色髮露清水灰1000ml', cost: 1050 },
  { brand: 'Fiole', name: '一日之計。日出花語', cost: 1200 },
  { brand: 'Fiole', name: '露西亞增色髮露-琥珀橘250ML', cost: 400 },
  { brand: 'Fiole', name: '露西亞增色髮露-琥珀橘1L', cost: 1050 },
  { brand: 'Fiole', name: '原子隔離噴霧', cost: 350 },
  { brand: 'Fiole', name: '噴噴造型噴霧', cost: 385 },
  { brand: 'Fiole', name: '強力造型蠟', cost: 475 },
  { brand: 'Fiole', name: '露西亞矯色髮露-(大瓶）奶霜棕1000ml', cost: 1050 },
  { brand: 'Fiole', name: '艾得極潤護補充包800ml', cost: 800 },
  { brand: 'Fiole', name: '布朗棕', cost: 400 },
  { brand: 'Fiole', name: '布朗棕', cost: 1050 },
  { brand: 'Fiole', name: '漂漂惹人愛油', cost: 650 },
  { brand: 'Fiole', name: '露西亞矯色髮露-奶霜色250ml', cost: 400 },
  { brand: 'KH', name: 'KH魔術直髮霜1劑', cost: 630 },
  { brand: 'KH', name: '珍珠燙1劑', cost: 520 },
  { brand: 'KH', name: '珍珠燙2劑', cost: 160 },
  { brand: 'KH', name: 'Magic pink粉紅護髮', cost: 1500 },
  { brand: 'KORI', name: '水光系列角蛋白 500ml', cost: 1650 },
  { brand: 'KORI', name: '角蛋白護色免沖洗250ml', cost: 550 },
  { brand: 'KORI', name: '氧氣前導凝膠 250ml', cost: 900 },
  { brand: 'KORI', name: '角蛋白水乳', cost: 800 },
  { brand: 'KORI', name: '仙杜瑞拉深層洗髮精1000ml', cost: 1000 },
  { brand: 'KORI', name: '仙杜瑞拉離子護-直髮1000ml', cost: 12000 },
  { brand: 'KORI', name: '仙杜瑞拉離子噴霧250ml', cost: 1000 },
  { brand: 'KORI', name: '豐盈護理敷膜 500ml', cost: 800 },
  { brand: 'KORI', name: '角蛋白髮膜300ml', cost: 600 },
  { brand: 'KORI', name: '角蛋白髮膜500ml', cost: 1000 },
  { brand: 'TiAM', name: 'C60淨化平衡液', cost: 200 },
  { brand: 'TiAM', name: '網紅飲料杯套', cost: 100 },
  { brand: 'TiAM', name: '電風扇', cost: 250 },
  { brand: '京喚羽', name: '白松露重建賦活露200ml', cost: 640 },
  { brand: '京喚羽', name: '(新) 京喚羽恆潤', cost: 528 },
  { brand: '京喚羽', name: '喚羽凝脂 200g', cost: 780 },
  { brand: '京喚羽', name: '(新) 喚羽凝脂 400g', cost: 1320 },
  { brand: '京喚羽', name: '(新)喚羽精華 100ml', cost: 1020 },
  { brand: '京喚羽', name: '(新) 金喚羽京澤100ml', cost: 1140 },
  { brand: '京喚羽', name: '(新) 金喚羽凝脂 400g', cost: 1620 },
  { brand: '京喚羽', name: '(新) 金喚羽淨露400g', cost: 1620 },
  { brand: '京喚羽', name: '金喚羽凝脂200ml', cost: 900 },
  { brand: '京喚羽', name: '金喚羽淨露200g', cost: 900 },
  { brand: '京喚羽', name: '(新) 喚羽淨露 400ml', cost: 1320 },
  { brand: '京喚羽', name: '(新)TOKIO 3M', cost: 2800 },
  { brand: '京喚羽', name: '(新)TOKIO 4M', cost: 1500 },
  { brand: '京喚羽', name: '(新) TOKIO 0', cost: 2800 },
  { brand: '京喚羽', name: '(新) TOKIO１', cost: 2800 },
  { brand: '京喚羽', name: '(新)TOKIO 2M', cost: 2800 },
  { brand: '京喚羽', name: '(新)TOKIO 2S', cost: 2800 },
  { brand: '京喚羽', name: '（新）京喚羽淨露補充包700ml', cost: 1860 },
  { brand: '京喚羽', name: '金喚羽京澤（補)', cost: 2000 },
  { brand: '京喚羽', name: 'JRD1EX400 D1EX 400g', cost: 1300 },
  { brand: '京喚羽', name: 'JRD1H1L D1H 1000g', cost: 2300 },
  { brand: '京喚羽', name: 'D1N 1000g', cost: 2300 },
  { brand: '京喚羽', name: 'D1S 1000g', cost: 2300 },
  { brand: '京喚羽', name: 'D2 1000g', cost: 2300 },
  { brand: '京喚羽', name: 'D3c 1000g', cost: 1900 },
  { brand: '京喚羽', name: 'D3EX 400g', cost: 750 },
  { brand: '京喚羽', name: 'D3L 1000g', cost: 2300 },
  { brand: '京喚羽', name: 'D4 250g', cost: 1400 },
  { brand: '京喚羽', name: '(新) 前導喚羽淨露1000ml', cost: 1700 },
  { brand: '京喚羽', name: '(新)TOKIO 3S', cost: 2800 },
  { brand: '京喚羽', name: '(新)TOKIO 4S', cost: 1500 },
  { brand: '京喚羽', name: 'Buffer 酸鹼平衡劑 1000ml', cost: 1900 },
  { brand: '京喚羽', name: '熱導京煥羽恆潤 50g', cost: 440 },
  { brand: '吉樂多多行銷', name: '吹風機', cost: 2564 },
  { brand: '吉樂多多行銷', name: '風罩', cost: 200 },
  { brand: '哥德式', name: 'NL-SH1閃亮溫塑燙（一劑）', cost: 500 },
  { brand: '哥德式', name: '水光系列Ｍ4一劑（紫） 400ml', cost: 700 },
  { brand: '哥德式', name: '水光系列Ｍ4二劑（紫） 400ml', cost: 350 },
  { brand: '哥德式', name: '13-Am(80g)', cost: 195 },
  { brand: '哥德式', name: '13-SI(80g)', cost: 195 },
  { brand: '哥德式', name: 'P-BE(80g)', cost: 195 },
  { brand: '哥德式', name: 'P-BL(80g)', cost: 195 },
  { brand: '哥德式', name: 'P-OR(80g)', cost: 195 },
  { brand: '哥德式', name: 'P-PK(80g)', cost: 195 },
  { brand: '哥德式', name: '9-Sa(80g)', cost: 195 },
  { brand: '哥德式', name: '9-Am(80g)', cost: 195 },
  { brand: '哥德式', name: '9-S1(80g)', cost: 195 },
  { brand: '哥德式', name: '13-Gp(80g)', cost: 195 },
  { brand: '哥德式', name: '13-Sa(80g)', cost: 195 },
  { brand: '哥德式', name: 'b6-SB(80g)', cost: 195 },
  { brand: '哥德式', name: 'b7-SB(80g)', cost: 195 },
  { brand: '哥德式', name: 'b9-SB(80g)', cost: 195 },
  { brand: '哥德式', name: '13-CL(80g)', cost: 195 },
  { brand: '哥德式', name: 'BL(80g)', cost: 195 },
  { brand: '哥德式', name: 'YL(80g)', cost: 195 },
  { brand: '哥德式', name: '喚癮染膏-OR 80g', cost: 195 },
  { brand: '哥德式', name: '7N-CR 80g', cost: 195 },
  { brand: '哥德式', name: '13N-WM 80g', cost: 195 },
  { brand: '哥德式', name: '喚癮染膏BR 80g', cost: 195 },
  { brand: '哥德式', name: '7-Sa 80g', cost: 195 },
  { brand: '哥德式', name: '7-Am 80g', cost: 195 },
  { brand: '哥德式', name: '7-S1 80g', cost: 195 },
  { brand: '哥德式', name: '13N-CR 80g', cost: 195 },
  { brand: '哥德式', name: 'P-SI 80g', cost: 195 },
  { brand: '哥德式', name: 'P-VL 80g', cost: 195 },
  { brand: '哥德式', name: 'b6-NB(80g)', cost: 195 },
  { brand: '哥德式', name: '晶采雙氧乳3%', cost: 380 },
  { brand: '哥德式', name: '晶采雙氧乳6%', cost: 385 },
  { brand: '哥德式', name: 'b7-PB', cost: 195 },
  { brand: '哥德式', name: 'b7-AB', cost: 195 },
  { brand: '哥德式', name: '喚癮雙氧乳9%', cost: 385 },
  { brand: '哥德式', name: '喚癮雙氧乳12%', cost: 385 },
  { brand: '哥德式', name: 'b5-BB 80g', cost: 195 },
  { brand: '哥德式', name: 'b5-SB 80g', cost: 185 },
  { brand: '哥德式', name: 'b7-BB 80g', cost: 185 },
  { brand: '哥德式', name: '7N-WM 80g', cost: 195 },
  { brand: '哥德式', name: 'b6-BB(80g)', cost: 195 },
  { brand: '哥德式', name: '7-Em', cost: 195 },
  { brand: '哥德式', name: 'B5-NB', cost: 195 },
  { brand: '哥德式', name: 'B9-NB', cost: 195 },
  { brand: '哥德式', name: '9-Em(80g)', cost: 195 },
  { brand: '哥德式', name: 'VL(80g)', cost: 195 },
  { brand: '哥德式', name: 'RD(80g)', cost: 195 },
  { brand: '哥德式', name: 'GL柔漾護髮1+ (600g)', cost: 800 },
  { brand: '哥德式', name: 'GL柔漾護髮1X (600g)', cost: 800 },
  { brand: '哥德式', name: 'GL柔漾護髮2劑 (600g)', cost: 1200 },
  { brand: '哥德式', name: 'GL柔漾護髮3+ (600g)', cost: 800 },
  { brand: '哥德式', name: 'GL柔漾護髮3X (600g)', cost: 800 },
  { brand: '哥德式', name: 'GL柔漾護髮4+ (9gx4x10排)', cost: 1500 },
  { brand: '哥德式', name: 'GL柔漾護髮4X(9gx4x10排)', cost: 1500 },
  { brand: '哥德式', name: 'My Force NO.4 300ml', cost: 800 },
  { brand: '哥德式', name: 'My Force NO.5 300ml', cost: 800 },
  { brand: '哥德式', name: 'My Force NO.7 500g', cost: 800 },
  { brand: '哥德式', name: 'My Force NO.10 500g', cost: 800 },
  { brand: '哥德式', name: 'My Force NO.11 300ml', cost: 800 },
  { brand: '哥德式', name: 'My Force NO.12 36g', cost: 180 },
  { brand: '哥德式', name: '生命果乳GE (粉)', cost: 600 },
  { brand: '哥德式', name: '生命果油LS (黃)', cost: 600 },
  { brand: '哥德式', name: '生命果油GS (橘)', cost: 600 },
  { brand: '哥德式', name: '極潤果油BC (紫)', cost: 600 },
  { brand: '哥德式', name: '極潤果露BG (紫)', cost: 600 },
  { brand: '哥德式', name: '生命果油MS (綠)', cost: 600 },
  { brand: '哥德式', name: '四重奏雪球藍（R)200g', cost: 450 },
  { brand: '哥德式', name: '水光系列CMC 200ml', cost: 800 },
  { brand: '哥德式', name: '啞光5D噴霧120g', cost: 425 },
  { brand: '哥德式', name: '舞動造型噴霧（180g)塑型藍', cost: 300 },
  { brand: '哥德式', name: '凝光髮霜 40g', cost: 425 },
  { brand: '哥德式', name: 'GL柔漾護髮素VL 500g', cost: 1000 },
  { brand: '哥德式', name: '凝光髮油90ml', cost: 425 },
  { brand: '哥德式', name: '柔光感造型慕斯 NO.7', cost: 300 },
  { brand: '哥德式', name: '柔光感造型慕斯 NO.4', cost: 300 },
  { brand: '哥德式', name: '凝光髮膠150g', cost: 425 },
  { brand: '哥德式', name: '柔光感造型慕斯 NO.5', cost: 300 },
  { brand: '哥德式', name: 'GL柔漾洗髮精SL 200ml', cost: 400 },
  { brand: '哥德式', name: 'GL柔漾洗髮精SL 500ml', cost: 850 },
  { brand: '哥德式', name: 'GL柔漾洗髮精VL 200ml', cost: 400 },
  { brand: '哥德式', name: 'GL柔漾洗髮精VL', cost: 850 },
  { brand: '哥德式', name: 'GL柔漾洗髮精WL 200ml', cost: 400 },
  { brand: '哥德式', name: 'GL柔漾洗髮精WL 500ml', cost: 850 },
  { brand: '哥德式', name: 'GL柔漾護髮素SL 200g', cost: 600 },
  { brand: '哥德式', name: 'GL柔漾護髮素SL 500g', cost: 1000 },
  { brand: '哥德式', name: 'GL柔漾護髮素VL 200g', cost: 600 },
  { brand: '哥德式', name: 'GL柔漾護髮素WL 200g', cost: 600 },
  { brand: '哥德式', name: 'GL柔漾護髮素WL 500g', cost: 1000 },
  { brand: '威傑士', name: '7/713 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '9/44 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: 'ZERO-W 暖色透明劑', cost: 230 },
  { brand: '威傑士', name: '7/17 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/23 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/31 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '12/70 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '3/88 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '5/43+ NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '5/66+ NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/18 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/11 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/113 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/5 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/61 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/613 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/20 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/20 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/11 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/40 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/50 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '12/10 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '3/0', cost: 230 },
  { brand: '威傑士', name: '4/0', cost: 230 },
  { brand: '威傑士', name: '5/0', cost: 230 },
  { brand: '威傑士', name: '6/0', cost: 230 },
  { brand: '威傑士', name: '6/613', cost: 230 },
  { brand: '威傑士', name: '7/37', cost: 230 },
  { brand: '威傑士', name: 'EA191 7/87', cost: 230 },
  { brand: '威傑士', name: 'EA028 8/11', cost: 230 },
  { brand: '威傑士', name: 'EA104 8/3', cost: 230 },
  { brand: '威傑士', name: 'EA126 8/44', cost: 230 },
  { brand: '威傑士', name: 'EA247 8/713', cost: 230 },
  { brand: '威傑士', name: 'EA250 8/813', cost: 230 },
  { brand: '威傑士', name: 'new 3%雙氧水ZERO(鋁箔包）', cost: 250 },
  { brand: '威傑士', name: 'new 6%雙氧水ZERO(鋁箔包）', cost: 250 },
  { brand: '威傑士', name: 'new 9%雙氧水ZERO(鋁箔包）', cost: 250 },
  { brand: '威傑士', name: 'new 12%雙氧水ZERO(鋁箔包）', cost: 250 },
  { brand: '威傑士', name: 'EA002 2/0', cost: 230 },
  { brand: '威傑士', name: '6/17 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/23 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/1 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '8/17 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/78 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/87 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '4/1NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '4/5+ NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '5/11 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '5/18 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/11 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/113 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/37 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/5NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/60 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/18 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/44 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/60 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '8/113 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '0/w', cost: 230 },
  { brand: '威傑士', name: '10/3', cost: 230 },
  { brand: '威傑士', name: '6/1', cost: 230 },
  { brand: '威傑士', name: '5/37', cost: 230 },
  { brand: '威傑士', name: '6/87', cost: 230 },
  { brand: '威傑士', name: 'ZERO頭皮隔離液(15ml)', cost: 50 },
  { brand: '威傑士', name: '8/37 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/67new zero', cost: 230 },
  { brand: '威傑士', name: '100 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '7/15 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '8/15 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '6/55 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '10/1', cost: 230 },
  { brand: '威傑士', name: '6/43', cost: 230 },
  { brand: '威傑士', name: '6/713', cost: 230 },
  { brand: '威傑士', name: '8/05', cost: 230 },
  { brand: '威傑士', name: '9/1', cost: 230 },
  { brand: '威傑士', name: '8/1', cost: 230 },
  { brand: '威傑士', name: 'EA013 5/1 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '8/20 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: 'TD1水鏡光溫熱塑一劑（一般髮）500ml', cost: 300 },
  { brand: '威傑士', name: 'CD1水鏡光溫塑燙一劑（CA)500ml', cost: 350 },
  { brand: '威傑士', name: '3/00', cost: 230 },
  { brand: '威傑士', name: 'TH1水鏡光溫燙熱塑一劑（抗拒髮）500ml', cost: 300 },
  { brand: '威傑士', name: 'OW2水鏡光溫熱塑燙第2劑（雙氧水狀）500ml', cost: 250 },
  { brand: '威傑士', name: 'NEW ZERO-護色洗髮精300ml', cost: 150 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1-7號（灰紫色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1-7號（灰紫色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1號（酷冷色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1號（酷冷色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴2號（潮綠色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴2號（潮綠色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴4號（甜橘色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴4號（甜橘色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴5號（豔紅色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴5號（豔紅色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴6號（摩卡棕）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴6號（摩卡棕）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴7號（炫紫色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴7號（炫紫色）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴8號（海洋藍）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴8號（海洋藍）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1-7P號（粉灰紫色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴1-7P號（粉灰紫色）300ml', cost: 320 },
  { brand: '威傑士', name: 'NEW ZERO-護色洗髮精1000ml', cost: 500 },
  { brand: '威傑士', name: 'Zero 極光炫染1-1號（冷霧灰色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'Zero 極光炫染1-1號（冷霧灰色）300ml', cost: 320 },
  { brand: '威傑士', name: 'Zero 極光炫染6-1號（奶霜色）1000ml', cost: 750 },
  { brand: '威傑士', name: 'Zero 極光炫染6-1號（奶霜色）300ml', cost: 320 },
  { brand: '威傑士', name: '0/20', cost: 230 },
  { brand: '威傑士', name: '0/55', cost: 230 },
  { brand: '威傑士', name: '0/70', cost: 230 },
  { brand: '威傑士', name: '0/80', cost: 230 },
  { brand: '威傑士', name: '6/77 New zero', cost: 230 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴7-1號（矯色洗）1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO極光炫染髮浴7-1號（矯色洗）300ml', cost: 320 },
  { brand: '威傑士', name: 'ZERO 5-1(泡泡粉)1000ml', cost: 750 },
  { brand: '威傑士', name: 'ZERO 5-1(泡泡粉)300ml', cost: 320 },
  { brand: '威傑士', name: '漂粉（白色強效）', cost: 800 },
  { brand: '威傑士', name: '7/0 NEW ZERO', cost: 230 },
  { brand: '威傑士', name: '漂粉（藍色專業）', cost: 600 },
  { brand: '娜普菈', name: '莯蕾隨心所欲水潤凝乳(暖色用)80g', cost: 315 },
  { brand: '娜普菈', name: '乳油木輕質油150ml', cost: 525 },
  { brand: '娜普菈', name: '基底造型噴霧1號', cost: 390 },
  { brand: '娜普菈', name: '3號微定型噴霧', cost: 390 },
  { brand: '宸宇', name: '采萃 熱塑一劑 TG-B 1000ml', cost: 450 },
  { brand: '宸宇', name: '采萃 SC 優塑乳 1000ml', cost: 1000 },
  { brand: '宸宇', name: '采萃 鏈鍵蛋白素 1000ml', cost: 700 },
  { brand: '宸宇', name: '去黃髮膜小300ml', cost: 500 },
  { brand: '施華蔻', name: '水漾質感中和膏', cost: 200 },
  { brand: '施華蔻', name: '俏翎蘆薈中和水1000ml', cost: 550 },
  { brand: '施華蔻', name: 'E-1', cost: 190 },
  { brand: '施華蔻', name: '3-0', cost: 190 },
  { brand: '施華蔻', name: '5-0', cost: 190 },
  { brand: '施華蔻', name: 'L-33', cost: 200 },
  { brand: '施華蔻', name: 'L-22', cost: 210 },
  { brand: '施華蔻', name: '雙氧乳3%', cost: 360 },
  { brand: '施華蔻', name: '雙氧乳6%', cost: 330 },
  { brand: '施華蔻', name: '9-98', cost: 205 },
  { brand: '施華蔻', name: '6-99', cost: 190 },
  { brand: '施華蔻', name: 'B33摩耀色系特綠', cost: 205 },
  { brand: '施華蔻', name: '8-19', cost: 195 },
  { brand: '施華蔻', name: '8-11', cost: 190 },
  { brand: '施華蔻', name: 'L-44', cost: 210 },
  { brand: '施華蔻', name: '0-11', cost: 190 },
  { brand: '施華蔻', name: '0-22', cost: 190 },
  { brand: '施華蔻', name: '0-99', cost: 205 },
  { brand: '施華蔻', name: 'p9.5-29', cost: 195 },
  { brand: '施華蔻', name: '9.5-1', cost: 190 },
  { brand: '施華蔻', name: '7-1', cost: 190 },
  { brand: '施華蔻', name: '6-6', cost: 190 },
  { brand: '施華蔻', name: 'L-77', cost: 210 },
  { brand: '施華蔻', name: '6-08', cost: 190 },
  { brand: '施華蔻', name: 'L-88', cost: 210 },
  { brand: '施華蔻', name: '6-06', cost: 190 },
  { brand: '施華蔻', name: '新伊采染髮膏4-0基色', cost: 190 },
  { brand: '施華蔻', name: '0-88', cost: 205 },
  { brand: '施華蔻', name: '0-55', cost: 200 },
  { brand: '施華蔻', name: '6-77', cost: 190 },
  { brand: '施華蔻', name: '6-80', cost: 195 },
  { brand: '施華蔻', name: '6-60', cost: 195 },
  { brand: '施華蔻', name: 'L-89', cost: 210 },
  { brand: '施華蔻', name: '9.5-49', cost: 190 },
  { brand: '施華蔻', name: '12-1', cost: 195 },
  { brand: '施華蔻', name: '0-33', cost: 190 },
  { brand: '施華蔻', name: '5-60', cost: 185 },
  { brand: '施華蔻', name: '纖杜拉一號 鏈鍵強化液500ml', cost: 3900 },
  { brand: '施華蔻', name: '新水漾護髮膜', cost: 650 },
  { brand: '施華蔻', name: '仙人掌冷萃精油', cost: 900 },
  { brand: '施華蔻', name: '超級浮力霧', cost: 450 },
  { brand: '施華蔻', name: '銀亮髮露1000ml', cost: 880 },
  { brand: '施華蔻', name: '銀亮髮露250ml', cost: 340 },
  { brand: '施華蔻', name: '壓頭', cost: 60 },
  { brand: '施華蔻', name: '纖杜拉鏈鍵油150ml', cost: 1200 },
  { brand: '施華蔻', name: '綠岩漿', cost: 440 },
  { brand: '晨宏', name: '蘊活再生髮浴-乾/屑/敏（紅）沙龍用 1000ml', cost: 2000 },
  { brand: '晨宏', name: '蘊活再生髮浴-油/掉（藍）沙龍用1000ml', cost: 2000 },
  { brand: '晨宏', name: '療程工具（按摩梳-毛巾-湯匙-碗)', cost: 1000 },
  { brand: '晨宏', name: 'ONcare頭皮調理清潔乳（控油）', cost: 1350 },
  { brand: '晨宏', name: '頭皮調理理液(喚髮)100ml', cost: 1000 },
  { brand: '晨宏', name: '薀泉PH平衡液 200ml', cost: 850 },
  { brand: '晨宏', name: '髮肌逆時前導精華50ml', cost: 600 },
  { brand: '晨宏', name: 'ONcare 頭皮調理清潔乳（喚髮）950ml', cost: 1350 },
  { brand: '晨宏', name: 'ONcare髮肌逆時淨化清潔乳950ml', cost: 1200 },
  { brand: '晨宏', name: 'ONcare頭皮調理清潔乳（淨屑）', cost: 1350 },
  { brand: '晨宏', name: 'QQ捲髮組合', cost: 800 },
  { brand: '晨宏', name: '蘊活再生髮浴-乾/屑/敏（紅） 500ml', cost: 1350 },
  { brand: '晨宏', name: '蘊活再生髮浴-油/掉（藍）500ml', cost: 1350 },
  { brand: '晨宏', name: '蘊活再生頭皮養髮液-熟齡（藍）', cost: 10000 },
  { brand: '晨宏', name: '微晶導入儀', cost: 6000 },
  { brand: '晨宏', name: '導入儀-針筒＋微晶（圓）', cost: 60 },
  { brand: '晨宏', name: '導入儀-微晶（圓）', cost: 0 },
  { brand: '晴美', name: '采薇大桶潤絲精-水蜜桃白', cost: 150 },
  { brand: '晴美', name: '采薇大桶洗髮精-花香白', cost: 170 },
  { brand: '樂事', name: '6D接髮片26吋65', cost: 2900 },
  { brand: '樂事', name: '無痕(4D)接髮片22寸55腰下', cost: 1900 },
  { brand: '樂事', name: '6D接髮片28吋70', cost: 3100 },
  { brand: '樂事', name: '零重力有色髮薄藤紫', cost: 80 },
  { brand: '樂事', name: '零重力有色髮灰色', cost: 80 },
  { brand: '樂事', name: '零重力有色髮藍紫色', cost: 80 },
  { brand: '樂事', name: '零重力有色髮米白色', cost: 80 },
  { brand: '樂事', name: '零重力有色髮淺粉色', cost: 80 },
  { brand: '樂事', name: '零重力有色髮寶藍色', cost: 80 },
  { brand: '樂事', name: '零重力有色髮天藍色', cost: 80 },
  { brand: '樂事', name: '零重力接髮片22吋55', cost: 1900 },
  { brand: '樂事', name: '零重力接髮片26吋65', cost: 2050 },
  { brand: '樂事', name: '零重力接髮片24吋60', cost: 1950 },
  { brand: '樂事', name: '零重力接髮片20吋50', cost: 1850 },
  { brand: '樂事', name: '零重力接髮片18吋45', cost: 1800 },
  { brand: '樂事', name: '零重力接髮片16吋40', cost: 1700 },
  { brand: '樂事', name: '巴黎畫染22吋', cost: 2000 },
  { brand: '樂事', name: '九度色零重力接髮片16吋40', cost: 1730 },
  { brand: '樂事', name: '九度色零重力接髮片18吋45', cost: 1830 },
  { brand: '樂事', name: '九度色零重力接髮片20吋50', cost: 1880 },
  { brand: '樂事', name: '九度色零重力接髮片22吋55', cost: 1930 },
  { brand: '樂事', name: '九度色零重力接髮片26吋65', cost: 2080 },
  { brand: '樂事', name: 'S接髮24', cost: 1750 },
  { brand: '樂事', name: 'S級9度色55CM', cost: 1850 },
  { brand: '樂事', name: 'S接髮16', cost: 1600 },
  { brand: '樂事', name: 'S接髮20', cost: 1650 },
  { brand: '歌薇', name: '熱力塑質霜一劑 0-強', cost: 590 },
  { brand: '歌薇', name: '凡絲蒂燙髮水一劑（0）', cost: 90 },
  { brand: '歌薇', name: '燙前保養調理劑400ml', cost: 420 },
  { brand: '歌薇', name: '燙後保水調理劑400ml', cost: 420 },
  { brand: '歌薇', name: '熱力塑質霜一劑 1 一般', cost: 590 },
  { brand: '歌薇', name: '熱力塑質霜一劑 2中等', cost: 590 },
  { brand: '歌薇', name: '熱力塑質霜一劑 3 弱', cost: 590 },
  { brand: '歌薇', name: '凡絲蒂燙髮水一劑（2） 80ML', cost: 90 },
  { brand: '歌薇', name: '熱力塑質中和霜二劑400ml', cost: 450 },
  { brand: '歌薇', name: 'COL 2A 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 7MB 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 天空粉藍 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 7AK@PK 120ml', cost: 380 },
  { brand: '歌薇', name: '14rev 80ml', cost: 200 },
  { brand: '歌薇', name: '掃色粉', cost: 1100 },
  { brand: '歌薇', name: '8NeB 80ml', cost: 200 },
  { brand: '歌薇', name: '10NeB 80ml', cost: 200 },
  { brand: '歌薇', name: '10Gr 80ml', cost: 200 },
  { brand: '歌薇', name: '14BlV 80ml', cost: 200 },
  { brand: '歌薇', name: '12BlV 80ml', cost: 200 },
  { brand: '歌薇', name: '14PiV 80ml', cost: 200 },
  { brand: '歌薇', name: '8PiV 80ml', cost: 200 },
  { brand: '歌薇', name: '8Re 80ml', cost: 200 },
  { brand: '歌薇', name: '10Go 80ml', cost: 200 },
  { brand: '歌薇', name: '10YeMa 80ml', cost: 200 },
  { brand: '歌薇', name: '14BlAs 80ml', cost: 200 },
  { brand: '歌薇', name: '12BlAs 80ml', cost: 200 },
  { brand: '歌薇', name: '8BlAs 80ml', cost: 200 },
  { brand: '歌薇', name: '14As 80ml', cost: 200 },
  { brand: '歌薇', name: '10As 80ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 11SV 250ml', cost: 640 },
  { brand: '歌薇', name: '6NeB 80ml', cost: 200 },
  { brand: '歌薇', name: '6Gr 80ml', cost: 200 },
  { brand: '歌薇', name: '6BlAs 80ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 5NN 250ml', cost: 580 },
  { brand: '歌薇', name: 'TCC 5B 250ml', cost: 580 },
  { brand: '歌薇', name: '7OO@GK 60ml', cost: 200 },
  { brand: '歌薇', name: '8Gr 80ml', cost: 200 },
  { brand: '歌薇', name: '8BIV 80ml', cost: 200 },
  { brand: '歌薇', name: '10PiV 80ml', cost: 200 },
  { brand: '歌薇', name: '10BlV 80ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 7MB 250ml', cost: 580 },
  { brand: '歌薇', name: 'TCC 11VA 250ml', cost: 640 },
  { brand: '歌薇', name: '5N 60ml', cost: 180 },
  { brand: '歌薇', name: '8CA@PB 250ml', cost: 620 },
  { brand: '歌薇', name: '8NB 80ml (歌薇)', cost: 200 },
  { brand: '歌薇', name: '6NB 80ml', cost: 200 },
  { brand: '歌薇', name: '8PeB 80ml', cost: 200 },
  { brand: '歌薇', name: '6PeB 80ml', cost: 200 },
  { brand: '歌薇', name: '8PiB 80ml', cost: 200 },
  { brand: '歌薇', name: '7RR@RR 250ml', cost: 620 },
  { brand: '歌薇', name: '9%雙氧乳', cost: 330 },
  { brand: '歌薇', name: '3%雙氧乳', cost: 330 },
  { brand: '歌薇', name: '12%雙氧乳', cost: 330 },
  { brand: '歌薇', name: '8YeMa 80ml', cost: 200 },
  { brand: '歌薇', name: '6Ma 80ml', cost: 200 },
  { brand: '歌薇', name: 'COL 5N 120ml', cost: 380 },
  { brand: '歌薇', name: 'GK@all 200ml', cost: 450 },
  { brand: '歌薇', name: 'YY@all 200ml', cost: 450 },
  { brand: '歌薇', name: '11VV', cost: 640 },
  { brand: '歌薇', name: '7SB@Bl 60ml', cost: 200 },
  { brand: '歌薇', name: '6SB 250ml', cost: 580 },
  { brand: '歌薇', name: '8ReV 80ml', cost: 200 },
  { brand: '歌薇', name: '10ReV 80ml', cost: 200 },
  { brand: '歌薇', name: '12Gr TC 80ml', cost: 200 },
  { brand: '歌薇', name: '8Or 80ml', cost: 200 },
  { brand: '歌薇', name: 'COL 玫瑰粉紅 60ml', cost: 180 },
  { brand: '歌薇', name: 'COL 蜜桃粉橘 60ml', cost: 180 },
  { brand: '歌薇', name: '3N 250ml', cost: 580 },
  { brand: '歌薇', name: '7RO 60ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 7OO 60ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 6RB 250ml', cost: 580 },
  { brand: '歌薇', name: 'TCC 8K 250ml', cost: 580 },
  { brand: '歌薇', name: '6PiV 80ml', cost: 200 },
  { brand: '歌薇', name: 'Tcc 6B 250ML', cost: 580 },
  { brand: '歌薇', name: 'TCC 7KG 250ml', cost: 580 },
  { brand: '歌薇', name: '6RR@PK 60ml', cost: 200 },
  { brand: '歌薇', name: '5B@BK 60ml', cost: 200 },
  { brand: '歌薇', name: 'TCC 2A 250ml', cost: 580 },
  { brand: '歌薇', name: '13BC 250ml', cost: 640 },
  { brand: '歌薇', name: 'TCC 13BCA 250ml', cost: 640 },
  { brand: '歌薇', name: 'Violet TC NEWANCE FASHION TB 80ml', cost: 640 },
  { brand: '歌薇', name: '8AS 80ml', cost: 200 },
  { brand: '歌薇', name: '5CB 80ml', cost: 200 },
  { brand: '歌薇', name: 'P-Mix 60ml', cost: 200 },
  { brand: '歌薇', name: '8MaB', cost: 200 },
  { brand: '歌薇', name: 'TCC 6A250ml', cost: 580 },
  { brand: '歌薇', name: 'TCC 6MB 250ml', cost: 580 },
  { brand: '歌薇', name: 'TCC 8B 250ml', cost: 580 },
  { brand: '歌薇', name: '11A 250ml', cost: 640 },
  { brand: '歌薇', name: '6BP@VA 250ml', cost: 640 },
  { brand: '歌薇', name: '8CA 60ml', cost: 200 },
  { brand: '歌薇', name: 'COL 5VV超艷紅 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 6A 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 6B 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 6RB 120ml', cost: 380 },
  { brand: '歌薇', name: 'COL 顯色乳', cost: 280 },
  { brand: '歌薇', name: 'COL 4NN 120ml', cost: 380 },
  { brand: '歌薇', name: '9KG', cost: 380 },
  { brand: '歌薇', name: '光感重建劑', cost: 92 },
  { brand: '歌薇', name: '動感重建劑', cost: 92 },
  { brand: '歌薇', name: 'KSP絲馭光淨化髮浴1000ml', cost: 1000 },
  { brand: '歌薇', name: 'KSP絲馭光金萃控質劑-強500ml', cost: 1800 },
  { brand: '歌薇', name: 'KSP絲馭光金萃柔順霜-強500ml', cost: 1800 },
  { brand: '歌薇', name: 'KS水誘晶漾髮浴250ml', cost: 450 },
  { brand: '歌薇', name: 'KS水誘晶漾髮護200ml', cost: 500 },
  { brand: '歌薇', name: 'KSP絲馭光質控髮蜜', cost: 560 },
  { brand: '歌薇', name: '光纖重建劑', cost: 92 },
  { brand: '歌薇', name: '精萃金油100ml', cost: 750 },
  { brand: '歌薇', name: 'DS光感洗髮精1L', cost: 800 },
  { brand: '歌薇', name: 'ksp絲馭光金萃柔順霜-一般500ml', cost: 1800 },
  { brand: '歌薇', name: 'KSP絲馭光金萃控質劑一般500ml', cost: 1800 },
  { brand: '歌薇', name: 'DS水感極水髮膜1L', cost: 1100 },
  { brand: '歌薇', name: 'SS塑形鋼鐵人 140ml', cost: 350 },
  { brand: '歌薇', name: '馭髪洸誘髮浴250ml', cost: 450 },
  { brand: '歌薇', name: '馭髪洸誘髮護250ml', cost: 600 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道全面淨化髮浴', cost: 880 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道全效鎖護髮膜-輕爽', cost: 800 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道全效鎖護髮膜-水潤', cost: 800 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道前導調理', cost: 1200 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道深層調理-一般', cost: 2500 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道深層調理-強效', cost: 2500 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道角質調理-一般', cost: 2500 },
  { brand: '歌薇', name: 'KS 絲馭洸 馭髮道角質調理-強效', cost: 2500 },
  { brand: '歌薇', name: 'KS 絲馭洸 微整質柔髮繚 750ml', cost: 4800 },
  { brand: '歌薇', name: 'KS 絲馭洸 微整質柔菁萃 22ml', cost: 180 },
  { brand: '歌薇', name: '絲馭洸 馭髮洸誘水髮膜200ml', cost: 800 },
  { brand: '歌薇', name: 'KS質順柔緻髮浴750ML', cost: 880 },
  { brand: '歌薇', name: 'KS水誘晶漾髮護750ML', cost: 1080 },
  { brand: '歌薇', name: 'KS質順柔緻髮護750ML', cost: 1080 },
  { brand: '歌薇', name: 'KS水誘晶漾髮膜500ML', cost: 1680 },
  { brand: '歌薇', name: 'KS質順柔緻髮膜500ML', cost: 1680 },
  { brand: '歌薇', name: 'KS水誘晶漾髮浴750ML', cost: 880 },
  { brand: '歌薇', name: '全明星輕髮油50ml', cost: 500 },
  { brand: '歌薇', name: 'KS髮繃帶緊緻露125ML', cost: 600 },
  { brand: '歌薇', name: 'KS無暇抗熱打底髮霧', cost: 560 },
  { brand: '歌薇', name: '慕光戀色髮浴750ml', cost: 880 },
  { brand: '歌薇', name: '慕光戀色髮護750ml', cost: 1080 },
  { brand: '歌薇', name: 'SS量感4號塑型慕絲 300ml', cost: 320 },
  { brand: '歌薇', name: 'KS質順柔緻髮露 75ml', cost: 550 },
  { brand: '歌薇', name: '光纖洗髮精 1000ml', cost: 800 },
  { brand: '歌薇', name: 'DS水感6效精華100ml', cost: 360 },
  { brand: '歌薇', name: 'DS光感洗髮精 250ml', cost: 320 },
  { brand: '歌薇', name: 'DS光纖洗髮精 250ml', cost: 320 },
  { brand: '歌薇', name: 'KS質順柔緻髮浴250ML', cost: 450 },
  { brand: '歌薇', name: 'TCC 7NA 250ml', cost: 580 },
  { brand: '歌薇', name: '新熱力防護精華 150ml', cost: 350 },
  { brand: '歌薇', name: 'DS輕感深層清潔洗髮精1L REF23', cost: 880 },
  { brand: '歌薇', name: '量感3號晶光慕斯300ml', cost: 320 },
  { brand: '歌薇', name: 'KS水誘晶漾髮霧125ml', cost: 600 },
  { brand: '歌薇', name: '超型塑型口香糖75ml', cost: 320 },
  { brand: '歌薇', name: '輕盈蓬蓬髮霧125ml', cost: 600 },
  { brand: '歌薇', name: 'KS輕盈蓬蓬髮浴750ml', cost: 880 },
  { brand: '歌薇', name: 'ELU 高效潔膚液 250ml', cost: 340 },
  { brand: '歌薇', name: '髮纖修護工程(二劑式組合) 500ml', cost: 2560 },
  { brand: '歌薇', name: '髮纖修護工程-地基一號精華500ml', cost: 2500 },
  { brand: '歌薇', name: '超型完美定型5號噴霧 300ml', cost: 360 },
  { brand: '歌薇', name: 'HP玩髮 IN雕 200ML', cost: 370 },
  { brand: '歌薇', name: '超型系列塑型霧腊', cost: 370 },
  { brand: '歌薇', name: 'AP豐韌洗髮精300ml', cost: 360 },
  { brand: '歌薇', name: '超型完美定型5號噴霧 500ml', cost: 450 },
  { brand: '歌薇', name: 'KSP水誘光深層晶漾髮膜200ml', cost: 800 },
  { brand: '歌薇', name: '抗躁魔法棒 8ml', cost: 360 },
  { brand: '歌薇', name: '超型系列 量感4號塑型慕絲 500ml', cost: 450 },
  { brand: '歌薇', name: '朵朵雲捲髮露', cost: 400 },
  { brand: '歌薇', name: '染系統 導光調頻噴霧 150ml', cost: 290 },
  { brand: '歌薇', name: 'TCC 9A 250ml', cost: 580 },
  { brand: '漢高', name: '沛迷絲真漾白金灰棕PtBe 5N', cost: 200 },
  { brand: '漢高', name: 'CoBe9', cost: 200 },
  { brand: '漢高', name: '盈潤新生洗髮露250ml', cost: 450 },
  { brand: '漢高', name: '活耀洗髮露500ml', cost: 830 },
  { brand: '漢高', name: '盈潤新生護髮乳(乾燥收損)500g', cost: 990 },
  { brand: '漢高', name: '盈潤新生護髮乳(乾燥收損)1000g', cost: 1560 },
  { brand: '漢高', name: '盈潤絲絨晶露100ml', cost: 700 },
  { brand: '漢高', name: '輕縈柔潤豐澤乳125ml', cost: 700 },
  { brand: '漢高', name: '活耀未來無限肌能精萃120ml', cost: 1200 },
  { brand: '漢高', name: '極光洗髮露補充包', cost: 1600 },
  { brand: '漢高', name: '盈潤新生修護髮膜（脆弱受損）680g', cost: 2000 },
  { brand: '漢高', name: '盈潤新生洗髮露500ml', cost: 780 },
  { brand: '特芬利', name: '特12-21', cost: 285 },
  { brand: '特芬利', name: '特10-21', cost: 300 },
  { brand: '特芬利', name: '特12-11', cost: 285 },
  { brand: '特芬利', name: '特2-21', cost: 285 },
  { brand: '特芬利', name: '特2-11', cost: 300 },
  { brand: '特芬利', name: '特4-0', cost: 300 },
  { brand: '特芬利', name: '特6-0', cost: 285 },
  { brand: '特芬利', name: '特6-1', cost: 285 },
  { brand: '特芬利', name: '特7-1', cost: 285 },
  { brand: '特芬利', name: '特8-1', cost: 285 },
  { brand: '特芬利', name: '特7-11', cost: 285 },
  { brand: '特芬利', name: '特5-11', cost: 300 },
  { brand: '特芬利', name: '特6-15', cost: 285 },
  { brand: '特芬利', name: '特6-71', cost: 285 },
  { brand: '特芬利', name: '特6-35', cost: 300 },
  { brand: '特芬利', name: '特5-35', cost: 300 },
  { brand: '特芬利', name: '特6-22', cost: 285 },
  { brand: '特芬利', name: '特000', cost: 285 },
  { brand: '特芬利', name: '特12-18', cost: 285 },
  { brand: '特芬利', name: '特55.0', cost: 285 },
  { brand: '特芬利', name: '特4-1', cost: 285 },
  { brand: '特芬利', name: '特10-12', cost: 285 },
  { brand: '特芬利', name: '特0-25', cost: 285 },
  { brand: '特芬利', name: '特0-18', cost: 285 },
  { brand: '特芬利', name: '特0-12', cost: 300 },
  { brand: '特芬利', name: '特33-0', cost: 300 },
  { brand: '特芬利', name: '特3-0', cost: 285 },
  { brand: '特芬利', name: '特4-22', cost: 285 },
  { brand: '特芬利', name: '特3-81', cost: 300 },
  { brand: '特芬利', name: '特5-15', cost: 300 },
  { brand: '特芬利', name: '特4-18', cost: 285 },
  { brand: '特芬利', name: '特8-44', cost: 285 },
  { brand: '特芬利', name: '特10-7', cost: 285 },
  { brand: '特芬利', name: '特6-44', cost: 285 },
  { brand: '特芬利', name: '特5-56冷檀紅', cost: 300 },
  { brand: '特芬利', name: '特10-23', cost: 285 },
  { brand: '特芬利', name: '優活乳3% 900ml', cost: 300 },
  { brand: '特芬利', name: '優活乳6% 900ml', cost: 300 },
  { brand: '特芬利', name: '優活乳9% 900ml', cost: 300 },
  { brand: '特芬利', name: '暖暖彈力洗髮露5000ml', cost: 4350 },
  { brand: '特芬利', name: '霓霧亮色洗髮露5000ml', cost: 4350 },
  { brand: '特芬利', name: '霓霧亮色輕髮膜5000ml', cost: 4800 },
  { brand: '特芬利', name: '暖暖彈力洗髮露250ml', cost: 445 },
  { brand: '特芬利', name: '純淨抗屑洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '能量豐茂洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '康敏舒緩洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '康敏舒緩強效菁華100ml', cost: 1110 },
  { brand: '特芬利', name: '能量豐茂活化強效精華100ml', cost: 1900 },
  { brand: '特芬利', name: '彈潤寶水洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '甦活益生洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '甦活益生強效精華100ml', cost: 1250 },
  { brand: '特芬利', name: '東方美人油135ml', cost: 1000 },
  { brand: '特芬利', name: '暖暖彈力洗髮露1000ml', cost: 1270 },
  { brand: '特芬利', name: '暖暖彈力輕髮膜1000ml', cost: 1620 },
  { brand: '特芬利', name: '霓霧亮色洗髮露1000ml', cost: 1270 },
  { brand: '特芬利', name: '霓霧亮色輕髮膜1000ml', cost: 1620 },
  { brand: '特芬利', name: '深層淨化洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '康敏舒緩洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '甦活益生調理霜1000ml', cost: 1870 },
  { brand: '特芬利', name: '彈潤寶水潤髮霜1000ml', cost: 1800 },
  { brand: '特芬利', name: '彈潤寶水洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '能量豐茂洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '平衡控油洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '甦活益生洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '純淨抗屑洗髮露1000ml', cost: 1280 },
  { brand: '特芬利', name: '輕爽深層洗髮露5000ml', cost: 4350 },
  { brand: '特芬利', name: '海洋蓬蓬霧', cost: 520 },
  { brand: '特芬利', name: '能量豐茂賦活強效菁華100ml', cost: 1900 },
  { brand: '特芬利', name: '極光霧200ml', cost: 520 },
  { brand: '特芬利', name: '喚蘊昇華賦舒菁華100ml', cost: 1090 },
  { brand: '特芬利', name: '甦活益生調理霜 250ml', cost: 560 },
  { brand: '特芬利', name: '平衡控油洗髮露250ml', cost: 450 },
  { brand: '特芬利', name: '昇華香氛噴霧', cost: 1170 },
  { brand: '特芬利', name: '純淨抗屑凝膠', cost: 620 },
  { brand: '特芬利', name: '平衡控油調理凝露250ml', cost: 650 },
  { brand: '特芬利', name: '喚蘊昇華淨化土120g', cost: 2600 },
  { brand: '特芬利', name: '髮爍膠250ml', cost: 520 },
  { brand: '甦沐梓', name: '甦沐梓修護1劑', cost: 1800 },
  { brand: '甦沐梓', name: '甦沐梓修護2劑', cost: 1800 },
  { brand: '甦沐梓', name: '甦沐梓修護3劑', cost: 1600 },
  { brand: '甦沐梓', name: '甦沐梓髮油', cost: 790 },
  { brand: '甦沐梓', name: '甦沐梓髮浴', cost: 840 },
  { brand: '甦沐梓', name: '甦沐梓髮膜', cost: 840 },
  { brand: '甦沐梓', name: '甦沐梓洗護油旅行組', cost: 290 },
  { brand: '聖馥', name: 'MD雙氧水3％', cost: 180 },
  { brand: '聖馥', name: 'MD雙氧水6％', cost: 180 },
  { brand: '聖馥', name: 'MD雙氧水9％', cost: 180 },
  { brand: '聖馥', name: 'MD雙氧水12％', cost: 180 },
  { brand: '聖馥', name: '旭佑漂粉（藍）500g', cost: 450 },
  { brand: '葳肯', name: 'B5棉花糖補色慕斯-冰川藍', cost: 480 },
  { brand: '葳肯', name: 'B2棉花糖補色慕斯-煙燻粉', cost: 480 },
  { brand: '葳肯', name: 'B1棉花糖補色慕斯-灰紫霧', cost: 480 },
  { brand: '蘊洛', name: '水光感熱塑-受損1劑 500ml', cost: 400 },
  { brand: '覺亞', name: '希沛絲頭皮修護膜35ml(12入組）', cost: 1200 },
  { brand: '覺亞', name: '甘草次酸角質淨化液75ml', cost: 185 },
  { brand: '覺亞', name: '極致控油氨基酸養髮液115ml', cost: 700 },
  { brand: '覺亞', name: '深層抗屑氨基酸養髮液115ml', cost: 700 },
  { brand: '覺亞', name: '深層抗屑氨基酸洗髮精220ml', cost: 475 },
  { brand: '覺亞', name: '柔敏健髮氨基酸養髮液115ml', cost: 700 },
  { brand: '覺亞', name: '極致控油氨基酸洗髮精220ml', cost: 475 },
  { brand: '覺亞', name: '梳王', cost: 990 },
  { brand: '覺亞', name: '柔敏健髮氨基酸洗髮精220ml', cost: 475 },
  { brand: '覺亞', name: '希沛絲賦活露50ml', cost: 2300 },
  { brand: '覺亞', name: '燙染守護神15ml', cost: 75 },
  { brand: '覺亞', name: '希沛絲頭皮修護膜35ml', cost: 100 },
  { brand: '覺亞', name: '甘草次酸角質淨化液220ml', cost: 540 },
  { brand: '覺亞', name: '深層抗屑氨基酸洗髮精1000ml', cost: 1900 },
  { brand: '覺亞', name: '極致控油氨基酸洗髮精1000ml', cost: 1900 },
  { brand: '覺亞', name: '柔敏健髮氨基酸洗髮精1000ml', cost: 1900 },
  { brand: '覺亞', name: '健髮賦活氨基酸洗髮精1000ml', cost: 1900 },
  { brand: '覺亞', name: '希沛絲蘊髮洗髮精(油性頭皮）220ml', cost: 540 },
  { brand: '覺亞', name: '希沛絲蘊髮養髮液（乾性頭皮）', cost: 1000 },
  { brand: '覺亞', name: '希沛絲蘊髮養髮液（油性頭皮）115ml', cost: 1000 },
  { brand: '覺亞', name: '希沛絲蘊髮洗髮精(乾性頭皮）220ml', cost: 540 },
  { brand: '覺亞', name: '健髮賦活胺基酸養髮液500ml', cost: 1900 },
  { brand: '覺亞', name: '極致控油胺基酸洗髮精4000ml', cost: 2400 },
  { brand: '覺亞', name: '希沛絲蘊髮洗髮精(油性頭皮）1000ml', cost: 2300 },
  { brand: '覺亞', name: '希沛絲蘊髮洗髮精(乾性頭皮）1000ml', cost: 2300 },
  { brand: '覺亞', name: '健髮賦活氨基酸洗4000ml', cost: 2400 },
  { brand: '覺亞', name: '深層抗屑氨基酸洗4000ml', cost: 2400 },
  { brand: '覺亞', name: '甘草次酸角質淨化液4000ml', cost: 2600 },
  { brand: '覺亞', name: '甘草次酸健康護手霜', cost: 230 },
  { brand: '覺亞', name: 'Delta洗髮沐浴露330ml', cost: 780 },
  { brand: '覺亞', name: '健髮賦活胺基酸養髮液115ml', cost: 700 },
  { brand: '覺亞', name: '柔敏健髮氨基酸洗髮精30ml', cost: 55 },
  { brand: '覺亞', name: '亞麻健髮護色護髮油30ml', cost: 120 },
  { brand: '覺亞', name: '高階養髮旅行組', cost: 850 },
  { brand: '覺亞', name: '握握梳', cost: 590 },
  { brand: '覺亞', name: '希沛絲賦活精華EX(6人組）', cost: 990 },
  { brand: '覺亞', name: '白鈴蘭與雪松洗髮沐浴露 1000ml', cost: 675 },
  { brand: '覺亞', name: '三合一出走伊甸園', cost: 675 },
  { brand: '覺亞', name: '三合一洗髮沐浴露（清醒夢序曲）1000ml', cost: 675 },
  { brand: '覺亞', name: '草本健髮胺基酸洗髮精（蒙馬特散策）1000ml', cost: 0 },
  { brand: '覺亞', name: '搭贈白鈴蘭與雪松洗髮沐浴露(買二送一）', cost: 0 },
  { brand: '覺亞', name: '覺亞-壓頭', cost: 20 },
  { brand: '覺亞', name: '燙染舒敏頭皮隔離油（24入）', cost: 1800 },
  { brand: '覺亞', name: '甘草次酸健康洗髮精（護手配方）1000ml', cost: 0 },
  { brand: '覺亞', name: '三合一洗髮沐浴露（春冷綠意）1000ml.', cost: 675 },
  { brand: '覺亞', name: '三合一洗髮沐浴露（浮絃隱茶）1000ml', cost: 675 },
  { brand: '覺亞', name: '三合一洗髮沐浴露（蒼嶙沉烟）1000ml', cost: 675 },
  { brand: '里歐', name: '日式縮Q彈燙-冷燙1劑(健康)', cost: 350 },
  { brand: '里歐', name: '日式縮Q彈燙-冷燙1劑-受損', cost: 350 },
  { brand: '里歐', name: '里歐9%', cost: 180 },
  { brand: '里歐', name: '里歐6%', cost: 180 },
  { brand: '里歐', name: '里歐12/02', cost: 200 },
  { brand: '里歐', name: '里歐12%', cost: 180 },
  { brand: '里歐', name: '里歐77/80', cost: 200 },
  { brand: '里歐', name: '里歐77/2', cost: 200 },
  { brand: '里歐', name: '里歐77/1', cost: 200 },
  { brand: '里歐', name: '里歐55/2', cost: 200 },
  { brand: '里歐', name: '里歐3%', cost: 180 },
  { brand: '里歐', name: '里歐6/0', cost: 150 },
  { brand: '里歐', name: '里歐88/62', cost: 200 },
  { brand: '里歐', name: '里歐99/21', cost: 200 },
  { brand: '里歐', name: '里歐88/16', cost: 200 },
  { brand: '里歐', name: '里歐3/0', cost: 150 },
  { brand: '里歐', name: '里歐4/8', cost: 200 },
  { brand: '里歐', name: '里歐4/0', cost: 150 },
  { brand: '里歐', name: '里歐5/0', cost: 150 },
  { brand: '里歐', name: '里歐1/0', cost: 150 },
  { brand: '里歐', name: '里歐7/1', cost: 150 },
  { brand: '里歐', name: 'musumi頭皮精華隔離油500ml', cost: 1400 },
  { brand: '里歐', name: '頭皮復活舒緩凝膠', cost: 550 },
  { brand: '里歐', name: 'musumi頭皮隔離精華液150ml', cost: 480 },
  { brand: '里歐', name: '頭皮賦活泥500ml', cost: 550 },
  { brand: '雷娜塔', name: '雷娜塔5/0', cost: 190 },
  { brand: '雷娜塔', name: '森精粹前導淨化凝膠500ml', cost: 800 },
  { brand: '髮瑪', name: 'Hairmod 雲捲燙Tg1', cost: 350 },
  { brand: '髮瑪', name: '雲捲燙 TG-S (壓貼)', cost: 380 },
  { brand: '髮瑪', name: '雲捲冷燙（水狀）', cost: 350 },
  { brand: '髮瑪', name: '2P直hairmod雲捲燙（2劑）乳狀', cost: 180 },
  { brand: '髮瑪', name: '2P捲hairmod雲捲燙（2劑）液狀', cost: 180 },
  { brand: '髮瑪', name: 'hairmod雲捲塑型燙（凝膠狀）', cost: 220 },
  { brand: '髮瑪', name: 'Hairmod 雲捲燙Tg2', cost: 350 },
  { brand: '髮瑪', name: 'Hairmod 雲捲Cy3', cost: 350 },
  { brand: '髮瑪', name: 'Hairmod 雲捲冷燙一劑（一般髮質使用）', cost: 350 },
  { brand: '髮瑪', name: 'BLONDHER PLUS 超級灰漂', cost: 1050 },
  { brand: '髮瑪', name: 'A6鴿羽100ml', cost: 200 },
  { brand: '髮瑪', name: 'AA8水泥100ml', cost: 200 },
  { brand: '髮瑪', name: 'R8粉嫣100ml', cost: 200 },
  { brand: '髮瑪', name: 'M8檀香100ml', cost: 200 },
  { brand: '髮瑪', name: '7.1金灰80ml', cost: 200 },
  { brand: '髮瑪', name: '5.74淺棕棕橘80ml', cost: 200 },
  { brand: '髮瑪', name: '6.43深金銅黃80ml', cost: 200 },
  { brand: '髮瑪', name: '6%OXY雙氧乳1000ml', cost: 300 },
  { brand: '髮瑪', name: '9%OXY雙氧乳1000ml', cost: 300 },
  { brand: '髮瑪', name: '11.89極淺金珍珠藍80ml', cost: 200 },
  { brand: '髮瑪', name: 'B6澈海100ml', cost: 200 },
  { brand: '髮瑪', name: 'G6碧柳100ml', cost: 200 },
  { brand: '髮瑪', name: 'Argento超銀矯色膏80ml', cost: 200 },
  { brand: '髮瑪', name: '半永久染ONICE(3)霧灰80ml', cost: 220 },
  { brand: '髮瑪', name: '3%OXY雙氧乳1000ml', cost: 300 },
  { brand: '髮瑪', name: '12%OXY雙氧乳1000ml', cost: 300 },
  { brand: '髮瑪', name: '半永久染TURCHESE碧80ml', cost: 220 },
  { brand: '髮瑪', name: 'AA6石灰100ml', cost: 200 },
  { brand: '髮瑪', name: 'M6檜皮 100ml', cost: 200 },
  { brand: '髮瑪', name: 'M7桃木', cost: 200 },
  { brand: '髮瑪', name: 'B2玄武100ml', cost: 200 },
  { brand: '髮瑪', name: 'C13極光100ml', cost: 200 },
  { brand: '髮瑪', name: 'R7莓果100ml', cost: 200 },
  { brand: '髮瑪', name: 'Ash岩100ml', cost: 200 },
  { brand: '髮瑪', name: 'Blue青100ml', cost: 200 },
  { brand: '髮瑪', name: 'White雪100ml', cost: 200 },
  { brand: '髮瑪', name: 'Red赤100ml', cost: 200 },
  { brand: '髮瑪', name: 'N11稻穗', cost: 200 },
  { brand: '髮瑪', name: '5.1淺棕灰', cost: 200 },
  { brand: '髮瑪', name: '8.21', cost: 200 },
  { brand: '髮瑪', name: '5.17淺棕灰柚木80ml', cost: 200 },
  { brand: '髮瑪', name: '4.87棕雷藤木80ml', cost: 200 },
  { brand: '髮瑪', name: 'Violet靚100ml', cost: 200 },
  { brand: '髮瑪', name: '6.87深金雷藤木', cost: 200 },
  { brand: '髮瑪', name: 'V8丁香100ml', cost: 200 },
  { brand: '髮瑪', name: '1.9', cost: 200 },
  { brand: '髮瑪', name: '髮油膠100g', cost: 445 },
  { brand: '髮瑪', name: '硬漢髮蠟 120ml', cost: 425 },
  { brand: '髮瑪', name: '硬漢髮油(紅)', cost: 425 },
  { brand: '髮瑪', name: 'C4冷咖100ml', cost: 200 },
  { brand: '髮瑪', name: 'G7松煙100ml', cost: 200 },
  { brand: '髮瑪', name: 'B7霧空100ml', cost: 200 },
  { brand: '髮瑪', name: 'N6卡其100ml', cost: 200 },
  { brand: '髮瑪', name: 'A9鈦鼠100ml', cost: 200 },
  { brand: '髮瑪', name: 'A11銀牙100ml', cost: 200 },
  { brand: '髮瑪', name: 'A4墨灰100ml', cost: 200 },
  { brand: '髮瑪', name: '+3Warm暖100ml', cost: 200 },
  { brand: '髮瑪', name: '＋3Cool冷100ml', cost: 200 },
  { brand: '髮瑪', name: 'Orange橙100ml', cost: 200 },
  { brand: '髮瑪', name: 'Yellow皇100ml', cost: 200 },
  { brand: '髮瑪', name: 'V9藕蓮100ml', cost: 200 },
  { brand: '髮瑪', name: 'V11玫金100ml', cost: 200 },
  { brand: '髮瑪', name: 'Green玉100ml', cost: 200 },
  { brand: '髮瑪', name: 'O7朱銅100ml', cost: 200 },
  { brand: '髮瑪', name: 'M4焦茶100ml', cost: 200 },
  { brand: '髮瑪', name: 'V6妃櫻100ml', cost: 200 },
  { brand: '髮瑪', name: '0.66加強紅80ml', cost: 200 },
  { brand: '髮瑪', name: '5.87淺棕雷藤木80ml', cost: 200 },
  { brand: '髮瑪', name: '7.87金雷藤木80ml', cost: 200 },
  { brand: '髮瑪', name: '11.1極淺金灰80ml', cost: 200 },
  { brand: '髮瑪', name: '11.2極淺金紫80ml', cost: 200 },
  { brand: '髮瑪', name: '11.8極淺金珍珠80ml', cost: 200 },
  { brand: '髮瑪', name: '0.28紫藍加強色80ml', cost: 200 },
  { brand: '髮瑪', name: '5.7柚木', cost: 200 }
];

const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map((p, index) => {
  let isBundle = false;
  
  if (p.brand === '威傑士') {
     isBundle = true; 
  }
  
  if (p.brand === '施華蔻' && (p.name === '水漾質感中和膏' || p.name === '俏翎蘆薈中和水1000ml')) {
     isBundle = true;
  }
  
  if (p.brand === '歌薇' && (p.name.includes('熱力塑質霜一劑 1') || p.name.includes('熱力塑質霜一劑 2') || p.name.includes('熱力塑質霜一劑 3'))) {
     isBundle = true;
  }

  // Construct base object without conditional properties first
  const product: Product = {
    id: `prod_${String(index + 1).padStart(3, '0')}`,
    brand: p.brand,
    name: p.name,
    costPrice: p.cost,
    isActive: true,
    isFeatured: false,
  };

  // Only add promotion if it exists (avoid undefined)
  if (isBundle) {
      product.promotion = NEW_YEAR_PROMO;
  }

  return product;
});

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
      // Return initial if nothing stored locally yet
      return INITIAL_ANNOUNCEMENT;
    }
    return JSON.parse(stored);
  },

  subscribeToAnnouncement: (callback: (announcement: Announcement) => void) => {
      if (!isDbEnabled || !db) {
          // Fallback to local storage logic
          const stored = localStorage.getItem(KEYS.ANNOUNCEMENT);
          callback(stored ? JSON.parse(stored) : INITIAL_ANNOUNCEMENT);

          const interval = setInterval(() => {
              const current = localStorage.getItem(KEYS.ANNOUNCEMENT);
              if (current) callback(JSON.parse(current));
          }, 2000);
          return () => clearInterval(interval);
      }

      // Firestore Subscription
      const docRef = doc(db, "system", "announcement");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              callback(docSnap.data() as Announcement);
          } else {
              // If no announcement exists yet, seed the initial one locally or just return it
              callback(INITIAL_ANNOUNCEMENT);
          }
      }, (error) => {
          console.error("Error fetching announcement:", error);
          // Fallback on error
          callback(INITIAL_ANNOUNCEMENT);
      });

      return unsubscribe;
  },

  saveAnnouncement: async (announcement: Announcement) => {
    if (isDbEnabled && db) {
        // Sanitize
        const safeData = JSON.parse(JSON.stringify(announcement));
        await setDoc(doc(db, "system", "announcement"), safeData);
    } else {
        localStorage.setItem(KEYS.ANNOUNCEMENT, JSON.stringify(announcement));
    }
  },

  // Products
  // Subscribes to the products collection. If empty, seeds it with INITIAL_PRODUCTS.
  subscribeToProducts: (callback: (products: Product[]) => void) => {
      if (!isDbEnabled || !db) {
          // Fallback to local storage logic
          const stored = localStorage.getItem(KEYS.PRODUCTS);
          const initial = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
          if (!stored) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
          
          callback(initial);
          
          // Poll for local changes (simple hack for local mode sync across tabs/components if needed)
          const interval = setInterval(() => {
              const current = localStorage.getItem(KEYS.PRODUCTS);
              if (current) callback(JSON.parse(current));
          }, 2000);
          return () => clearInterval(interval);
      }

      // Simplified query to avoid requiring a composite index.
      // We sort only by brand here, and perform secondary sorting (by name) in the client callback.
      const q = query(collection(db, "products"), orderBy("brand"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
          if (snapshot.empty) {
              // Seed data if DB is empty
              console.log('[System] Database empty. Seeding initial products...');
              const chunkSize = 450; // Firestore batch limit is 500
              for (let i = 0; i < INITIAL_PRODUCTS.length; i += chunkSize) {
                  const chunk = INITIAL_PRODUCTS.slice(i, i + chunkSize);
                  const batch = writeBatch(db);
                  chunk.forEach(p => {
                      // Ensure no undefined values are passed to Firestore
                      const cleanP = JSON.parse(JSON.stringify(p));
                      const ref = doc(db, "products", p.id);
                      batch.set(ref, cleanP);
                  });
                  await batch.commit();
              }
              console.log('[System] Seeding complete.');
              // Snapshot will fire again automatically after write
          } else {
              const products: Product[] = [];
              snapshot.forEach(doc => products.push(doc.data() as Product));
              
              // Client-side sort to ensure consistent order (Brand -> Name)
              products.sort((a, b) => {
                  if (a.brand !== b.brand) {
                      return a.brand.localeCompare(b.brand, 'zh-TW');
                  }
                  return a.name.localeCompare(b.name, 'zh-TW');
              });
              
              callback(products);
          }
      });
      return unsubscribe;
  },

  saveProduct: async (product: Product) => {
    if (isDbEnabled && db) {
        // Firestore doesn't accept undefined values.
        // We sanitize the object by removing keys with undefined values.
        const safeProduct = JSON.parse(JSON.stringify(product));
        await setDoc(doc(db, "products", product.id), safeProduct);
    } else {
        const products = dataService.getProductsLocal();
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) products[index] = product;
        else products.push(product);
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  updateProductBatch: async (products: Product[]) => {
      if (isDbEnabled && db) {
          const batch = writeBatch(db);
          products.forEach(p => {
             const cleanP = JSON.parse(JSON.stringify(p));
             const ref = doc(db, "products", p.id);
             batch.set(ref, cleanP);
          });
          await batch.commit();
      } else {
        const currentProducts = dataService.getProductsLocal();
        const updatesMap = new Map(products.map(p => [p.id, p]));
        const newProducts = currentProducts.map(p => updatesMap.get(p.id) || p);
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(newProducts));
      }
  },

  deleteProduct: async (id: string) => {
    if (isDbEnabled && db) {
        await deleteDoc(doc(db, "products", id));
    } else {
        const products = dataService.getProductsLocal().filter(p => p.id !== id);
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  resetProductDatabase: async () => {
    if (isDbEnabled && db) {
        console.log('[System] Resetting product database...');
        // 1. Delete all existing products
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);
        
        const deleteChunkSize = 450;
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += deleteChunkSize) {
            const chunk = docs.slice(i, i + deleteChunkSize);
            const batch = writeBatch(db);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        console.log('[System] All existing products deleted.');

        // 2. Seed initial products
        const seedChunkSize = 450; 
        for (let i = 0; i < INITIAL_PRODUCTS.length; i += seedChunkSize) {
            const chunk = INITIAL_PRODUCTS.slice(i, i + seedChunkSize);
            const batch = writeBatch(db);
            chunk.forEach(p => {
                const cleanP = JSON.parse(JSON.stringify(p));
                const ref = doc(db, "products", p.id);
                batch.set(ref, cleanP);
            });
            await batch.commit();
        }
        console.log('[System] Database reset complete with initial products.');
    } else {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        console.log('[System] Local storage reset complete.');
    }
  },

  // Helper for local fallback
  getProductsLocal: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  },

  // Products (Public getter for initial load if needed, but prefer subscription)
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
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
        // Sanitize undefined values before sending to Firestore
        const safeOrder = JSON.parse(JSON.stringify(order));
        await setDoc(doc(db, "orders", order.id), safeOrder);
    } else {
        const orders = dataService.getOrdersLocalFallback();
        orders.unshift(order);
        localStorage.setItem(KEYS.LOCAL_ORDERS, JSON.stringify(orders));
    }
  },

  updateOrder: async (updatedOrder: Order) => {
    if (isDbEnabled && db) {
        const orderRef = doc(db, "orders", updatedOrder.id);
        // Sanitize undefined values
        const safeOrder = JSON.parse(JSON.stringify(updatedOrder));
        await updateDoc(orderRef, safeOrder);
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
             // Sanitize undefined values
             const safeOrder = JSON.parse(JSON.stringify(o));
             return updateDoc(orderRef, safeOrder);
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