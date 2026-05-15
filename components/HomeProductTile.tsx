import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/format";
import { stockOf } from "@/lib/inStock";
import { publicImageUrl } from "@/lib/publicImageUrl";
import { colors, radii, shadows } from "@/lib/theme";
import type { ProductWithStock } from "@/lib/types/database";

export function HomeProductTile({ product }: { product: ProductWithStock }) {
  const { addItem } = useCart();
  const stock = stockOf(product);
  const uri = publicImageUrl(product.image_url);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(`/product/${product.id}`)} style={styles.imagePress}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.ph]}>
            <Text style={styles.phText}>No image</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={() => router.push(`/product/${product.id}`)}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <Text style={styles.price}>{formatMoney(Number(product.price))}</Text>
      </Pressable>
      <Pressable
        style={[styles.fab, stock <= 0 && styles.fabDisabled]}
        disabled={stock <= 0}
        onPress={() =>
          addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            imageUrl: product.image_url,
            unit: product.unit,
            maxQty: stock,
            quantity: 1,
          })
        }
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    maxWidth: "48%",
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: 12,
    ...shadows.card,
  },
  imagePress: { borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.page },
  ph: { alignItems: "center", justifyContent: "center" },
  phText: { color: colors.muted, fontSize: 12 },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: 10, paddingHorizontal: 10, minHeight: 36 },
  unit: { fontSize: 12, color: colors.muted, paddingHorizontal: 10, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "800", color: colors.brand, paddingHorizontal: 10, marginTop: 4 },
  fab: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: radii.fab,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  fabDisabled: { backgroundColor: colors.muted, opacity: 0.5 },
  fabText: { color: colors.white, fontSize: 22, fontWeight: "700", marginTop: -2 },
});
