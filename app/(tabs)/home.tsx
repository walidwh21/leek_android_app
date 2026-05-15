import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeProductTile } from "@/components/HomeProductTile";
import { useAuth } from "@/context/AuthContext";
import { timeGreeting } from "@/lib/greeting";
import { supabase } from "@/lib/supabase";
import { publicImageUrl } from "@/lib/publicImageUrl";
import { colors, radii, shadows } from "@/lib/theme";
import type { Category, ProductWithStock } from "@/lib/types/database";
import { Image } from "expo-image";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (catError) {
      setError(catError.message);
      if (!opts?.silent) setLoading(false);
      return;
    }

    const { data: prodData, error: prodError } = await supabase
      .from("products")
      .select("*, inventory(quantity)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8);

    if (prodError) {
      setError(prodError.message);
      if (!opts?.silent) setLoading(false);
      return;
    }

    setCategories((catData ?? []) as Category[]);
    setFeatured((prodData ?? []) as ProductWithStock[]);
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim()?.split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "there";

  if (loading && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load({ silent: true });
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={[styles.topPad, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hello 👋</Text>
            <Text style={styles.greet}>
              {timeGreeting()}, {firstName}
            </Text>
          </View>
          <Pressable style={styles.bell} hitSlop={12}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            placeholderTextColor={colors.muted}
            style={styles.searchField}
            returnKeyType="search"
            onSubmitEditing={() =>
              router.push({ pathname: "/catalog", params: { q: search.trim() } })
            }
          />
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: "/catalog", params: { q: search.trim() } })}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.brand} />
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load catalogue</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable onPress={() => void load()}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.banner}>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Fresh vegetables</Text>
          <Text style={styles.bannerSub}>Up to 30% off selected picks</Text>
          <Pressable onPress={() => router.push("/catalog")}>
            <Text style={styles.bannerCta}>Shop now →</Text>
          </Pressable>
        </View>
        <MaterialCommunityIcons name="basket" size={56} color={colors.brand} style={{ opacity: 0.35 }} />
      </View>

      {categories.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => router.push("/categories")}>
              <Text style={styles.sectionLink}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.slice(0, 8).map((c) => {
              const uri = publicImageUrl(c.image_url);
              return (
                <Pressable
                  key={c.id}
                  style={styles.catCircle}
                  onPress={() =>
                    router.push({
                      pathname: "/catalog",
                      params: { categoryId: c.id, categoryName: c.name },
                    })
                  }
                >
                  <View style={styles.catAvatar}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.catImg} contentFit="cover" />
                    ) : (
                      <Text style={styles.catInitial}>{c.name.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.catLabel} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exclusive offer</Text>
          <Pressable onPress={() => router.push("/catalog")}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>
        <FlatList
          data={featured}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <HomeProductTile product={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  topPad: { paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  hello: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  greet: { fontSize: 22, fontWeight: "800", color: colors.ink, marginTop: 4 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchField: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.ink },
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.mintBanner,
    borderRadius: radii.card,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.15)",
  },
  bannerTextCol: { flex: 1, paddingRight: 12 },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: colors.brandDark },
  bannerSub: { fontSize: 14, color: colors.brand, marginTop: 6, fontWeight: "600" },
  bannerCta: { marginTop: 10, fontSize: 15, fontWeight: "800", color: colors.brand },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  sectionLink: { fontSize: 14, fontWeight: "700", color: colors.brand },
  catCircle: { alignItems: "center", marginRight: 16, width: 76 },
  catAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.leek50,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  catImg: { width: "100%", height: "100%" },
  catInitial: { fontSize: 22, fontWeight: "800", color: colors.brand },
  catLabel: { marginTop: 6, fontSize: 11, fontWeight: "600", color: colors.ink, textAlign: "center", maxWidth: 76 },
  row: { justifyContent: "space-between", gap: 10 },
  empty: { color: colors.muted, paddingVertical: 16 },
  errorBox: {
    margin: 16,
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorTitle: { fontWeight: "700", color: colors.danger, marginBottom: 4 },
  errorBody: { color: colors.ink },
  retry: { marginTop: 12, color: colors.brand, fontWeight: "700" },
});
