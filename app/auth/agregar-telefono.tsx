import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";
import { SelectorPais, PAISES, type Pais } from "@/frontend/components/SelectorPais";

export default function AgregarTelefonoScreen() {
  const { token, usuario } = useAuth();
  const { rol } = useLocalSearchParams<{ rol?: string }>();

  const [pais,    setPais]    = useState<Pais>(PAISES[0]);
  const [numero,  setNumero]  = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const validar = () => {
    const n = numero.trim().replace(/\s|-/g, "");
    if (!n) { setError("Ingresa tu número de WhatsApp"); return null; }
    if (!/^\d{6,12}$/.test(n)) { setError("Solo dígitos, entre 6 y 12 números"); return null; }
    setError("");
    return `${pais.codigo}${n}`;
  };

  const handleContinuar = async () => {
    const telefonoCompleto = validar();
    if (!telefonoCompleto || !token || !usuario) return;

    setLoading(true);
    try {
      // 1. Guardar teléfono en el perfil
      await authService.updateMe(token, { num_telefono: telefonoCompleto });

      // 2. Enviar OTP por WhatsApp
      await authService.resendOtp(usuario.id);

      // 3. Ir a verificación
      router.replace({
        pathname: "/(auth)/verify-phone",
        params: {
          usuario_id: usuario.id,
          telefono:   telefonoCompleto,
          from_google: "1",
          rol:         rol ?? usuario.rol,
        },
      } as any);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>

          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={36} color={Caffiq.pineTeal} />
          </View>

          <Text style={styles.titulo}>Agrega tu WhatsApp</Text>
          <Text style={styles.subtitulo}>
            Necesitamos verificar tu número para proteger tu cuenta.
            Te enviaremos un código por WhatsApp.
          </Text>

          {/* Campo teléfono */}
          <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
            <SelectorPais pais={pais} onSelect={setPais} />
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Número de WhatsApp"
              placeholderTextColor={error ? `${Caffiq.error}80` : Caffiq.placeholder}
              value={numero}
              onChangeText={v => { setNumero(v.replace(/\D/g, "")); setError(""); }}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={13} color={Caffiq.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : numero ? (
            <Text style={styles.preview}>{pais.codigo} {numero}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleContinuar}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.btnText}>Enviar código</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" /></>
            }
          </TouchableOpacity>

          <Text style={styles.nota}>
            Podrás cambiarlo más tarde desde tu perfil.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Caffiq.white },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 48, alignItems: "center" },

  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#E8F5F2", borderWidth: 2, borderColor: "#B0D9D0",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  titulo:    { fontSize: 26, fontWeight: "800", color: Caffiq.coffeBean, marginBottom: 10, textAlign: "center" },
  subtitulo: { fontSize: 14, color: Caffiq.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 },

  inputWrap: {
    flexDirection: "row", alignItems: "center", width: "100%",
    backgroundColor: Caffiq.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: Caffiq.inputBorder, paddingHorizontal: 14, height: 52,
  },
  inputWrapError: { borderColor: Caffiq.error, backgroundColor: "#FFF5F5" },
  divider: { width: 1, height: 24, backgroundColor: Caffiq.inputBorder, marginRight: 10 },
  input:  { flex: 1, fontSize: 15, color: Caffiq.textDark },

  errorRow: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 6 },
  errorText:{ fontSize: 12, color: Caffiq.error, fontWeight: "500" },
  preview:  { fontSize: 12, color: Caffiq.placeholder, alignSelf: "flex-start", marginTop: 6 },

  btn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: Caffiq.pineTeal, borderRadius: 12,
    paddingVertical: 15, marginTop: 28,
    shadowColor: Caffiq.pineTeal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  nota:    { fontSize: 12, color: Caffiq.placeholder, marginTop: 16, textAlign: "center" },
});
