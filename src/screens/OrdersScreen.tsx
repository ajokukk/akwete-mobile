import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { OrderRow, loadOrders, sendConfirmation } from '../lib/orders';
import { Button, Banner, Title } from '../components/ui';
import { colors, fonts, naira } from '../theme';

const STATUS: Record<string, string> = { pending: 'Received', confirmed: 'Confirmed', in_production: 'In production', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function OrdersScreen() {
  const { user, signInWithGoogle } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) { setOrders([]); return; }
    setLoading(true); setError('');
    try { setOrders(await loadOrders()); } catch (e: any) { setError(`Could not load orders: ${e?.message ?? e}`); }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  async function resend(id: string) {
    setNote((n) => ({ ...n, [id]: 'Sending...' }));
    const r = await sendConfirmation(id);
    if (r.ok) load(); else setNote((n) => ({ ...n, [id]: 'We still could not send the email. Please try again later.' }));
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ink} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Title size={38}>My orders</Title>
            {!user && (
              <View style={{ marginTop: 14 }}>
                <Banner text="Sign in with Google to see the orders saved to your account." />
                <Button title="Continue with Google" kind="google" onPress={() => signInWithGoogle().catch((e) => setError(String(e?.message ?? e)))} />
              </View>
            )}
            {!!error && <Text style={s.err}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={user && !loading ? <Text style={s.empty}>No orders yet.</Text> : null}
        renderItem={({ item: o }) => (
          <View style={s.card}>
            <View style={s.head}>
              <Text style={s.num}>{o.order_number}</Text>
              <Text style={s.badge}>{STATUS[o.status] ?? o.status}</Text>
            </View>
            <Text style={s.date}>
              {new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              {o.confirmation_sent_at ? ' \u00B7 confirmation email sent' : ' \u00B7 confirmation email not sent yet'}
            </Text>
            {o.order_items.map((i, idx) => (
              <View key={idx} style={s.line}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.lineName}>{i.name}{i.quantity > 1 ? ` \u00D7 ${i.quantity}` : ''}</Text>
                  {!!i.detail && <Text style={s.lineDetail}>{i.detail}</Text>}
                </View>
                <Text style={s.linePrice}>{naira(i.unit_price_ngn * i.quantity)}</Text>
              </View>
            ))}
            <Text style={s.total}>{naira(o.total_ngn)}</Text>
            {!o.confirmation_sent_at && (
              <View style={{ marginTop: 10 }}>
                <Button title="Resend confirmation email" kind="ghost" onPress={() => resend(o.id)} style={{ minHeight: 42 }} />
                {!!note[o.id] && <Text style={s.lineDetail}>{note[o.id]}</Text>}
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  err: { fontFamily: fonts.medium, color: colors.danger, marginTop: 10 },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 16, marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  badge: { fontFamily: fonts.bold, fontSize: 13, backgroundColor: colors.cotton, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', color: colors.text },
  date: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  lineDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  linePrice: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  total: { fontFamily: fonts.display, fontSize: 22, textAlign: 'right', marginTop: 8, color: colors.text },
});
