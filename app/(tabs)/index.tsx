import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";

export default function HomeScreen() {
  const { usuario } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.greeting}>
          Hola, {usuario?.nom_completo ?? "Caffiq"} ☕
        </Text>
        <Text style={styles.sub}>
          Bienvenido a Caffiq
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Caffiq.white },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: Caffiq.coffeBean,
    marginBottom: 8,
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: Caffiq.textMuted,
    textAlign: "center",
  },
});
