import type { ComponentProps } from "react";
import { ActivityIndicator, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <MaterialCommunityIcons name={name} size={24} color={focused ? colors.brand : colors.muted} />;
}

export default function TabsLayout() {
  const { isReady } = useRequireAuth();
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "800", color: colors.ink, fontSize: 18 },
        headerTitle: "LEEK",
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 58 + Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          headerShown: true,
          headerTitle: "Categories",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "view-grid" : "view-grid-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          headerTitle: "My cart",
          tabBarBadge: count > 0 ? (count > 99 ? "99+" : count) : undefined,
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "cart" : "cart-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerTitle: "My orders",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "clipboard-text" : "clipboard-text-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "account" : "account-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
