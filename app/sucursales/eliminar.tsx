import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
  Image, Modal,
} from "react-native";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";

const SUCURSALES_INICIAL = [
  { id: 1, nombre: "Cafe Martinez", direccion: "Direccion........", imagen: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600" },
  { id: 2, nombre: "The Coffee Club", direccion: "Direccion........", imagen: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600" },
  { id: 3, nombre: "Juan Valdez Cafe", direccion: "Direccion........", imagen: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600" },
];

export default function EliminarSucursal() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [sucursales, setSucursales] = useState(SUCURSALES_INICIAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [seleccionada, setSeleccionada] = useState<typeof SUCURSALES_INICIAL[0] | null>(null);

  const abrirModal = (s: typeof SUCURSALES_INICIAL[0]) => {
    setSeleccionada(s);
    setModalVisible(true);
  };

  const confirmarEliminar = () => {
    if (seleccionada) {
      setSucursales((prev) => prev.filter((s) => s.id !== seleccionada.id));
    }
    setModalVisible(false);
    setSeleccionada(null);
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
        <Text style={styles.sectionTitle}>Cafeterías disponibles</Text>

        {sucursales.map((cafe) => (
          <View key={cafe.id} style={styles.card}>
            <Image source={{ uri: cafe.imagen }} style={styles.cardImage} />

            {/* Botón eliminar */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => abrirModal(cafe)}
            >
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>

            <View style={styles.cardOverlay}>
              <Text style={styles.cardNombre}>{cafe.nombre}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardDireccion}>{cafe.direccion}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Esta seguro de eliminar esta sucursal?</Text>
            <Text style={styles.modalDesc}>
              Se eliminara la sucursal{" "}
              <Text style={styles.modalNombre}>{seleccionada?.nombre}</Text>
              {" "}ya no aparecera para los demas usuarios en la lista de sucursales
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnEliminar} onPress={confirmarEliminar}>
                <Text style={styles.btnEliminarText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
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
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 18, fontWeight: "600", color: "#2d2d2d",
    textAlign: "center", marginBottom: 16, fontStyle: "italic",
  },
  card: {
    borderRadius: 14, overflow: "hidden",
    marginBottom: 16, backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  cardImage: { width: "100%", height: 180 },
  deleteBtn: {
    position: "absolute",
    top: 10, right: 10,
    backgroundColor: "#6FA58B",
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
  },
  deleteBtnText: { fontSize: 16 },
  cardOverlay: {
    position: "absolute",
    bottom: 44, left: 0, right: 0,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardNombre: {
    fontSize: 20, fontWeight: "700", color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cardInfo: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff" },
  cardDireccion: { fontSize: 13, color: "#777" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16, fontWeight: "700",
    color: "#2C1819", textAlign: "center", marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13, color: "#555",
    textAlign: "center", marginBottom: 20, lineHeight: 20,
  },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 12 },
  btnEliminar: {
    backgroundColor: "#0D5A52",
    borderRadius: 20, paddingVertical: 10,
    paddingHorizontal: 24,
  },
  btnEliminarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnCancelar: {
    backgroundColor: "#6FA58B",
    borderRadius: 20, paddingVertical: 10,
    paddingHorizontal: 24,
  },
  btnCancelarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
