import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { supabase } from "@/lib/supabase";
import { categoryPastels, colors, radii, shadows } from "@/lib/theme";
import { publicImageUrl } from "@/lib/publicImageUrl";
import type { Category } from "@/lib/types/database";

const { width } = Dimensions.get("window");
const GAP = 12;
const PAD = 16;
const tileW = (width - PAD * 2 - GAP) / 2;

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("position", { ascending: true });
    setLoading(false);
    if (err) {
      setError(err.message);
      setCategories([]);
      return;
    }
    setCategories((data ?? []) as Category[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.sub}>Browse aisles — same catalogue as the LEEK web store.</Text>
      <View style={styles.grid}>
        {categories.map((c, i) => {
          const bg = categoryPastels[i % categoryPastels.length];
          const uri = publicImageUrl(c.image_url);
          return (
            <Pressable
              key={c.id}
              style={[styles.tile, { width: tileW, backgroundColor: bg }]}
              onPress={() =>
                router.push({
                  pathname: "/catalog",
                  params: { categoryId: c.id, categoryName: c.name },
                })
              }
            >
              <View style={styles.tileImageWrap}>
                {uri ? (
                  <Image source={{ uri }} style={styles.tileImage} contentFit="contain" />
                ) : (
                  <View style={[styles.tileImage, styles.fallback]}>
                    <Text style={styles.fallbackText}>{c.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tileName} numberOfLines={2}>
                {c.name}
              </Text>
              <Text style={styles.tileCta}>Shop aisle →</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  pad: { padding: PAD, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: {
    borderRadius: radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    ...shadows.card,
  },
  tileImageWrap: {
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
    marginBottom: 10,
  },
  tileImage: { width: "100%", height: "100%" },
  fallback: { alignItems: "center", justifyContent: "center" },
  fallbackText: { fontSize: 22, fontWeight: "800", color: colors.brand },
  tileName: { fontSize: 15, fontWeight: "700", color: colors.ink, minHeight: 40 },
  tileCta: { fontSize: 13, fontWeight: "700", color: colors.brand, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 8 },
  retry: { color: colors.brand, fontWeight: "700" },
});
