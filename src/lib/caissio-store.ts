// Caissio data store — localStorage-based, works without backend

export type CaissioUser = {
  id: string;
  name: string;
  store_name: string;
  email: string;
  password: string;
  pin?: string;
  plan: "starter" | "pro" | "business";
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  price_buy?: number;
  category: string;
  barcode?: string;
  stock: number;
  stock_min?: number;
  tva: number;
  image_url?: string;
  active: boolean;
};

export type SaleItem = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
};

export type Sale = {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: "cash" | "card" | "mixed" | "account";
  cash_given?: number;
  change?: number;
  customer_id?: string;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points: number;
  balance: number; // outstanding tab (amount owed)
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
};

export type StoreSettings = {
  name: string;
  siret?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  ticket_footer?: string;
};

const KEY = {
  users: "caissio_users",
  session: "caissio_session",
  products: "caissio_products",
  sales: "caissio_sales",
  customers: "caissio_customers",
  suppliers: "caissio_suppliers",
  settings: "caissio_settings",
};

function get<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ── AUTH ── */

export function getUsers(): CaissioUser[] { return get<CaissioUser>(KEY.users); }

export function register(data: Omit<CaissioUser, "id" | "plan" | "created_at">): CaissioUser {
  const users = getUsers();
  if (users.find((u) => u.email === data.email)) throw new Error("Email déjà utilisé.");
  const user: CaissioUser = { ...data, id: uid(), plan: "pro", created_at: new Date().toISOString() };
  set(KEY.users, [...users, user]);
  setSession(user);
  // seed demo products on first register
  if (getProducts().length === 0) seedDemoProducts();
  return user;
}

export function login(email: string, password: string): CaissioUser {
  // allow demo account always
  if (email === "admin@caissio.fr" && password === "admin123") {
    const demo: CaissioUser = {
      id: "demo", name: "Admin Demo", store_name: "Épicerie Demo",
      email, password, pin: "123456", plan: "pro", created_at: "2026-01-01T00:00:00Z",
    };
    setSession(demo);
    if (getProducts().length === 0) seedDemoProducts();
    else migrateMissingCategories();
    return demo;
  }
  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Email ou mot de passe incorrect.");
  setSession(user);
  if (getProducts().length === 0) seedDemoProducts();
  else migrateMissingCategories();
  return user;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY.session);
}

export function getSession(): CaissioUser | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY.session) || "null"); } catch { return null; }
}

function setSession(user: CaissioUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY.session, JSON.stringify(user));
}

/* ── PRODUCTS ── */

export function getProducts(): Product[] { return get<Product>(KEY.products); }

export function saveProduct(p: Omit<Product, "id">): Product {
  const products = getProducts();
  const prod: Product = { ...p, id: uid() };
  set(KEY.products, [...products, prod]);
  return prod;
}

export function updateProduct(id: string, data: Partial<Product>): void {
  set(KEY.products, getProducts().map((p) => p.id === id ? { ...p, ...data } : p));
}

export function deleteProduct(id: string): void {
  set(KEY.products, getProducts().filter((p) => p.id !== id));
}

/* ── SALES ── */

export function getSales(): Sale[] { return get<Sale>(KEY.sales); }

export function recordSale(sale: Omit<Sale, "id" | "created_at">): Sale {
  const s: Sale = { ...sale, id: uid(), created_at: new Date().toISOString() };
  set(KEY.sales, [...getSales(), s]);
  // decrement stock
  const products = getProducts();
  s.items.forEach((item) => {
    const p = products.find((x) => x.id === item.product_id);
    if (p) updateProduct(p.id, { stock: Math.max(0, p.stock - item.qty) });
  });
  // customer: add points (1 per €) + handle account payment
  if (s.customer_id) {
    addCustomerPoints(s.customer_id, Math.floor(s.total));
    if (s.payment === "account") {
      addCustomerBalance(s.customer_id, s.total);
    }
  }
  return s;
}

/* ── PIN ── */

export function validatePin(pin: string): boolean {
  const user = getSession();
  if (!user) return false;
  return user.pin === pin;
}

