import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
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

const CODE_LENGTH = 6;

export default function ResetPasswordScreen() {
  const { usuario_id, email } = useLocalSearchParams<{ usuario_id: string; email: string }>();
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleCodigoChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCodigo(digits);
    setError("");
  };

  const handleReset = async () => {
    if (codigo.length !== CODE_LENGTH) { setError("Ingresa el código de 6 dígitos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setError("");

    try {
      setLoading(true);
      await authService.resetearPassword(usuario_id!, codigo, password);
      Alert.alert("Listo", "Contraseña actualizada. Ya puedes iniciar sesión.", [
        { text: "Ir al login", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      setError(e.message ?? "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    try {
      setEnviandoCodigo(true);
      await authService.solicitarResetPassword(email!);
      Alert.alert("Código reenviado", "Revisa tu WhatsApp.");
    } catch {
      Alert.alert("Aviso", "Debes esperar 1 minuto para solicitar otro código.");
    } finally {
      setEnviandoCodigo(false);
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
              <Ionicons name="shield-checkmark-outline" size={36} color={Caffiq.pineTeal} />
            </View>
            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.sub}>
              Ingresa el código de 6 dígitos enviado a tu WhatsApp y tu nueva contraseña.
            </Text>

            {/* Código OTP */}
            <Text style={styles.label}>Código de verificación</Text>
            <TouchableOpacity style={styles.codeInputWrap} onPress={() => inputRef.current?.focus()} activeOpacity={0.8}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const digit = codigo[i] ?? "";
                return (
                  <View key={i} style={[styles.codeBox, digit !== "" && styles.codeBoxFilled, codigo.length === CODE_LENGTH && styles.codeBoxDone]}>
                    <Text style={[styles.codeDigit, digit !== "" && styles.codeDigitFilled]}>{digit || " "}</Text>
                  </View>
                );
              })}
              <TextInput ref={inputRef} style={styles.hiddenInput} value={codigo} onChangeText={handleCodigoChange} keyboardType="number-pad" maxLength={CODE_LENGTH} autoFocus />
            </TouchableOpacity>

            {/* Nueva contraseña */}
            <View style={[styles.inputWrapper, { marginTop: 20 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Caffiq.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                placeholderTextColor={Caffiq.placeholder}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeIcon}>
                <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color={Caffiq.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Caffiq.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={Caffiq.placeholder}
                value={confirm}
                onChangeText={(v) => { setConfirm(v); setError(""); }}
                secureTextEntry={!showCp}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCp((v) => !v)} style={styles.eyeIcon}>
                <Ionicons name={showCp ? "eye-outline" : "eye-off-outline"} size={20} color={Caffiq.placeholder} />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color={Caffiq.white} />
              ) : (
                <Text style={styles.btnText}>Guardar contraseña</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.reenviarBtn} onPress={handleReenviar} disabled={enviandoCodigo}>
              {enviandoCodigo ? (
                <ActivityIndicator size="small" color={Caffiq.pineTeal} />
              ) : (
                <Text style={styles.reenviarText}>Reenviar código</Text>
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
  sub: { fontSize: 14, color: Caffiq.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  label: { fontSize: 13, fontWeight: "600", color: Caffiq.textDark, alignSelf: "flex-start", marginBottom: 8 },

  codeInputWrap: { flexDirection: "row", gap: 10, width: "100%", justifyContent: "center" },
  codeBox: { width: 44, height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: Caffiq.inputBorder, alignItems: "center", justifyContent: "center", backgroundColor: Caffiq.inputBg },
  codeBoxFilled: { borderColor: Caffiq.pineTeal },
  codeBoxDone: { backgroundColor: "#EDF7F4", borderColor: Caffiq.pineTeal },
  codeDigit: { fontSize: 20, color: Caffiq.placeholder },
  codeDigitFilled: { color: Caffiq.coffeBean, fontWeight: "700" },
  hiddenInput: { position: "absolute", opacity: 0, height: 0, width: 0 },

  inputWrapper: { flexDirection: "row", alignItems: "center", width: "100%", backgroundColor: Caffiq.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Caffiq.inputBorder, paddingHorizontal: 14, height: 52, marginBottom: 10 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Caffiq.textDark },
  eyeIcon: { padding: 4 },
  errorText: { fontSize: 12, color: Caffiq.error, alignSelf: "flex-start", marginBottom: 8, paddingHorizontal: 4 },

  btn: { backgroundColor: Caffiq.pineTeal, borderRadius: 12, paddingVertical: 15, width: "100%", alignItems: "center", marginTop: 16 },
  btnText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },
  reenviarBtn: { marginTop: 16, paddingVertical: 8 },
  reenviarText: { fontSize: 14, color: Caffiq.pineTeal, fontWeight: "600" },
});
