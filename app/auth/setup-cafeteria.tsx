import { useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

const PASOS = ["Información", "Identidad"] as const;

export default function SetupCafeteriaScreen() {
  const { token, setSession } = useAuth();
  const { hp } = useResponsive();

  const [paso,        setPaso]        = useState(0);
  const [nomCafeteria, setNomCafeteria] = useState("");
  const [ciudad,       setCiudad]       = useState("");
  const [descripcion,  setDescripcion]  = useState("");
  const [logoUri,      setLogoUri]      = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const validarPaso0 = () => {
    const e: Record<string, string> = {};
    if (!nomCafeteria.trim()) e.nom = "El nombre es requerido";
    if (!ciudad.trim())       e.ciudad = "La ciudad es requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const seleccionarLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as any, quality: 0.8 });
    if (!r.canceled) setLogoUri(r.assets[0].uri);
  };

  const handleSiguiente = () => {
    if (paso === 0 && !validarPaso0()) return;
    setPaso(1);
  };

  const handleFinalizar = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let logo_url: string | undefined;
      if (logoUri) logo_url = await subirImagenCloudinary(logoUri);

      const { token: newToken, usuario } = await authService.setupCafeteria(token, {
        nom_cafeteria: nomCafeteria.trim(),
        ciudad:        ciudad.trim(),
        descripcion:   descripcion.trim() || undefined,
      });

      // Si hay logo, actualizamos la cafetería
      if (logo_url && usuario.cafeteria_id) {
        await fetch(
          `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api/cafeterias/${usuario.cafeteria_id}`,
          {
            method:  "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${newToken}` },
            body:    JSON.stringify({ logo_url }),
          },
        );
      }

      await setSession(newToken, usuario);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo crear la cafetería");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="storefront-outline" size={28} color={Caffiq.pineTeal} />
            </View>
            <Text style={styles.heroTitulo}>Configura tu cafetería</Text>
            <Text style={styles.heroSub}>Completa estos datos para empezar a recibir pedidos</Text>
          </View>

          {/* Indicador de pasos */}
          <View style={styles.pasos}>
            {PASOS.map((label, i) => (
              <View key={i} style={styles.pasoItem}>
                <View style={[styles.pasoBurbuja, i <= paso && styles.pasoBurbujaActiva, i < paso && styles.pasoBurbujaCompleta]}>
                  {i < paso
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.pasoNum, i <= paso && { color: "#fff" }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.pasoLabel, i <= paso && styles.pasoLabelActiva]}>{label}</Text>
                {i < PASOS.length - 1 && <View style={[styles.pasoLinea, i < paso && styles.pasoLineaCompleta]} />}
              </View>
            ))}
          </View>

          {/* Paso 0: Información básica */}
          {paso === 0 && (
            <View style={styles.form}>
              <Text style={styles.seccion}>Información básica</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre de la cafetería *</Text>
                <View style={[styles.inputWrap, !!errors.nom && styles.inputError]}>
                  <Ionicons name="cafe-outline" size={18} color={errors.nom ? Caffiq.error : Caffiq.placeholder} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Caffiq Central"
                    placeholderTextColor={Caffiq.placeholder}
                    value={nomCafeteria}
                    onChangeText={v => { setNomCafeteria(v); if (errors.nom) setErrors(p => ({ ...p, nom: "" })); }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ciudad *</Text>
                <View style={[styles.inputWrap, !!errors.ciudad && styles.inputError]}>
                  <Ionicons name="location-outline" size={18} color={errors.ciudad ? Caffiq.error : Caffiq.placeholder} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Cochabamba"
                    placeholderTextColor={Caffiq.placeholder}
                    value={ciudad}
                    onChangeText={v => { setCiudad(v); if (errors.ciudad) setErrors(p => ({ ...p, ciudad: "" })); }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.ciudad ? <Text style={styles.errorText}>{errors.ciudad}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Descripción <Text style={styles.opcional}>(opcional)</Text></Text>
                <View style={[styles.inputWrap, { height: "auto", paddingVertical: 12, alignItems: "flex-start" }]}>
                  <Ionicons name="document-text-outline" size={18} color={Caffiq.placeholder} style={[styles.inputIcon, { marginTop: 2 }]} />
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                    placeholder="Cuéntales a tus clientes de qué trata tu cafetería..."
                    placeholderTextColor={Caffiq.placeholder}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.btn} onPress={handleSiguiente} activeOpacity={0.85}>
                <Text style={styles.btnText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Paso 1: Logo */}
          {paso === 1 && (
            <View style={styles.form}>
              <Text style={styles.seccion}>Logo de tu cafetería</Text>
              <Text style={styles.seccionSub}>
                Un buen logo ayuda a que tus clientes te identifiquen fácilmente. Puedes omitirlo y agregarlo después.
              </Text>

              {logoUri ? (
                <View style={[styles.logoPreview, { height: hp(25) }]}>
                  <Image source={{ uri: logoUri }} style={styles.logoImg} />
                  <TouchableOpacity style={styles.logoRemove} onPress={() => setLogoUri(null)}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.logoCambiar} onPress={seleccionarLogo}>
                    <Ionicons name="camera-outline" size={16} color="#fff" />
                    <Text style={styles.logoCambiarText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.logoEmpty} onPress={seleccionarLogo} activeOpacity={0.8}>
                  <View style={styles.logoEmptyIcon}>
                    <Ionicons name="image-outline" size={32} color={Caffiq.pineTeal} />
                  </View>
                  <Text style={styles.logoEmptyTitulo}>Subir logo</Text>
                  <Text style={styles.logoEmptySubtitulo}>PNG, JPG · Recomendado 1:1</Text>
                </TouchableOpacity>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnSecundario} onPress={() => setPaso(0)} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={16} color={Caffiq.pineTeal} />
                  <Text style={styles.btnSecundarioText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1 }, loading && { opacity: 0.7 }]}
                  onPress={handleFinalizar}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <><Text style={styles.btnText}>¡Listo, empezar!</Text>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" /></>
                  }
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleFinalizar} disabled={loading}>
                <Text style={styles.omitir}>Omitir por ahora →</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Caffiq.white },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },

  hero:       { alignItems: "center", paddingTop: 36, paddingBottom: 24 },
  heroBadge:  { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F5F2", borderWidth: 2, borderColor: "#B0D9D0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitulo: { fontSize: 26, fontWeight: "800", color: Caffiq.coffeBean, textAlign: "center", marginBottom: 8 },
  heroSub:    { fontSize: 14, color: Caffiq.textMuted, textAlign: "center", lineHeight: 20 },

  pasos: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 32, gap: 0 },
  pasoItem:    { flexDirection: "row", alignItems: "center" },
  pasoBurbuja: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f0f0", borderWidth: 2, borderColor: "#e0e0e0", alignItems: "center", justifyContent: "center" },
  pasoBurbujaActiva:  { backgroundColor: Caffiq.pineTeal, borderColor: Caffiq.pineTeal },
  pasoBurbujaCompleta:{ backgroundColor: "#4CAF84", borderColor: "#4CAF84" },
  pasoNum:   { fontSize: 13, fontWeight: "700", color: "#aaa" },
  pasoLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", marginHorizontal: 6 },
  pasoLabelActiva: { color: Caffiq.pineTeal },
  pasoLinea: { width: 28, height: 2, backgroundColor: "#e0e0e0" },
  pasoLineaCompleta: { backgroundColor: "#4CAF84" },

  form:       { gap: 16 },
  seccion:    { fontSize: 18, fontWeight: "700", color: Caffiq.coffeBean },
  seccionSub: { fontSize: 13, color: Caffiq.textMuted, lineHeight: 20, marginTop: -8 },

  fieldGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: "600", color: Caffiq.textDark },
  opcional:   { fontSize: 12, color: Caffiq.placeholder, fontWeight: "400" },
  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: Caffiq.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Caffiq.inputBorder, paddingHorizontal: 14, height: 52 },
  inputError: { borderColor: Caffiq.error, backgroundColor: "#FFF5F5" },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: Caffiq.textDark },
  errorText:  { fontSize: 12, color: Caffiq.error, fontWeight: "500" },

  logoPreview: { borderRadius: 14, overflow: "hidden", height: 200, position: "relative" },
  logoImg:     { width: "100%", height: "100%", resizeMode: "cover" },
  logoRemove:  { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  logoCambiar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 10 },
  logoCambiarText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  logoEmpty:       { borderRadius: 14, borderWidth: 1.5, borderColor: Caffiq.inputBorder, borderStyle: "dashed", backgroundColor: Caffiq.inputBg, height: 160, alignItems: "center", justifyContent: "center", gap: 8 },
  logoEmptyIcon:   { width: 60, height: 60, borderRadius: 14, backgroundColor: `${Caffiq.pineTeal}18`, alignItems: "center", justifyContent: "center" },
  logoEmptyTitulo: { fontSize: 15, fontWeight: "700", color: Caffiq.textDark },
  logoEmptySubtitulo: { fontSize: 12, color: Caffiq.placeholder },

  btnRow:        { flexDirection: "row", gap: 10, marginTop: 8 },
  btn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Caffiq.pineTeal, borderRadius: 12, paddingVertical: 15, shadowColor: Caffiq.pineTeal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  btnText:       { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnSecundario: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: Caffiq.inputBorder },
  btnSecundarioText: { fontSize: 14, fontWeight: "600", color: Caffiq.pineTeal },
  omitir:        { textAlign: "center", color: Caffiq.placeholder, fontSize: 13, marginTop: 12 },
});
