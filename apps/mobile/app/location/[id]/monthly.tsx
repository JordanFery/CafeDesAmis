import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/client";
import type { CatalogProduct, MonthlyInventory } from "@/types/inventory";
import type { CurrentUser } from "@/types/user";
import type { Supplier } from "@/types/supplier";
import { colors } from "@/constants/theme";

type Quantities = { counter: string; backstore: string };

export default function LocationMonthlyInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inventory, setInventory] = useState<MonthlyInventory | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [quantities, setQuantities] = useState<Record<string, Quantities>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.ensureMonthlyInventory(id),
      api.getProducts(supplierFilter || undefined),
      api.getSuppliers(),
      api.me(),
    ])
      .then(([inv, prods, sups, me]) => {
        setInventory(inv);
        setProducts(prods);
        setSuppliers(sups);
        setCurrentUser(me);
        const initial: Record<string, Quantities> = {};
        inv.items.forEach((item) => {
          initial[item.productId] = {
            counter: item.counterQuantity ?? "",
            backstore: item.backstoreQuantity ?? "",
          };
        });
        setQuantities(initial);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, supplierFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, CatalogProduct[]>();
    for (const product of products) {
      const key = product.category.name;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(product);
    }
    return Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const getQuantities = (productId: string): Quantities =>
    quantities[productId] ?? { counter: "", backstore: "" };

  const totalFor = (productId: string) => {
    const q = getQuantities(productId);
    const counter = q.counter.trim() === "" ? 0 : Number(q.counter.replace(",", "."));
    const backstore = q.backstore.trim() === "" ? 0 : Number(q.backstore.replace(",", "."));
    if (Number.isNaN(counter) || Number.isNaN(backstore)) return null;
    return counter + backstore;
  };

  const handleChange = (productId: string, field: "counter" | "backstore", value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: { ...getQuantities(productId), [field]: value },
    }));
  };

  const handleCommit = async (productId: string, field: "counter" | "backstore", rawValue: string) => {
    if (!inventory) return;
    const trimmed = rawValue.trim();
    const value = trimmed === "" ? null : Number(trimmed.replace(",", "."));
    if (value !== null && (Number.isNaN(value) || value < 0)) return;

    try {
      const key = field === "counter" ? "counterQuantity" : "backstoreQuantity";
      await api.updateMonthlyInventoryItem(inventory.id, productId, { [key]: value });
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer la quantité");
    }
  };

  const handleSubmit = async () => {
    if (!inventory) return;
    setSubmitting(true);
    try {
      const updated = await api.submitMonthlyInventory(inventory.id);
      setInventory((prev) => (prev ? { ...prev, status: updated.status } : prev));
      Alert.alert("Envoyé", "L'inventaire mensuel a été envoyé pour validation.");
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'envoyer l'inventaire");
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (!inventory) return;
    setValidating(true);
    try {
      const updated = await api.validateMonthlyInventory(inventory.id);
      setInventory((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible de valider l'inventaire");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </SafeAreaView>
    );
  }

  if (error || !inventory) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Erreur : {error ?? "inventaire introuvable"}</Text>
      </SafeAreaView>
    );
  }

  const isSubmitted = inventory.status === "SUBMITTED";
  const isValidated = !!inventory.validatedAt;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace(`/location/${id}/daily`)}>
          <Text style={styles.back}>‹ Quotidien</Text>
        </Pressable>
        <Text style={styles.title}>Inventaire mensuel · {inventory.inventoryDate.slice(0, 7)}</Text>
        {isValidated ? (
          <Text style={[styles.badge, styles.badgeValidated]}>Validé</Text>
        ) : isSubmitted ? (
          <Text style={styles.badge}>Envoyé</Text>
        ) : null}
      </View>

      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Fournisseur</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={supplierFilter}
            onValueChange={setSupplierFilter}
            mode="dropdown"
            style={styles.picker}
          >
            <Picker.Item label="Tous les fournisseurs" value="" />
            {suppliers.map((s) => (
              <Picker.Item key={s.id} label={s.name} value={s.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.columnHeader}>
        <Text style={[styles.columnHeaderText, styles.productNameCol]} />
        <Text style={[styles.columnHeaderText, styles.qtyCol]}>Comptoir</Text>
        <Text style={[styles.columnHeaderText, styles.qtyCol]}>Back store</Text>
        <Text style={[styles.columnHeaderText, styles.qtyCol]}>Total</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {grouped.map(([categoryName, items]) => (
          <View key={categoryName} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            {items.map((product) => {
              const q = getQuantities(product.id);
              const total = totalFor(product.id);
              return (
                <View key={product.id} style={styles.row}>
                  <Text style={[styles.productName, styles.productNameCol]}>
                    {product.name}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.qtyCol]}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    value={q.counter}
                    editable={!isSubmitted}
                    onChangeText={(v) => handleChange(product.id, "counter", v)}
                    onEndEditing={(e) => handleCommit(product.id, "counter", e.nativeEvent.text)}
                  />
                  <TextInput
                    style={[styles.input, styles.qtyCol]}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    value={q.backstore}
                    editable={!isSubmitted}
                    onChangeText={(v) => handleChange(product.id, "backstore", v)}
                    onEndEditing={(e) => handleCommit(product.id, "backstore", e.nativeEvent.text)}
                  />
                  <Text style={[styles.totalText, styles.qtyCol]}>
                    {total !== null ? total : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {!isSubmitted ? (
        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Envoyer pour validation</Text>
          )}
        </Pressable>
      ) : !isValidated && currentUser?.role === "ADMIN" ? (
        <Pressable style={styles.submitButton} onPress={handleValidate} disabled={validating}>
          {validating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Valider l'inventaire</Text>
          )}
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  back: { color: colors.secondary, fontWeight: "600", fontSize: 15 },
  title: { fontSize: 14, fontWeight: "600", flex: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeValidated: { color: colors.secondary, backgroundColor: colors.secondarySoft },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: colors.secondary,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: Platform.select({
    ios: { height: 120 },
    default: { height: 44 },
  }) as object,
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  columnHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.inkMuted,
    textAlign: "center",
  },
  list: { padding: 16, paddingBottom: 100 },
  categoryBlock: { marginBottom: 20 },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 6,
  },
  productNameCol: { flex: 1.6, paddingRight: 6 },
  qtyCol: { flex: 1 },
  productName: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 6,
    textAlign: "center",
    fontSize: 13,
  },
  totalText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },
  submitButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  error: { color: "red" },
});
