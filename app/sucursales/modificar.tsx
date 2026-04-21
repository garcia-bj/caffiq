import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ScrollView, Image, Alert, Modal, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { listarSucursalesAPI, modificarSucursalAPI } from "@/frontend/services/sucursalService";
type Sucursal = {
  id_sucursal: string;
  nombre: string;
  direccion: string;
  imagen: string;
  estado_sucursal: boolean;
};

export default function ModificarSucursal() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]); 
  const [cargandoLista, setCargandoLista] = useState(true);     
  const [cargandoGuardar, setCargandoGuardar] = useState(false); 
  const [seleccionada, setSeleccionada] = useState<Sucursal | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [estado, setEstado] = useState<"activo" | "suspendido">("activo");
  
  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    setCargandoLista(true);
    try {
      const result = await listarSucursalesAPI();
      setSucursales(result.data || []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las sucursales");
    } finally {
      setCargandoLista(false);
    }
  };

  const seleccionar = (s: Sucursal) => { // 👈 tipo Sucursal
    setSeleccionada(s);
    setNombre(s.nombre);
    setDireccion(s.direccion);
    setImagenActual(s.imagen);
    setDropdownOpen(false);
  };

  // ── Cambiar imagen desde galería ──────────────────────────
  const cambiarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!resultado.canceled) {
      setImagenActual(resultado.assets[0].uri);
    }
  };

  // ── Quitar imagen ─────────────────────────────────────────
  const quitarImagen = () => setImagenActual(null);

  // ── Validar antes de mostrar modal ────────────────────────
  const intentarGuardar = () => {
    if (!seleccionada) {
      Alert.alert("Sin selección", "Por favor selecciona una sucursal.");
      return;
    }
    if (!nombre.trim()) {
      Alert.alert("Campo requerido", "El nombre no puede estar vacío.");
      return;
    }
    if (!direccion.trim()) {
      Alert.alert("Campo requerido", "La dirección no puede estar vacía.");
      return;
    }
    if (!imagenActual) {
      Alert.alert("Campo requerido", "La imagen no puede estar vacía.");
      return;
    }
    setModalConfirm(true);
  };

  // ── Confirmar guardado ────────────────────────────────────
    const confirmarGuardar = async () => {
    if (!seleccionada) return;
    setCargandoGuardar(true);
    try {
      await modificarSucursalAPI(seleccionada.id_sucursal, {
        nombre,
        direccion,
        imagen: imagenActual!,
      });
      setModalConfirm(false);
      Alert.alert("✅ Éxito", "Sucursal actualizada correctamente.");
      // Actualiza la lista local con los nuevos datos
      setSucursales((prev) =>
        prev.map((s) =>
          s.id_sucursal === seleccionada.id_sucursal
            ? { ...s, nombre, direccion, imagen: imagenActual! }
            : s
        )
      );
      // Limpia el formulario
      setSeleccionada(null);
      setNombre("");
      setDireccion("");
      setImagenActual(null);
    } catch (error: any) {
      setModalConfirm(false);
      Alert.alert("Error", error.message || "No se pudo actualizar la sucursal");
    } finally {
      setCargandoGuardar(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}></Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Modificar sucursal</Text>
        {/* Spinner mientras carga */}
          {cargandoLista ? (
            <ActivityIndicator size="large" color="#0D5A52" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.dropdownText}>
                  {seleccionada ? seleccionada.nombre : "Seleccione una sucursal"}
                </Text>
                <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  {sucursales.map((s) => (
                    <TouchableOpacity
                      key={s.id_sucursal} // 👈 usa id_sucursal
                      style={styles.dropdownItem}
                      onPress={() => seleccionar(s)}
                    >
                      <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de la sucursal</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Dirección */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Direccion</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        {/* Estado */}
        <View style={styles.estadoRow}>
          <Text style={styles.label}>Estado</Text>
          <TouchableOpacity style={styles.radioOption} onPress={() => setEstado("activo")}>
            <View style={[styles.radioCircle, estado === "activo" && styles.radioActivo]} />
            <Text style={styles.radioLabel}>Activo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioOption} onPress={() => setEstado("suspendido")}>
            <View style={[styles.radioCircle, estado === "suspendido" && styles.radioSuspendido]} />
            <Text style={styles.radioLabel}>Suspendido</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sección imagen ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen de la sucursal</Text>

          {imagenActual ? (
            // Imagen cargada — mostrar preview con opciones
            <View style={styles.previewContainer}>
              <Image source={{ uri: imagenActual }} style={styles.previewImage} />

              {/* Botón quitar (esquina superior izquierda) */}
              <TouchableOpacity style={styles.removeBtn} onPress={quitarImagen}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>

              {/* Botón cambiar imagen (parte inferior) */}
              <TouchableOpacity style={styles.changeBtn} onPress={cambiarImagen}>
                <Text style={styles.changeBtnText}>Cambiar imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Sin imagen — mostrar área de subida igual que en agregar
            <TouchableOpacity style={styles.uploadBox} onPress={cambiarImagen}>
              <Text style={styles.uploadIcon}>⬆</Text>
              <Text style={styles.uploadText}>Coloque un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>Toca para abrir la galería</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.btnGuardar} onPress={intentarGuardar}>
          <Text style={styles.btnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de confirmación ── */}
      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Guardar cambios?</Text>
            <Text style={styles.modalDesc}>
              Se actualizará la sucursal{" "}
              <Text style={styles.modalNombre}>"{nombre}"</Text>
              {" "}con los nuevos datos.
            </Text>

            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>{direccion}</Text>
              <Text style={styles.resumenItem}>
                Estado: {estado === "activo" ? "Activo" : "Suspendido"}
              </Text>
              <Text style={styles.resumenItem}>
                Imagen: {imagenActual ? "Actualizada" : "Sin imagen"}
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalConfirm(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarGuardar}>
                <Text style={styles.btnConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavbarLateral visible={navbarVisible} onClose={() => setNavbarVisible(false)} />
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
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 24, fontWeight: "700", color: "#2C1819",
    marginBottom: 24, fontStyle: "italic",
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
  dropdown: {
    backgroundColor: "#6FA58B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { color: "#fff", fontSize: 14 },
  dropdownChevron: { color: "#fff", fontSize: 12 },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: { fontSize: 14, color: "#2C1819" },
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#0D5A52",
  },
  radioActivo: { backgroundColor: "#541A1A", borderColor: "#6FA58B" },
  radioSuspendido: { backgroundColor: "#541A1A", borderColor: "#6FA58B" },
  radioLabel: { fontSize: 14, color: "#2C1819" },

  // ── Imagen ──
  previewContainer: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 190,
  },
  removeBtn: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  removeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  changeBtn: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(13,90,82,0.82)",
    paddingVertical: 10,
    alignItems: "center",
  },
  changeBtnText: {
    color: "#fff", fontSize: 14, fontWeight: "600",
  },
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

  // Botón guardar
  btnGuardar: {
    backgroundColor: "#541A1A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18, fontWeight: "700",
    color: "#0D5A52", textAlign: "center", marginBottom: 10,
  },
  modalDesc: {
    fontSize: 14, color: "#555",
    textAlign: "center", marginBottom: 16, lineHeight: 20,
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
    flex: 1, backgroundColor: "#6FA58B",
    borderRadius: 20, paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelarText: { color: "#fff", fontWeight: "700" },
  btnConfirmar: {
    flex: 1, backgroundColor: "#0D5A52",
    borderRadius: 20, paddingVertical: 12,
    alignItems: "center",
  },
  btnConfirmarText: { color: "#fff", fontWeight: "700" },
});