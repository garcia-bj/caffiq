import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { authService } from "@/frontend/services/auth.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { fs } = useResponsive();

  const handleSolicitar = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("El correo electrónico es requerido"); return; }
    if (!EMAIL_RE.test(trimmed)) { setError("Ingresa un correo válido"); return; }
    setError("");

    try {
      setLoading(true);
      const { usuario_id } = await authService.solicitarResetPassword(trimmed);
      router.push({
        pathname: "/(auth)/reset-password",
        params: { usuario_id, email: trimmed },
      } as any);
    } catch (e: any) {
      const msg = e.message ?? "Error al solicitar el código";
      Alert.alert("Aviso", msg.includes("registrado") ? msg : "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Caffiq.pineTeal} />
            </TouchableOpacity>

            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed-outline" size={36} color={Caffiq.pineTeal} />
            </View>
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.sub}>
              Ingresa tu correo electrónico registrado y te enviaremos un código de verificación por WhatsApp.
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Caffiq.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={Caffiq.placeholder}
                value={email}
                onChangeText={(v) => { setEmail(v); if (error) setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSolicitar} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color={Caffiq.white} />
              ) : (
                <Text style={styles.btnText}>Enviar código</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Caffiq.white },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 20, alignItems: "center" },
  backBtn: { alignSelf: "flex-start", marginBottom: 20, padding: 4 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EDF7F4", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: Caffiq.coffeBean, marginBottom: 10 },
  sub: { fontSize: 14, color: Caffiq.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 28, paddingHorizontal: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", width: "100%", backgroundColor: Caffiq.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Caffiq.inputBorder, paddingHorizontal: 14, height: 52, marginBottom: 6 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Caffiq.textDark },
  errorText: { fontSize: 12, color: Caffiq.error, alignSelf: "flex-start", marginBottom: 8, paddingHorizontal: 4 },
  btn: { backgroundColor: Caffiq.pineTeal, borderRadius: 12, paddingVertical: 15, width: "100%", alignItems: "center", marginTop: 20 },
  btnText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },
});
