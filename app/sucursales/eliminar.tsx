import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView,
  Image, Modal, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavbar } from "@/frontend/context/NavbarContext";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService, type SucursalPublica } from "@/frontend/services/sucursales.service";

export default function EliminarSucursal() {
  const { token, usuario } = useAuth();
  const { open: openNavbar } = useNavbar();
  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [seleccionada, setSeleccionada] = useState<SucursalPublica | null>(null);

  useEffect(() => {
    if (!token || !usuario?.cafeteria_id) return;
    sucursalesService.listar(token, usuario.cafeteria_id)
      .then(({ sucursales: data }) => setSucursales(data))
      .catch(() => Alert.alert("Error", "No se pudieron cargar las sucursales"))
      .finally(() => setCargandoLista(false));
  }, [token, usuario?.cafeteria_id]);

  const abrirModal = (s: SucursalPublica) => {
    setSeleccionada(s);
    setModalVisible(true);
  };

  const confirmarSuspender = async () => {
    if (!seleccionada || !token || !usuario?.cafeteria_id) return;
    setCargando(true);
    try {
      await sucursalesService.suspender(token, usuario.cafeteria_id, seleccionada.id);
      setSucursales((prev) => prev.filter((s) => s.id !== seleccionada.id));
      setModalVisible(false);
      setSeleccionada(null);
      Alert.alert("Listo", "La sucursal fue suspendida.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo suspender la sucursal");
    } finally {
      setCargando(false);
    }
  };

  if (cargandoLista) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0D5A52" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openNavbar}>
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
        <Text style={styles.sectionTitle}>Suspender sucursal</Text>

        {sucursales.length === 0 ? (
          <Text style={styles.emptyText}>No hay sucursales registradas.</Text>
        ) : (
          sucursales.map((s) => (
            <View key={s.id} style={styles.card}>
              <Image
                source={{ uri: s.imagen_url ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600" }}
                style={styles.cardImage}
              />
              <TouchableOpacity style={styles.deleteBtn} onPress={() => abrirModal(s)}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
              <View style={styles.cardOverlay}>
                <Text style={styles.cardNombre}>{s.nombre}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardDireccion}>{s.direccion} — {s.ciudad}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Suspender esta sucursal?</Text>
            <Text style={styles.modalDesc}>
              La sucursal{" "}
              <Text style={styles.modalNombre}>{seleccionada?.nombre}</Text>
              {" "}dejará de aparecer para los usuarios.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnEliminar}
                onPress={confirmarSuspender}
                disabled={cargando}
              >
                {cargando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnEliminarText}>Suspender</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
                disabled={cargando}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scrollContent: { padding: 16, paddingBottom: 84 },
  sectionTitle: {
    fontSize: 18, fontWeight: "600", color: "#2d2d2d",
    textAlign: "center", marginBottom: 16, fontStyle: "italic",
  },
  emptyText: { textAlign: "center", color: "#777", marginTop: 20 },
  card: {
    borderRadius: 14, overflow: "hidden", marginBottom: 16, backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  cardImage: { width: "100%", height: 180 },
  deleteBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "#6FA58B",
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center", elevation: 4,
  },
  deleteBtnText: { fontSize: 16 },
  cardOverlay: {
    position: "absolute", bottom: 44, left: 0, right: 0,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardNombre: {
    fontSize: 20, fontWeight: "700", color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4,
  },
  cardInfo: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff" },
  cardDireccion: { fontSize: 13, color: "#777" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 24, width: "80%", alignItems: "center", elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#2C1819", textAlign: "center", marginBottom: 12 },
  modalDesc: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 12 },
  btnEliminar: {
    backgroundColor: "#0D5A52", borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  btnEliminarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnCancelar: {
    backgroundColor: "#6FA58B", borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  btnCancelarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
