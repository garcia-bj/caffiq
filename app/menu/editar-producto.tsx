import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
  ImageBackground, Modal, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { PRODUCTOS, EstadoProducto } from "@/backend/menu-data";

export default function EditarProducto() {
  const router = useRouter();
  const { productoId } = useLocalSearchParams();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);

  // Buscar producto por id
  const productoOriginal = PRODUCTOS.find((p) => p.id === Number(productoId));

  const [nombre, setNombre] = useState(productoOriginal?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoOriginal?.descripcion ?? "");
  const [precio, setPrecio] = useState(String(productoOriginal?.precio ?? ""));
  const [stock, setStock] = useState(String(productoOriginal?.stock ?? ""));
  const [estado, setEstado] = useState<EstadoProducto>(productoOriginal?.estado ?? "disponible");
  const [imagen, setImagen] = useState<string | null>(productoOriginal?.imagen ?? null);

  const cambiarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!resultado.canceled) setImagen(resultado.assets[0].uri);
  };

  const intentarGuardar = () => {
    if (!nombre.trim()) return Alert.alert("Requerido", "El nombre no puede estar vacío.");
    if (!precio.trim()) return Alert.alert("Requerido", "El precio no puede estar vacío.");
    setModalConfirm(true);
  };

  const confirmarGuardar = () => {
    setModalConfirm(false);
    // Aquí irá la llamada a Supabase
    console.log({ id: productoId, nombre, descripcion, precio, stock, estado, imagen });
    Alert.alert("✅ Éxito", "Producto actualizado correctamente.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  if (!productoOriginal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20, color: "#541A1A" }}>Producto no encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}><Text style={styles.logoEmoji}>☕</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Botón volver */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0D5A52" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Datos del Producto</Text>

        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Producto</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripcion del Producto</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={descripcion} onChangeText={setDescripcion}
            multiline numberOfLines={4} textAlignVertical="top"
          />
        </View>

        {/* Precio y Stock */}
        <View style={styles.rowGroup}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Precio</Text>
            <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Stock</Text>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" />
          </View>
        </View>

        {/* Estado */}
        <View style={styles.estadoRow}>
          <Text style={styles.label}>Estado</Text>
          <TouchableOpacity style={styles.radioOption} onPress={() => setEstado("disponible")}>
            <View style={[styles.radioCircle, estado === "disponible" && styles.radioDisponible]} />
            <Text style={styles.radioLabel}>Disponible</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioOption} onPress={() => setEstado("no_disponible")}>
            <View style={[styles.radioCircle, estado === "no_disponible" && styles.radioNoDisponible]} />
            <Text style={styles.radioLabel}>No Disponible</Text>
          </TouchableOpacity>
        </View>

        {/* Imagen */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Foto del Producto</Text>
          {imagen ? (
            <View style={styles.previewContainer}>
              <ImageBackground
                source={{ uri: imagen }}
                style={styles.previewImage}
                imageStyle={{ borderRadius: 10 }}
              >
                <TouchableOpacity style={styles.removeBtn} onPress={() => setImagen(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.changeBtn} onPress={cambiarImagen}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.changeBtnText}>  Cambiar imagen</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={cambiarImagen}>
              <Ionicons name="cloud-upload-outline" size={36} color="#fff" />
              <Text style={styles.uploadText}>Coloque un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>Toca para abrir la galería</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.btnGuardar} onPress={intentarGuardar}>
          <Text style={styles.btnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal confirmación */}
      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Guardar cambios?</Text>
            <Text style={styles.modalDesc}>
              Se actualizará <Text style={styles.modalNombre}>"{nombre}"</Text> en el menú.
            </Text>
            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>💰 Precio: ${precio}</Text>
              <Text style={styles.resumenItem}>📦 Stock: {stock}</Text>
              <Text style={styles.resumenItem}>
                🔘 Estado: {estado === "disponible" ? "Disponible" : "No disponible"}
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
  header: { backgroundColor: "#0D5A52", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50 },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, color: "#0D5A52", fontWeight: "600" },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 20, fontStyle: "italic" },
  inputGroup: { marginBottom: 14 },
  rowGroup: { flexDirection: "row", marginBottom: 14 },
  label: { fontSize: 13, color: "#2C1819", marginBottom: 5, fontWeight: "500" },
  input: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#fff" },
  inputMultiline: { height: 100, paddingTop: 12 },
  estadoRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#0D5A52" },
  radioDisponible: { backgroundColor: "#541A1A", borderColor: "#541A1A" },
  radioNoDisponible: { backgroundColor: "#6FA58B", borderColor: "#6FA58B" },
  radioLabel: { fontSize: 13, color: "#2C1819" },
  previewContainer: { borderRadius: 10, overflow: "hidden" },
  previewImage: { width: "100%", height: 200, justifyContent: "space-between" },
  removeBtn: { margin: 8, backgroundColor: "rgba(0,0,0,0.6)", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  changeBtn: { backgroundColor: "rgba(13,90,82,0.82)", paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  changeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  uploadBox: { backgroundColor: "#6FA58B", borderRadius: 10, height: 140, alignItems: "center", justifyContent: "center", gap: 6 },
  uploadText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  btnGuardar: { backgroundColor: "#541A1A", borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
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