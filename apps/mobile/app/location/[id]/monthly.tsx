import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/client";
import type { CatalogProduct, MonthlyInventory } from "@/types/inventory";
import type { CurrentUser } from "@/types/user";

export default function LocationMonthlyInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inventory, setInventory] = useState<MonthlyInventory | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.ensureMonthlyInventory(id), api.getProducts(), api.me()])
      .then(([inv, prods, me]) => {
        setInventory(inv);
        setProducts(prods);
        setCurrentUser(me);
        const initial: Record<string, string> = {};
        inv.items.forEach((item) => {
          initial[item.productId] = item.quantity;
        });
        setQuantities(initial);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleCommit = async (productId: string, rawValue: string) => {
    if (!inventory) return;
    const trimmed = rawValue.trim();
    if (trimmed === "") return;
    const quantity = Number(trimmed.replace(",", "."));
    if (Number.isNaN(quantity) || quantity < 0) return;

    try {
      await api.updateMonthlyInventoryItem(inventory.id, productId, quantity);
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
        <ActivityIndicator size="large" />
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

      <ScrollView contentContainerStyle={styles.list}>
        {grouped.map(([categoryName, items]) => (
          <View key={categoryName} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            {items.map((product) => (
              <View key={product.id} style={styles.row}>
                <Text style={styles.productName}>{product.name}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  value={quantities[product.id] ?? ""}
                  editable={!isSubmitted}
                  onChangeText={(value) =>
                    setQuantities((prev) => ({ ...prev, [product.id]: value }))
                  }
                  onEndEditing={(e) => handleCommit(product.id, e.nativeEvent.text)}
                />
              </View>
            ))}
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
  back: { color: "#8a5a3b", fontWeight: "600", fontSize: 15 },
  title: { fontSize: 14, fontWeight: "600", flex: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f7d3c",
    backgroundColor: "#e4f4e6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeValidated: { color: "#8a5a3b", backgroundColor: "#f4ece3" },
  list: { padding: 16, paddingBottom: 100 },
  categoryBlock: { marginBottom: 20 },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8a5a3b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeec",
  },
  productName: { fontSize: 15, fontWeight: "600", flex: 1, paddingRight: 12 },
  input: {
    width: 70,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
  },
  submitButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#8a5a3b",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  error: { color: "red" },
});
