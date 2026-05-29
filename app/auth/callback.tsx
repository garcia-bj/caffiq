import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/frontend/lib/supabase";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";

export default function AuthCallback() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { code, access_token, rol } = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    rol?: string;
  }>();

  useEffect(() => {
    if (code)              handleCode(code);
    else if (access_token) handleToken(access_token);
  }, [code, access_token]);

  async function handleCode(pkceCode: string) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(pkceCode);
      if (error || !data.session) throw new Error("Error al obtener sesion de Supabase");
      await handleToken(data.session.access_token);
    } catch (e) {
      console.error("[AuthCallback] handleCode:", e);
      router.replace("/(auth)/login");
    }
  }

  async function handleToken(supabaseToken: string) {
    try {
      const rolFinal = rol === "admin" ? "admin" : "cliente";
      const result = await authService.exchangeGoogleToken(supabaseToken, rolFinal);
      await setSession(result.token, result.usuario);

      const u = result.usuario;

      // 1. Necesita agregar número de teléfono
      if (result.necesita_telefono) {
        router.replace({
          pathname: "/auth/agregar-telefono",
          params:   { rol: u.rol },
        } as any);
        return;
      }

      // 2. Admin sin cafetería configurada
      if (u.rol === "admin" && !u.cafeteria_id) {
        router.replace("/auth/setup-cafeteria" as any);
        return;
      }

      router.replace("/(tabs)");
    } catch (e) {
      console.error("[AuthCallback] handleToken:", e);
      router.replace("/(auth)/login");
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF84" />
      <Text style={styles.text}>Iniciando sesión con Google...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#091A17" },
  text:      { marginTop: 16, color: "#fff", fontSize: 15 },
});
