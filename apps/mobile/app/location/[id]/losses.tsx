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
import type { CatalogProduct } from "@/types/inventory";
import type { CurrentUser } from "@/types/user";
import type { Loss, LossReason } from "@/types/loss";

const REASON_LABELS: Record<LossReason, string> = {
  EXPIRED: "Expiré",
  DAMAGED: "Endommagé",
  DROPPED: "Échappé / cassé",
  OTHER: "Autre",
};

const REASON_OPTIONS: LossReason[] = ["EXPIRED", "DAMAGED", "DROPPED", "OTHER"];

export default function LocationLossesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [losses, setLosses] = useState<Loss[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<LossReason>("EXPIRED");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getLosses(id), api.getProducts(), api.me()])
      .then(([lossList, prods, me]) => {
        setLosses(lossList);
        setProducts(prods);
        setCurrentUser(me);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canRemove = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGEMENT";

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  const handleCreate = async () => {
    if (!id || !productId) {
      Alert.alert("Champs requis", "Sélectionne un produit.");
      return;
    }
    const parsedQuantity = Number(quantity.replace(",", "."));
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Quantité invalide", "Indique une quantité perdue supérieure à 0.");
      return;
    }

    setSaving(true);
    try {
      await api.createLoss({
        locationId: id,
        productId,
        quantity: parsedQuantity,
        reason,
      });
      setProductId("");
      setQuantity("");
      setReason("EXPIRED");
      load();
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer la perte");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (loss: Loss) => {
    Alert.alert("Retirer la perte", `Retirer cette perte de ${loss.product.name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteLoss(loss.id);
            load();
          } catch (err: any) {
            Alert.alert("Erreur", err.message ?? "Impossible de retirer la perte");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Erreur : {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace(`/location/${id}/daily`)}>
          <Text style={styles.back}>‹ Quotidien</Text>
        </Pressable>
        <Text style={styles.title}>Contrôle des pertes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nouvelle perte</Text>

          <Text style={styles.fieldLabel}>Produit</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={productId}
              onValueChange={setProductId}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Choisir un produit" value="" />
              {sortedProducts.map((p) => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Quantité perdue</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.fieldLabel}>Motif</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={reason}
              onValueChange={(v) => setReason(v as LossReason)}
              mode="dropdown"
              style={styles.picker}
            >
              {REASON_OPTIONS.map((r) => (
                <Picker.Item key={r} label={REASON_LABELS[r]} value={r} />
              ))}
            </Picker>
          </View>

          <Pressable style={styles.submitButton} onPress={handleCreate} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Enregistrer la perte</Text>
            )}
          </Pressable>
        </View>

        {losses.length === 0 ? (
          <Text style={styles.hint}>Aucune perte enregistrée pour ce lieu.</Text>
        ) : (
          losses.map((loss) => (
            <View key={loss.id} style={styles.lossRow}>
              <View style={styles.lossInfo}>
                <Text style={styles.lossName}>{loss.product.name}</Text>
                <Text style={styles.lossMeta}>
                  {loss.quantity} {loss.product.unit.toLowerCase()} · {REASON_LABELS[loss.reason]}{" "}
                  · {loss.lossDate.slice(0, 10)}
                </Text>
                <Text style={styles.lossMeta}>
                  Rapporté par {loss.reportedBy.firstName} {loss.reportedBy.lastName}
                </Text>
              </View>
              {canRemove ? (
                <Pressable onPress={() => handleDelete(loss)}>
                  <Text style={styles.removeText}>Retirer</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
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
  title: { fontSize: 16, fontWeight: "700", flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: "#f4f1ee",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 6,
  },
  formTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6, color: "#8a5a3b" },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#8a5a3b",
    marginTop: 8,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: Platform.select({
    ios: { height: 120 },
    default: { height: 44 },
  }) as object,
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
  },
  submitButton: {
    backgroundColor: "#8a5a3b",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  lossRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeec",
  },
  lossInfo: { flex: 1, paddingRight: 12 },
  lossName: { fontSize: 14, fontWeight: "600" },
  lossMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  removeText: { color: "#b33", fontWeight: "600", fontSize: 13 },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
  error: { color: "red" },
});
