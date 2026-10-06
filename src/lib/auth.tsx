import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { CONFIGURED } from '../config';

WebBrowser.maybeCompleteAuthSession();

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};
const Ctx = createContext<AuthCtx>({ user: null, loading: true, signInWithGoogle: async () => {}, signOut: async () => {} });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CONFIGURED) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    // React Native has no browser tab events, so tell the SDK when to refresh tokens.
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh();
    });
    return () => { sub.subscription.unsubscribe(); app.remove(); };
  }, []);

  async function signInWithGoogle() {
    if (!CONFIGURED) throw new Error('Add your Supabase URL and anon key in src/config.ts first.');
    // akwete://auth-callback in the installed app, exp://... inside Expo Go. Both must be allowed in Supabase.
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    });
    if (error || !data?.url) throw error ?? new Error('Could not start Google sign-in.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return; // the person closed the browser

    const { queryParams } = Linking.parse(result.url);
    const code = queryParams?.code;
    if (typeof code === 'string') {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw exErr;
      return;
    }
    throw new Error(String(queryParams?.error_description ?? 'Sign-in was not completed. Please try again.'));
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return <Ctx.Provider value={{ user, loading, signInWithGoogle, signOut }}>{children}</Ctx.Provider>;
}

export function firstName(user: User | null): string {
  if (!user) return '';
  const meta: any = user.user_metadata ?? {};
  const n: string = meta.full_name || meta.name || user.email || '';
  return n.split(/[ @]/)[0];
}
