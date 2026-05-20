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
    return demo;
  }
  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Email ou mot de passe incorrect.");
  setSession(user);
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

/* ── SEED DATA ── */

function seedDemoProducts() {
  const demo: Omit<Product, "id">[] = [
    { name: "Croissant", price: 1.20, price_buy: 0.40, category: "Boulangerie", barcode: "3700000000001", stock: 48, stock_min: 10, tva: 5.5, active: true },
    { name: "Pain de campagne", price: 3.50, price_buy: 1.20, category: "Boulangerie", barcode: "3700000000002", stock: 12, stock_min: 5, tva: 5.5, active: true },
    { name: "Pain au chocolat", price: 1.40, price_buy: 0.45, category: "Boulangerie", barcode: "3700000000003", stock: 35, stock_min: 10, tva: 5.5, active: true },
    { name: "Café expresso", price: 2.00, price_buy: 0.30, category: "Boissons", barcode: "3700000000004", stock: 200, stock_min: 50, tva: 10, active: true },
    { name: "Eau Evian 50cl", price: 1.00, price_buy: 0.25, category: "Boissons", barcode: "3700000000005", stock: 72, stock_min: 20, tva: 5.5, active: true },
    { name: "Coca-Cola 33cl", price: 1.80, price_buy: 0.60, category: "Boissons", barcode: "3700000000006", stock: 4, stock_min: 12, tva: 20, active: true },
    { name: "Salade César", price: 4.50, price_buy: 1.50, category: "Snacks", barcode: "3700000000007", stock: 8, stock_min: 5, tva: 10, active: true },
    { name: "Sandwich jambon", price: 3.90, price_buy: 1.30, category: "Snacks", barcode: "3700000000008", stock: 0, stock_min: 6, tva: 10, active: true },
    { name: "Pâtes Barilla 500g", price: 1.85, price_buy: 0.80, category: "Épicerie", barcode: "3700000000009", stock: 24, stock_min: 10, tva: 5.5, active: true },
    { name: "Tomates grappe 500g", price: 2.20, price_buy: 0.90, category: "Épicerie", barcode: "3700000000010", stock: 18, stock_min: 8, tva: 5.5, active: true },
  ];
  demo.forEach((p) => saveProduct(p));

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
