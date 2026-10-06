import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { Delivery, NIGERIAN_STATES, PlacedOrder, placeOrder, sendConfirmation, validateDelivery } from '../lib/orders';
import { Banner, Button, Field, Title } from '../components/ui';
import { colors, fonts, naira } from '../theme';
import type { BagStackParams } from '../navigation';

export default function CheckoutScreen({ navigation }: NativeStackScreenProps<BagStackParams, 'Checkout'>) {
  const { user, signInWithGoogle } = useAuth();
  const { items, total, clear } = useCart();
  const [d, setD] = useState<Delivery>({ name: '', email: '', phone: '', address: '', city: '', state: '', notes: '' });
  const [pickState, setPickState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ order: PlacedOrder; emailed: boolean; email: string } | null>(null);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    const meta: any = user.user_metadata ?? {};
    setD((x) => ({ ...x, email: x.email || user.email || '', name: x.name || meta.full_name || meta.name || '' }));
  }, [user]);

  const set = (k: keyof Delivery) => (v: string) => setD((x) => ({ ...x, [k]: v }));

  async function submit() {
    setError('');
    const problem = validateDelivery(d);
    if (problem) { setError(problem); return; }
    if (!items.length) { setError('Your bag is empty.'); return; }
    setBusy(true);
    try {
      const order = await placeOrder(items, d);
      clear(); // the database also empties the saved bag, so the website updates too
      const sent = await sendConfirmation(order.id);
      setDone({ order, emailed: sent.ok, email: d.email.trim() });
    } catch (e: any) {
      setError(`We could not place the order: ${e?.message ?? e}`);
    } finally { setBusy(false); }
  }

  async function resend() {
    if (!done) return;
    setResendMsg('Sending...');
    const r = await sendConfirmation(done.order.id);
    if (r.ok) { setDone({ ...done, emailed: true }); setResendMsg('Confirmation email sent.'); }
    else setResendMsg('We still could not send the email. Please try again later.');
  }

  if (done) {
    return (
      <SafeAreaView style={s.page} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Title size={42}>Order received.</Title>
          <Text style={s.num}>{done.order.order_number}</Text>
          <Text style={s.p}>
            {done.emailed
              ? `A confirmation email is on its way to ${done.email}.`
              : 'Your order is saved. The confirmation email could not be sent just now, but you can see the order under My orders.'}
          </Text>
          {!done.emailed && <Button title="Resend confirmation email" kind="ghost" onPress={resend} style={{ marginBottom: 8 }} />}
          {!!resendMsg && <Text style={s.fine}>{resendMsg}</Text>}
          <Text style={s.fine}>Total {naira(done.order.total_ngn)}. We will contact you to confirm production time and payment.</Text>
          <Button title="View my orders" onPress={() => (navigation as any).getParent()?.navigate('OrdersTab')} style={{ marginTop: 22 }} />
          <Button title="Back to the shop" kind="ghost" onPress={() => (navigation as any).getParent()?.navigate('ShopTab')} style={{ marginTop: 10 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.page} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          <Title size={38}>Checkout</Title>

          {!user ? (
            <View style={{ marginVertical: 16 }}>
              <Banner text="Sign in with Google so we can save your order and send the confirmation." />
              <Button title="Continue with Google" kind="google" onPress={() => signInWithGoogle().catch((e) => setError(String(e?.message ?? e)))} />
            </View>
          ) : <Banner tone="ok" text={`Signed in as ${user.email}`} />}

          <View style={s.summary}>
            {items.map((i, idx) => (
              <View key={idx} style={s.sumRow}>
                <Text style={s.sumName}>{i.name}{i.qty > 1 ? ` \u00D7 ${i.qty}` : ''}</Text>
                <Text style={s.sumPrice}>{naira(i.price * i.qty)}</Text>
              </View>
            ))}
            <View style={[s.sumRow, { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 6, paddingTop: 10 }]}>
              <Text style={s.sumName}>Total</Text><Text style={[s.sumPrice, { fontFamily: fonts.display, fontSize: 22 }]}>{naira(total)}</Text>
            </View>
          </View>

          <Field label="Full name" value={d.name} onChangeText={set('name')} autoComplete="name" textContentType="name" />
          <Field label="Email for your confirmation" value={d.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Phone" value={d.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
          <Field label="Delivery address" value={d.address} onChangeText={set('address')} autoComplete="street-address" />
          <Field label="City or town" value={d.city} onChangeText={set('city')} />
          <Text style={s.label}>State</Text>
          <Pressable accessibilityRole="button" onPress={() => setPickState(true)} style={s.pick}>
            <Text style={{ fontFamily: fonts.body, fontSize: 16, color: d.state ? colors.text : '#8d8a80' }}>{d.state || 'Select state'}</Text>
          </Pressable>
          <Field label="Notes (optional)" value={d.notes} onChangeText={set('notes')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />

          {!!error && <Text style={s.err} accessibilityLiveRegion="polite">{error}</Text>}
          <Button title={user ? 'Place order' : 'Sign in to place order'} loading={busy} disabled={!user} onPress={submit} />
          <Text style={s.fine}>Prices are checked again on the server when you place the order. We confirm production time and payment with you after that.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickState} animationType="slide" onRequestClose={() => setPickState(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
          <View style={s.modalHead}><Title size={28}>Choose state</Title><Button title="Close" kind="ghost" onPress={() => setPickState(false)} style={{ minHeight: 40, paddingHorizontal: 16 }} /></View>
          <FlatList data={NIGERIAN_STATES} keyExtractor={(x) => x}
            renderItem={({ item }) => (
              <Pressable style={s.stateRow} onPress={() => { set('state')(item); setPickState(false); }}>
                <Text style={[s.stateTxt, item === d.state && { fontFamily: fonts.bold }]}>{item}</Text>
              </Pressable>
            )} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  num: { fontFamily: fonts.display, fontSize: 30, marginVertical: 14, color: colors.text },
  p: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text, marginBottom: 14 },
  fine: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 10, lineHeight: 19 },
  summary: { backgroundColor: colors.cotton, borderRadius: 6, padding: 14, marginVertical: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumName: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text, paddingRight: 10 },
  sumPrice: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 6 },
  pick: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(13,19,48,0.35)', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14 },
  err: { fontFamily: fonts.medium, fontSize: 15, color: colors.danger, marginBottom: 12, lineHeight: 21 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  stateRow: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.line },
  stateTxt: { fontFamily: fonts.body, fontSize: 17, color: colors.text },
});
