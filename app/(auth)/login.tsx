import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from "@/frontend/context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { nomUsuario?: string; password?: string };

function BackgroundPattern() {
  const circles = [
    { top: -30,   left: -30,  size: 120, opacity: 0.04 },
    { top: 60,    right: -40, size: 160, opacity: 0.04 },
    { top: 200,   left: -50,  size: 100, opacity: 0.03 },
    { bottom: 200, right: -20, size: 140, opacity: 0.04 },
    { bottom: 80,  left: 20,  size: 90,  opacity: 0.03 },
    { bottom: -20, right: 80, size: 120, opacity: 0.04 },
  ] as const;
  return (
    <>
      {circles.map(({ size, opacity, ...pos }, i) => (
        <View key={i} style={[styles.patternCircle, { width: size, height: size, borderRadius: size / 2, opacity, ...(pos as object) }]} />
      ))}
    </>
  );
}

function Field({
  icon, placeholder, value, onChange, onBlur, error,
  secure = false, keyboardType = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  const [show, setShow] = useState(false);
  const hasError = !!error;
  return (
    <View style={styles.fieldWrapper}>
      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
        <Ionicons name={icon} size={20} color={hasError ? Caffiq.error : Caffiq.placeholder} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={hasError ? `${Caffiq.error}80` : Caffiq.placeholder}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow(v => !v)} style={styles.eyeIcon}>
            <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={20} color={Caffiq.placeholder} />
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <View style={styles.errorTag}>
          <Ionicons name="alert-circle" size={13} color={Caffiq.error} />
          <Text style={styles.errorTagText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [nomUsuario, setNomUsuario] = useState("");
  const [password,   setPassword]   = useState("");
  const [errors,     setErrors]     = useState<Errors>({});
  const [loading,    setLoading]    = useState(false);

  const validateField = (field: keyof Errors, val: string): string => {
    if (field === "nomUsuario") {
      if (!val.trim()) return "El correo electrónico es requerido";
      if (!EMAIL_RE.test(val.trim())) return "Ingresa un correo válido (ej. usuario@gmail.com)";
    }
    if (field === "password") {
      if (!val) return "La contraseña es requerida";
      if (val.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    }
    return "";
  };

  const setFieldError = (field: keyof Errors, val: string) =>
    setErrors(prev => ({ ...prev, [field]: validateField(field, val) }));

  const validarTodo = (): boolean => {
    const newErrors: Errors = {
      nomUsuario: validateField("nomUsuario", nomUsuario),
      password:   validateField("password",   password),
    };
    setErrors(newErrors);
    return !newErrors.nomUsuario && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validarTodo()) return;
    try {
      setLoading(true);
      await login(nomUsuario.trim(), password);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al iniciar sesión";
      const esCredenciales = msg.toLowerCase().includes("incorrecto") || msg.toLowerCase().includes("invalid");
      if (esCredenciales) {
        setErrors({ nomUsuario: " ", password: "Correo o contraseña incorrectos" });
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle("cliente");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <BackgroundPattern />

            {/* Logo */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Image source={require("../../assets/images/icon.png")} style={styles.logoImage} />
              </View>
              <Text style={styles.logoText}>CAFFIQ</Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              <Field
                icon="mail-outline"
                placeholder="Correo electrónico"
                value={nomUsuario}
                onChange={v => { setNomUsuario(v); if (errors.nomUsuario) setFieldError("nomUsuario", v); }}
                onBlur={() => setFieldError("nomUsuario", nomUsuario)}
                error={errors.nomUsuario}
                keyboardType="email-address"
              />
              <Field
                icon="lock-closed-outline"
                placeholder="Contraseña"
                value={password}
                onChange={v => { setPassword(v); if (errors.password) setFieldError("password", v); }}
                onBlur={() => setFieldError("password", password)}
                error={errors.password}
                secure
              />

              <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.signInBtn, loading && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleLogin} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={Caffiq.white} />
                  : <View style={styles.signInContent}>
                      <Text style={styles.signInText}>Iniciar sesión</Text>
                      <View style={styles.signInIcon}><Ionicons name="cafe" size={18} color={Caffiq.white} /></View>
                    </View>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85} onPress={handleGoogle} disabled={loading}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.footerLink}>Regístrate →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Caffiq.white },
  scroll: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: Caffiq.white, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24, overflow: "hidden" },
  patternCircle: { position: "absolute", backgroundColor: Caffiq.pineTeal },

  logoWrapper: { alignItems: "center", marginBottom: 36 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Caffiq.pineTeal, backgroundColor: Caffiq.white, alignItems: "center", justifyContent: "center", overflow: "hidden", shadowColor: Caffiq.pineTeal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoImage: { width: 68, height: 68, borderRadius: 34 },
  logoText: { marginTop: 10, fontSize: 20, fontWeight: "800", color: Caffiq.coffeBean, letterSpacing: 4 },

  form: { gap: 12 },
  fieldWrapper: { gap: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: Caffiq.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Caffiq.inputBorder, paddingHorizontal: 14, height: 52 },
  inputWrapperError: { borderColor: Caffiq.error, backgroundColor: "#FFF5F5" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Caffiq.textDark },
  eyeIcon: { padding: 4 },
  errorTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 4 },
  errorTagText: { fontSize: 12, color: Caffiq.error, fontWeight: "500" },

  forgotWrapper: { alignSelf: "flex-end", marginTop: -4 },
  forgotText: { fontSize: 13, color: Caffiq.pineTeal, fontWeight: "600" },

  signInBtn: { backgroundColor: Caffiq.pineTeal, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, shadowColor: Caffiq.pineTeal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  signInContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  signInText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },
  signInIcon: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, padding: 4 },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Caffiq.inputBorder },
  dividerText: { fontSize: 13, color: Caffiq.placeholder, fontWeight: "500" },

  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Caffiq.white, borderRadius: 12, borderWidth: 1.5, borderColor: Caffiq.inputBorder, paddingVertical: 14 },
  googleG: { fontSize: 17, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "600", color: Caffiq.textDark },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerText: { fontSize: 14, color: Caffiq.textMuted },
  footerLink: { fontSize: 14, color: Caffiq.pineTeal, fontWeight: "700" },
});
