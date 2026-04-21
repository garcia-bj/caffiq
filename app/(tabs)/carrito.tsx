import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const D = { bg: "#091A17", primary: "#FFFFFF", secondary: "#8BA89A" };

export default function CarritoScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.center}>
        <Ionicons name="bag-outline" size={48} color={D.secondary} />
        <Text style={styles.title}>Carrito</Text>
        <Text style={styles.sub}>Próximamente</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title:  { fontSize: 22, fontWeight: "800", color: D.primary },
  sub:    { fontSize: 14, color: D.secondary },
});
