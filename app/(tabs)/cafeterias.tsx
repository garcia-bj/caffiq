import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService } from "@/frontend/services/sucursales.service";
import { pedidosService } from "@/frontend/services/pedidos.service";
import { productosService } from "@/frontend/services/productos.service";

const D = {
  bg:      "#f5f0eb",
  header:  "#0D5A52",
  card:    "#FFFFFF",
  border:  "#C5D9CE",
  accent:  "#0D5A52",
  label:   "#2C1819",
  hint:    "#7a9a8a",
  orange:  "#E65100",
  orangeBg:"#FFF3E0",
  green:   "#1B5E20",
  greenBg: "#E8F5E9",
  red:     "#541A1A",
  redBg:   "#FFEBEE",
} as const;

interface Metricas {
  pendientes: number;
  sucursales: number;
  sucursalesActivas: number;
  productos: number;
}

const ACCESOS = [
  {
    key: "sucursales", label: "Sucursales", desc: "Agregar · Editar · Eliminar",
    icon: "storefront-outline" as const, color: "#0D5A52", bg: "#EDF7F2",
    ruta: "/sucursales/agregar",
  },
  {
    key: "menu", label: "Menú", desc: "Agregar · Modificar productos",
    icon: "restaurant-outline" as const, color: "#1A4A30", bg: "#F0F7F0",
    ruta: "/menu/agregar",
  },
  {
    key: "personalizacion", label: "Personalización", desc: "Tamaño · Azúcar · Extras",
    icon: "options-outline" as const, color: "#1A2E5A", bg: "#EEF2FF",
    ruta: "/personalizacion",
  },
  {
    key: "pedidos", label: "Pedidos", desc: "Aprobar · Rechazar",
    icon: "receipt-outline" as const, color: "#541A1A", bg: "#FFF0F0",
    ruta: "/pedidos",
  },
  {
    key: "qr", label: "QR de Pago", desc: "Subir código de pago",
    icon: "qr-code-outline" as const, color: "#4A2C1A", bg: "#FFF8F0",
    ruta: "/configuracion/qr-pago",
  },
] as const;

