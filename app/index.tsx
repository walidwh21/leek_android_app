import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { colors, radii, shadows } from "@/lib/theme";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Redirect href="/home" />;
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.hero}>
        <Image source={require("../assets/leek-logo.png")} style={styles.logo} contentFit="contain" />
      </View>
      <Text style={styles.lead}>Sign in to shop, checkout, and track your orders.</Text>
      <Pressable style={[styles.primary, shadows.card]} onPress={() => router.push("/login")}>
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => router.push("/signup")}>
        <Text style={styles.secondaryText}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: "100%",
    maxWidth: 320,
    height: 160,
  },
  lead: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  primary: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radii.input,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 17 },
  secondary: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: radii.input,
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.brand, fontWeight: "800", fontSize: 17 },
});
