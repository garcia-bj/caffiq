import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";

// ─── Patron de fondo decorativo ──────────────────────────────────────────────
function BackgroundPattern() {
  const circles = [
    { top: -30,  left: -30,  size: 120, opacity: 0.04 },
    { top: 60,   right: -40, size: 160, opacity: 0.04 },
    { top: 200,  left: -50,  size: 100, opacity: 0.03 },
    { bottom: 200, right: -20, size: 140, opacity: 0.04 },
    { bottom: 80,  left: 20,  size: 90,  opacity: 0.03 },
    { bottom: -20, right: 80, size: 120, opacity: 0.04 },
  ] as const;

  return (
    <>
      {circles.map(({ size, opacity, ...pos }, i) => (
        <View
          key={i}
          style={[
            styles.patternCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity,
              ...(pos as object),
            },
          ]}
        />
      ))}
    </>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [nomUsuario, setNomUsuario] = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleLogin = async () => {
    if (!nomUsuario.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nomUsuario.trim())) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }
    try {
      setLoading(true);
      await login(nomUsuario.trim(), password);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al iniciar sesion";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // TODO: abrir flujo OAuth
    Alert.alert("Proximamente", "Login con Google en desarrollo.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <BackgroundPattern />

            {/* ── Logo ─────────────────────────────────────────────────── */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.logoImage}
                />
              </View>
              <Text style={styles.logoText}>CAFFIQ</Text>
            </View>

            {/* ── Formulario ───────────────────────────────────────────── */}
            <View style={styles.form}>

              {/* Correo */}
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Caffiq.placeholder}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={Caffiq.placeholder}
                  value={nomUsuario}
                  onChangeText={setNomUsuario}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Caffiq.placeholder}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Contraseña"
                  placeholderTextColor={Caffiq.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPass ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={Caffiq.placeholder}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot password */}
              <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Boton Sign in */}
              <TouchableOpacity
                style={styles.signInBtn}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Caffiq.white} />
                ) : (
                  <View style={styles.signInContent}>
                    <Text style={styles.signInText}>Iniciar sesión</Text>
                    <View style={styles.signInIcon}>
                      <Ionicons name="cafe" size={18} color={Caffiq.white} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Separador */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Boton Google */}
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.85}
                onPress={handleGoogle}
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>

            {/* ── Footer ───────────────────────────────────────────────── */}
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
  safe: { flex: 1, backgroundColor: Caffiq.white },
  scroll: { flexGrow: 1 },

  container: {
    flex: 1,
    backgroundColor: Caffiq.white,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    overflow: "hidden",
  },

  // ── Patron ───────────────────────────────────────────────────────────────────
  patternCircle: {
    position: "absolute",
    backgroundColor: Caffiq.pineTeal,
  },

  // ── Logo ─────────────────────────────────────────────────────────────────────
  logoWrapper: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Caffiq.pineTeal,
    backgroundColor: Caffiq.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: Caffiq.pineTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  logoText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: Caffiq.coffeBean,
    letterSpacing: 4,
  },

  // ── Formulario ───────────────────────────────────────────────────────────────
  form: { gap: 14 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Caffiq.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Caffiq.inputBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Caffiq.textDark,
  },
  eyeIcon: { padding: 4 },

  forgotWrapper: { alignSelf: "flex-end", marginTop: -4 },
  forgotText: {
    fontSize: 13,
    color: Caffiq.pineTeal,
    fontWeight: "600",
  },

  // ── Boton Sign in ────────────────────────────────────────────────────────────
  signInBtn: {
    backgroundColor: Caffiq.pineTeal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: Caffiq.pineTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  signInContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signInText: {
    color: Caffiq.white,
    fontSize: 16,
    fontWeight: "700",
  },
  signInIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 4,
  },

  // ── Divisor ──────────────────────────────────────────────────────────────────
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Caffiq.inputBorder,
  },
  dividerText: {
    fontSize: 13,
    color: Caffiq.placeholder,
    fontWeight: "500",
  },

  // ── Boton Google ─────────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Caffiq.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Caffiq.inputBorder,
    paddingVertical: 14,
  },
  googleG: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4285F4",
  },
  googleText: {
    fontSize: 15,
    fontWeight: "600",
    color: Caffiq.textDark,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: Caffiq.textMuted,
  },
  footerLink: {
    fontSize: 14,
    color: Caffiq.pineTeal,
    fontWeight: "700",
  },
});
