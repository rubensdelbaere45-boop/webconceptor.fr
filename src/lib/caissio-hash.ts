/**
 * caissio-hash.ts
 * Chaîne de hachage SHA-256 — conformité NF 525 / article L.102 B du LPF
 *
 * Chaque vente référence le hash de la vente précédente → toute altération
 * casse la chaîne et est détectable instantanément.
 *
 * Utilise Web Crypto API (browser + Node.js ≥ 15 + Edge runtime Vercel).
 */

async function sha256(data: string): Promise<string> {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash initial (première vente d'un commerce — pas de précédent) */
export async function genesisHash(): Promise<string> {
  return sha256("CAISSIO-NF525-GENESIS-2026");
}

export interface SaleHashInput {
  previous_hash: string;
  ticket_num:    string;
  sale_date:     string;   // ISO 8601
  total:         number;
  pay_mode:      string;
  items: Array<{ name: string; qty: number; unit_price: number }>;
}

/**
 * Calcule le hash NF 525 d'une vente.
 * Déterministe : mêmes données → même hash. Ordre des champs fixe.
 */
export async function computeSaleHash(input: SaleHashInput): Promise<string> {
  const itemsStr = input.items
    .map((i) => `${i.name}×${i.qty}@${i.unit_price.toFixed(2)}`)
    .join("|");
  const payload = [
    input.previous_hash,
    input.ticket_num,
    input.sale_date,
    input.total.toFixed(2),
    input.pay_mode,
    itemsStr,
  ].join("\n");
  return sha256(payload);
}

export interface ClosureHashInput {
  previous_closure_hash: string;
  period_start:          string;
  period_end:            string;
  total_sales:           number;
  total_amount:          number;
  last_sale_hash:        string;
}

/** Hash d'une clôture (Z-report) */
export async function computeClosureHash(input: ClosureHashInput): Promise<string> {
  const payload = [
    input.previous_closure_hash,
    input.period_start,
    input.period_end,
    String(input.total_sales),
    input.total_amount.toFixed(2),
    input.last_sale_hash,
  ].join("\n");
  return sha256(payload);
}
