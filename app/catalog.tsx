import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProductCard } from "@/components/ProductCard";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";
import type { ProductWithStock } from "@/lib/types/database";

export default function CatalogScreen() {
  const { loading: authLoading, isReady } = useRequireAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string; q?: string }>();
  const initialQ = typeof params.q === "string" ? params.q : "";
  const { categoryId, categoryName } = params;

  const [search, setSearch] = useState(initialQ);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("products")
      .select("*, inventory(quantity)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name");

    const q = search.trim();
    if (q) query = query.ilike("name", `%${q}%`);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error: err } = await query;
    setLoading(false);
    if (err) {
      setError(err.message);
      setProducts([]);
      return;
    }
    setProducts((data ?? []) as ProductWithStock[]);
  }, [search, categoryId]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSearch(initialQ);
  }, [initialQ]);

  const title = categoryName ? String(categoryName) : "Search products";

  if (authLoading || !isReady) {
    return (
      <>
        <Stack.Screen options={{ title: "Shop" }} />
        <View style={[styles.page, styles.centered]}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.page}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            placeholderTextColor={colors.muted}
            onSubmitEditing={() => void fetchProducts()}
            style={styles.input}
            returnKeyType="search"
          />
          <Pressable style={styles.iconBtn} onPress={() => void fetchProducts()}>
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.brand} />
          </Pressable>
        </View>

        {categoryId ? (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel} numberOfLines={1}>
              {typeof categoryName === "string" ? categoryName : "Category"}
            </Text>
            <Pressable onPress={() => router.replace("/catalog")}>
              <Text style={styles.clearFilter}>Clear</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void fetchProducts()}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listPad}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {search.trim() ? `No products match “${search.trim()}”.` : "No products available."}
              </Text>
            }
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.ink },
  iconBtn: { padding: 8 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterLabel: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: "600" },
  clearFilter: { fontSize: 14, fontWeight: "700", color: colors.brand },
  row: { justifyContent: "space-between", gap: 8, paddingHorizontal: 12 },
  listPad: { paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: colors.danger, textAlign: "center", marginBottom: 8 },
  retry: { color: colors.brand, fontWeight: "700" },
  empty: { color: colors.muted, padding: 24, textAlign: "center" },
});
