import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { formatDate, formatMoney } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { colors, radii, shadows } from "@/lib/theme";
import type { Order, OrderItem, OrderStatus } from "@/lib/types/database";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order placed" },
  { status: "picking", label: "Picking" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

function stepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  const i = STEPS.findIndex((s) => s.status === status);
  return i >= 0 ? i : 0;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading, isReady } = useRequireAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [lines, setLines] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    setError(null);
    const { data: row, error: e1 } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (e1 || !row) {
      setError(e1?.message ?? "Order not found");
      setOrder(null);
      setLoading(false);
      return;
    }
    const o = row as Order;
    if (o.user_id !== user.id) {
      setError("Not found");
      setOrder(null);
      setLoading(false);
      return;
    }
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at");
    setOrder(o);
    setLines((items ?? []) as OrderItem[]);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (!isReady) return;
    void load();
  }, [load, isReady]);

  if (authLoading || !isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const idx = stepIndex(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <>
      <Stack.Screen options={{ title: "Order" }} />
      <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
        <Text style={styles.mono}>{order.id}</Text>
        <Text style={styles.date}>{formatDate(order.created_at)}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{order.status.replace(/_/g, " ")}</Text>
        </View>
        <Text style={styles.total}>{formatMoney(Number(order.total_amount))}</Text>

        {!cancelled ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Status</Text>
            {STEPS.map((s, i) => {
              const done = i <= idx;
              return (
                <View key={s.status} style={styles.stepRow}>
                  <MaterialCommunityIcons
                    name={done ? "check-circle" : "circle-outline"}
                    size={22}
                    color={done ? colors.brand : colors.border}
                  />
                  <Text style={[styles.stepLabel, done && styles.stepLabelOn]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.cancelNote}>This order was cancelled.</Text>
        )}

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Items</Text>
          {lines.map((li) => (
            <View key={li.id} style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{li.product_name_snapshot}</Text>
                <Text style={styles.lineMeta}>
                  {formatMoney(Number(li.unit_price_snapshot))} × {li.quantity}
                </Text>
              </View>
              <Text style={styles.linePrice}>{formatMoney(Number(li.subtotal))}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  pad: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: colors.danger },
  mono: { fontFamily: "monospace", fontSize: 12, color: colors.muted },
  date: { fontSize: 14, color: colors.muted, marginTop: 6 },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: colors.leek50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  statusText: { fontWeight: "700", color: colors.brand, textTransform: "capitalize" },
  total: { fontSize: 26, fontWeight: "800", color: colors.brand, marginTop: 16 },
  card: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  stepLabel: { fontSize: 15, color: colors.muted },
  stepLabelOn: { color: colors.ink, fontWeight: "600" },
  cancelNote: { marginTop: 16, color: colors.muted, fontSize: 15 },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineName: { fontWeight: "600", color: colors.ink },
  lineMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  linePrice: { fontWeight: "700", color: colors.ink },
});
