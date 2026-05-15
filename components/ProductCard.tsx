import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@/lib/format";
import { stockOf } from "@/lib/inStock";
import { publicImageUrl } from "@/lib/publicImageUrl";
import { colors, radii, shadows } from "@/lib/theme";
import type { ProductWithStock } from "@/lib/types/database";

export function ProductCard({ product, compact }: { product: ProductWithStock; compact?: boolean }) {
  const stock = stockOf(product);
  const uri = publicImageUrl(product.image_url);

  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact, shadows.card]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, compact && styles.imageCompact]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, compact && styles.imageCompact, styles.placeholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.price}>{formatMoney(Number(product.price))}</Text>
      <Text style={styles.meta}>
        {stock > 0 ? `${stock} in stock` : "Out of stock"} · {product.unit}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    maxWidth: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  cardCompact: {
    minWidth: 140,
    maxWidth: 160,
    marginRight: 12,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  imageWrapCompact: { height: 100 },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.page },
  imageCompact: { aspectRatio: undefined, height: 100 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.muted, fontSize: 12 },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink, minHeight: 38 },
  price: { fontSize: 15, fontWeight: "800", color: colors.brand, marginTop: 4 },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
