import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService } from "@/frontend/services/sucursales.service";

export default function EliminarSucursalScreen() {
  const { cafeteria_id, sucursal_id, nombre } = useLocalSearchParams<{
    cafeteria_id: string; sucursal_id: string; nombre?: string;
  }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSuspender = async () => {
    try {
      setLoading(true);
      await sucursalesService.suspender(token!, cafeteria_id!, sucursal_id!);
      Alert.alert("Sucursal suspendida", `"${nombre}" ya no aparecerá activa.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo suspender");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Caffiq.pineTeal} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="warning-outline" size={48} color="#D32F2F" />
        </View>

        <Text style={styles.title}>Suspender Sucursal</Text>
        <Text style={styles.subtitle}>
          ¿Estás seguro de suspender{"\n"}
          <Text style={styles.nombre}>"{nombre}"</Text>?{"\n\n"}
          La sucursal dejará de ser visible para los clientes. Puedes reactivarla desde la base de datos.
        </Text>

        <TouchableOpacity
          style={styles.suspenderBtn}
          onPress={handleSuspender}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Caffiq.white} />
          ) : (
            <Text style={styles.suspenderText}>Sí, suspender</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Caffiq.white },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: "center",
  },
  backBtn: { alignSelf: "flex-start", padding: 8, marginBottom: 32 },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Caffiq.coffeBean,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Caffiq.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
  },
  nombre: {
    fontWeight: "700",
    color: Caffiq.coffeBean,
  },

  suspenderBtn: {
    width: "100%",
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  suspenderText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },

  cancelBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Caffiq.inputBorder,
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: Caffiq.textMuted },
});
