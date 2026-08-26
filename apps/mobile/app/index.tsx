import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/api/client";
import { LOCATION_LABELS } from "@/constants/locations";
import type { CurrentUser } from "@/types/user";
import type { Location } from "@/types/location";
import { colors } from "@/constants/theme";

export default function HomeScreen() {
  const { session, loading: authLoading, signOut } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    Promise.all([api.me(), api.getLocations()])
      .then(([me, locs]) => {
        setUser(me);
        setLocations(locs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Erreur : {error}</Text>
        <Pressable onPress={signOut} style={{ marginTop: 16 }}>
          <Text style={styles.logout}>Déconnexion</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {user ? (
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour {user.firstName} · {user.role}
          </Text>
          <View style={styles.headerActions}>
            {user.role === "ADMIN" || user.role === "MANAGEMENT" ? (
              <Pressable onPress={() => router.push("/admin/suppliers")}>
                <Text style={styles.logout}>Fournisseurs</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={signOut}>
              <Text style={styles.logout}>Déconnexion</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun lieu accessible pour le moment.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/location/${item.id}`)}
          >
            <Text style={styles.cardTitle}>
              {LOCATION_LABELS[item.type] ?? item.name}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  greeting: { fontSize: 16, fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  logout: { color: colors.secondary, fontWeight: "500" },
  list: { padding: 16 },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 32, color: colors.inkMuted },
  error: { color: "red" },
});
