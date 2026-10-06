import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Gloock_400Regular } from '@expo-google-fonts/gloock';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold } from '@expo-google-fonts/figtree';

import { AuthProvider } from './src/lib/auth';
import { CartProvider, useCart } from './src/lib/cart';
import ShopScreen from './src/screens/ShopScreen';
import ProductScreen from './src/screens/ProductScreen';
import BagScreen from './src/screens/BagScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AccountScreen from './src/screens/AccountScreen';
import { colors, fonts } from './src/theme';
import type { BagStackParams, ShopStackParams } from './src/navigation';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const ShopStack = createNativeStackNavigator<ShopStackParams>();
const BagStack = createNativeStackNavigator<BagStackParams>();

const headerStyle = { headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink, headerTitleStyle: { fontFamily: fonts.display }, headerShadowVisible: false } as const;

function ShopTab() {
  return (
    <ShopStack.Navigator screenOptions={headerStyle}>
      <ShopStack.Screen name="Catalog" component={ShopScreen} options={{ headerShown: false }} />
      <ShopStack.Screen name="Product" component={ProductScreen} options={{ title: '', headerTransparent: false }} />
    </ShopStack.Navigator>
  );
}
function BagTab() {
  return (
    <BagStack.Navigator screenOptions={headerStyle}>
      <BagStack.Screen name="BagMain" component={BagScreen} options={{ headerShown: false }} />
      <BagStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: '' }} />
    </BagStack.Navigator>
  );
}

function Tabs() {
  const { count } = useCart();
  const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.clay,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      }}
    >
      <Tab.Screen name="ShopTab" component={ShopTab} options={{ title: 'Shop', tabBarIcon: icon('storefront-outline') }} />
      <Tab.Screen name="BagTab" component={BagTab} options={{ title: 'Bag', tabBarIcon: icon('bag-outline'), tabBarBadge: count > 0 ? count : undefined, tabBarBadgeStyle: { backgroundColor: colors.clay, fontFamily: fonts.bold } }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: 'Orders', tabBarIcon: icon('receipt-outline') }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'Account', tabBarIcon: icon('person-outline') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loaded] = useFonts({ Gloock_400Regular, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold });
  const onReady = useCallback(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onReady}>
        <StatusBar style="dark" />
        <AuthProvider>
          <CartProvider>
            <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.paper, primary: colors.clay } }}>
              <Tabs />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