export function setUserPin(pin: string): void {
  const user = getSession();
  if (!user) return;
  const updated = { ...user, pin };
  setSession(updated);
  if (user.id !== "demo") {
    const users = getUsers();
    set(KEY.users, users.map((u) => u.id === user.id ? { ...u, pin } : u));
  }
}

/* ── CUSTOMERS ── */

export function getCustomers(): Customer[] { return get<Customer>(KEY.customers); }

export function saveCustomer(c: Omit<Customer, "id" | "points" | "balance" | "created_at">): Customer {
  const cust: Customer = { ...c, id: uid(), points: 0, balance: 0, created_at: new Date().toISOString() };
  set(KEY.customers, [...getCustomers(), cust]);
  return cust;
}

export function addCustomerBalance(customerId: string, amount: number): void {
  set(KEY.customers, getCustomers().map((c) =>
    c.id === customerId ? { ...c, balance: (c.balance ?? 0) + amount } : c
  ));
}

export function addCustomerPoints(customerId: string, points: number): void {
  set(KEY.customers, getCustomers().map((c) =>
    c.id === customerId ? { ...c, points: c.points + points } : c
  ));
}

/* ── SUPPLIERS ── */

export function getSuppliers(): Supplier[] { return get<Supplier>(KEY.suppliers); }

export function saveSupplier(s: Omit<Supplier, "id" | "created_at">): Supplier {
  const sup: Supplier = { ...s, id: uid(), created_at: new Date().toISOString() };
  set(KEY.suppliers, [...getSuppliers(), sup]);
  return sup;
}

export function updateSupplier(id: string, data: Partial<Supplier>): void {
  set(KEY.suppliers, getSuppliers().map((s) => s.id === id ? { ...s, ...data } : s));
}

export function deleteSupplier(id: string): void {
  set(KEY.suppliers, getSuppliers().filter((s) => s.id !== id));
}

/* ── STORE SETTINGS ── */

export function getStoreSettings(): StoreSettings {
  if (typeof window === "undefined") return { name: "Mon Commerce" };
  try {
    const raw = localStorage.getItem(KEY.settings);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const user = getSession();
  return { name: user?.store_name || "Mon Commerce" };
}

export function saveStoreSettings(s: StoreSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY.settings, JSON.stringify(s));
}

/* ── DASHBOARD STATS ── */

export function getDashboardStats() {
  const sales = getSales();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = sales.filter((s) => s.created_at.startsWith(todayStr));
  const weekSales = sales.filter((s) => new Date(s.created_at) >= weekAgo);
  const monthSales = sales.filter((s) => new Date(s.created_at) >= monthStart);

  const sum = (arr: Sale[]) => arr.reduce((t, s) => t + s.total, 0);

  // last 7 days chart
  const last7: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    last7.push({ date: ds, revenue: sum(sales.filter((s) => s.created_at.startsWith(ds))) });
  }

  // hourly today
  const hourly: { hour: string; revenue: number }[] = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    revenue: sum(todaySales.filter((s) => new Date(s.created_at).getHours() === h)),
  }));

  // top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  monthSales.forEach((s) => s.items.forEach((item) => {
    if (!productMap[item.product_id]) productMap[item.product_id] = { name: item.name, qty: 0, revenue: 0 };
    productMap[item.product_id].qty += item.qty;
    productMap[item.product_id].revenue += item.price * item.qty;
  }));
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // low stock
  const products = getProducts();
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= (p.stock_min ?? 5));
  const outOfStock = products.filter((p) => p.stock === 0);

  return {
    kpis: {
      day_revenue: sum(todaySales),
      day_tickets: todaySales.length,
      week_revenue: sum(weekSales),
      month_revenue: sum(monthSales),
      avg_basket: todaySales.length > 0 ? sum(todaySales) / todaySales.length : 0,
    },
    last7,
    hourly,
    topProducts,
    lowStock,
    outOfStock,
  };
}

/* ── PRODUCT CATALOG (single source of truth) ── */

