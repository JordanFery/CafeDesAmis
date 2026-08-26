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
import type { DailyInventory, DailyInventoryItem } from "@/types/inventory";
import type { CurrentUser } from "@/types/user";
import { colors } from "@/constants/theme";

const INCIDENT_ROLES = ["TEAM_LEADER", "MANAGEMENT", "ADMIN"];

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};
const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function LocationInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inventory, setInventory] = useState<DailyInventory | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.ensureDailyInventory(id), api.me()])
      .then(([inv, me]) => {
        setInventory(inv);
        setCurrentUser(me);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const [weekdayFilter, setWeekdayFilter] = useState<number | "">("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const suppliers = useMemo(() => {
    if (!inventory) return [];
    const byId = new Map<string, string>();
    for (const item of inventory.items) {
      const supplier = item.product.suppliers[0]?.supplier;
      if (supplier) byId.set(supplier.id, supplier.name);
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory]);

  const categories = useMemo(() => {
    if (!inventory) return [];
    const byId = new Map<string, string>();
    for (const item of inventory.items) {
      byId.set(item.product.category.id, item.product.category.name);
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory]);

  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.items.filter((item) => {
      const supplier = item.product.suppliers[0]?.supplier;
      if (supplierFilter && supplier?.id !== supplierFilter) return false;
      if (categoryFilter && item.product.category.id !== categoryFilter) return false;
      if (weekdayFilter) {
        const weekdays = supplier?.employees?.map((e) => e.inventoryWeekday) ?? [];
        if (!weekdays.includes(weekdayFilter)) return false;
      }
      return true;
    });
  }, [inventory, weekdayFilter, supplierFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, DailyInventoryItem[]>();
    for (const item of filteredItems) {
      const key = item.product.category.name;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredItems]);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.title}>Inventaire du {inventory.inventoryDate.slice(0, 10)}</Text>
        {isSubmitted ? <Text style={styles.badge}>Envoyé</Text> : null}
        <Pressable onPress={() => router.push(`/location/${id}/monthly`)}>
          <Text style={styles.back}>Mensuel ›</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/location/${id}/losses`)}>
          <Text style={styles.back}>Pertes ›</Text>
        </Pressable>
        {currentUser && INCIDENT_ROLES.includes(currentUser.role) ? (
          <Pressable onPress={() => router.push(`/location/${id}/incidents`)}>
            <Text style={styles.back}>Incidents ›</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Journée</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={weekdayFilter}
              onValueChange={(v) => setWeekdayFilter(v === "" ? "" : Number(v))}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Toutes" value="" />
              {WEEKDAY_OPTIONS.map((d) => (
                <Picker.Item key={d} label={WEEKDAY_LABELS[d]} value={d} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Fournisseur</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={supplierFilter}
              onValueChange={setSupplierFilter}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Tous" value="" />
              {suppliers.map((s) => (
                <Picker.Item key={s.id} label={s.name} value={s.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Catégorie</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={categoryFilter}
              onValueChange={setCategoryFilter}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Toutes" value="" />
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {grouped.length === 0 ? (
          <Text style={styles.empty}>Aucun article ne correspond à ce filtre.</Text>
        ) : null}
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
  back: { color: colors.secondary, fontWeight: "600", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterField: { flex: 1, gap: 4 },
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
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: 24 },
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
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 15, fontWeight: "600" },
  productMeta: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  input: {
    width: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
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