function saludar() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardAdminScreen() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!token || !usuario?.cafeteria_id) return;
    if (!silencioso) setCargando(true);
    try {
      const [
        { sucursales },
        { pedidos: pendientes },
        { productos },
      ] = await Promise.all([
        sucursalesService.listar(token, usuario.cafeteria_id),
        pedidosService.listarPorCafeteria(token, usuario.cafeteria_id, "pendiente"),
        productosService.listar(token, usuario.cafeteria_id),
      ]);
      setMetricas({
        pendientes:        pendientes.length,
        sucursales:        sucursales.length,
        sucursalesActivas: sucursales.filter((s) => s.activa).length,
        productos:         productos.length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [token, usuario?.cafeteria_id]);

  // Recargar cada vez que la pantalla recibe foco (ej. volver de pedidos)
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const nombreCorto = usuario?.nom_completo?.split(" ")[0] ?? "Admin";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={D.header} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CAFFIQ</Text>

        {/* Badge de pendientes en el header */}
        {(metricas?.pendientes ?? 0) > 0 ? (
          <TouchableOpacity
            style={styles.pendienteBadge}
            onPress={() => router.push("/pedidos" as never)}
          >
            <Ionicons name="notifications-outline" size={16} color="#fff" />
            <Text style={styles.pendienteBadgeText}>{metricas!.pendientes}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar(true); }}
            tintColor={D.accent}
          />
        }
      >
        {/* ── Saludo ────────────────────────────────────────────── */}
        <View style={styles.saludoBlock}>
          <Text style={styles.saludoTexto}>{saludar()},</Text>
          <Text style={styles.saludoNombre}>{nombreCorto}</Text>
          <Text style={styles.saludoSub}>Panel de administración</Text>
        </View>

        {/* ── Métricas ──────────────────────────────────────────── */}
        {cargando ? (
          <View style={styles.metricasLoading}>
            <ActivityIndicator size="large" color={D.accent} />
          </View>
        ) : metricas ? (
          <View style={styles.metricasRow}>
            {/* Pedidos pendientes */}
            <TouchableOpacity
              style={[styles.metricaCard, metricas.pendientes > 0 && styles.metricaCardAlerta]}
              onPress={() => router.push("/pedidos" as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.metricaIconWrap, { backgroundColor: metricas.pendientes > 0 ? D.orangeBg : "#F0F7F0" }]}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={metricas.pendientes > 0 ? D.orange : D.accent}
                />
              </View>
              <Text style={[styles.metricaNum, metricas.pendientes > 0 && { color: D.orange }]}>
                {metricas.pendientes}
              </Text>
              <Text style={styles.metricaLabel}>Pendientes</Text>
              {metricas.pendientes > 0 && (
                <View style={styles.metricaAlertDot} />
              )}
            </TouchableOpacity>

            {/* Sucursales */}
            <TouchableOpacity
              style={styles.metricaCard}
              onPress={() => router.push("/sucursales/agregar" as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.metricaIconWrap, { backgroundColor: "#EDF7F2" }]}>
                <Ionicons name="storefront-outline" size={22} color={D.accent} />
              </View>
              <Text style={styles.metricaNum}>{metricas.sucursalesActivas}</Text>
              <Text style={styles.metricaLabel}>Sucursales{"\n"}activas</Text>
            </TouchableOpacity>

            {/* Productos */}
            <TouchableOpacity
              style={styles.metricaCard}
              onPress={() => router.push("/menu/agregar" as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.metricaIconWrap, { backgroundColor: "#F0F7F0" }]}>
                <Ionicons name="restaurant-outline" size={22} color="#1A4A30" />
              </View>
              <Text style={styles.metricaNum}>{metricas.productos}</Text>
              <Text style={styles.metricaLabel}>Productos{"\n"}en menú</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Acceso rápido ─────────────────────────────────────── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Acceso rápido</Text>
        </View>

        <View style={styles.grid}>
          {ACCESOS.map((item, idx) => {
            const esUltimo = idx === ACCESOS.length - 1;
            const impar    = ACCESOS.length % 2 !== 0;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.gridCard,
                  esUltimo && impar && styles.gridCardFull,
                ]}
                onPress={() => router.push(item.ruta as never)}
                activeOpacity={0.85}
              >
                {/* Badge de alerta en pedidos */}
                {item.key === "pedidos" && (metricas?.pendientes ?? 0) > 0 && (
                  <View style={styles.gridAlertBadge}>
                    <Text style={styles.gridAlertBadgeText}>{metricas!.pendientes}</Text>
                  </View>
                )}

                <View style={[styles.gridIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridDesc} numberOfLines={1}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Pie ───────────────────────────────────────────────── */}
        <Text style={styles.footer}>Caffiq Admin · v1.0.0</Text>
      </ScrollView>

      <NavbarLateral visible={navbarVisible} onClose={() => setNavbarVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: {
    backgroundColor: D.header,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBtn:  { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  headerSpacer: { width: 40 },

  pendienteBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: D.orange, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pendienteBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  scroll: { paddingBottom: 48 },

  // Saludo
  saludoBlock: {
    backgroundColor: D.header,
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28,
  },
  saludoTexto:  { fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  saludoNombre: { fontSize: 26, fontWeight: "800", color: "#fff", marginTop: 2 },
  saludoSub:    { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },

  // Métricas
  metricasLoading: { paddingVertical: 32, alignItems: "center" },
  metricasRow: {
    flexDirection: "row", gap: 10,
    marginHorizontal: 16, marginTop: -16,
    marginBottom: 8,
  },
  metricaCard: {
    flex: 1, backgroundColor: D.card, borderRadius: 16,
    borderWidth: 1, borderColor: D.border,
    padding: 14, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    position: "relative", overflow: "hidden",
  },
  metricaCardAlerta: { borderColor: D.orange },
  metricaIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  metricaNum:    { fontSize: 26, fontWeight: "800", color: D.label },
  metricaLabel:  { fontSize: 10, color: D.hint, fontWeight: "600", textAlign: "center", lineHeight: 14 },
  metricaAlertDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: D.orange,
  },

  // Sección
  seccionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  seccionTitulo: { fontSize: 16, fontWeight: "700", color: D.label },

  // Grid acceso rápido
  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
    paddingHorizontal: 16,
  },
  gridCard: {
    width: "47%", backgroundColor: D.card,
    borderRadius: 16, borderWidth: 1, borderColor: D.border,
    padding: 16, gap: 8, position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  gridCardFull: { width: "100%" },
  gridIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  gridLabel:    { fontSize: 15, fontWeight: "700", color: D.label },
  gridDesc:     { fontSize: 11, color: D.hint },
  gridAlertBadge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: D.orange, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5,
  },
  gridAlertBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  footer: { textAlign: "center", fontSize: 11, color: D.hint, marginTop: 24 },
});
