import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IMAGES } from '../lib/products';
import { useCart } from '../lib/cart';
import { Button, Chip, Title } from '../components/ui';
import { colors, fonts, naira } from '../theme';
import type { ShopStackParams } from '../navigation';

export default function ProductScreen({ route, navigation }: NativeStackScreenProps<ShopStackParams, 'Product'>) {
  const { product } = route.params;
  const { add, items } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const inBag = items.filter((i) => i.slug === product.slug).reduce((n, i) => n + i.qty, 0);

  function addToBag() {
    add({ slug: product.slug, custom: false, piece: null, name: product.name, detail: size, price: product.price });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <SafeAreaView style={s.page} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Image source={IMAGES[product.slug]} style={s.img} contentFit="cover" transition={150} />
        <View style={s.body}>
          <Text style={s.kind}>{product.kind}</Text>
          <Title size={34}>{product.name}</Title>
          <Text style={s.price}>{naira(product.price)}</Text>

          <Text style={s.label}>Size</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {product.sizes.map((z) => <Chip key={z} label={z} selected={z === size} onPress={() => setSize(z)} />)}
          </View>

          <Button title={added ? 'Added to your bag \u2713' : 'Add to bag'} onPress={addToBag} style={{ marginTop: 12 }} />
          {inBag > 0 && (
            <Button title={`View bag (${inBag} of this)`} kind="ghost" style={{ marginTop: 10 }}
              onPress={() => (navigation as any).getParent()?.navigate('BagTab')} />
          )}
          <Text style={s.fine}>
            Colours may look slightly different from the photographs. After you order, we contact you to confirm details, production time and payment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  img: { width: '100%', aspectRatio: 1, backgroundColor: colors.cotton },
  body: { padding: 20 },
  kind: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, marginBottom: 4 },
  price: { fontFamily: fonts.bold, fontSize: 22, marginTop: 8, marginBottom: 18, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 8, color: colors.text },
  fine: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 18, lineHeight: 19 },
});
