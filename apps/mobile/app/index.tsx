import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/api/client";
import type { CurrentUser } from "@/types/user";
import type { Location } from "@/types/location";

const LOCATION_LABELS: Record<Location["type"], string> = {
  CHALET: "Chalet",
  PAVILION: "Pavillon",
  KITCHEN: "Cuisine",
};

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
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

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
          <Pressable onPress={signOut}>
            <Text style={styles.logout}>Déconnexion</Text>
          </Pressable>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {LOCATION_LABELS[item.type] ?? item.name}
            </Text>
          </View>
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
  logout: { color: "#8a5a3b", fontWeight: "500" },
  list: { padding: 16 },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#f4f1ee",
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 32, color: "#888" },
  error: { color: "red" },
});
