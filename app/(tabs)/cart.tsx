import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/format";
import { publicImageUrl } from "@/lib/publicImageUrl";
import { colors, radii, shadows } from "@/lib/theme";

/** Display-only delivery estimate (checkout still uses server totals). */
const DELIVERY_FEE_MAD = 15;

export default function CartScreen() {
  const { items, setQuantity, removeItem, clear, hydrated } = useCart();

  if (!hydrated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading basket…</Text>
      </View>
    );
  }

  const subtotal = items.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE_MAD : 0);

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.title}>My cart</Text>
        <Text style={styles.body}>Your cart is empty.</Text>
        <Text style={styles.bodyMuted}>
          Add items from home or categories — your basket stays on this device until checkout.
        </Text>
        <Link href="/catalog" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start shopping</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My cart</Text>
        <Pressable onPress={() => clear()}>
          <Text style={styles.clearLink}>Clear</Text>
        </Pressable>
      </View>

      {items.map((line) => {
        const uri = publicImageUrl(line.imageUrl);
        return (
          <View key={line.productId} style={[styles.line, shadows.card]}>
            <View style={styles.thumb}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
              ) : (
                <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
                  <Text style={styles.thumbPhText}>—</Text>
                </View>
              )}
            </View>
            <View style={styles.lineBody}>
              <Text style={styles.lineName}>{line.name}</Text>
              <Text style={styles.linePrice}>
                {formatMoney(line.price)} · {line.unit}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable style={styles.stepper} onPress={() => setQuantity(line.productId, line.quantity - 1)}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{line.quantity}</Text>
                <Pressable style={styles.stepper} onPress={() => setQuantity(line.productId, line.quantity + 1)}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
                <Pressable onPress={() => removeItem(line.productId)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.lineTotal}>{formatMoney(line.price * line.quantity)}</Text>
          </View>
        );
      })}

      <View style={[styles.summary, shadows.card]}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Subtotal</Text>
          <Text style={styles.sumVal}>{formatMoney(subtotal)}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Delivery fee</Text>
          <Text style={styles.sumVal}>{formatMoney(DELIVERY_FEE_MAD)}</Text>
        </View>
        <View style={[styles.sumRow, styles.sumTotalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>{formatMoney(total)}</Text>
        </View>
      </View>

      <Pressable style={styles.checkoutBtn} onPress={() => router.push("/checkout")}>
        <Text style={styles.checkoutBtnText}>Checkout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page, padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.muted },
  emptyWrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.page },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  body: { fontSize: 16, color: colors.ink, marginBottom: 8 },
  bodyMuted: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 20 },
  primaryBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radii.input,
  },
  primaryBtnText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  clearLink: { color: colors.danger, fontWeight: "600" },
  line: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  thumb: { width: 72 },
  thumbImg: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.page },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  thumbPhText: { color: colors.muted },
  lineBody: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  linePrice: { fontSize: 14, color: colors.muted, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
  },
  stepperText: { fontSize: 20, fontWeight: "700", color: colors.ink, marginTop: -2 },
  qtyValue: { minWidth: 28, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.ink },
  remove: { color: colors.danger, fontWeight: "600", fontSize: 14 },
  lineTotal: { fontWeight: "800", color: colors.brand, alignSelf: "center" },
  summary: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sumLabel: { fontSize: 15, color: colors.muted },
  sumVal: { fontSize: 15, fontWeight: "600", color: colors.ink },
  sumTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 0 },
  totalLabel: { fontSize: 17, fontWeight: "800", color: colors.ink },
  totalVal: { fontSize: 18, fontWeight: "800", color: colors.brand },
  checkoutBtn: {
    marginTop: 18,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radii.input,
    alignItems: "center",
  },
  checkoutBtnText: { color: colors.white, fontWeight: "800", fontSize: 17 },
});
