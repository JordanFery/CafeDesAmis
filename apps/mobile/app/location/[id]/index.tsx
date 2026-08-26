import { Redirect, useLocalSearchParams } from "expo-router";

// Le tap sur un lieu depuis l'accueil ouvre directement l'inventaire quotidien.
export default function LocationIndexRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/location/${id}/daily`} />;
}
