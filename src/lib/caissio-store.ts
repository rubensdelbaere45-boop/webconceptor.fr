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
  // Mode Test / Live (comme Stripe)
  mode: "test" | "live";
  // Onboarding
  onboarding_done?: boolean;
  // Google OAuth
  google_sub?: string;
  // Stripe / subscription
  trial_ends_at: string;
  stripe_customer_id?: string;
  subscription_status?: "trialing" | "active" | "past_due" | "cancelled";
  subscription_plan?: "starter" | "pro" | "business";
  subscription_verified_at?: string;
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
  widget?: boolean; // true = affiché directement sur l'écran d'accueil caisse (hors catégorie)
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
  mode?: "test" | "live";
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points: number;
  balance: number;
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

export type CustomCategory = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  light: string;
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

export type InvoiceLine = {
  description: string;
  qty: number;
  unit_price_ht: number;
  tva_rate: number;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
};

export type TvaBreakdown = {
  rate: number;
  base_ht: number;
  tva_amount: number;
};

export type Invoice = {
  id: string;
  number: string; // FAC-2026-0001
  date: string;
  due_date?: string;
  sale_id?: string;
  // Vendeur
  seller_name: string;
  seller_address?: string;
  seller_siret?: string;
  seller_vat_number?: string;
  seller_email?: string;
  seller_phone?: string;
  // Client
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_email?: string;
  customer_phone?: string;
  // Lignes
  lines: InvoiceLine[];
  // Totaux
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  tva_breakdown: TvaBreakdown[];
  // Paiement
  payment_method?: string;
  notes?: string;
  status: "draft" | "sent" | "paid";
  created_at: string;
};

