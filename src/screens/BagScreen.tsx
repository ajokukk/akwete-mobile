import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { Banner, Button, Title } from '../components/ui';
import { colors, fonts, naira } from '../theme';
import type { BagStackParams } from '../navigation';

export default function BagScreen({ navigation }: NativeStackScreenProps<BagStackParams, 'BagMain'>) {
  const { items, total, count, sync, lastSynced, changeQty, refresh } = useCart();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const when = lastSynced ? lastSynced.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const status =
    !user ? 'Not signed in. This bag is saved on this phone only.' :
    sync === 'syncing' ? 'Syncing with your account...' :
    sync === 'error' ? 'Could not sync. Pull down to try again.' :
    `Synced with your account${when ? ` at ${when}` : ''}. Changes on the website appear here.`;
  const dot = !user ? colors.muted : sync === 'error' ? colors.danger : sync === 'syncing' ? colors.thread : colors.moss;

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(i, idx) => `${i.slug}-${i.detail}-${idx}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} tintColor={colors.ink} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <Title size={38}>Your bag</Title>
            <View style={s.sync} accessibilityLiveRegion="polite">
              <View style={[s.dot, { backgroundColor: dot }]} />
              <Text style={s.syncText}>{status}</Text>
            </View>
            {!user && <Banner text="Sign in with Google (Account tab) to save this bag to your account and see it on the website too." />}
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>Your bag is empty. Add a piece from the Shop tab.</Text>}
        renderItem={({ item, index }) => (
          <View style={s.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.detail}>{item.detail}</Text>
              <Text style={s.price}>{naira(item.price * item.qty)}</Text>
            </View>
            <View style={s.stepper}>
              <Pressable accessibilityLabel={`Remove one ${item.name}`} onPress={() => changeQty(index, item.qty - 1)} style={s.stepBtn}><Text style={s.stepTxt}>{item.qty === 1 ? '\u00D7' : '\u2212'}</Text></Pressable>
              <Text style={s.qty}>{item.qty}</Text>
              <Pressable accessibilityLabel={`Add one more ${item.name}`} onPress={() => changeQty(index, item.qty + 1)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={{ marginTop: 18 }}>
              <View style={s.totalRow}><Text style={s.totalLabel}>Total ({count})</Text><Text style={s.totalVal}>{naira(total)}</Text></View>
              <Button title="Go to checkout" onPress={() => navigation.navigate('Checkout')} style={{ marginTop: 14 }} />
              <Text style={s.fine}>Prices are checked again on the server when you place the order.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  sync: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  syncText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, lineHeight: 19 },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  name: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  detail: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
  price: { fontFamily: fonts.bold, fontSize: 15, marginTop: 4, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.ink, borderRadius: 99 },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  qty: { fontFamily: fonts.bold, fontSize: 16, minWidth: 22, textAlign: 'center', color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
  totalLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  totalVal: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  fine: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 10 },
});
