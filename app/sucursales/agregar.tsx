import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Caffiq } from "@/frontend/constants/theme";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService } from "@/frontend/services/sucursales.service";
import { seleccionarImagen } from "@/frontend/services/imagePicker.service";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary.service";

export default function AgregarSucursalScreen() {
  const { cafeteria_id } = useLocalSearchParams<{ cafeteria_id: string }>();
  const { token } = useAuth();

  const [nombre, setNombre]     = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad]     = useState("");
  const [apertura, setApertura] = useState("");
  const [cierre, setCierre]     = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      const uri = await seleccionarImagen();
      if (uri) setImagenUri(uri);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo seleccionar imagen");
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !direccion.trim() || !ciudad.trim()) {
      Alert.alert("Campos requeridos", "Nombre, dirección y ciudad son obligatorios.");
      return;
    }
    try {
      setLoading(true);
      let imagen_url: string | undefined;

      if (imagenUri) {
        setUploading(true);
        imagen_url = await subirImagenCloudinary(imagenUri);
        setUploading(false);
      }

      await sucursalesService.crear(token!, cafeteria_id!, {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        horario_apertura: apertura.trim() || undefined,
        horario_cierre:   cierre.trim()   || undefined,
        imagen_url,
      });

      Alert.alert("Éxito", "Sucursal creada correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo crear la sucursal");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Caffiq.pineTeal} />
            </TouchableOpacity>
            <Text style={styles.title}>Nueva Sucursal</Text>
          </View>

          {/* Imagen */}
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
            {imagenUri ? (
              <Image source={{ uri: imagenUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={36} color={Caffiq.placeholder} />
                <Text style={styles.imagePlaceholderText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Campos */}
          <View style={styles.form}>
            <Field label="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Ej: Sucursal Centro" />
            <Field label="Dirección *" value={direccion} onChangeText={setDireccion} placeholder="Ej: Av. Principal 123" />
            <Field label="Ciudad *" value={ciudad} onChangeText={setCiudad} placeholder="Ej: Monterrey" />
            <Field label="Horario apertura" value={apertura} onChangeText={setApertura} placeholder="HH:MM  ej: 08:00" />
            <Field label="Horario cierre" value={cierre} onChangeText={setCierre} placeholder="HH:MM  ej: 22:00" />
          </View>

          {/* Boton */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={Caffiq.white} />
            ) : (
              <Text style={styles.saveBtnText}>{uploading ? "Subiendo imagen..." : "Guardar sucursal"}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Caffiq.placeholder}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Caffiq.white },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: "800", color: Caffiq.coffeBean },

  imagePicker: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: Caffiq.inputBg,
    borderWidth: 1.5,
    borderColor: Caffiq.inputBorder,
    borderStyle: "dashed",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 14, color: Caffiq.placeholder },

  form: { gap: 16, marginBottom: 28 },
  fieldWrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: Caffiq.textMuted },
  input: {
    backgroundColor: Caffiq.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Caffiq.inputBorder,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: Caffiq.textDark,
  },

  saveBtn: {
    backgroundColor: Caffiq.pineTeal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: Caffiq.pineTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: { color: Caffiq.white, fontSize: 16, fontWeight: "700" },
});
