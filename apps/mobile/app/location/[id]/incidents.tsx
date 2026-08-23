import { useCallback, useEffect, useState } from "react";
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
import type { Incident, IncidentReason, IncidentStatus } from "@/types/incident";
import type { Location } from "@/types/location";
import type { TeamMember } from "@/types/user";
import { todayDateOnly } from "@/lib/dates";
import { LOCATION_LABELS } from "@/constants/locations";

const STATUS_LABELS: Record<IncidentStatus, string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

const STATUS_OPTIONS: IncidentStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function LocationIncidentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [locations, setLocations] = useState<Location[]>([]);
  const [reasons, setReasons] = useState<IncidentReason[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [locationFilter, setLocationFilter] = useState(id ?? "");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");

  const [loadingIncidents, setLoadingIncidents] = useState(true);
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

  useEffect(() => {
    Promise.all([api.getLocations(), api.getIncidentReasons()])
      .then(([locs, rsns]) => {
        setLocations(locs);
        setReasons(rsns);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api
      .getTeamMembers(locationFilter || undefined)
      .then(setTeam)
      .catch((err) => setError(err.message));
  }, [locationFilter]);

  const loadIncidents = useCallback(() => {
    setLoadingIncidents(true);
    api
      .getIncidents({
        locationId: locationFilter || undefined,
        employeeId: employeeFilter || undefined,
        status: statusFilter || undefined,
      })
      .then(setIncidents)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingIncidents(false));
  }, [locationFilter, employeeFilter, statusFilter]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
    setEmployeeFilter("");
  };

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

  const openForm = (prefillEmployeeId?: string) => {
    resetForm();
    if (prefillEmployeeId) {
      setEmployeeIds([prefillEmployeeId]);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const targetLocationId = locationFilter || id;
    if (!targetLocationId) return;
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
        locationId: targetLocationId,
        incidentDate,
        reasonId,
        description: description.trim(),
        recurrence: recurrence.trim() || undefined,
        correctiveAction: correctiveAction.trim() || undefined,
        preventiveAction: preventiveAction.trim() || undefined,
        employeeIds,
      });
      setShowForm(false);
      loadIncidents();
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible d'envoyer le rapport");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployeeName = team.find((m) => m.id === employeeFilter);

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
          <Pressable onPress={() => openForm()}>
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
                <Text style={styles.hint}>Aucun employé disponible.</Text>
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
        <>
          <View style={styles.filterBar}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Lieu</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={locationFilter}
                  onValueChange={handleLocationFilterChange}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="Tous les lieux" value="" />
                  {locations.map((loc) => (
                    <Picker.Item
                      key={loc.id}
                      label={LOCATION_LABELS[loc.type] ?? loc.name}
                      value={loc.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Employé</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={employeeFilter}
                  onValueChange={setEmployeeFilter}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="Tous les employés" value="" />
                  {team.map((member) => (
                    <Picker.Item
                      key={member.id}
                      label={`${member.firstName} ${member.lastName}`}
                      value={member.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>État de traitement</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as IncidentStatus | "")}
                  mode="dropdown"
                  style={styles.picker}
                >
                  <Picker.Item label="Tous les états" value="" />
                  {STATUS_OPTIONS.map((s) => (
                    <Picker.Item key={s} label={STATUS_LABELS[s]} value={s} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {employeeFilter && filteredEmployeeName ? (
              <View style={styles.historyBar}>
                <Text style={styles.historyTitle}>
                  Historique — {filteredEmployeeName.firstName} {filteredEmployeeName.lastName}
                </Text>
                <Pressable
                  style={styles.historyNewButton}
                  onPress={() => openForm(employeeFilter)}
                >
                  <Text style={styles.historyNewButtonText}>+ Nouveau rapport</Text>
                </Pressable>
              </View>
            ) : null}

            {loadingIncidents ? (
              <ActivityIndicator size="large" style={{ marginTop: 24 }} />
            ) : incidents.length === 0 ? (
              <Text style={styles.hint}>Aucun rapport ne correspond à ce filtre.</Text>
            ) : (
              incidents.map((incident) => (
                <View key={incident.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{incident.incidentDate.slice(0, 10)}</Text>
                    <Text style={styles.statusBadge}>{STATUS_LABELS[incident.status]}</Text>
                  </View>
                  <Text style={styles.cardReason}>{incident.reason.name}</Text>
                  <Text style={styles.cardDescription}>{incident.description}</Text>

                  {incident.recurrence ? (
                    <View style={styles.cardSection}>
                      <Text style={styles.cardSectionLabel}>Problème récurrent</Text>
                      <Text style={styles.cardSectionText}>{incident.recurrence}</Text>
                    </View>
                  ) : null}

                  {incident.correctiveAction ? (
                    <View style={styles.cardSection}>
                      <Text style={styles.cardSectionLabel}>Actions correctrices prises</Text>
                      <Text style={styles.cardSectionText}>{incident.correctiveAction}</Text>
                    </View>
                  ) : null}

                  {incident.preventiveAction ? (
                    <View style={styles.cardSection}>
                      <Text style={styles.cardSectionLabel}>Actions préventives à prendre</Text>
                      <Text style={styles.cardSectionText}>{incident.preventiveAction}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.cardMeta}>
                    Rapporté par {incident.reportedBy.firstName} {incident.reportedBy.lastName}
                    {incident.employees.length > 0
                      ? ` · Concerne ${incident.employees
                          .map((e) => `${e.user.firstName} ${e.user.lastName}`)
                          .join(", ")}`
                      : ""}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </>
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
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeec",
    gap: 8,
  },
  filterField: { gap: 4 },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#8a5a3b",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f4f1ee",
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: Platform.select({
    ios: { height: 120 },
    default: { height: 44 },
  }) as object,
  historyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  historyTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  historyNewButton: {
    backgroundColor: "#8a5a3b",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyNewButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
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
  cardDescription: { fontSize: 13, color: "#333", marginBottom: 8 },
  cardSection: { marginBottom: 8 },
  cardSectionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#8a5a3b",
    marginBottom: 2,
  },
  cardSectionText: { fontSize: 13, color: "#333" },
  cardMeta: { fontSize: 11, color: "#888", marginTop: 4 },
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
