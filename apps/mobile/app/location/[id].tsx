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
import type { DailyInventory, DailyInventoryItem } from "@/types/inventory";

export default function LocationInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inventory, setInventory] = useState<DailyInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .ensureDailyInventory(id)
      .then(setInventory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    if (!inventory) return [];
    const byCategory = new Map<string, DailyInventoryItem[]>();
    for (const item of inventory.items) {
      const key = item.product.category.name;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [inventory]);

  const handleQuantityChange = (productId: string, rawValue: string) => {
    if (!inventory) return;
    setInventory({
      ...inventory,
      items: inventory.items.map((item) =>
        item.productId === productId ? { ...item, quantity: rawValue } : item
      ),
    });
  };

  const handleQuantityCommit = async (productId: string, rawValue: string) => {
    if (!inventory) return;
    const quantity = rawValue.trim() === "" ? null : Number(rawValue.replace(",", "."));

    if (quantity !== null && Number.isNaN(quantity)) {
      return;
    }

    try {
      const updated = await api.updateInventoryItem(inventory.id, productId, {
        quantity,
      });
      setInventory((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.productId === productId ? { ...item, ...updated } : item
              ),
            }
          : prev
      );
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer la quantité");
    }
  };

  const handleSubmit = async () => {
    if (!inventory) return;
    setSubmitting(true);
    try {
      await api.submitDailyInventory(inventory.id);
      Alert.alert("Envoyé", "L'inventaire a été envoyé au Dashboard.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'envoyer l'inventaire");
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.title}>Inventaire du {inventory.inventoryDate.slice(0, 10)}</Text>
        {isSubmitted ? <Text style={styles.badge}>Envoyé</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {grouped.map(([categoryName, items]) => (
          <View key={categoryName} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productMeta}>
                    Seuil {item.stockMinimum} {item.product.unit.toLowerCase()}
                    {item.product.suppliers[0]
                      ? ` · ${item.product.suppliers[0].supplier.name}`
                      : ""}
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  value={item.quantity ?? ""}
                  editable={!isSubmitted}
                  onChangeText={(value) => handleQuantityChange(item.productId, value)}
                  onEndEditing={(e) =>
                    handleQuantityCommit(item.productId, e.nativeEvent.text)
                  }
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
            <Text style={styles.submitText}>Envoyer au Dashboard</Text>
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
  back: { color: "#8a5a3b", fontWeight: "600", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f7d3c",
    backgroundColor: "#e4f4e6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
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
  rowInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 15, fontWeight: "600" },
  productMeta: { fontSize: 12, color: "#888", marginTop: 2 },
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
