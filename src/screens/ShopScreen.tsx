import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FALLBACK, IMAGES, Product, loadProducts } from '../lib/products';
import { useAuth, firstName } from '../lib/auth';
import { colors, fonts, naira } from '../theme';
import type { ShopStackParams } from '../navigation';

export default function ShopScreen({ navigation }: NativeStackScreenProps<ShopStackParams, 'Catalog'>) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(FALLBACK);
  useEffect(() => { loadProducts().then(setProducts); }, []);

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.slug}
        numColumns={2}
        columnWrapperStyle={{ gap: 14, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.brand}>Akwete</Text>
            <Text style={s.tag}>{user ? `Welcome, ${firstName(user)}. ` : ''}Wear the story.</Text>
            <View style={s.band}>
              {[colors.clay, colors.cotton, colors.indigo, colors.cotton, colors.moss, colors.cotton, colors.clay].map((c, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${naira(item.price)}`}
            style={s.card}
            onPress={() => navigation.navigate('Product', { product: item })}
          >
            <Image source={IMAGES[item.slug]} style={s.img} contentFit="cover" transition={150} />
            <Text style={s.name} numberOfLines={2}>{item.name}</Text>
            <Text style={s.price}>{naira(item.price)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  brand: { fontFamily: fonts.display, fontSize: 44, color: colors.text },
  tag: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, marginTop: 2 },
  band: { flexDirection: 'row', height: 14, marginTop: 14, borderRadius: 2, overflow: 'hidden' },
  card: { flex: 1, marginBottom: 20 },
  img: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.cotton, borderRadius: 3 },
  name: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, marginTop: 8, color: colors.text },
  price: { fontFamily: fonts.bold, fontSize: 15, marginTop: 2, color: colors.text },
});
