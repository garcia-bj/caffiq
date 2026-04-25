import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
//imagenes
import { crearSucursalAPI } from "@/frontend/services/sucursalService";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary";

export default function AgregarSucursal() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<"activo" | "suspendido">("activo");
  const [imagen, setImagen] = useState<string | null>(null);
  const [modalConfirm, setModalConfirm] = useState(false);

  // ── Abrir galería ──────────────────────────────────────────
  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para seleccionar una imagen.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setImagen(resultado.assets[0].uri);
    }
  };

  // ── Quitar imagen ──────────────────────────────────────────
  const quitarImagen = () => setImagen(null);

  // ── Validar antes de mostrar modal ─────────────────────────
  const intentarRegistrar = () => {
    if (!nombre.trim()) {
      Alert.alert(
        "Campo requerido",
        "Por favor ingresa el nombre de la sucursal.",
      );
      return;
    }
    if (!direccion.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa la dirección.");
      return;
    }
    setModalConfirm(true);
  };

  // ── Confirmar y guardar ────────────────────────────────────
  const confirmarRegistro = async () => {
    try {
      setModalConfirm(false);

      let urlImagen = "";

      // Subir imagen
      if (imagen) {
        urlImagen = await subirImagenCloudinary(imagen);
      }

      // Guardar sucursal
      const { error } = await crearSucursalAPI({
        nombre,
        direccion,
        imagen: urlImagen,
        estado_sucursal: estado === "activo", // conversión correcta
      });

      if (error) {
        console.log("Error:", error);
        Alert.alert("Error", "No se pudo guardar la sucursal");
        return;
      }

      Alert.alert("Éxito", "Sucursal registrada correctamente 🔥");

      //  limpiar
      setNombre("");
      setDireccion("");
      setEstado("activo");
      setImagen(null);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setNavbarVisible(true)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}></Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.bgPattern} />

        <Text style={styles.pageTitle}>Registro de sucursal</Text>

        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de la sucursal</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Dirección */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Direccion</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Estado */}
        <View style={styles.estadoRow}>
          <Text style={styles.label}>Estado</Text>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setEstado("activo")}
          >
            <View
              style={[
                styles.radioCircle,
                estado === "activo" && styles.radioActivo,
              ]}
            />
            <Text style={styles.radioLabel}>Activo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setEstado("suspendido")}
          >
            <View
              style={[
                styles.radioCircle,
                estado === "suspendido" && styles.radioSuspendido,
              ]}
            />
            <Text style={styles.radioLabel}>Suspendido</Text>
          </TouchableOpacity>
        </View>

        {/* Imagen */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen de la sucursal</Text>

          {imagen ? (
            // ── Previsualización con botón quitar ──
            <View style={styles.previewContainer}>
              <Image source={{ uri: imagen }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={quitarImagen}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── Área de subida ──
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={seleccionarImagen}
            >
              <Text style={styles.uploadIcon}>⬆</Text>
              <Text style={styles.uploadText}>Coloque un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>
                Toca para abrir la galería
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón registrar */}
        <TouchableOpacity
          style={styles.btnRegistrar}
          onPress={intentarRegistrar}
        >
          <Text style={styles.btnText}>Registrar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de confirmación ── */}
      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Confirmar registro?</Text>
            <Text style={styles.modalDesc}>
              Se registrará la sucursal{" "}
              <Text style={styles.modalNombre}>"{nombre}"</Text> y será visible
              para todos los usuarios.
            </Text>

            {/* Mini resumen */}
            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>{direccion}</Text>
              <Text style={styles.resumenItem}>
                Estado: {estado === "activo" ? "Activo" : "Suspendido"}
              </Text>
              <Text style={styles.resumenItem}>
                Imagen: {imagen ? "Seleccionada ✓" : "Sin imagen"}
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalConfirm(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirmar}
                onPress={confirmarRegistro}
              >
                <Text style={styles.btnConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavbarLateral
        visible={navbarVisible}
        onClose={() => setNavbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f0eb" },
  header: {
    backgroundColor: "#0D5A52",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: {
    width: 24,
    height: 2.5,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 3,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  bgPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
    backgroundColor: "#6FA58B",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C1819",
    marginBottom: 24,
    fontStyle: "italic",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#2C1819", marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#6FA58B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
  },
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#0D5A52",
    backgroundColor: "transparent",
  },
  radioActivo: { backgroundColor: "#541A1A", borderColor: "#6FA58B" },
  radioSuspendido: { backgroundColor: "#541A1A", borderColor: "#6FA58B" },
  radioLabel: { fontSize: 14, color: "#2C1819" },

  // Upload
  uploadBox: {
    backgroundColor: "#6FA58B",
    borderRadius: 10,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadIcon: { fontSize: 32, color: "#fff" },
  uploadText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.75)" },

  // Preview imagen
  previewContainer: { position: "relative" },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Botón registrar
  btnRegistrar: {
    backgroundColor: "#541A1A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D5A52",
    textAlign: "center",
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalResumen: {
    backgroundColor: "#f0f7f4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  resumenItem: { fontSize: 13, color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 10 },
  btnCancelar: {
    flex: 1,
    backgroundColor: "#6FA58B",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelarText: { color: "#fff", fontWeight: "700" },
  btnConfirmar: {
    flex: 1,
    backgroundColor: "#0D5A52",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnConfirmarText: { color: "#fff", fontWeight: "700" },
});
