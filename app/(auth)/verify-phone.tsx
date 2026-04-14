import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyPhoneScreen() {
  const { usuario_id, telefono } = useLocalSearchParams<{ usuario_id: string; telefono: string }>();
  const { setSession } = useAuth();

  const [code, setCode]           = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading]     = useState(false);
  const [resendSecs, setResendSecs] = useState(RESEND_SECONDS);
  const [resending, setResending]   = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  // Countdown para reenvio
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < CODE_LENGTH) {
      Alert.alert("Codigo incompleto", "Ingresa los 6 digitos.");
      return;
    }
    try {
      setLoading(true);
      const { token, usuario } = await authService.verifyPhone(usuario_id!, fullCode);
      await setSession(token, usuario);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Codigo invalido");
      setCode(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSecs > 0 || resending) return;
    try {
      setResending(true);
      await authService.resendOtp(usuario_id!);
      setResendSecs(RESEND_SECONDS);
      Alert.alert("Codigo reenviado", `Revisa los mensajes de ${telefono}`);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo reenviar");
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = telefono
    ? `${telefono.slice(0, 4)}****${telefono.slice(-3)}`
    : "tu numero";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>

          {/* Boton volver */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Caffiq.pineTeal} />
          </TouchableOpacity>

          {/* Icono */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={36} color={Caffiq.pineTeal} />
            </View>
          </View>

          {/* Titulos */}
          <Text style={styles.title}>Verifica tu numero</Text>
          <Text style={styles.subtitle}>
            Ingresa el codigo de 6 digitos enviado a{"\n"}
            <Text style={styles.phone}>{maskedPhone}</Text>
          </Text>

          {/* Cajas OTP */}
          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                returnKeyType="done"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Boton verificar */}
          <TouchableOpacity
            style={styles.verifyBtn}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Caffiq.white} />
            ) : (
              <Text style={styles.verifyText}>Verificar y continuar</Text>
            )}
          </TouchableOpacity>

          {/* Reenviar */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>No recibiste el codigo? </Text>
            {resendSecs > 0 ? (
              <Text style={styles.resendTimer}>
                Reenviar en {resendSecs}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? "Enviando..." : "Reenviar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Caffiq.white },
  container: {
    flex: 1,
    backgroundColor: Caffiq.white,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: "center",
  },

  backBtn: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 24,
  },

  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E8F5F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Caffiq.mutedTeal,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Caffiq.coffeBean,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Caffiq.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  phone: {
    fontWeight: "700",
    color: Caffiq.pineTeal,
  },

  // ── Cajas OTP ────────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 36,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Caffiq.inputBorder,
    backgroundColor: Caffiq.inputBg,
    fontSize: 22,
    fontWeight: "700",
    color: Caffiq.textDark,
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: Caffiq.pineTeal,
    backgroundColor: "#E8F5F2",
  },

  // ── Boton ────────────────────────────────────────────────────────────────────
  verifyBtn: {
    width: "100%",
    backgroundColor: Caffiq.pineTeal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: Caffiq.pineTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  verifyText: {
    color: Caffiq.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Reenviar ─────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendLabel: {
    fontSize: 14,
    color: Caffiq.textMuted,
  },
  resendTimer: {
    fontSize: 14,
    color: Caffiq.placeholder,
    fontWeight: "600",
  },
  resendLink: {
    fontSize: 14,
    color: Caffiq.pineTeal,
    fontWeight: "700",
  },
});
