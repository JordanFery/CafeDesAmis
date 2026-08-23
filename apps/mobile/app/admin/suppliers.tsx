import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/client";
import type { CurrentUser, TeamMember } from "@/types/user";
import type { Supplier, SupplierAssignment } from "@/types/supplier";

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

export default function SupplierAssignmentsScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [assignments, setAssignments] = useState<SupplierAssignment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [userId, setUserId] = useState("");
  const [weekday, setWeekday] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.me(),
      api.getSupplierAssignments(),
      api.getSuppliers(),
      api.getTeamMembers(),
    ])
      .then(([me, list, sups, members]) => {
        setCurrentUser(me);
        setAssignments(list);
        setSuppliers(sups);
        setTeamLeaders(members.filter((m) => m.role === "TEAM_LEADER"));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = currentUser?.role === "ADMIN";

  const grouped = useMemo(() => {
    const bySupplier = new Map<string, SupplierAssignment[]>();
    for (const a of assignments) {
      const key = a.supplier.name;
      if (!bySupplier.has(key)) bySupplier.set(key, []);
      bySupplier.get(key)!.push(a);
    }
    return Array.from(bySupplier.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assignments]);

  const handleCreate = async () => {
    if (!supplierId || !userId) {
      Alert.alert("Champs requis", "Sélectionne un fournisseur et un chef d'équipe.");
      return;
    }
    setSaving(true);
    try {
      await api.createSupplierAssignment({
        supplierId,
        userId,
        inventoryWeekday: weekday === "" ? undefined : weekday,
      });
      setSupplierId("");
      setUserId("");
      setWeekday("");
      load();
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'enregistrer l'attribution");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (assignment: SupplierAssignment) => {
    Alert.alert(
      "Retirer l'attribution",
      `Retirer ${assignment.supplier.name} de ${assignment.user.firstName} ${assignment.user.lastName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteSupplierAssignment(assignment.id);
              load();
            } catch (err: any) {
              Alert.alert("Erreur", err.message ?? "Impossible de retirer l'attribution");
            }
          },
        },
      ]
    );
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
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.title}>Attribution des fournisseurs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {canEdit ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nouvelle attribution</Text>

            <Text style={styles.fieldLabel}>Fournisseur</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={supplierId}
                onValueChange={setSupplierId}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Choisir un fournisseur" value="" />
                {suppliers.map((s) => (
                  <Picker.Item key={s.id} label={s.name} value={s.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Chef d'équipe</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={userId}
                onValueChange={setUserId}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Choisir un chef d'équipe" value="" />
                {teamLeaders.map((m) => (
                  <Picker.Item
                    key={m.id}
                    label={`${m.firstName} ${m.lastName}`}
                    value={m.id}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Journée d'inventaire</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={weekday}
                onValueChange={(v) => setWeekday(v === "" ? "" : Number(v))}
                mode="dropdown"
                style={styles.picker}
              >
                <Picker.Item label="Non déterminée" value="" />
                {WEEKDAY_OPTIONS.map((d) => (
                  <Picker.Item key={d} label={WEEKDAY_LABELS[d]} value={d} />
                ))}
              </Picker>
            </View>

            <Pressable style={styles.submitButton} onPress={handleCreate} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Attribuer</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {grouped.length === 0 ? (
          <Text style={styles.hint}>Aucune attribution pour le moment.</Text>
        ) : (
          grouped.map(([supplierName, items]) => (
            <View key={supplierName} style={styles.supplierBlock}>
              <Text style={styles.supplierTitle}>{supplierName}</Text>
              {items.map((a) => (
                <View key={a.id} style={styles.assignmentRow}>
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentName}>
                      {a.user.firstName} {a.user.lastName}
                    </Text>
                    <Text style={styles.assignmentDay}>
                      {a.inventoryWeekday
                        ? WEEKDAY_LABELS[a.inventoryWeekday]
                        : "Journée non déterminée"}
                    </Text>
                  </View>
                  {canEdit ? (
                    <Pressable onPress={() => handleDelete(a)}>
                      <Text style={styles.removeText}>Retirer</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
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
  submitButton: {
    backgroundColor: "#8a5a3b",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  supplierBlock: { marginBottom: 20 },
  supplierTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#8a5a3b",
    marginBottom: 8,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeec",
  },
  assignmentInfo: {},
  assignmentName: { fontSize: 14, fontWeight: "600" },
  assignmentDay: { fontSize: 12, color: "#888", marginTop: 2 },
  removeText: { color: "#b33", fontWeight: "600", fontSize: 13 },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
  error: { color: "red" },
});
