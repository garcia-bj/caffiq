import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar,
  ScrollView, Image, Alert, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { LocationPickerButton } from "@/frontend/components/LocationPickerButton";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService, type SucursalPublica } from "@/frontend/services/sucursales.service";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary.service";

export default function ModificarSucursal() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [seleccionada, setSeleccionada] = useState<SucursalPublica | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [modalConfirm, setModalConfirm] = useState(false);

  useEffect(() => {
    if (!token || !usuario?.cafeteria_id) return;
    sucursalesService.listar(token, usuario.cafeteria_id)
      .then(({ sucursales: data }) => setSucursales(data))
      .catch(() => Alert.alert("Error", "No se pudieron cargar las sucursales"))
      .finally(() => setCargandoLista(false));
  }, [token, usuario?.cafeteria_id]);

  const seleccionar = (s: SucursalPublica) => {
    setSeleccionada(s);
    setNombre(s.nombre);
    setDireccion(s.direccion ?? "");
    setCiudad(s.ciudad ?? "");
    setLatitud(s.latitud  ?? null);
    setLongitud(s.longitud ?? null);
    setImagenActual(s.imagen_url ?? null);
    setDropdownOpen(false);
  };

  const cambiarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!resultado.canceled) setImagenActual(resultado.assets[0].uri);
  };

  const quitarImagen = () => setImagenActual(null);

  const intentarGuardar = () => {
    if (!seleccionada) { Alert.alert("Sin selección", "Selecciona una sucursal."); return; }
    if (!nombre.trim()) { Alert.alert("Campo requerido", "El nombre no puede estar vacío."); return; }
    if (!direccion.trim()) { Alert.alert("Campo requerido", "La dirección no puede estar vacía."); return; }
    if (!ciudad.trim()) { Alert.alert("Campo requerido", "La ciudad no puede estar vacía."); return; }
    setModalConfirm(true);
  };

  const confirmarGuardar = async () => {
    if (!seleccionada || !token || !usuario?.cafeteria_id) return;
    setCargandoGuardar(true);
    try {
      let imagen_url: string | undefined = imagenActual ?? undefined;
      if (imagenActual && !imagenActual.startsWith("http")) {
        imagen_url = await subirImagenCloudinary(imagenActual);
      }

      const { sucursal } = await sucursalesService.modificar(
        token, usuario.cafeteria_id, seleccionada.id,
        { nombre, direccion, ciudad, imagen_url, latitud, longitud }
      );
      setModalConfirm(false);
      Alert.alert("Éxito", "Sucursal actualizada correctamente.");
      setSucursales((prev) => prev.map((s) => s.id === sucursal.id ? sucursal : s));
      setSeleccionada(null);
      setNombre(""); setDireccion(""); setCiudad("");
      setLatitud(null); setLongitud(null);
      setImagenActual(null);
    } catch (error: any) {
      setModalConfirm(false);
      Alert.alert("Error", error.message ?? "No se pudo actualizar la sucursal");
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
          <Text style={styles.logoEmoji}>☕</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Modificar sucursal</Text>

        {cargandoLista ? (
          <ActivityIndicator size="large" color="#0D5A52" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seleccionar sucursal</Text>
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
                {sucursales.length === 0 ? (
                  <Text style={{ padding: 14, color: "#999" }}>No hay sucursales</Text>
                ) : (
                  sucursales.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.dropdownItem}
                      onPress={() => seleccionar(s)}
                    >
                      <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de la sucursal</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ciudad</Text>
          <TextInput style={styles.input} value={ciudad} onChangeText={setCiudad} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Ubicación en el mapa <Text style={styles.labelOpcional}>(opcional)</Text>
          </Text>
          <Text style={styles.labelHint}>
            {seleccionada
              ? "Toca el mapa para cambiar la ubicación de la sucursal."
              : "Selecciona primero una sucursal para editar su ubicación."}
          </Text>
          <LocationPickerButton
            key={seleccionada?.id ?? "empty"}
            latitud={latitud}
            longitud={longitud}
            onChange={(lat, lng) => { setLatitud(lat); setLongitud(lng); }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen de la sucursal</Text>
          {imagenActual ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imagenActual }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={quitarImagen}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeBtn} onPress={cambiarImagen}>
                <Text style={styles.changeBtnText}>Cambiar imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={cambiarImagen}>
              <Text style={styles.uploadIcon}>⬆</Text>
              <Text style={styles.uploadText}>Coloca un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>Toca para abrir la galería</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnGuardar, cargandoGuardar && { opacity: 0.6 }]}
          onPress={intentarGuardar}
          disabled={cargandoGuardar}
        >
          {cargandoGuardar
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Guardar cambios</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Guardar cambios?</Text>
            <Text style={styles.modalDesc}>
              Se actualizará la sucursal{" "}
              <Text style={styles.modalNombre}>"{nombre}"</Text> con los nuevos datos.
            </Text>
            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>Dirección: {direccion}</Text>
              <Text style={styles.resumenItem}>Ciudad: {ciudad}</Text>
              <Text style={styles.resumenItem}>
                Ubicación: {latitud != null ? `${latitud.toFixed(5)}, ${longitud!.toFixed(5)}` : "Sin marcar"}
              </Text>
              <Text style={styles.resumenItem}>
                Imagen: {imagenActual ? "Actualizada" : "Sin imagen"}
              </Text>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalConfirm(false)}>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
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
  pageTitle: { fontSize: 24, fontWeight: "700", color: "#2C1819", marginBottom: 24, fontStyle: "italic" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#2C1819", marginBottom: 4, fontWeight: "500" },
  labelOpcional: { fontSize: 12, color: "#7a9a8a", fontWeight: "400" },
  labelHint: { fontSize: 12, color: "#7a9a8a", marginBottom: 8 },
  input: {
    backgroundColor: "#6FA58B", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#fff",
  },
  dropdown: {
    backgroundColor: "#6FA58B", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  dropdownText: { color: "#fff", fontSize: 14 },
  dropdownChevron: { color: "#fff", fontSize: 12 },
  dropdownList: {
    backgroundColor: "#fff", borderRadius: 8, marginTop: 4,
    elevation: 4, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: { fontSize: 14, color: "#2C1819" },
  previewContainer: { borderRadius: 10, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: 190 },
  removeBtn: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  removeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  changeBtn: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(13,90,82,0.82)", paddingVertical: 10, alignItems: "center",
  },
  changeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  uploadBox: {
    backgroundColor: "#6FA58B", borderRadius: 10, height: 140,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  uploadIcon: { fontSize: 32, color: "#fff" },
  uploadText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  btnGuardar: {
    backgroundColor: "#541A1A", borderRadius: 30,
    paddingVertical: 16, alignItems: "center", marginTop: 24,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  modalBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "85%", elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0D5A52", textAlign: "center", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16, lineHeight: 20 },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalResumen: { backgroundColor: "#f0f7f4", borderRadius: 10, padding: 12, marginBottom: 20, gap: 6 },
  resumenItem: { fontSize: 13, color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 10 },
  btnCancelar: { flex: 1, backgroundColor: "#6FA58B", borderRadius: 20, paddingVertical: 12, alignItems: "center" },
  btnCancelarText: { color: "#fff", fontWeight: "700" },
  btnConfirmar: { flex: 1, backgroundColor: "#0D5A52", borderRadius: 20, paddingVertical: 12, alignItems: "center" },
  btnConfirmarText: { color: "#fff", fontWeight: "700" },
});
