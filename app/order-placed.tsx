import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { formatMoney } from "@/lib/format";
import { colors, radii } from "@/lib/theme";

export default function OrderPlacedScreen() {
  const { loading, isReady } = useRequireAuth();
  const { orderId, total } = useLocalSearchParams<{ orderId?: string; total?: string }>();

  if (loading || !isReady) {
    return (
      <View style={[styles.wrap, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.wrap}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-decagram" size={72} color={colors.brand} />
        </View>
        <Text style={styles.title}>Thank you!</Text>
        <Text style={styles.sub}>Your order has been placed successfully.</Text>

        <View style={styles.card}>
          <Text style={styles.k}>Order ID</Text>
          <Text style={styles.v} selectable>
            {orderId ?? "—"}
          </Text>
          <Text style={[styles.k, { marginTop: 14 }]}>Total</Text>
          <Text style={styles.v}>{total ? formatMoney(Number(total)) : "—"}</Text>
          <Text style={[styles.k, { marginTop: 14 }]}>Estimated delivery</Text>
          <Text style={styles.eta}>30–45 minutes</Text>
        </View>

        <Pressable
          style={[styles.primary, !orderId && { opacity: 0.45 }]}
          disabled={!orderId}
          onPress={() => orderId && router.replace(`/order/${orderId}`)}
        >
          <Text style={styles.primaryText}>Track order</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/home")}>
          <Text style={styles.link}>Back to home</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.page,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink },
  sub: { fontSize: 16, color: colors.muted, textAlign: "center", marginTop: 10, lineHeight: 22 },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  k: { fontSize: 13, color: colors.muted },
  v: { fontSize: 15, fontWeight: "700", color: colors.ink, fontFamily: "monospace", marginTop: 4 },
  eta: { fontSize: 16, fontWeight: "700", color: colors.brand, marginTop: 4 },
  primary: {
    marginTop: 28,
    width: "100%",
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radii.input,
    alignItems: "center",
  },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 17 },
  link: { marginTop: 20, fontSize: 16, fontWeight: "700", color: colors.brand },
});
