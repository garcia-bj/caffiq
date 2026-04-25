import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService, type SucursalPublica } from "@/frontend/services/sucursales.service";

export default function CafeteriasScreen() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const obtenerDatos = useCallback(async () => {
    if (!token || !usuario?.cafeteria_id) return;
    try {
      const { sucursales: data } = await sucursalesService.listar(token, usuario.cafeteria_id);
      setSucursales(data);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [token, usuario?.cafeteria_id]);

  useEffect(() => { obtenerDatos(); }, [obtenerDatos]);

  const alRefrescar = () => {
    setRefrescando(true);
    obtenerDatos();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

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

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/sucursales/agregar" as never)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D5A52" />
          <Text style={styles.loadingText}>Cargando sucursales...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor="#0D5A52" />
          }
        >
          <Text style={styles.sectionTitle}>Mis sucursales</Text>

          {sucursales.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>No hay sucursales registradas.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/sucursales/agregar" as never)}
              >
                <Text style={styles.emptyBtnText}>Agregar primera sucursal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sucursales.map((s) => (
              <View key={s.id} style={styles.card}>
                <Image
                  source={{ uri: s.imagen_url ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600" }}
                  style={styles.cardImage}
                />

                {!s.activa && (
                  <View style={styles.suspendidoBadge}>
                    <Text style={styles.suspendidoText}>Suspendida</Text>
                  </View>
                )}

                <View style={styles.cardOverlay}>
                  <Text style={styles.cardNombre}>{s.nombre}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardDireccion}>{s.direccion} — {s.ciudad}</Text>
                  {(s.horario_apertura && s.horario_cierre) ? (
                    <Text style={styles.cardHorario}>
                      {s.horario_apertura} – {s.horario_cierre}
                    </Text>
                  ) : null}

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => router.push({ pathname: "/sucursales/modificar", params: { id: s.id } } as never)}
                    >
                      <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => router.push({ pathname: "/sucursales/eliminar", params: { id: s.id } } as never)}
                    >
                      <Text style={styles.actionBtnText}>Suspender</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <NavbarLateral
        visible={navbarVisible}
        onClose={() => setNavbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { fontSize: 24, color: "#fff", fontWeight: "700", lineHeight: 28 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#0D5A52", fontWeight: "600" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 18, fontWeight: "600", color: "#2C1819",
    textAlign: "center", marginBottom: 16, fontStyle: "italic",
  },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: "#777", fontSize: 15, textAlign: "center" },
  emptyBtn: {
    backgroundColor: "#0D5A52", paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  card: {
    borderRadius: 14, overflow: "hidden",
    marginBottom: 16, backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  cardImage: { width: "100%", height: 180 },
  suspendidoBadge: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: "rgba(180,30,30,0.85)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  suspendidoText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardOverlay: {
    position: "absolute", bottom: 80,
    left: 0, right: 0,
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
  cardDireccion: { fontSize: 13, color: "#6FA58B" },
  cardHorario: { fontSize: 12, color: "#999", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: 20, alignItems: "center",
  },
  editBtn: { backgroundColor: "#0D5A52" },
  deleteBtn: { backgroundColor: "#541A1A" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
