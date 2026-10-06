import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { CONFIGURED } from '../config';
import { CartItem, addItem, cleanItems, countOf, mergeCarts, sameCart, setQty, totalOf } from './cartLogic';

/*
  How the bag stays in sync with the website
  - The bag is one row per person in the `carts` table (user_id, items JSON). The website uses the same row.
  - Every change is saved on the phone first, then pushed to that row (after a short pause).
  - We pull the row again when the app comes to the front, when you pull down on the bag, and live through Realtime.
  - First sign-in on a device merges the phone bag with the saved bag. After that, the saved bag wins.
*/

export type SyncState = 'local' | 'syncing' | 'synced' | 'error';
type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  sync: SyncState;
  lastSynced: Date | null;
  add: (item: Omit<CartItem, 'qty'>) => void;
  changeQty: (index: number, qty: number) => void;
  clear: () => void;
  refresh: () => Promise<void>;
};
const Ctx = createContext<CartCtx>({
  items: [], count: 0, total: 0, sync: 'local', lastSynced: null,
  add: () => {}, changeQty: () => {}, clear: () => {}, refresh: async () => {},
});
export const useCart = () => useContext(Ctx);

const KEY = 'akwete_bag_v1';
const SYNCED_USER = 'akwete_synced_user';
const UNSAVED = 'akwete_bag_unsaved';   // a change on this phone has not reached the server yet

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [sync, setSync] = useState<SyncState>('local');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recent = useRef<string[]>([]);   // what we saved recently, to recognise our own echo

  const setBoth = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // 1. load what is saved on this phone
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) { try { const parsed = cleanItems(JSON.parse(v)); itemsRef.current = parsed; setItems(parsed); } catch {} }
      setReady(true);
    });
  }, []);

  const pushNow = useCallback(async (next: CartItem[]) => {
    if (!userId) return;
    recent.current = [...recent.current.slice(-7), JSON.stringify(next)];
    const { error } = await supabase.from('carts').upsert({ user_id: userId, items: next, updated_at: new Date().toISOString() });
    if (error) { console.warn('Bag save failed:', error.message); setSync('error'); }
    else {
      setSync('synced'); setLastSynced(new Date());
      if (sameCart(itemsRef.current, next)) AsyncStorage.removeItem(UNSAVED).catch(() => {});  // nothing newer was added meanwhile
    }
  }, [userId]);

  const queuePush = useCallback((next: CartItem[]) => {
    if (!userId || !CONFIGURED) return;
    setSync('syncing');
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { pushTimer.current = null; pushNow(next); }, 400);
  }, [userId, pushNow]);

  const update = useCallback((next: CartItem[]) => {
    if (userId) AsyncStorage.setItem(UNSAVED, '1').catch(() => {});
    setBoth(next);
    queuePush(next);
  }, [userId, setBoth, queuePush]);

  // 2. pull the saved bag. 'merge' on the first sign-in on this device, 'replace' afterwards.
  const pull = useCallback(async (mode: 'merge' | 'replace') => {
    if (!userId || !CONFIGURED) return;
    setSync('syncing');
    const { data, error } = await supabase.from('carts').select('items').eq('user_id', userId).maybeSingle();
    if (error) { console.warn('Bag load failed:', error.message); setSync('error'); return; }
    const local = itemsRef.current;
    // A change made on this phone never reached the server (app closed within a moment): it is newer, so save it.
    if (mode === 'replace' && (await AsyncStorage.getItem(UNSAVED)) === '1') { await pushNow(local); return; }
    if (data) {
      const remote = cleanItems(data.items);
      const next = mode === 'merge' ? mergeCarts(remote, local) : remote;
      if (!sameCart(next, local)) setBoth(next);
      if (!sameCart(next, remote)) { await pushNow(next); return; }
    } else if (mode === 'merge') {
      if (local.length) { await pushNow(local); return; }   // first sign-in on this phone: save the phone's bag
    } else if (local.length) {
      setBoth([]);                                            // the saved bag was removed (for example after an order on the website)
    }
    setSync('synced'); setLastSynced(new Date());
  }, [userId, setBoth, pushNow]);

  const refresh = useCallback(async () => { await pull('replace'); }, [pull]);

  // 3. on sign-in / sign-out
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      // signed out: the bag is saved in the account, so empty this phone's copy (also protects a shared phone)
      if (itemsRef.current.length) setBoth([]);
      AsyncStorage.removeItem(SYNCED_USER).catch(() => {});
      AsyncStorage.removeItem(UNSAVED).catch(() => {});
      setSync('local'); setLastSynced(null);
      return;
    }
    (async () => {
      const seen = await AsyncStorage.getItem(SYNCED_USER);
      await pull(seen === userId ? 'replace' : 'merge');
      await AsyncStorage.setItem(SYNCED_USER, userId);
    })();
  }, [ready, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. pull again whenever the app comes back to the front
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active' && userId) pull('replace'); });
    return () => sub.remove();
  }, [userId, pull]);

  // 5. live updates (works once Realtime is enabled for the carts table; otherwise the pulls above still keep it in sync)
  useEffect(() => {
    if (!userId || !CONFIGURED) return;
    const channel = supabase
      .channel(`cart-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${userId}` }, (payload: any) => {
        if (pushTimer.current) return;                            // we have a newer change waiting to be saved
        if (payload.eventType === 'DELETE') { if (itemsRef.current.length) setBoth([]); }
        else {
          const remote = cleanItems(payload.new?.items);
          if (recent.current.includes(JSON.stringify(remote))) return;   // just our own save coming back
          if (!sameCart(remote, itemsRef.current)) setBoth(remote);
        }
        setSync('synced'); setLastSynced(new Date());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, setBoth]);

  const value: CartCtx = {
    items,
    count: countOf(items),
    total: totalOf(items),
    sync,
    lastSynced,
    add: (item) => update(addItem(itemsRef.current, item)),
    changeQty: (index, qty) => update(setQty(itemsRef.current, index, qty)),
    clear: () => update([]),
    refresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
