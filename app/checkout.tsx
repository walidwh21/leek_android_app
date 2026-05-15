import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/format";
import { messageForCreateOrderError } from "@/lib/rpcErrors";
import { supabase } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";
import type { Address, PaymentMethod } from "@/lib/types/database";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cod", label: "Cash on delivery" },
  { value: "wire", label: "Wire transfer" },
  { value: "card", label: "Credit / debit card" },
];

export default function CheckoutScreen() {
  const { user, loading: authLoading, isReady } = useRequireAuth();
  const { items, subtotal, clear } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    postal_code: "",
    country: "MA",
    is_default: false,
  });

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setAddresses([]);
      setSelectedId("");
    } else {
      setError(null);
      const list = (data ?? []) as Address[];
      setAddresses(list);
      setSelectedId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    void loadAddresses();
  }, [user, authLoading, loadAddresses]);

  async function saveAddress() {
    if (!user) return;
    setError(null);
    const payload = {
      label: form.label,
      line1: form.line1,
      line2: form.line2.trim() === "" ? null : form.line2,
      city: form.city,
      postal_code: form.postal_code,
      country: form.country.trim() || "MA",
      is_default: form.is_default,
    };

    if (editingId) {
      const { error: err } = await supabase
        .from("addresses")
        .update({
          label: payload.label,
          line1: payload.line1,
          line2: payload.line2,
          city: payload.city,
          postal_code: payload.postal_code,
          country: payload.country,
          is_default: payload.is_default,
        })
        .eq("id", editingId)
        .eq("user_id", user.id);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { data, error: err } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          ...payload,
        })
        .select("id")
        .single();
      if (err) {
        setError(err.message);
        return;
      }
      if (data?.id) setSelectedId(data.id as string);
    }

    setShowNew(false);
    setEditingId(null);
    setForm({
      label: "",
      line1: "",
      line2: "",
      city: "",
      postal_code: "",
      country: "MA",
      is_default: false,
    });
    await loadAddresses();
  }

  function startEdit(a: Address) {
    setEditingId(a.id);
    setShowNew(true);
    setForm({
      label: a.label,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      postal_code: a.postal_code,
      country: a.country,
      is_default: a.is_default,
    });
  }

  async function placeOrder() {
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!selectedId) {
      setError("Choose or add a shipping address.");
      return;
    }
    setSubmitting(true);
    const p_items = items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }));
    const { data, error: rpcErr } = await supabase.rpc("create_order", {
      p_address_id: selectedId,
      p_items,
      p_payment_method: payment,
      p_notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (rpcErr) {
      setError(messageForCreateOrderError(rpcErr));
      return;
    }
    const result = data as { order_id: string; total: number };
    clear();
    router.replace({
      pathname: "/order-placed",
      params: { orderId: result.order_id, total: String(result.total) },
    });
  }

  if (authLoading || !isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Nothing to checkout</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back to cart</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.sectionTitle}>Shipping address</Text>
        {loading ? (
          <Text style={styles.muted}>Loading addresses…</Text>
        ) : (
          <>
            {addresses.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.addrCard, selectedId === a.id && styles.addrCardSelected]}
                onPress={() => setSelectedId(a.id)}
              >
                <View style={styles.addrRow}>
                  <View style={[styles.radio, selectedId === a.id && styles.radioOn]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addrLabel}>
                      {a.label} {a.is_default ? <Text style={styles.badge}>(default)</Text> : null}
                    </Text>
                    <Text style={styles.addrLines}>
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                    </Text>
                    <Text style={styles.addrLines}>
                      {a.postal_code} {a.city}, {a.country}
                    </Text>
                    <Pressable onPress={() => startEdit(a)}>
                      <Text style={styles.edit}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={() => {
                setEditingId(null);
                setForm({
                  label: "",
                  line1: "",
                  line2: "",
                  city: "",
                  postal_code: "",
                  country: "MA",
                  is_default: false,
                });
                setShowNew((s) => !s);
              }}
            >
              <Text style={styles.addLink}>{showNew ? "Cancel new address" : "+ Add address"}</Text>
            </Pressable>

            {showNew ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>{editingId ? "Edit address" : "New address"}</Text>
                <LabeledInput label="Label" value={form.label} onChangeText={(t) => setForm((f) => ({ ...f, label: t }))} />
                <LabeledInput label="Line 1" value={form.line1} onChangeText={(t) => setForm((f) => ({ ...f, line1: t }))} />
                <LabeledInput label="Line 2" value={form.line2} onChangeText={(t) => setForm((f) => ({ ...f, line2: t }))} />
                <LabeledInput label="City" value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} />
                <LabeledInput
                  label="Postal code"
                  value={form.postal_code}
                  onChangeText={(t) => setForm((f) => ({ ...f, postal_code: t }))}
                />
                <LabeledInput label="Country" value={form.country} onChangeText={(t) => setForm((f) => ({ ...f, country: t }))} />
                <Pressable
                  style={styles.checkRow}
                  onPress={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
                >
                  <View style={[styles.box, form.is_default && styles.boxOn]} />
                  <Text>Set as default address</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => void saveAddress()}>
                  <Text style={styles.secondaryBtnText}>Save address</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment</Text>
        <Text style={styles.muted}>Payment method</Text>
        {PAYMENT_OPTIONS.map((opt) => (
          <Pressable key={opt.value} style={styles.payRow} onPress={() => setPayment(opt.value)}>
            <View style={[styles.radio, payment === opt.value && styles.radioOn]} />
            <Text style={styles.payLabel}>{opt.label}</Text>
          </Pressable>
        ))}

        <Text style={[styles.muted, { marginTop: 16 }]}>Order notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.notes}
          placeholder="Delivery instructions…"
          placeholderTextColor={colors.muted}
        />

        <View style={styles.summary}>
          <Text style={styles.sumLabel}>Subtotal</Text>
          <Text style={styles.sumValue}>{formatMoney(subtotal)}</Text>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={() => void placeOrder()} disabled={submitting}>
          <Text style={styles.primaryText}>{submitting ? "Placing order…" : "Place order"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.page },
  pad: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.page },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  link: { color: colors.brand, fontWeight: "700", marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 8 },
  addrCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  addrCardSelected: { borderColor: colors.brand, borderWidth: 2 },
  addrRow: { flexDirection: "row", gap: 10 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
  },
  radioOn: { borderColor: colors.brand, backgroundColor: colors.brand },
  addrLabel: { fontWeight: "700", color: colors.ink },
  badge: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  addrLines: { color: colors.muted, marginTop: 4, fontSize: 14 },
  edit: { marginTop: 8, color: colors.brand, fontWeight: "700" },
  addLink: { marginTop: 4, color: colors.brand, fontWeight: "700", marginBottom: 8 },
  form: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
  },
  formTitle: { fontWeight: "800", marginBottom: 10, color: colors.ink },
  inputLabel: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  box: { width: 20, height: 20, borderWidth: 2, borderColor: colors.border, borderRadius: 4 },
  boxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  secondaryBtn: {
    backgroundColor: colors.leek50,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtnText: { color: colors.brand, fontWeight: "800" },
  payRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  payLabel: { fontSize: 16, color: colors.ink },
  notes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: colors.white,
    color: colors.ink,
  },
  summary: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  sumLabel: { fontSize: 16, color: colors.muted },
  sumValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  err: { color: colors.danger, marginTop: 12 },
  primary: {
    marginTop: 20,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radii.input,
    alignItems: "center",
  },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 17 },
  k: { fontSize: 13, color: colors.muted },
  v: { fontSize: 16, fontWeight: "700", color: colors.ink, fontFamily: "monospace" },
});
