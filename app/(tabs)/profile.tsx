import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { colors, radii, shadows } from "@/lib/theme";

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();

  if (loading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={40} color={colors.brand} />
        </View>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Pressable style={[styles.row, shadows.card]} onPress={() => router.push("/orders")}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={colors.brand} />
        <Text style={styles.rowText}>My orders</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>

      <Pressable
        style={[styles.outlineBtn, { marginTop: 24 }]}
        onPress={() => {
          void (async () => {
            await signOut();
            router.replace("/");
          })();
        }}
      >
        <Text style={styles.outlineBtnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page },
  wrap: { flex: 1, backgroundColor: colors.page, padding: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.leek50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  email: { fontSize: 16, fontWeight: "700", color: colors.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  rowText: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.ink },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: radii.input,
    alignItems: "center",
  },
  outlineBtnText: { color: colors.danger, fontWeight: "700", fontSize: 16 },
});
