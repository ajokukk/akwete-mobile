import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { Banner, Button, Title } from '../components/ui';
import { CONFIGURED, WEB_URL } from '../config';
import { colors, fonts } from '../theme';

export default function AccountScreen() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { count, sync } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn() {
    setBusy(true); setError('');
    try { await signInWithGoogle(); } catch (e: any) { setError(String(e?.message ?? e)); }
    setBusy(false);
  }
  const meta: any = user?.user_metadata ?? {};

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Title size={38}>Account</Title>
        {!CONFIGURED && <View style={{ marginTop: 14 }}><Banner text="The database is not connected yet. Add your Supabase URL and anon key in src/config.ts, then rebuild." /></View>}

        {user ? (
          <View style={s.card}>
            <Text style={s.name}>{meta.full_name || meta.name || 'Signed in'}</Text>
            <Text style={s.email}>{user.email}</Text>
            <Text style={s.small}>Your bag ({count} {count === 1 ? 'item' : 'items'}) is saved to this account, so it also appears on the website when you sign in there. Status: {sync === 'synced' ? 'synced' : sync}.</Text>
            <Button title="Sign out" kind="ghost" onPress={signOut} style={{ marginTop: 14 }} />
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.name}>Sign in</Text>
            <Text style={s.small}>Use the same Google account as on the website. Your bag, orders and details are shared between the website and this app.</Text>
            <Button title="Continue with Google" kind="google" loading={busy || loading} onPress={signIn} style={{ marginTop: 14 }} />
            {!!error && <Text style={s.err}>{error}</Text>}
          </View>
        )}

        <Button title="Open the website" kind="ghost" onPress={() => Linking.openURL(WEB_URL)} style={{ marginTop: 18 }} />
        <Text style={s.foot}>Akwete {"\u00B7"} version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 18, marginTop: 16 },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: 2, marginBottom: 10 },
  small: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 21, marginTop: 6 },
  err: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, marginTop: 12, lineHeight: 20 },
  foot: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 22 },
});
