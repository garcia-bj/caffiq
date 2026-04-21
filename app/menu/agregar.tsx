import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ScrollView, Modal, Alert, ImageBackground,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { SUCURSALES } from "@/backend/menu-data";

//const FONDO = require("../../../assets/images/fondo-cafe.png");

export default function AgregarProductoMenu() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [modalConfirm, setModalConfirm] = useState(false);

  const sucursalNombre = SUCURSALES.find((s) => s.id === sucursalId)?.nombre;

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!resultado.canceled) setImagen(resultado.assets[0].uri);
  };

  const intentarRegistrar = () => {
    if (!sucursalId) return Alert.alert("Requerido", "Selecciona una sucursal.");
    if (!nombre.trim()) return Alert.alert("Requerido", "Ingresa el nombre del producto.");
    if (!precio.trim()) return Alert.alert("Requerido", "Ingresa el precio.");
    setModalConfirm(true);
  };

  const confirmarRegistro = () => {
    setModalConfirm(false);
    // Aquí irá la llamada a Supabase
    console.log({ sucursalId, nombre, descripcion, precio, stock, imagen });
    Alert.alert("✅ Éxito", "Producto registrado correctamente.");
    setNombre(""); setDescripcion(""); setPrecio("");
    setStock(""); setImagen(null); setSucursalId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}><Text style={styles.logoEmoji}>☕</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.pageTitle}>Agregar Producto al Menu</Text>

        {/* Dropdown sucursal */}
        <View style={styles.inputGroup}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>
              {sucursalNombre ?? "Seleccione una sucursal"}
            </Text>
            <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {SUCURSALES.map((s) => (
                <TouchableOpacity key={s.id} style={styles.dropdownItem}
                  onPress={() => { setSucursalId(s.id); setDropdownOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Datos del Nuevo Producto</Text>

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

        {/* Precio y Stock en fila */}
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

        {/* Foto */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Foto del Producto</Text>
          {imagen ? (
            <View style={styles.previewContainer}>
              <ImageBackground source={{ uri: imagen }} style={styles.previewImage} imageStyle={{ borderRadius: 10 }}>
                <TouchableOpacity style={styles.removeBtn} onPress={() => setImagen(null)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.changeBtn} onPress={seleccionarImagen}>
                  <Text style={styles.changeBtnText}>📷  Cambiar imagen</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={seleccionarImagen}>
              <Text style={styles.uploadIcon}>⬆</Text>
              <Text style={styles.uploadText}>Coloque un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>Toca para abrir la galería</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.btnRegistrar} onPress={intentarRegistrar}>
          <Text style={styles.btnText}>Registrar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal confirmación */}
      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Confirmar registro?</Text>
            <Text style={styles.modalDesc}>
              Se agregará <Text style={styles.modalNombre}>"{nombre}"</Text> al menú de{" "}
              <Text style={styles.modalNombre}>{sucursalNombre}</Text>.
            </Text>
            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>💰 Precio: ${precio}</Text>
              <Text style={styles.resumenItem}>📦 Stock: {stock}</Text>
              <Text style={styles.resumenItem}>🖼 Foto: {imagen ? "Seleccionada ✓" : "Sin foto"}</Text>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalConfirm(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarRegistro}>
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
    backgroundColor: "#0D5A52", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 16, fontStyle: "italic", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0D5A52", marginBottom: 16, marginTop: 4 },
  inputGroup: { marginBottom: 14 },
  rowGroup: { flexDirection: "row", marginBottom: 14 },
  label: { fontSize: 13, color: "#2C1819", marginBottom: 5, fontWeight: "500" },
  input: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#fff" },
  inputMultiline: { height: 100, paddingTop: 12 },
  dropdown: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownText: { color: "#fff", fontSize: 14 },
  dropdownChevron: { color: "#fff", fontSize: 12 },
  dropdownList: { backgroundColor: "#fff", borderRadius: 8, marginTop: 4, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemText: { fontSize: 14, color: "#2C1819" },
  uploadBox: { backgroundColor: "#6FA58B", borderRadius: 10, height: 140, alignItems: "center", justifyContent: "center", gap: 6 },
  uploadIcon: { fontSize: 32, color: "#fff" },
  uploadText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  previewContainer: { borderRadius: 10, overflow: "hidden" },
  previewImage: { width: "100%", height: 180, justifyContent: "space-between" },
  removeBtn: { margin: 8, backgroundColor: "rgba(0,0,0,0.6)", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  changeBtn: { backgroundColor: "rgba(13,90,82,0.82)", paddingVertical: 10, alignItems: "center" },
  changeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btnRegistrar: { backgroundColor: "#541A1A", borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 24 },
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