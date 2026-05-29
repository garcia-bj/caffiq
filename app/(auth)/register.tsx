import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Rol = "cliente" | "admin";
type Errors = Record<string, string>;

// ─── Regex ────────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Países con código ────────────────────────────────────────────────────────
interface Pais { bandera: string; nombre: string; codigo: string; }

const PAISES: Pais[] = [
  { bandera: "🇧🇴", nombre: "Bolivia",           codigo: "+591" },
  { bandera: "🇦🇷", nombre: "Argentina",          codigo: "+54"  },
  { bandera: "🇧🇷", nombre: "Brasil",             codigo: "+55"  },
  { bandera: "🇨🇱", nombre: "Chile",              codigo: "+56"  },
  { bandera: "🇨🇴", nombre: "Colombia",           codigo: "+57"  },
  { bandera: "🇪🇨", nombre: "Ecuador",            codigo: "+593" },
  { bandera: "🇲🇽", nombre: "México",             codigo: "+52"  },
  { bandera: "🇵🇪", nombre: "Perú",               codigo: "+51"  },
  { bandera: "🇵🇾", nombre: "Paraguay",           codigo: "+595" },
  { bandera: "🇺🇾", nombre: "Uruguay",            codigo: "+598" },
  { bandera: "🇻🇪", nombre: "Venezuela",          codigo: "+58"  },
  { bandera: "🇵🇦", nombre: "Panamá",             codigo: "+507" },
  { bandera: "🇨🇷", nombre: "Costa Rica",         codigo: "+506" },
  { bandera: "🇬🇹", nombre: "Guatemala",          codigo: "+502" },
  { bandera: "🇭🇳", nombre: "Honduras",           codigo: "+504" },
  { bandera: "🇸🇻", nombre: "El Salvador",        codigo: "+503" },
  { bandera: "🇳🇮", nombre: "Nicaragua",          codigo: "+505" },
  { bandera: "🇩🇴", nombre: "Rep. Dominicana",    codigo: "+1"   },
  { bandera: "🇨🇺", nombre: "Cuba",               codigo: "+53"  },
  { bandera: "🇪🇸", nombre: "España",             codigo: "+34"  },
  { bandera: "🇺🇸", nombre: "Estados Unidos",     codigo: "+1"   },
  { bandera: "🇬🇧", nombre: "Reino Unido",        codigo: "+44"  },
  { bandera: "🇩🇪", nombre: "Alemania",           codigo: "+49"  },
  { bandera: "🇫🇷", nombre: "Francia",            codigo: "+33"  },
  { bandera: "🇮🇹", nombre: "Italia",             codigo: "+39"  },
  { bandera: "🇵🇹", nombre: "Portugal",           codigo: "+351" },
];

