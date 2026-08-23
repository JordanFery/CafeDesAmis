import { useCallback, useEffect, useState } from "react";
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
import type { Incident, IncidentReason } from "@/types/incident";
import type { TeamMember } from "@/types/user";
import { todayDateOnly } from "@/lib/dates";

const STATUS_LABELS: Record<Incident["status"], string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export default function LocationIncidentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reasons, setReasons] = useState<IncidentReason[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [incidentDate, setIncidentDate] = useState(todayDateOnly());
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState("");
  const [description, setDescription] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getIncidents(id), api.getIncidentReasons(), api.getLocationUsers(id)])
      .then(([incs, rsns, members]) => {
        setIncidents(incs);
        setReasons(rsns);
        setTeam(members);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEmployee = (userId: string) => {
    setEmployeeIds((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setIncidentDate(todayDateOnly());
    setReasonId(null);
    setEmployeeIds([]);
    setRecurrence("");
    setDescription("");
    setCorrectiveAction("");
    setPreventiveAction("");
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!reasonId) {
      Alert.alert("Genre d'incident requis", "Sélectionne un genre d'incident.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Description requise", "Décris l'incident avant d'envoyer.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createIncident({
        locationId: id,
        incidentDate,
        reasonId,
        description: description.trim(),
        recurrence: recurrence.trim() || undefined,
        correctiveAction: correctiveAction.trim() || undefined,
        preventiveAction: preventiveAction.trim() || undefined,
        employeeIds,
      });
      resetForm();
      setShowForm(false);
      load();
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'envoyer le rapport");
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
        <Pressable onPress={() => (showForm ? setShowForm(false) : router.back())}>
          <Text style={styles.back}>‹ {showForm ? "Annuler" : "Retour"}</Text>
        </Pressable>
        <Text style={styles.title}>Rapports d'incident</Text>
        {!showForm ? (
          <Pressable onPress={() => setShowForm(true)}>
            <Text style={styles.back}>+ Nouveau</Text>
          </Pressable>
        ) : null}
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.form}>
          <Field label="Date de l'incident">
            <TextInput
              style={styles.input}
              value={incidentDate}
              onChangeText={setIncidentDate}
              placeholder="AAAA-MM-JJ"
            />
          </Field>

          <Field label="Nom d'employé (concerné)">
            <View style={styles.chipRow}>
              {team.map((member) => (
                <Pressable
                  key={member.id}
                  style={[
                    styles.chip,
                    employeeIds.includes(member.id) && styles.chipSelected,
                  ]}
                  onPress={() => toggleEmployee(member.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      employeeIds.includes(member.id) && styles.chipTextSelected,
                    ]}
                  >
                    {member.firstName} {member.lastName}
                  </Text>
                </Pressable>
              ))}
              {team.length === 0 ? (
                <Text style={styles.hint}>Aucun employé assigné à ce lieu.</Text>
              ) : null}
            </View>
          </Field>

          <Field label="Genre d'incident">
            <View style={styles.chipRow}>
              {reasons.map((reason) => (
                <Pressable
                  key={reason.id}
                  style={[styles.chip, reasonId === reason.id && styles.chipSelected]}
                  onPress={() => setReasonId(reason.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      reasonId === reason.id && styles.chipTextSelected,
                    ]}
                  >
                    {reason.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Problème récurrent ?">
            <TextInput
              style={styles.input}
              value={recurrence}
              onChangeText={setRecurrence}
              placeholder="Ex. : 3e fois ce mois-ci"
            />
          </Field>

          <Field label="Description de l'incident">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </Field>

          <Field label="Actions correctrices prises">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={correctiveAction}
              onChangeText={setCorrectiveAction}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Actions préventives à prendre">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={preventiveAction}
              onChangeText={setPreventiveAction}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Envoyer le rapport</Text>
            )}
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {incidents.length === 0 ? (
            <Text style={styles.hint}>Aucun rapport d'incident pour ce lieu.</Text>
          ) : null}
          {incidents.map((incident) => (
            <View key={incident.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{incident.incidentDate.slice(0, 10)}</Text>
                <Text style={styles.statusBadge}>{STATUS_LABELS[incident.status]}</Text>
              </View>
              <Text style={styles.cardReason}>{incident.reason.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={3}>
                {incident.description}
              </Text>
              <Text style={styles.cardMeta}>
                Rapporté par {incident.reportedBy.firstName} {incident.reportedBy.lastName}
                {incident.employees.length > 0
                  ? ` · Concerne ${incident.employees
                      .map((e) => `${e.user.firstName} ${e.user.lastName}`)
                      .join(", ")}`
                  : ""}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  back: { color: "#8a5a3b", fontWeight: "600", fontSize: 15 },
  title: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  list: { padding: 16, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f4f1ee",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardDate: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#888",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8a5a3b",
    backgroundColor: "#efe0d2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardReason: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cardDescription: { fontSize: 13, color: "#333", marginBottom: 6 },
  cardMeta: { fontSize: 11, color: "#888" },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
  form: { padding: 16, paddingBottom: 60, gap: 4 },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#8a5a3b",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#8a5a3b", borderColor: "#8a5a3b" },
  chipText: { fontSize: 13, color: "#333" },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#8a5a3b",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  error: { color: "red" },
});
