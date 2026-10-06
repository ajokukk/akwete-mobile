import { supabase } from './supabase';
import type { CartItem } from './cartLogic';

export type Delivery = { name: string; email: string; phone: string; address: string; city: string; state: string; notes: string };
export const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

// Same rules the database enforces, so people see the problem before sending.
export function validateDelivery(d: Delivery): string | null {
  if (d.name.trim().length < 2) return 'Please enter your full name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return 'Please enter a valid email address.';
  if (!/^\+?[0-9 ()-]{7,20}$/.test(d.phone.trim())) return 'Phone: digits only, 7 to 20 characters. A leading + is fine.';
  if (d.address.trim().length < 5) return 'Please enter your delivery address.';
  if (d.city.trim().length < 2) return 'Please enter your city or town.';
  if (!d.state) return 'Please choose your state.';
  return null;
}

export type PlacedOrder = { id: string; order_number: string; total_ngn: number };

// Prices are NOT sent. The database looks them up, exactly as on the website.
export async function placeOrder(items: CartItem[], d: Delivery): Promise<PlacedOrder> {
  const payload = items.map((b) => ({ slug: b.slug, custom: b.custom, piece: b.piece, detail: b.detail, qty: b.qty }));
  const { data, error } = await supabase.rpc('place_order', {
    p_items: payload, p_name: d.name.trim(), p_email: d.email.trim(), p_phone: d.phone.trim(),
    p_address: d.address.trim(), p_city: d.city.trim(), p_state: d.state, p_notes: d.notes.trim() || null,
  });
  if (error) throw new Error(error.message);
  return data as PlacedOrder;
}

export async function sendConfirmation(orderId: string): Promise<{ ok: boolean; reason: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-order-email', { body: { order_id: orderId, lang: 'en' } });
    if (!error) return { ok: true, reason: '' };
    let reason = error.message;
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === 'function') {
      try { const b = await ctx.json(); reason = `${ctx.status ?? ''} ${b?.error ?? reason}${b?.detail ? ` (${b.detail})` : ''}`.trim(); } catch {}
    }
    console.warn('Confirmation email failed:', reason);
    return { ok: false, reason };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message ?? e) };
  }
}

export type OrderRow = {
  id: string; order_number: string; status: string; total_ngn: number; created_at: string; confirmation_sent_at: string | null;
  order_items: { name: string; detail: string | null; quantity: number; unit_price_ngn: number }[];
};
export async function loadOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_ngn, created_at, confirmation_sent_at, order_items(name, detail, quantity, unit_price_ngn)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}
