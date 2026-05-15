import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatMoney } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { colors, radii, shadows } from "@/lib/theme";
import type { Order, OrderStatus } from "@/lib/types/database";

type FilterKey = "all" | "ongoing" | "completed" | "cancelled";

function matchesFilter(o: Order, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "ongoing") return o.status === "pending" || o.status === "picking" || o.status === "out_for_delivery";
  if (f === "completed") return o.status === "delivered";
  return o.status === "cancelled";
}

export default function OrdersTabScreen() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async (silent?: boolean) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!silent) setLoading(false);
    if (err) {
      setError(err.message);
      setOrders([]);
      return;
    }
    setOrders((data ?? []) as Order[]);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    void load();
  }, [user, authLoading, load]);

  const filtered = useMemo(() => orders.filter((o) => matchesFilter(o, filter)), [orders, filter]);

  if (authLoading || !user) {
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

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => void load()}>
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pad}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load(true);
            setRefreshing(false);
          }}
        />
      }
    >
      <Text style={styles.head}>My orders</Text>
      <Text style={styles.sub}>Pull to refresh status.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextOn]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No orders in this tab yet.</Text>
      ) : (
        filtered.map((o) => (
          <Pressable
            key={o.id}
            style={styles.card}
            onPress={() => router.push(`/order/${o.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>{o.id.slice(0, 8)}…</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{o.status.replace(/_/g, " ")}</Text>
              </View>
            </View>
            <Text style={styles.date}>{formatDate(o.created_at)}</Text>
            <Text style={styles.total}>{formatMoney(Number(o.total_amount))}</Text>
            {o.status === "out_for_delivery" || o.status === "picking" || o.status === "pending" ? (
              <Pressable style={styles.track} onPress={() => router.push(`/order/${o.id}`)}>
                <Text style={styles.trackText}>Track order</Text>
              </Pressable>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  pad: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  head: { fontSize: 22, fontWeight: "800", color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 12 },
  chipsRow: { flexGrow: 0, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.leek50, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  chipTextOn: { color: colors.brand },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 13, color: colors.muted, fontFamily: "monospace" },
  badge: { backgroundColor: colors.leek50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.brand, textTransform: "capitalize" },
  date: { fontSize: 13, color: colors.muted, marginTop: 8 },
  total: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 6 },
  track: { marginTop: 12, alignSelf: "flex-start" },
  trackText: { color: colors.brand, fontWeight: "700", fontSize: 14 },
  empty: { color: colors.muted, fontSize: 15, marginTop: 8 },
  primary: {
    marginTop: 16,
    backgroundColor: colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.input,
  },
  primaryText: { color: colors.white, fontWeight: "800" },
  error: { color: colors.danger, textAlign: "center", marginBottom: 8 },
  retry: { color: colors.brand, fontWeight: "700" },
});