// ─── Selector de país ─────────────────────────────────────────────────────────
function SelectorPais({ pais, onSelect }: { pais: Pais; onSelect: (p: Pais) => void }) {
  const [open, setOpen]     = useState(false);
  const [buscar, setBuscar] = useState("");

  const filtrados = useMemo(() =>
    buscar.trim()
      ? PAISES.filter(p =>
          p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
          p.codigo.includes(buscar))
      : PAISES,
  [buscar]);

  return (
    <>
      <TouchableOpacity style={styles.paisBtn} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Text style={styles.paisBandera}>{pais.bandera}</Text>
        <Text style={styles.paisCodigo}>{pais.codigo}</Text>
        <Ionicons name="chevron-down" size={13} color={Caffiq.placeholder} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.paisModalOverlay}>
          <View style={styles.paisModalBox}>
            <View style={styles.paisModalHeader}>
              <Text style={styles.paisModalTitulo}>Código de país</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setBuscar(""); }}>
                <Ionicons name="close" size={22} color={Caffiq.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.paisBuscador}>
              <Ionicons name="search-outline" size={16} color={Caffiq.placeholder} />
              <TextInput
                style={styles.paisBuscadorInput}
                placeholder="Buscar país..."
                placeholderTextColor={Caffiq.placeholder}
                value={buscar}
                onChangeText={setBuscar}
                autoFocus
              />
            </View>

            <FlatList
              data={filtrados}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.paisItem, item.codigo === pais.codigo && item.nombre === pais.nombre && styles.paisItemActivo]}
                  onPress={() => { onSelect(item); setOpen(false); setBuscar(""); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.paisItemBandera}>{item.bandera}</Text>
                  <Text style={styles.paisItemNombre}>{item.nombre}</Text>
                  <Text style={styles.paisItemCodigo}>{item.codigo}</Text>
                  {item.codigo === pais.codigo && item.nombre === pais.nombre && (
                    <Ionicons name="checkmark" size={16} color={Caffiq.pineTeal} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Fondo decorativo ─────────────────────────────────────────────────────────
function BackgroundPattern() {
  const circles = [
    { top: -20, right: -30, size: 130, opacity: 0.04 },
    { top: 100, left: -40, size: 110, opacity: 0.03 },
    { bottom: 150, right: -20, size: 100, opacity: 0.04 },
    { bottom: 40, left: 30, size: 80, opacity: 0.03 },
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

// ─── Campo con validación inline ─────────────────────────────────────────────
interface FieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  secure?: boolean;
  keyboardType?:
    | "default"
    | "phone-pad"
    | "email-address"
    | "numbers-and-punctuation";
  autoCapitalize?: "none" | "words" | "sentences";
  multiline?: boolean;
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline = false,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const hasError = !!error;
  return (
    <View style={styles.fieldWrapper}>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMulti,
          hasError && styles.inputWrapperError,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={hasError ? Caffiq.error : Caffiq.placeholder}
          style={[
            styles.inputIcon,
            multiline && { alignSelf: "flex-start", marginTop: 14 },
          ]}
        />
        <TextInput
          style={[styles.input, { flex: 1 }, multiline && styles.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor={
            hasError ? `${Caffiq.error}80` : Caffiq.placeholder
          }
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShow((v) => !v)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={show ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={Caffiq.placeholder}
            />
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

// ─── Separador de sección ─────────────────────────────────────────────────────
function SectionLabel({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={15} color={Caffiq.pineTeal} />
      <Text style={styles.sectionLabelText}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Selector de logo ─────────────────────────────────────────────────────────
function LogoPicker({
  uri,
  onPick,
}: {
  uri: string | null;
  onPick: (uri: string) => void;
}) {
  const handlePick = async () => {
    // Pedir permisos
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para subir el logo.",
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity
      style={styles.logoPicker}
      onPress={handlePick}
      activeOpacity={0.8}
    >
      {uri ? (
        <View style={styles.logoPreviewWrap}>
          <Image source={{ uri }} style={styles.logoPreviewImg} />
          <View style={styles.logoEditOverlay}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.logoEditText}>Cambiar</Text>
          </View>
        </View>
      ) : (
        <View style={styles.logoEmpty}>
          <View style={styles.logoEmptyIcon}>
            <Ionicons name="image-outline" size={28} color={Caffiq.pineTeal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoEmptyTitle}>Subir logo de cafetería</Text>
            <Text style={styles.logoEmptySubtitle}>
              PNG, JPG · Recomendado 1:1
            </Text>
          </View>
          <View style={styles.logoPickerBtn}>
            <Text style={styles.logoPickerBtnText}>Elegir</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { loginWithGoogle } = useAuth();
  const [rol, setRol] = useState<Rol>("cliente");

  const [nomCompleto, setNomCompleto] = useState("");
  const [nomUsuario, setNomUsuario] = useState("");
  const [pais, setPais]       = useState<Pais>(PAISES[0]); // Bolivia por defecto
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [nomCafeteria, setNomCafeteria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudadCafeteria, setCiudadCafeteria] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  // ── Validar campo individual ──────────────────────────────────────────────
  const validate = (field: string, val: string, extra?: string): string => {
    switch (field) {
      case "nomCompleto":
        if (!val.trim()) return "El nombre completo es requerido";
        if (val.trim().length < 2) return "Mínimo 2 caracteres";
        break;
      case "nomUsuario":
        if (!val.trim()) return "El correo es requerido";
        if (!EMAIL_RE.test(val.trim()))
          return "Ingresa un correo válido (ej. usuario@gmail.com)";
        break;
      case "telefono": {
        const t = val.trim().replace(/\s|-/g, "");
        if (!t) return "El número de WhatsApp es requerido";
        if (!/^\d{6,12}$/.test(t)) return "Solo dígitos, entre 6 y 12 números";
        break;
      }
      case "password":
        if (!val) return "La contraseña es requerida";
        if (val.length < 8) return "Mínimo 8 caracteres";
        if (!/[A-Z]/.test(val)) return "Debe incluir al menos una mayúscula";
        if (!/\d/.test(val)) return "Debe incluir al menos un número";
        break;
      case "confirmar":
        if (!val) return "Confirma tu contraseña";
        if (val !== extra) return "Las contraseñas no coinciden";
        break;
      case "nomCafeteria":
        if (!val.trim()) return "El nombre de la cafetería es requerido";
        break;
      case "ciudadCafeteria":
        if (!val.trim()) return "La ciudad es requerida";
        break;
    }
    return "";
  };

  const setFieldError = (field: string, val: string, extra?: string) => {
    const msg = validate(field, val, extra);
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  // ── Validar todo antes de submit ─────────────────────────────────────────
  const validarTodo = (): boolean => {
    const newErrors: Errors = {
      nomCompleto: validate("nomCompleto", nomCompleto),
      nomUsuario: validate("nomUsuario", nomUsuario),
      telefono: validate("telefono", telefono),
      password: validate("password", password),
      confirmar: validate("confirmar", confirmar, password),
    };
    if (rol === "admin") {
      newErrors.nomCafeteria = validate("nomCafeteria", nomCafeteria);
      newErrors.ciudadCafeteria = validate("ciudadCafeteria", ciudadCafeteria);
    }
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validarTodo()) return;
    try {
      setLoading(true);
      const payload: Parameters<typeof authService.register>[0] = {
        nom_completo: nomCompleto.trim(),
        nom_usuario: nomUsuario.trim(),
        num_telefono: `${pais.codigo}${telefono.trim().replace(/\s|-/g, "")}`,
        password,
        rol,
        ...(rol === "admin" && {
          cafeteria: {
            nom_cafeteria: nomCafeteria.trim(),
            ciudad: ciudadCafeteria.trim(),
            descripcion: descripcion.trim() || undefined,
            logo_uri: logoUri ?? undefined,
          },
        }),
      };
      const { usuario_id } = await authService.register(payload);
      router.replace({
        pathname: "/(auth)/verify-phone",
        params: { usuario_id, telefono: telefono.trim() },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al registrarse";
      const esConflicto = msg.toLowerCase().includes("ya está registrado");
      Alert.alert(
        esConflicto ? "Cuenta existente" : "Error al registrarse",
        esConflicto
          ? "Este correo o número de teléfono ya tiene una cuenta. Si aún no verificaste tu número, revisa tu WhatsApp."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle(rol);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al iniciar sesion con Google";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
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

            {/* ── Logo ──────────────────────────────────────────────── */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.logoImage}
                />
              </View>
              <Text style={styles.logoText}>CAFFIQ</Text>
            </View>

            {/* ── Selector de rol ───────────────────────────────────── */}
            <View style={styles.rolSelector}>
              {(["cliente", "admin"] as Rol[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolBtn, rol === r && styles.rolBtnActive]}
                  onPress={() => setRol(r)}
                >
                  <Ionicons
                    name={
                      r === "cliente" ? "person-outline" : "storefront-outline"
                    }
                    size={16}
                    color={rol === r ? Caffiq.white : Caffiq.pineTeal}
                  />
                  <Text
                    style={[
                      styles.rolBtnText,
                      rol === r && styles.rolBtnTextActive,
                    ]}
                  >
                    {r === "cliente" ? "Soy Cliente" : "Soy Administrador"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Formulario ────────────────────────────────────────── */}
            <View style={styles.form}>
              <SectionLabel icon="person-outline" label="Datos personales" />

              <Field
                icon="person-circle-outline"
                placeholder="Nombre completo *"
                value={nomCompleto}
                onChange={setNomCompleto}
                onBlur={() => setFieldError("nomCompleto", nomCompleto)}
                error={errors.nomCompleto}
                autoCapitalize="words"
              />
              <Field
                icon="mail-outline"
                placeholder="Correo electrónico *"
                value={nomUsuario}
                onChange={setNomUsuario}
                onBlur={() => setFieldError("nomUsuario", nomUsuario)}
                error={errors.nomUsuario}
                keyboardType="email-address"
              />
              {/* Teléfono con selector de país */}
              <View style={styles.fieldWrapper}>
                <View style={[styles.inputWrapper, !!errors.telefono && styles.inputWrapperError]}>
                  <SelectorPais pais={pais} onSelect={setPais} />
                  <View style={styles.paisDivider} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Número de WhatsApp *"
                    placeholderTextColor={errors.telefono ? `${Caffiq.error}80` : Caffiq.placeholder}
                    value={telefono}
                    onChangeText={v => { setTelefono(v.replace(/\D/g, "")); if (errors.telefono) setFieldError("telefono", v); }}
                    onBlur={() => setFieldError("telefono", telefono)}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
                {errors.telefono ? (
                  <View style={styles.errorTag}>
                    <Ionicons name="alert-circle" size={13} color={Caffiq.error} />
                    <Text style={styles.errorTagText}>{errors.telefono}</Text>
                  </View>
                ) : telefono ? (
                  <Text style={styles.telefonoPreview}>{pais.codigo} {telefono}</Text>
                ) : null}
              </View>
              <Field
                icon="lock-closed-outline"
                placeholder="Contraseña *"
                value={password}
                onChange={setPassword}
                onBlur={() => setFieldError("password", password)}
                error={errors.password}
                secure
              />
              <Field
                icon="shield-checkmark-outline"
                placeholder="Confirmar contraseña *"
                value={confirmar}
                onChange={setConfirmar}
                onBlur={() => setFieldError("confirmar", confirmar, password)}
                error={errors.confirmar}
                secure
              />

              {/* ── Cafetería (solo admin) ─────────────────────────── */}
              {rol === "admin" && (
                <>
                  <SectionLabel
                    icon="storefront-outline"
                    label="Datos de tu cafetería"
                  />

                  {/* Logo de cafetería */}
                  <View style={styles.logoPickerSection}>
                    <Text style={styles.logoPickerLabel}>
                      Logo de la cafetería
                    </Text>
                    <LogoPicker uri={logoUri} onPick={setLogoUri} />
                    <Text style={styles.logoPickerHint}>
                      Sube el logo para que tus clientes identifiquen tu
                      cafetería fácilmente
                    </Text>
                  </View>

                  <Field
                    icon="cafe-outline"
                    placeholder="Nombre de la cafetería *"
                    value={nomCafeteria}
                    onChange={setNomCafeteria}
                    onBlur={() => setFieldError("nomCafeteria", nomCafeteria)}
                    error={errors.nomCafeteria}
                    autoCapitalize="words"
                  />
                  <Field
                    icon="map-outline"
                    placeholder="Ciudad *"
                    value={ciudadCafeteria}
                    onChange={setCiudadCafeteria}
                    onBlur={() =>
                      setFieldError("ciudadCafeteria", ciudadCafeteria)
                    }
                    error={errors.ciudadCafeteria}
                    autoCapitalize="words"
                  />
                </>
              )}

              {/* ── Botón registrar ───────────────────────────────────── */}
              <TouchableOpacity
                style={styles.registerBtn}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Caffiq.white} />
                ) : (
                  <View style={styles.registerContent}>
                    <Text style={styles.registerText}>Crear cuenta</Text>
                    <View style={styles.registerIcon}>
                      <Ionicons name="cafe" size={18} color={Caffiq.white} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.85}
                onPress={handleGoogle}
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>

            {/* ── Footer ────────────────────────────────────────────── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.footerLink}>Iniciar sesión →</Text>
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
    paddingTop: 28,
    paddingBottom: 24,
    overflow: "hidden",
  },
  patternCircle: { position: "absolute", backgroundColor: Caffiq.pineTeal },

  // Logo app
  logoWrapper: { alignItems: "center", marginBottom: 24 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  logoImage: { width: 60, height: 60, borderRadius: 30 },
  logoText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: Caffiq.coffeBean,
    letterSpacing: 4,
  },

  // Rol
  rolSelector: {
    flexDirection: "row",
    backgroundColor: Caffiq.inputBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  rolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rolBtnActive: { backgroundColor: Caffiq.pineTeal },
  rolBtnText: { fontSize: 13, fontWeight: "600", color: Caffiq.pineTeal },
  rolBtnTextActive: { color: Caffiq.white },

  // Section
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: -2,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: Caffiq.pineTeal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: Caffiq.inputBorder },

  // Form
  form: { gap: 10 },
  fieldWrapper: { gap: 4 },
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
  inputWrapperMulti: {
    height: "auto",
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  inputWrapperError: { borderColor: Caffiq.error, backgroundColor: "#FFF5F5" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Caffiq.textDark },
  inputMulti: { minHeight: 64, textAlignVertical: "top" },
  eyeIcon: { padding: 4 },

  // Selector de país
  paisBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  paisBandera: { fontSize: 20 },
  paisCodigo: { fontSize: 13, fontWeight: "700", color: Caffiq.textDark },
  paisDivider: { width: 1, height: 24, backgroundColor: Caffiq.inputBorder, marginRight: 10 },
  telefonoPreview: { fontSize: 11, color: Caffiq.placeholder, paddingHorizontal: 4, marginTop: 2 },

  paisModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  paisModalBox: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 24 },
  paisModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: Caffiq.inputBorder },
  paisModalTitulo: { fontSize: 17, fontWeight: "700", color: Caffiq.textDark },
  paisBuscador: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, backgroundColor: Caffiq.inputBg, borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: Caffiq.inputBorder },
  paisBuscadorInput: { flex: 1, fontSize: 15, color: Caffiq.textDark },
  paisItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  paisItemActivo: { backgroundColor: `${Caffiq.pineTeal}0D` },
  paisItemBandera: { fontSize: 22 },
  paisItemNombre: { flex: 1, fontSize: 14, color: Caffiq.textDark, fontWeight: "500" },
  paisItemCodigo: { fontSize: 13, color: Caffiq.placeholder, fontWeight: "600" },

  // Error tag
  errorTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  errorTagText: { fontSize: 12, color: Caffiq.error, fontWeight: "500" },

  // ── Logo picker ────────────────────────────────────────────────────────
  logoPickerSection: { gap: 6 },
  logoPickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Caffiq.pineTeal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  logoPickerHint: { fontSize: 11, color: Caffiq.placeholder, lineHeight: 16 },

  logoPicker: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Caffiq.inputBorder,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: Caffiq.inputBg,
  },

  // Empty state
  logoEmpty: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  logoEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: `${Caffiq.pineTeal}18`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${Caffiq.pineTeal}30`,
  },
  logoEmptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Caffiq.textDark,
    marginBottom: 2,
  },
  logoEmptySubtitle: { fontSize: 12, color: Caffiq.placeholder },
  logoPickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Caffiq.pineTeal,
  },
  logoPickerBtnText: { fontSize: 13, fontWeight: "700", color: Caffiq.white },

  // Preview state
  logoPreviewWrap: { position: "relative", height: 140 },
  logoPreviewImg: { width: "100%", height: "100%", resizeMode: "cover" },
  logoEditOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  logoEditText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Botón
  registerBtn: {
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
  registerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  registerText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },
  registerIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 4,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Caffiq.inputBorder },
  dividerText: { fontSize: 13, color: Caffiq.placeholder, fontWeight: "500" },

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
  googleG: { fontSize: 17, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "600", color: Caffiq.textDark },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { fontSize: 14, color: Caffiq.textMuted },
  footerLink: { fontSize: 14, color: Caffiq.pineTeal, fontWeight: "700" },
});
