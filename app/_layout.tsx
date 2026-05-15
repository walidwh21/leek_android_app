import "react-native-gesture-handler";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { colors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const nav = useRootNavigationState();

  useEffect(() => {
    if (nav?.key) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [nav?.key]);

  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.ink,
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: "800" },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="catalog" options={{ title: "Shop" }} />
            <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
            <Stack.Screen name="order-placed" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
            <Stack.Screen name="login" options={{ title: "Sign in" }} />
            <Stack.Screen name="signup" options={{ title: "Create account" }} />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
