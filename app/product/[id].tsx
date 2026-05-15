import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { formatMoney } from "@/lib/format";
import { stockOf } from "@/lib/inStock";
import { publicImageUrl } from "@/lib/publicImageUrl";
import { supabase } from "@/lib/supabase";
import { colors, radii, shadows } from "@/lib/theme";
import type { ProductWithStock } from "@/lib/types/database";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading, isReady } = useRequireAuth();
  const { addItem, count } = useCart();
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("products")
      .select("*, inventory(quantity)")
      .eq("id", id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    setLoading(false);
    if (err || !data) {
      setError(err?.message ?? "Product not found.");
      setProduct(null);
      return;
    }
    setProduct(data as ProductWithStock);
    setQty(1);
  }, [id]);

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

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const stock = stockOf(product);
  const uri = publicImageUrl(product.image_url);

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 }}>
              <Pressable hitSlop={12} style={styles.hdrIcon}>
                <MaterialCommunityIcons name="heart-outline" size={24} color={colors.ink} />
              </Pressable>
              <Pressable hitSlop={12} style={styles.hdrCartWrap} onPress={() => router.push("/cart")}>
                <MaterialCommunityIcons name="cart-outline" size={24} color={colors.ink} />
                {count > 0 ? (
                  <View style={styles.hdrBadge}>
                    <Text style={styles.hdrBadgeText}>{count > 9 ? "9+" : count}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
        <View style={[styles.imageBox, shadows.card]}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="contain" />
          ) : (
            <View style={[styles.image, styles.ph]}>
              <Text style={styles.phText}>No image</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.unitLine}>{product.unit}</Text>

        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={18} color={colors.star} />
          <Text style={styles.ratingNum}>4.6</Text>
          <Text style={styles.ratingCount}>(128)</Text>
          {stock > 0 ? (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>In stock</Text>
            </View>
          ) : (
            <View style={[styles.stockBadge, styles.stockOut]}>
              <Text style={[styles.stockBadgeText, styles.stockBadgeTextOut]}>Out of stock</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>{formatMoney(Number(product.price))}</Text>

        {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

        {stock > 0 ? (
          <View style={styles.bottomBlock}>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.min(stock, q + 1))}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.cta}
              onPress={() => {
                addItem({
                  productId: product.id,
                  name: product.name,
                  price: Number(product.price),
                  imageUrl: product.image_url,
                  unit: product.unit,
                  maxQty: stock,
                  quantity: qty,
                });
              }}
            >
              <Text style={styles.ctaText}>Add to cart</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.oos}>This product is currently out of stock.</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  pad: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page },
  errorText: { color: colors.danger, padding: 24, textAlign: "center" },
  hdrIcon: { padding: 8 },
  hdrCartWrap: { padding: 8, position: "relative" },
  hdrBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  hdrBadgeText: { fontSize: 10, fontWeight: "800", color: colors.white },
  imageBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 16,
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: 14 },
  ph: { alignItems: "center", justifyContent: "center", backgroundColor: colors.page },
  phText: { color: colors.muted },
  name: { fontSize: 26, fontWeight: "800", color: colors.ink },
  unitLine: { fontSize: 15, color: colors.muted, marginTop: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6, flexWrap: "wrap" },
  ratingNum: { fontSize: 16, fontWeight: "700", color: colors.ink },
  ratingCount: { fontSize: 14, color: colors.muted },
  stockBadge: {
    marginLeft: 8,
    backgroundColor: colors.leek50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  stockOut: { backgroundColor: "#FEE2E2" },
  stockBadgeText: { fontSize: 12, fontWeight: "800", color: colors.brand },
  stockBadgeTextOut: { color: colors.danger },
  price: { fontSize: 26, fontWeight: "800", color: colors.brand, marginTop: 14 },
  desc: { fontSize: 15, color: colors.ink, lineHeight: 22, marginTop: 16 },
  bottomBlock: { marginTop: 28, gap: 14 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    backgroundColor: colors.surface,
  },
  stepBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  stepBtnText: { fontSize: 22, fontWeight: "700", color: colors.ink },
  qty: { minWidth: 40, textAlign: "center", fontSize: 18, fontWeight: "800" },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radii.input,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { fontWeight: "800", fontSize: 17, color: colors.white },
  oos: { marginTop: 20, color: colors.muted, fontSize: 15 },
});