const KEY = {
  users:       "caissio_users",
  session:     "caissio_session",
  products:    "caissio_products",
  sales:       "caissio_sales",        // live
  sales_test:  "caissio_sales_test",   // test
  customers:   "caissio_customers",
  suppliers:   "caissio_suppliers",
  settings:    "caissio_settings",
  invoices:    "caissio_invoices",
  categories:  "caissio_categories",
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

/** Clé des ventes selon le mode actuel */
function salesKey(): string {
  const user = getSession();
  return user?.mode === "live" ? KEY.sales : KEY.sales_test;
}

/* ── AUTH ── */

export function getUsers(): CaissioUser[] { return get<CaissioUser>(KEY.users); }

export function register(data: Omit<CaissioUser, "id" | "plan" | "created_at" | "trial_ends_at" | "mode" | "onboarding_done">): CaissioUser {
  const users = getUsers();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error("Adresse email invalide.");
  if (data.password.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");
  if (data.name.trim().length < 2) throw new Error("Nom invalide.");
  if (data.store_name.trim().length < 2) throw new Error("Nom du commerce invalide.");
  const email = data.email.trim().toLowerCase();
  if (users.find((u) => u.email === email)) throw new Error("Email déjà utilisé.");

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const user: CaissioUser = {
    ...data,
    email,
    id: uid(),
    plan: "pro",
    created_at: new Date().toISOString(),
    trial_ends_at: trialEndsAt,
    subscription_status: "trialing",
    mode: "test",          // tout nouveau compte commence en mode TEST
    onboarding_done: false,
  };
  set(KEY.users, [...users, user]);
  setSession(user);
  // ✅ Pas de seeding automatique — l'onboarding guide l'utilisateur
  return user;
}

/** Inscription via Google OAuth */
export function registerWithGoogle(data: {
  name: string;
  email: string;
  google_sub: string;
  store_name?: string;
}): CaissioUser {
  const users = getUsers();
  const email = data.email.toLowerCase();
  // Si le compte existe déjà, on connecte
  const existing = users.find((u) => u.email === email || u.google_sub === data.google_sub);
  if (existing) {
    const patched = { ...existing, google_sub: data.google_sub };
    set(KEY.users, users.map((u) => u.id === existing.id ? patched : u));
    setSession(patched);
    return patched;
  }
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const user: CaissioUser = {
    id: uid(),
    name: data.name,
    email,
    store_name: data.store_name || data.name,
    password: uid(), // mot de passe aléatoire, ne sera jamais utilisé
    google_sub: data.google_sub,
    plan: "pro",
    created_at: new Date().toISOString(),
    trial_ends_at: trialEndsAt,
    subscription_status: "trialing",
    mode: "test",
    onboarding_done: false,
  };
  set(KEY.users, [...users, user]);
  setSession(user);
  return user;
}

/** Connexion via Google OAuth (sub = identifiant unique Google) */
export function loginWithGoogle(google_sub: string, email: string): CaissioUser | null {
  const users = getUsers();
  const user = users.find((u) => u.google_sub === google_sub || u.email === email.toLowerCase());
  if (!user) return null;

  // Backfill champs manquants (même logique que login() pour les anciens comptes)
  const patched: CaissioUser = {
    ...user,
    google_sub,
    trial_ends_at: user.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_status: user.subscription_status || "trialing",
    mode: user.mode || "live",
    onboarding_done: user.onboarding_done ?? true,
  };

  set(KEY.users, users.map((u) => u.id === user.id ? patched : u));
  setSession(patched);
  migrateMissingCategories();
  migrateV2();
  return patched;
}

export function login(email: string, password: string): CaissioUser {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find((u) => u.email === normalizedEmail && u.password === password);
  if (!user) throw new Error("Email ou mot de passe incorrect.");

  // Backfill champs manquants pour anciens comptes
  const needsPatch = !user.trial_ends_at || !user.mode;
  if (needsPatch) {
    const patched: CaissioUser = {
      ...user,
      trial_ends_at: user.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_status: user.subscription_status || "trialing",
      mode: user.mode || "live", // anciens comptes → live (ils ont déjà leurs vraies données)
      onboarding_done: user.onboarding_done ?? true, // anciens comptes = pas d'onboarding
    };
    set(KEY.users, getUsers().map((u) => u.id === user.id ? patched : u));
    setSession(patched);
    migrateMissingCategories();
    migrateV2();
    return patched;
  }

  setSession(user);
  migrateMissingCategories();
  migrateV2();
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

/* ── MODE TEST / LIVE ── */

/** Passe en mode Live. Les ventes test restent dans leur clé séparée et ne polluent pas. */
export function switchToLive(): void {
  const user = getSession();
  if (!user) return;
  const updated: CaissioUser = { ...user, mode: "live" };
  setSession(updated);
  set(KEY.users, getUsers().map((u) => u.id === user.id ? updated : u));
}

/** Repasse en mode Test (pour les admin / support) */
export function switchToTest(): void {
  const user = getSession();
  if (!user) return;
  const updated: CaissioUser = { ...user, mode: "test" };
  setSession(updated);
  set(KEY.users, getUsers().map((u) => u.id === user.id ? updated : u));
}

/** Efface les ventes de test (appelé lors du passage en Live si l'utilisateur le demande) */
export function clearTestSales(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY.sales_test, "[]");
}

/** Marque l'onboarding comme terminé */
export function markOnboardingDone(): void {
  const user = getSession();
  if (!user) return;
  const updated: CaissioUser = { ...user, onboarding_done: true };
  setSession(updated);
  set(KEY.users, getUsers().map((u) => u.id === user.id ? updated : u));
}

/* ── SUBSCRIPTION HELPERS ── */

export function isTrialing(user: CaissioUser | null): boolean {
  if (!user) return false;
  if (!user.trial_ends_at) return false;
  return new Date(user.trial_ends_at) > new Date();
}

export function trialDaysLeft(user: CaissioUser | null): number {
  if (!user?.trial_ends_at) return 0;
  const ms = new Date(user.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function hasAccess(user: CaissioUser | null): boolean {
  if (!user) return false;
  // Accès pendant l'essai gratuit (trial_ends_at dans le futur)
  if (isTrialing(user)) return true;
  // Accès si le statut est "trialing" (explicite)
  if (user.subscription_status === "trialing") return true;
  // Accès si subscription_status absent → ancien compte localStorage sans champ = essai implicite
  if (!user.subscription_status) return true;
  // Accès si abonnement payant actif
  return user.subscription_status === "active";
}

export function updateSubscription(data: {
  stripe_customer_id?: string;
  subscription_status?: CaissioUser["subscription_status"];
  subscription_plan?: CaissioUser["subscription_plan"];
  subscription_verified_at?: string;
}): void {
  const user = getSession();
  if (!user) return;
  const updated: CaissioUser = { ...user, ...data };
  setSession(updated);
  if (user.id !== "demo") {
    set(KEY.users, getUsers().map((u) => u.id === user.id ? { ...u, ...data } : u));
  }
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

/** Efface tous les produits */
export function clearProducts(): void {
  set(KEY.products, []);
}

/* ── SALES ── */

export function getSales(): Sale[] { return get<Sale>(salesKey()); }

export function recordSale(sale: Omit<Sale, "id" | "created_at" | "mode">): Sale {
  const user = getSession();
  const s: Sale = { ...sale, id: uid(), created_at: new Date().toISOString(), mode: user?.mode ?? "live" };
  set(salesKey(), [...getSales(), s]);
  // Décrémente le stock
  const products = getProducts();
  s.items.forEach((item) => {
    const p = products.find((x) => x.id === item.product_id);
    if (p) updateProduct(p.id, { stock: Math.max(0, p.stock - item.qty) });
  });
  // Points fidélité + compte client
  if (s.customer_id) {
    addCustomerPoints(s.customer_id, Math.floor(s.total));
    if (s.payment === "account") addCustomerBalance(s.customer_id, s.total);
  }

  // ── NF 525 : double-écriture Supabase (immuable, hash chain SHA-256) ──
  // Fire-and-forget : ne bloque pas l'UI, localStorage reste la source de vérité locale.
  if (typeof window !== "undefined" && user?.email) {
    const settings = getStoreSettings();
    const body = {
      user_email:  user.email,
      store_name:  settings.name || user.store_name,
      address:     settings.address  || undefined,
      siret:       settings.siret    || undefined,
      ticket_num:  s.id.slice(-6).toUpperCase(),
      sale_date:   s.created_at,
      subtotal:    s.subtotal,
      discount:    s.discount,
      total:       s.total,
      pay_mode:    s.payment,
      cash_given:  s.cash_given,
      change:      s.change,
      customer_id: s.customer_id,
      mode:        s.mode,
      items:       s.items.map((i) => ({
        name:       i.name,
        qty:        i.qty,
        unit_price: i.price,
        tva_rate:   products.find((p) => p.id === i.product_id)?.tva ?? 20,
      })),
    };
    fetch("/api/caissio/record-sale", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }).catch((e) => console.warn("[caissio/NF525] sync failed (offline?):", e));
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
    set(KEY.users, getUsers().map((u) => u.id === user.id ? { ...u, pin } : u));
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

/* ── INVOICES ── */

export function getInvoices(): Invoice[] { return get<Invoice>(KEY.invoices); }

export function getNextInvoiceNumber(): string {
  const invoices = getInvoices();
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const maxNum = invoices
    .filter((inv) => inv.number.startsWith(prefix))
    .map((inv) => parseInt(inv.number.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
}

export function saveInvoice(inv: Omit<Invoice, "id" | "created_at">): Invoice {
  const invoice: Invoice = { ...inv, id: uid(), created_at: new Date().toISOString() };
  set(KEY.invoices, [...getInvoices(), invoice]);
  return invoice;
}

export function updateInvoice(id: string, data: Partial<Invoice>): void {
  set(KEY.invoices, getInvoices().map((inv) => inv.id === id ? { ...inv, ...data } : inv));
}

export function deleteInvoice(id: string): void {
  set(KEY.invoices, getInvoices().filter((inv) => inv.id !== id));
}

/* ── DASHBOARD STATS ── */

export function getDashboardStats() {
  const sales = getSales(); // automatiquement filtrées par mode
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = sales.filter((s) => s.created_at.startsWith(todayStr));
  const weekSales = sales.filter((s) => new Date(s.created_at) >= weekAgo);
  const monthSales = sales.filter((s) => new Date(s.created_at) >= monthStart);

  const sum = (arr: Sale[]) => arr.reduce((t, s) => t + s.total, 0);

  const last7: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    last7.push({ date: ds, revenue: sum(sales.filter((s) => s.created_at.startsWith(ds))) });
  }

  const hourly: { hour: string; revenue: number }[] = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    revenue: sum(todaySales.filter((s) => new Date(s.created_at).getHours() === h)),
  }));

  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  monthSales.forEach((s) => s.items.forEach((item) => {
    if (!productMap[item.product_id]) productMap[item.product_id] = { name: item.name, qty: 0, revenue: 0 };
    productMap[item.product_id].qty += item.qty;
    productMap[item.product_id].revenue += item.price * item.qty;
  }));
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

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

/* ── PRODUCT CATALOG (demo) ── */

function u(id: string) { return `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop&auto=format&q=80`; }

export const DEMO_CATALOG: Omit<Product, "id">[] = [
  // ── BOULANGERIE ──
  { name: "Croissant",           price: 1.20, price_buy: 0.40, category: "Boulangerie", barcode: "3700000000001", stock: 48, stock_min: 10, tva: 5.5,  active: true, image_url: u("1555507036-ab1f4038808a") },
  { name: "Pain au chocolat",    price: 1.40, price_buy: 0.45, category: "Boulangerie", barcode: "3700000000003", stock: 35, stock_min: 10, tva: 5.5,  active: true, image_url: u("1604882941706-7adadb3cd688") },
  { name: "Pain de campagne",    price: 3.50, price_buy: 1.20, category: "Boulangerie", barcode: "3700000000002", stock: 12, stock_min:  5, tva: 5.5,  active: true, image_url: u("1509440159596-0249088772ff") },
  { name: "Baguette tradition",  price: 1.10, price_buy: 0.30, category: "Boulangerie", barcode: "3700000000034", stock: 40, stock_min: 15, tva: 5.5,  active: true, image_url: u("1549931319-a545dcf3bc7b") },
  { name: "Chausson aux pommes", price: 1.60, price_buy: 0.55, category: "Boulangerie", barcode: "3700000000035", stock: 20, stock_min:  6, tva: 5.5,  active: true, image_url: u("1519915028121-7d003417fd9a") },
  { name: "Éclair chocolat",     price: 2.20, price_buy: 0.80, category: "Boulangerie", barcode: "3700000000036", stock: 15, stock_min:  5, tva: 5.5,  active: true, image_url: u("1578985545062-69928b1d9587") },
  { name: "Tarte aux fraises",   price: 4.80, price_buy: 1.90, category: "Boulangerie", barcode: "3700000000037", stock:  8, stock_min:  3, tva: 5.5,  active: true, image_url: u("1464219789935-c2d9d9aba644") },
  { name: "Brioche feuilletée",  price: 2.50, price_buy: 0.90, category: "Boulangerie", barcode: "3700000000038", stock: 18, stock_min:  6, tva: 5.5,  active: true, image_url: u("1586444248902-2f64eddc13df") },
  { name: "Millefeuille",        price: 3.20, price_buy: 1.20, category: "Boulangerie", barcode: "3700000000039", stock: 10, stock_min:  4, tva: 5.5,  active: true, image_url: u("1621955511577-8e92da25e7bc") },
  { name: "Quiche lorraine",     price: 4.20, price_buy: 1.60, category: "Boulangerie", barcode: "3700000000040", stock:  6, stock_min:  3, tva: 10,   active: true, image_url: u("1565299585323-38d6b0865b47") },
  // ── BOISSONS ──
  { name: "Café expresso",          price: 2.00, price_buy: 0.30, category: "Boissons", barcode: "3700000000004", stock: 200, stock_min: 50, tva: 10,  active: true, image_url: u("1510707577719-ae7c14805e3a") },
  { name: "Eau Evian 50cl",         price: 1.00, price_buy: 0.25, category: "Boissons", barcode: "3700000000005", stock:  72, stock_min: 20, tva: 5.5, active: true, image_url: u("1548839140-29a749e1cf4d") },
  { name: "Coca-Cola 33cl",         price: 1.80, price_buy: 0.60, category: "Boissons", barcode: "3700000000006", stock:   4, stock_min: 12, tva: 20,  active: true, image_url: u("1561758033-d89a9ad46330") },
  { name: "Jus d'orange 1L",        price: 2.50, price_buy: 0.90, category: "Boissons", barcode: "3700000000041", stock:  30, stock_min: 10, tva: 5.5, active: true, image_url: u("1600271886742-f049cd451bba") },
  { name: "Lait demi-écrémé 1L",    price: 1.40, price_buy: 0.55, category: "Boissons", barcode: "3700000000042", stock:  40, stock_min: 15, tva: 5.5, active: true, image_url: u("1550583724-b2692b85b150") },
  { name: "Thé glacé citron",        price: 2.20, price_buy: 0.70, category: "Boissons", barcode: "3700000000043", stock:  24, stock_min:  8, tva: 10,  active: true, image_url: u("1556679908-d4f65571fe28") },
  { name: "Smoothie fruits rouges",  price: 3.50, price_buy: 1.20, category: "Boissons", barcode: "3700000000044", stock:  16, stock_min:  6, tva: 10,  active: true, image_url: u("1553530666-ba11a7da3888") },
  { name: "Bière Heineken 33cl",     price: 2.80, price_buy: 1.00, category: "Boissons", barcode: "3700000000045", stock:  48, stock_min: 12, tva: 20,  active: true, image_url: u("1608270586620-248524c67de9") },
  // ── SNACKS ──
  { name: "Sandwich jambon",  price: 3.90, price_buy: 1.30, category: "Snacks", barcode: "3700000000008", stock:  0, stock_min:  6, tva: 10, active: true, image_url: u("1528735602780-2552fd46c7af") },
  { name: "Salade César",     price: 4.50, price_buy: 1.50, category: "Snacks", barcode: "3700000000007", stock:  8, stock_min:  5, tva: 10, active: true, image_url: u("1512621776951-a57141f2eefd") },
  { name: "Pizza Margherita", price: 6.90, price_buy: 2.50, category: "Snacks", barcode: "3700000000046", stock: 12, stock_min:  4, tva: 10, active: true, image_url: u("1565299624946-b28f40a0ae38") },
  { name: "Chips 150g",       price: 1.80, price_buy: 0.70, category: "Snacks", barcode: "3700000000047", stock: 30, stock_min: 10, tva: 20, active: true, image_url: u("1621447504864-d8686e12698c") },
  { name: "Barre chocolatée", price: 1.20, price_buy: 0.45, category: "Snacks", barcode: "3700000000048", stock: 40, stock_min: 12, tva: 20, active: true, image_url: u("1599599810769-bcde5a160d32") },
  { name: "Wrap poulet",      price: 4.20, price_buy: 1.40, category: "Snacks", barcode: "3700000000049", stock: 10, stock_min:  4, tva: 10, active: true, image_url: u("1626700051175-7ca1e3e1e6f8") },
  { name: "Bowl saumon",      price: 7.50, price_buy: 2.80, category: "Snacks", barcode: "3700000000050", stock:  6, stock_min:  3, tva: 10, active: true, image_url: u("1546069901-ba9599a7e63c") },
  { name: "Panini fromage",   price: 3.80, price_buy: 1.30, category: "Snacks", barcode: "3700000000051", stock:  8, stock_min:  4, tva: 10, active: true, image_url: u("1484723045421-1ffb88d5aef7") },
  // ── ÉPICERIE ──
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
  // ── FRUITS ──
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
  // ── LÉGUMES ──
  { name: "Salade verte",        price: 1.20, price_buy: 0.40, category: "Légumes", barcode: "3700000000013", stock: 15, stock_min:  5, tva: 5.5, active: true, image_url: u("1540420773420-3366772f4999") },
  { name: "Carottes 1kg",        price: 1.30, price_buy: 0.45, category: "Légumes", barcode: "3700000000014", stock: 25, stock_min:  8, tva: 5.5, active: true, image_url: u("1598170845058-32b9d6a5da37") },
  { name: "Courgettes 500g",     price: 1.60, price_buy: 0.60, category: "Légumes", barcode: "3700000000015", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1622206151226-18ca2c9ab4a1") },
  { name: "Tomates cerise 250g", price: 2.40, price_buy: 0.95, category: "Légumes", barcode: "3700000000029", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1592841584227-a4a0c892e6b1") },
  { name: "Champignons 250g",    price: 2.10, price_buy: 0.85, category: "Légumes", barcode: "3700000000031", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1589927986089-35812388d1f4") },
  { name: "Poivrons ×3",         price: 1.90, price_buy: 0.75, category: "Légumes", barcode: "3700000000032", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1563746924691-4374a1e4b84e") },
  { name: "Haricots verts 500g", price: 2.30, price_buy: 0.90, category: "Légumes", barcode: "3700000000033", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1567306302858-4aae82219f4e") },
  { name: "Brocolis",            price: 2.00, price_buy: 0.80, category: "Légumes", barcode: "3700000000065", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1459411621453-7b03977f4bfc") },
  { name: "Épinards 200g",       price: 1.80, price_buy: 0.70, category: "Légumes", barcode: "3700000000066", stock: 14, stock_min:  5, tva: 5.5, active: true, image_url: u("1576045057995-568f6f90a0fe") },
  { name: "Pommes de terre 2kg", price: 2.90, price_buy: 1.10, category: "Légumes", barcode: "3700000000068", stock: 20, stock_min:  8, tva: 5.5, active: true, image_url: u("1518977676037-74d3f7a04f67") },
  // ── FROMAGE ──
  { name: "Camembert 250g",    price: 3.20, price_buy: 1.40, category: "Fromage", barcode: "3700000000017", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1452195100486-9cc805987862") },
  { name: "Comté AOP 150g",    price: 4.80, price_buy: 2.20, category: "Fromage", barcode: "3700000000018", stock: 14, stock_min:  4, tva: 5.5, active: true, image_url: u("1589985270958-14e2e7a08462") },
  { name: "Chèvre frais",      price: 2.80, price_buy: 1.10, category: "Fromage", barcode: "3700000000019", stock: 10, stock_min:  4, tva: 5.5, active: true, image_url: u("1626645738196-c2a7c87a8f58") },
  { name: "Brie de Meaux",     price: 3.90, price_buy: 1.80, category: "Fromage", barcode: "3700000000020", stock:  8, stock_min:  3, tva: 5.5, active: true, image_url: u("1559561853-0cf9f8e5ac9d") },
  { name: "Gruyère râpé 200g", price: 2.50, price_buy: 1.00, category: "Fromage", barcode: "3700000000069", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1604152135252-3abd8cdf23a8") },
  { name: "Mozzarella 125g",   price: 1.90, price_buy: 0.75, category: "Fromage", barcode: "3700000000070", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1618164436431-df07e3c3c4ae") },
  { name: "Roquefort 100g",    price: 3.50, price_buy: 1.60, category: "Fromage", barcode: "3700000000071", stock: 10, stock_min:  3, tva: 5.5, active: true, image_url: u("1617692855027-33b14f061079") },
  { name: "Emmental tranché",  price: 2.20, price_buy: 0.90, category: "Fromage", barcode: "3700000000072", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1560807888-d27d4c0b7a14") },
  // ── CHARCUTERIE ──
  { name: "Jambon blanc 4 tr.", price: 3.50, price_buy: 1.60, category: "Charcuterie", barcode: "3700000000021", stock: 20, stock_min:  6, tva: 5.5, active: true, image_url: u("1567620905732-2d1ec7ab7445") },
  { name: "Saucisson sec 200g", price: 4.20, price_buy: 2.00, category: "Charcuterie", barcode: "3700000000022", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1606787366850-de6330128bfc") },
  { name: "Lardons fumés 200g", price: 2.50, price_buy: 1.10, category: "Charcuterie", barcode: "3700000000023", stock: 22, stock_min:  8, tva: 5.5, active: true, image_url: u("1529193591184-b1d58069ecdd") },
  { name: "Rosette tranchée",   price: 3.80, price_buy: 1.70, category: "Charcuterie", barcode: "3700000000024", stock: 12, stock_min:  4, tva: 5.5, active: true, image_url: u("1606787366850-de6330128bfc") },
  { name: "Chorizo doux 150g",  price: 3.20, price_buy: 1.40, category: "Charcuterie", barcode: "3700000000073", stock: 18, stock_min:  6, tva: 5.5, active: true, image_url: u("1604503468614-b2f8b4a5b2a2") },
  { name: "Mortadelle 150g",    price: 2.90, price_buy: 1.20, category: "Charcuterie", barcode: "3700000000076", stock: 16, stock_min:  5, tva: 5.5, active: true, image_url: u("1608198093002-ad4e005484ec") },
];

/* ── SEED DEMO DATA (appelé depuis onboarding uniquement) ── */

/** Charge le catalogue démo dans les produits */
export function seedDemoCatalog(): void {
  const existing = getProducts();
  if (existing.length > 0) return; // Ne pas écraser
  DEMO_CATALOG.forEach((p) => saveProduct(p));
}

/** Génère des ventes fictives pour tester le dashboard (mode test uniquement) */
export function seedDemoSales(): void {
  const user = getSession();
  if (user?.mode === "live") return; // Jamais en mode live
  const now = new Date();
  for (let d = 6; d >= 0; d--) {
    const count = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < count; i++) {
      const products = getProducts();
      if (products.length === 0) break;
      const items = [products[Math.floor(Math.random() * products.length)]].map((p) => ({
        product_id: p.id, name: p.name, price: p.price, qty: Math.floor(Math.random() * 3) + 1,
      }));
      const total = items.reduce((t, x) => t + x.price * x.qty, 0);
      const date = new Date(now.getTime() - d * 86400000);
      date.setHours(Math.floor(Math.random() * 10) + 9);
      const s: Sale = {
        id: uid(), items, subtotal: total, discount: 0, total,
        payment: Math.random() > 0.5 ? "card" : "cash",
        created_at: date.toISOString(),
        mode: "test",
      };
      set(KEY.sales_test, [...get<Sale>(KEY.sales_test), s]);
    }
  }
}

/* ── MIGRATIONS (rétrocompatibilité) ── */

export function migrateMissingCategories() {
  const existing = getProducts();
  if (existing.length === 0) return;
  const cats = new Set(existing.map((p) => p.category));
  const newCats = ["Fruits", "Légumes", "Fromage", "Charcuterie"].filter((c) => !cats.has(c));
  if (newCats.length === 0) return;
  DEMO_CATALOG.filter((p) => newCats.includes(p.category)).forEach((p) => saveProduct(p));
}

export function migrateV2() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("caissio_mv2")) return;
  const existing = getProducts();
  if (existing.length === 0) { localStorage.setItem("caissio_mv2", "1"); return; }
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

/* ── Custom Categories ─────────────────────────────── */
export function getCustomCategories(): CustomCategory[] {
  return get<CustomCategory>(KEY.categories);
}

export function saveCustomCategory(cat: Omit<CustomCategory, "id">): CustomCategory {
  const cats = getCustomCategories();
  const newCat: CustomCategory = { ...cat, id: uid() };
  set(KEY.categories, [...cats, newCat]);
  return newCat;
}

export function deleteCustomCategory(id: string): void {
  set(KEY.categories, getCustomCategories().filter((c) => c.id !== id));
}
