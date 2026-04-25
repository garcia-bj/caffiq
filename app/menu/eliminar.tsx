import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Image, Modal,
} from "react-native";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { SUCURSALES, getProductosPorSucursal, Producto } from "@/backend/menu-data";
import { Ionicons } from "@expo/vector-icons";

export default function EliminarProductoMenu() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  const sucursalNombre = SUCURSALES.find((s) => s.id === sucursalId)?.nombre;

  const seleccionarSucursal = (id: number) => {
    setSucursalId(id);
    setProductos(getProductosPorSucursal(id));
    setDropdownOpen(false);
  };

  const abrirModal = (p: Producto) => {
    setProductoAEliminar(p);
    setModalVisible(true);
  };

  const confirmarEliminar = () => {
    if (productoAEliminar) {
      setProductos((prev) => prev.filter((p) => p.id !== productoAEliminar.id));
    }
    setModalVisible(false);
    setProductoAEliminar(null);
  };

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
        <Text style={styles.pageTitle}>Eliminar Producto</Text>

        {/* Dropdown */}
        <View style={styles.inputGroup}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>{sucursalNombre ?? "Seleccione una sucursal"}</Text>
            <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {SUCURSALES.map((s) => (
                <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => seleccionarSucursal(s.id)}>
                  <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Grid productos */}
        {sucursalId && (
          <>
            <Text style={styles.sectionTitle}>Menu de ({sucursalNombre})</Text>
            <View style={styles.grid}>
              {productos.map((p) => (
                <View key={p.id} style={styles.card}>
                  <Image source={{ uri: p.imagen }} style={styles.cardImage} />

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => abrirModal(p)}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                 </TouchableOpacity>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNombre} numberOfLines={2}>{p.nombre}</Text>
                    <Text style={styles.cardPrecio}>$ {p.precio.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal confirmación */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Esta seguro de eliminar este Producto?</Text>
            <Text style={styles.modalDesc}>
              Se eliminara la sucursal{" "}
              <Text style={styles.modalNombre}>{productoAEliminar?.nombre}</Text>
              {" "}ya no aprecera para los demas usuarios en la lista de sucursales
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnEliminar} onPress={confirmarEliminar}>
                <Text style={styles.btnEliminarText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
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
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 16, fontStyle: "italic", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0D5A52", marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  dropdown: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownText: { color: "#fff", fontSize: 14 },
  dropdownChevron: { color: "#fff", fontSize: 12 },
  dropdownList: { backgroundColor: "#fff", borderRadius: 8, marginTop: 4, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemText: { fontSize: 14, color: "#2C1819" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "47%", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", elevation: 3, position: "relative" },
  cardImage: { width: "100%", height: 110 },
  deleteBtn: { position: "absolute", top: 6, right: 6, backgroundColor: "#6FA58B", width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center", elevation: 4 },
  deleteBtnText: { fontSize: 15 },
  cardInfo: { padding: 8 },
  cardNombre: { fontSize: 12, fontWeight: "600", color: "#2C1819", marginBottom: 2 },
  cardPrecio: { fontSize: 13, fontWeight: "700", color: "#541A1A" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "82%", elevation: 10 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#2C1819", textAlign: "center", marginBottom: 10 },
  modalDesc: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 20, lineHeight: 19 },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 12, justifyContent: "center" },
  btnEliminar: { backgroundColor: "#0D5A52", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24 },
  btnEliminarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnCancelar: { backgroundColor: "#6FA58B", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24 },
  btnCancelarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});