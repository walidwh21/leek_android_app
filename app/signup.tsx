import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function signUp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.sub}>We’ll send a confirmation email if required by your project settings.</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.primary} onPress={() => void signUp()} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? "Creating…" : "Sign up"}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.page },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  sub: { fontSize: 15, color: colors.muted, marginBottom: 24, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 14,
  },
  error: { color: colors.danger, marginBottom: 12 },
  message: { color: colors.leek800, marginBottom: 12, fontWeight: "600" },
  primary: {
    backgroundColor: colors.leek800,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 17 },
  link: { marginTop: 20, textAlign: "center", color: colors.leek800, fontWeight: "700", fontSize: 16 },
});