// Unsplash direct CDN – reliable, permanent, no API key needed
function u(id: string) { return `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop&auto=format&q=80`; }

const DEMO_CATALOG: Omit<Product, "id">[] = [
  // ── BOULANGERIE ──────────────────────────────────────────────────────────
  { name: "Croissant",          price: 1.20, price_buy: 0.40, category: "Boulangerie", barcode: "3700000000001", stock: 48, stock_min: 10, tva: 5.5,  active: true, image_url: u("1555507036-ab1f4038808a") },
  { name: "Pain au chocolat",   price: 1.40, price_buy: 0.45, category: "Boulangerie", barcode: "3700000000003", stock: 35, stock_min: 10, tva: 5.5,  active: true, image_url: u("1604882941706-7adadb3cd688") },
  { name: "Pain de campagne",   price: 3.50, price_buy: 1.20, category: "Boulangerie", barcode: "3700000000002", stock: 12, stock_min:  5, tva: 5.5,  active: true, image_url: u("1509440159596-0249088772ff") },
  { name: "Baguette tradition", price: 1.10, price_buy: 0.30, category: "Boulangerie", barcode: "3700000000034", stock: 40, stock_min: 15, tva: 5.5,  active: true, image_url: u("1549931319-a545dcf3bc7b") },
  { name: "Chausson aux pommes",price: 1.60, price_buy: 0.55, category: "Boulangerie", barcode: "3700000000035", stock: 20, stock_min:  6, tva: 5.5,  active: true, image_url: u("1519915028121-7d003417fd9a") },
  { name: "Éclair chocolat",    price: 2.20, price_buy: 0.80, category: "Boulangerie", barcode: "3700000000036", stock: 15, stock_min:  5, tva: 5.5,  active: true, image_url: u("1578985545062-69928b1d9587") },
  { name: "Tarte aux fraises",  price: 4.80, price_buy: 1.90, category: "Boulangerie", barcode: "3700000000037", stock:  8, stock_min:  3, tva: 5.5,  active: true, image_url: u("1464219789935-c2d9d9aba644") },
  { name: "Brioche feuilletée", price: 2.50, price_buy: 0.90, category: "Boulangerie", barcode: "3700000000038", stock: 18, stock_min:  6, tva: 5.5,  active: true, image_url: u("1586444248902-2f64eddc13df") },
  { name: "Millefeuille",       price: 3.20, price_buy: 1.20, category: "Boulangerie", barcode: "3700000000039", stock: 10, stock_min:  4, tva: 5.5,  active: true, image_url: u("1621955511577-8e92da25e7bc") },
  { name: "Quiche lorraine",    price: 4.20, price_buy: 1.60, category: "Boulangerie", barcode: "3700000000040", stock:  6, stock_min:  3, tva: 10,   active: true, image_url: u("1565299585323-38d6b0865b47") },

  // ── BOISSONS ─────────────────────────────────────────────────────────────
  { name: "Café expresso",         price: 2.00, price_buy: 0.30, category: "Boissons", barcode: "3700000000004", stock: 200, stock_min: 50, tva: 10,  active: true, image_url: u("1510707577719-ae7c14805e3a") },
  { name: "Eau Evian 50cl",        price: 1.00, price_buy: 0.25, category: "Boissons", barcode: "3700000000005", stock:  72, stock_min: 20, tva: 5.5, active: true, image_url: u("1548839140-29a749e1cf4d") },
  { name: "Coca-Cola 33cl",        price: 1.80, price_buy: 0.60, category: "Boissons", barcode: "3700000000006", stock:   4, stock_min: 12, tva: 20,  active: true, image_url: u("1561758033-d89a9ad46330") },
  { name: "Jus d'orange 1L",       price: 2.50, price_buy: 0.90, category: "Boissons", barcode: "3700000000041", stock:  30, stock_min: 10, tva: 5.5, active: true, image_url: u("1600271886742-f049cd451bba") },
  { name: "Lait demi-écrémé 1L",   price: 1.40, price_buy: 0.55, category: "Boissons", barcode: "3700000000042", stock:  40, stock_min: 15, tva: 5.5, active: true, image_url: u("1550583724-b2692b85b150") },
  { name: "Thé glacé citron",       price: 2.20, price_buy: 0.70, category: "Boissons", barcode: "3700000000043", stock:  24, stock_min:  8, tva: 10,  active: true, image_url: u("1556679908-d4f65571fe28") },
  { name: "Smoothie fruits rouges", price: 3.50, price_buy: 1.20, category: "Boissons", barcode: "3700000000044", stock:  16, stock_min:  6, tva: 10,  active: true, image_url: u("1553530666-ba11a7da3888") },
  { name: "Bière Heineken 33cl",    price: 2.80, price_buy: 1.00, category: "Boissons", barcode: "3700000000045", stock:  48, stock_min: 12, tva: 20,  active: true, image_url: u("1608270586620-248524c67de9") },

  // ── SNACKS ───────────────────────────────────────────────────────────────
  { name: "Sandwich jambon",   price: 3.90, price_buy: 1.30, category: "Snacks", barcode: "3700000000008", stock:  0, stock_min:  6, tva: 10, active: true, image_url: u("1528735602780-2552fd46c7af") },
  { name: "Salade César",      price: 4.50, price_buy: 1.50, category: "Snacks", barcode: "3700000000007", stock:  8, stock_min:  5, tva: 10, active: true, image_url: u("1512621776951-a57141f2eefd") },
  { name: "Pizza Margherita",  price: 6.90, price_buy: 2.50, category: "Snacks", barcode: "3700000000046", stock: 12, stock_min:  4, tva: 10, active: true, image_url: u("1565299624946-b28f40a0ae38") },
  { name: "Chips 150g",        price: 1.80, price_buy: 0.70, category: "Snacks", barcode: "3700000000047", stock: 30, stock_min: 10, tva: 20, active: true, image_url: u("1621447504864-d8686e12698c") },
  { name: "Barre chocolatée",  price: 1.20, price_buy: 0.45, category: "Snacks", barcode: "3700000000048", stock: 40, stock_min: 12, tva: 20, active: true, image_url: u("1599599810769-bcde5a160d32") },
  { name: "Wrap poulet",       price: 4.20, price_buy: 1.40, category: "Snacks", barcode: "3700000000049", stock: 10, stock_min:  4, tva: 10, active: true, image_url: u("1626700051175-7ca1e3e1e6f8") },
  { name: "Bowl saumon",       price: 7.50, price_buy: 2.80, category: "Snacks", barcode: "3700000000050", stock:  6, stock_min:  3, tva: 10, active: true, image_url: u("1546069901-ba9599a7e63c") },
  { name: "Panini fromage",    price: 3.80, price_buy: 1.30, category: "Snacks", barcode: "3700000000051", stock:  8, stock_min:  4, tva: 10, active: true, image_url: u("1484723045421-1ffb88d5aef7") },

  // ── ÉPICERIE ─────────────────────────────────────────────────────────────
  { name: "Pâtes Barilla 500g",  price: 1.85, price_buy: 0.80, category: "Épicerie", barcode: "3700000000009", stock: 24, stock_min: 10, tva: 5.5, active: true, image_url: u("1551462147-37885acc9edd") },
  { name: "Tomates grappe 500g", price: 2.20, price_buy: 0.90, category: "Épicerie", barcode: "3700000000010", stock: 18, stock_min:  8, tva: 5.5, active: true, image_url: u("1592841584227-a4a0c892e6b1") },
  { name: "Huile d'olive 50cl",  price: 4.50, price_buy: 1.80, category: "Épicerie", barcode: "3700000000052", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1474979078745-74b89a2f43e7") },
  { name: "Café en grains 250g", price: 5.90, price_buy: 2.50, category: "Épicerie", barcode: "3700000000053", stock: 15, stock_min:  5, tva: 5.5, active: true, image_url: u("1447933601428-5b7b08e80dbd") },
  { name: "Riz basmati 1kg",     price: 2.80, price_buy: 1.10, category: "Épicerie", barcode: "3700000000054", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1536304929831-ee1ca9d44906") },
  { name: "Farine T45 1kg",      price: 1.20, price_buy: 0.45, category: "Épicerie", barcode: "3700000000055", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1574323347407-f28e9082c0e9") },
  { name: "Sucre blanc 1kg",     price: 1.10, price_buy: 0.40, category: "Épicerie", barcode: "3700000000056", stock: 16, stock_min:  6, tva: 5.5, active: true, image_url: u("1542838132-e8e533e6c48c") },
  { name: "Beurre doux 250g",    price: 2.20, price_buy: 0.90, category: "Épicerie", barcode: "3700000000057", stock: 20, stock_min:  8, tva: 5.5, active: true, image_url: u("1589985270958-14e2e7a08462") },
  { name: "Miel acacia 250g",    price: 4.90, price_buy: 2.00, category: "Épicerie", barcode: "3700000000058", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1587049352846-4a222e784d38") },
  { name: "Chocolat noir 70%",   price: 2.50, price_buy: 1.00, category: "Épicerie", barcode: "3700000000059", stock: 14, stock_min:  5, tva: 5.5, active: true, image_url: u("1606312619070-d48b4c652a52") },

  // ── FRUITS ───────────────────────────────────────────────────────────────
  { name: "Pommes Golden 1kg",   price: 2.50, price_buy: 1.00, category: "Fruits", barcode: "3700000000011", stock: 40, stock_min: 10, tva: 5.5, active: true, image_url: u("1568702846914-96b305d2aaeb") },
  { name: "Bananes 1kg",         price: 1.90, price_buy: 0.70, category: "Fruits", barcode: "3700000000012", stock: 30, stock_min:  8, tva: 5.5, active: true, image_url: u("1571771894821-ce9b6c11b08e") },
  { name: "Fraises 250g",        price: 3.50, price_buy: 1.40, category: "Fruits", barcode: "3700000000016", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1464965911861-746a04b4bca6") },
  { name: "Oranges filet 1kg",   price: 2.20, price_buy: 0.90, category: "Fruits", barcode: "3700000000025", stock: 28, stock_min:  8, tva: 5.5, active: true, image_url: u("1582979512210-7a3e41e04fe3") },
  { name: "Poires Williams 1kg", price: 2.80, price_buy: 1.10, category: "Fruits", barcode: "3700000000026", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1601004890874-a5a45adb0c52") },
  { name: "Kiwis ×4",            price: 1.80, price_buy: 0.70, category: "Fruits", barcode: "3700000000027", stock: 22, stock_min:  6, tva: 5.5, active: true, image_url: u("1585059895524-72f6a4f81f10") },
  { name: "Raisins 500g",        price: 3.20, price_buy: 1.30, category: "Fruits", barcode: "3700000000028", stock: 15, stock_min:  5, tva: 5.5, active: true, image_url: u("1537640538966-79f369143f8f") },
  { name: "Mangue",              price: 2.50, price_buy: 1.00, category: "Fruits", barcode: "3700000000060", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1553279648-1005ef4f21a8") },
  { name: "Ananas entier",       price: 3.80, price_buy: 1.50, category: "Fruits", barcode: "3700000000061", stock: 10, stock_min:  4, tva: 5.5, active: true, image_url: u("1490885578174-acda8905c2c1") },
  { name: "Cerises 500g",        price: 4.50, price_buy: 1.80, category: "Fruits", barcode: "3700000000062", stock: 14, stock_min:  5, tva: 5.5, active: true, image_url: u("1528821128474-27f6f0a80339") },
  { name: "Pêches 1kg",          price: 3.20, price_buy: 1.30, category: "Fruits", barcode: "3700000000063", stock: 16, stock_min:  6, tva: 5.5, active: true, image_url: u("1595743825559-0c6f4b1e4e1d") },
  { name: "Melon",               price: 3.50, price_buy: 1.40, category: "Fruits", barcode: "3700000000064", stock:  8, stock_min:  3, tva: 5.5, active: true, image_url: u("1571575309144-96b282d3d997") },

  // ── LÉGUMES ──────────────────────────────────────────────────────────────
  { name: "Salade verte",        price: 1.20, price_buy: 0.40, category: "Légumes", barcode: "3700000000013", stock: 15, stock_min:  5, tva: 5.5, active: true, image_url: u("1540420773420-3366772f4999") },
  { name: "Carottes 1kg",        price: 1.30, price_buy: 0.45, category: "Légumes", barcode: "3700000000014", stock: 25, stock_min:  8, tva: 5.5, active: true, image_url: u("1598170845058-32b9d6a5da37") },
  { name: "Courgettes 500g",     price: 1.60, price_buy: 0.60, category: "Légumes", barcode: "3700000000015", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1622206151226-18ca2c9ab4a1") },
  { name: "Tomates cerise 250g", price: 2.40, price_buy: 0.95, category: "Légumes", barcode: "3700000000029", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1592841584227-a4a0c892e6b1") },
  { name: "Poireaux 500g",       price: 1.50, price_buy: 0.55, category: "Légumes", barcode: "3700000000030", stock: 14, stock_min:  5, tva: 5.5, active: true, image_url: u("1624718900781-36bf1b0b3c96") },
  { name: "Champignons 250g",    price: 2.10, price_buy: 0.85, category: "Légumes", barcode: "3700000000031", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1589927986089-35812388d1f4") },
  { name: "Poivrons ×3",         price: 1.90, price_buy: 0.75, category: "Légumes", barcode: "3700000000032", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1563746924691-4374a1e4b84e") },
  { name: "Haricots verts 500g", price: 2.30, price_buy: 0.90, category: "Légumes", barcode: "3700000000033", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1567306302858-4aae82219f4e") },
  { name: "Brocolis",            price: 2.00, price_buy: 0.80, category: "Légumes", barcode: "3700000000065", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1459411621453-7b03977f4bfc") },
  { name: "Épinards 200g",       price: 1.80, price_buy: 0.70, category: "Légumes", barcode: "3700000000066", stock: 14, stock_min:  5, tva: 5.5, active: true, image_url: u("1576045057995-568f6f90a0fe") },
  { name: "Oignons 1kg",         price: 1.40, price_buy: 0.50, category: "Légumes", barcode: "3700000000067", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1582284541042-c7ded8eac8cc") },
  { name: "Pommes de terre 2kg", price: 2.90, price_buy: 1.10, category: "Légumes", barcode: "3700000000068", stock: 20, stock_min:  8, tva: 5.5, active: true, image_url: u("1518977676037-74d3f7a04f67") },

  // ── FROMAGE ──────────────────────────────────────────────────────────────
  { name: "Camembert 250g",    price: 3.20, price_buy: 1.40, category: "Fromage", barcode: "3700000000017", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1452195100486-9cc805987862") },
  { name: "Comté AOP 150g",    price: 4.80, price_buy: 2.20, category: "Fromage", barcode: "3700000000018", stock: 14, stock_min:  4, tva: 5.5, active: true, image_url: u("1589985270958-14e2e7a08462") },
  { name: "Chèvre frais",      price: 2.80, price_buy: 1.10, category: "Fromage", barcode: "3700000000019", stock: 10, stock_min:  4, tva: 5.5, active: true, image_url: u("1626645738196-c2a7c87a8f58") },
  { name: "Brie de Meaux",     price: 3.90, price_buy: 1.80, category: "Fromage", barcode: "3700000000020", stock:  8, stock_min:  3, tva: 5.5, active: true, image_url: u("1559561853-0cf9f8e5ac9d") },
  { name: "Gruyère râpé 200g", price: 2.50, price_buy: 1.00, category: "Fromage", barcode: "3700000000069", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1604152135252-3abd8cdf23a8") },
  { name: "Mozzarella 125g",   price: 1.90, price_buy: 0.75, category: "Fromage", barcode: "3700000000070", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1618164436431-df07e3c3c4ae") },
  { name: "Roquefort 100g",    price: 3.50, price_buy: 1.60, category: "Fromage", barcode: "3700000000071", stock: 10, stock_min:  3, tva: 5.5, active: true, image_url: u("1617692855027-33b14f061079") },
  { name: "Emmental tranché",  price: 2.20, price_buy: 0.90, category: "Fromage", barcode: "3700000000072", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1560807888-d27d4c0b7a14") },

  // ── CHARCUTERIE ──────────────────────────────────────────────────────────
  { name: "Jambon blanc 4 tr.",  price: 3.50, price_buy: 1.60, category: "Charcuterie", barcode: "3700000000021", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1567620905732-2d1ec7ab7445") },
  { name: "Saucisson sec 200g",  price: 4.20, price_buy: 2.00, category: "Charcuterie", barcode: "3700000000022", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1544025162-d76538d-blank") },
  { name: "Lardons fumés 200g",  price: 2.50, price_buy: 1.10, category: "Charcuterie", barcode: "3700000000023", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1529193591184-b1d58069ecdd") },
  { name: "Rosette tranchée",    price: 3.80, price_buy: 1.70, category: "Charcuterie", barcode: "3700000000024", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1606787366850-de6330128bfc") },
  { name: "Chorizo doux 150g",   price: 3.20, price_buy: 1.40, category: "Charcuterie", barcode: "3700000000073", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1604503468614-b2f8b4a5b2a2") },
  { name: "Rillettes du Mans",   price: 3.50, price_buy: 1.50, category: "Charcuterie", barcode: "3700000000074", stock: 14, stock_min:  4, tva: 5.5, active: true, image_url: u("1544025162-d76538d-alt") },
  { name: "Pâté de campagne",    price: 2.80, price_buy: 1.20, category: "Charcuterie", barcode: "3700000000075", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1608198093002-ad4e005484ec") },
  { name: "Mortadelle 150g",     price: 2.90, price_buy: 1.20, category: "Charcuterie", barcode: "3700000000076", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1606787366850-de6330128bfc") },
];

/* ── MIGRATIONS ── */

/** v1 — ensure all 8 categories exist */
export function migrateMissingCategories() {
  const existing = getProducts();
  const cats = new Set(existing.map((p) => p.category));
  const newCats = ["Fruits", "Légumes", "Fromage", "Charcuterie"].filter((c) => !cats.has(c));
  if (newCats.length === 0) return;
  DEMO_CATALOG.filter((p) => newCats.includes(p.category)).forEach((p) => saveProduct(p));
}

/** v2 — add image_url to existing products + inject new products per category */
export function migrateV2() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("caissio_mv2")) return;

  const existing = getProducts();
  const byBarcode = new Map(existing.map((p) => [p.barcode, p]));

  DEMO_CATALOG.forEach((prod) => {
    if (!prod.barcode) return;
    const ex = byBarcode.get(prod.barcode);
    if (ex) {
      if (!ex.image_url) updateProduct(ex.id, { image_url: prod.image_url });
    } else {
      saveProduct(prod);
    }
  });

  localStorage.setItem("caissio_mv2", "1");
}

/* ── SEED DATA ── */

function seedDemoProducts() {
  DEMO_CATALOG.forEach((p) => saveProduct(p));

  // seed a few past sales for dashboard demo
  const now = new Date();
  for (let d = 6; d >= 0; d--) {
    const count = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < count; i++) {
      const products = getProducts();
      const items = [products[Math.floor(Math.random() * products.length)]].filter(Boolean).map((p) => ({
        product_id: p.id, name: p.name, price: p.price, qty: Math.floor(Math.random() * 3) + 1,
      }));
      const total = items.reduce((t, x) => t + x.price * x.qty, 0);
      const date = new Date(now.getTime() - d * 86400000);
      date.setHours(Math.floor(Math.random() * 10) + 9);
      const s: Sale = {
        id: uid(), items, subtotal: total, discount: 0, total,
        payment: Math.random() > 0.5 ? "card" : "cash", created_at: date.toISOString(),
      };
      set(KEY.sales, [...getSales(), s]);
    }
  }
}
