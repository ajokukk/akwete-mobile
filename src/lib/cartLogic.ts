// Pure cart rules, identical to js/shared.js on the website so both apps read and write the same `carts.items` JSON.
export type CartItem = {
  slug: string | null;     // product slug for ordinary items
  custom: boolean;         // true for pieces made in "Build your Akwete"
  piece: string | null;    // wrap | runner | cushion (custom items only)
  name: string;
  detail: string;          // size, or the custom description
  price: number;           // display only; the database sets the real price at checkout
  qty: number;
};

export const keyOf = (b: CartItem) => (b.custom ? `c|${b.piece}|${b.detail}` : `p|${b.slug}|${b.detail}`);

export function cleanItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((b: any) => ({
    slug: b?.slug ? String(b.slug) : null,
    custom: !!b?.custom,
    piece: b?.piece ? String(b.piece) : null,
    name: String(b?.name ?? '').slice(0, 80),
    detail: String(b?.detail ?? '').slice(0, 200),
    price: Number(b?.price) || 0,
    qty: Math.max(1, Math.min(10, parseInt(String(b?.qty), 10) || 1)),
  }));
}

export const sameCart = (a: CartItem[], b: CartItem[]) => JSON.stringify(a) === JSON.stringify(b);

// First sign-in on a device: keep everything from both sides (larger quantity wins).
export function mergeCarts(remote: CartItem[], local: CartItem[]): CartItem[] {
  const merged = remote.map((r) => ({ ...r }));
  for (const l of local) {
    const hit = merged.find((m) => keyOf(m) === keyOf(l));
    if (hit) hit.qty = Math.max(hit.qty, l.qty);
    else merged.push({ ...l });
  }
  return cleanItems(merged);
}

export function addItem(items: CartItem[], item: Omit<CartItem, 'qty'>): CartItem[] {
  const next = items.map((i) => ({ ...i }));
  const hit = next.find((i) => keyOf(i) === keyOf({ ...item, qty: 1 }));
  if (hit) hit.qty = Math.min(10, hit.qty + 1);
  else next.push({ ...item, qty: 1 });
  return next;
}

export function setQty(items: CartItem[], index: number, qty: number): CartItem[] {
  const next = items.map((i) => ({ ...i }));
  if (!next[index]) return next;
  if (qty <= 0) next.splice(index, 1);
  else next[index].qty = Math.min(10, qty);
  return next;
}

export const countOf = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const totalOf = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0);
