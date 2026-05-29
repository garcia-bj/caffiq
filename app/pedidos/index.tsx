import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Image, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { pedidosService, type Pedido, type EstadoPedido, type TipoPedido } from "@/frontend/services/pedidos.service";

const D = {
  bg:       "#f5f0eb",
  header:   "#0D5A52",
  card:     "#fff",
  border:   "#C5D9CE",
  accent:   "#0D5A52",
  danger:   "#541A1A",
  label:    "#2C1819",
  hint:     "#7a9a8a",
  pendiente:{ bg: "#FFF8E1", text: "#F57F17", border: "#FFE082" },
  aprobado: { bg: "#E8F5E9", text: "#1B5E20", border: "#A5D6A7" },
  rechazado:{ bg: "#FFEBEE", text: "#B71C1C", border: "#EF9A9A" },
} as const;

type Tab = "pendiente" | "aprobado" | "rechazado";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "pendiente",  label: "Pendientes",  icon: "time-outline"           },
  { key: "aprobado",   label: "Aprobados",   icon: "checkmark-circle-outline" },
  { key: "rechazado",  label: "Rechazados",  icon: "close-circle-outline"    },
];

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const col = D[estado];
  return (
    <View style={[styles.estadoBadge, { backgroundColor: col.bg, borderColor: col.border }]}>
      <Text style={[styles.estadoBadgeText, { color: col.text }]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Text>
    </View>
  );
}

function PedidoCard({
  pedido,
  onAprobar,
  onRechazar,
}: {
  pedido: Pedido;
  onAprobar?: () => void;
  onRechazar?: () => void;
}) {
  const [verFoto, setVerFoto] = useState(false);

  return (
    <View style={styles.card}>
      {/* Cabecera */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardCliente}>
            {pedido.cliente?.nom_completo ?? "Cliente"}
          </Text>
          <Text style={styles.cardFecha}>{formatFecha(pedido.created_at)}</Text>
        </View>
        <EstadoBadge estado={pedido.estado} />
      </View>

      {/* Ítems */}
      <View style={styles.itemsList}>
        {pedido.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemCant}>{item.cantidad}×</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              {item.personalizaciones.length > 0 && (
                <Text style={styles.itemPers}>
                  {item.personalizaciones.map((p) => p.opcion).join(" · ")}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrecio}>
              ${(item.precio_unitario * item.cantidad).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Tipo de pedido + Total */}
      <View style={styles.totalRow}>
        <View style={[
          styles.tipoBadge,
          pedido.tipo_pedido === "local"
            ? styles.tipoBadgeLocal
            : styles.tipoBadgeLlevar,
        ]}>
          <Text style={styles.tipoBadgeText}>
            {pedido.tipo_pedido === "local" ? "🪑 En el local" : "🛍️ Para llevar"}
          </Text>
        </View>
        <Text style={styles.totalValor}>${pedido.total.toFixed(2)}</Text>
      </View>

      {/* Comprobante */}
      {pedido.comprobante_url ? (
        <TouchableOpacity
          style={styles.comprobanteBtn}
          onPress={() => setVerFoto(!verFoto)}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={16} color={D.accent} />
          <Text style={styles.comprobanteBtnText}>
            {verFoto ? "Ocultar comprobante" : "Ver comprobante de pago"}
          </Text>
          <Ionicons name={verFoto ? "chevron-up" : "chevron-down"} size={14} color={D.accent} />
        </TouchableOpacity>
      ) : (
        <Text style={styles.sinComprobante}>Sin comprobante adjunto</Text>
      )}

      {verFoto && pedido.comprobante_url ? (
        <Image source={{ uri: pedido.comprobante_url }} style={styles.comprobanteImg} resizeMode="contain" />
      ) : null}

      {/* Acciones (solo para pendientes) */}
      {pedido.estado === "pendiente" && onAprobar && onRechazar && (
        <View style={styles.acciones}>
          <TouchableOpacity style={styles.btnRechazar} onPress={onRechazar} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnAccionText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAprobar} onPress={onAprobar} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnAccionText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function PedidosAdminScreen() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [tabActiva, setTabActiva] = useState<Tab>("pendiente");
  const [pedidos, setPedidos] = useState<Record<Tab, Pedido[]>>({
    pendiente: [], aprobado: [], rechazado: [],
  });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!token || !usuario?.cafeteria_id) return;
    if (!silencioso) setCargando(true);
    try {
      const [pend, apro, rech] = await Promise.all([
        pedidosService.listarPorCafeteria(token, usuario.cafeteria_id, "pendiente"),
        pedidosService.listarPorCafeteria(token, usuario.cafeteria_id, "aprobado"),
        pedidosService.listarPorCafeteria(token, usuario.cafeteria_id, "rechazado"),
      ]);
      setPedidos({ pendiente: pend.pedidos, aprobado: apro.pedidos, rechazado: rech.pedidos });
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [token, usuario?.cafeteria_id]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = (pedido: Pedido, nuevoEstado: "aprobado" | "rechazado") => {
    const accion = nuevoEstado === "aprobado" ? "aprobar" : "rechazar";
    Alert.alert(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} pedido?`,
      `El pedido de ${pedido.cliente?.nom_completo ?? "este cliente"} por $${pedido.total.toFixed(2)} será ${nuevoEstado}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: nuevoEstado === "aprobado" ? "Aprobar" : "Rechazar",
          style: nuevoEstado === "aprobado" ? "default" : "destructive",
          onPress: async () => {
            if (!token || !usuario?.cafeteria_id) return;
            try {
              await pedidosService.actualizarEstado(token, pedido.id, usuario.cafeteria_id, nuevoEstado);
              await cargar(true);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const listaPedidos = pedidos[tabActiva];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={D.header} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.pendienteBadge}>
          <Text style={styles.pendienteBadgeText}>{pedidos.pendiente.length}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const activa = tabActiva === tab.key;
          const count  = pedidos[tab.key].length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activa && styles.tabActiva]}
              onPress={() => setTabActiva(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activa ? D.accent : D.hint}
              />
              <Text style={[styles.tabLabel, activa && styles.tabLabelActiva]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabCount, activa && styles.tabCountActiva]}>
                  <Text style={[styles.tabCountText, activa && styles.tabCountTextActiva]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              tintColor={D.accent}
            />
          }
        >
          <Text style={styles.pageTitle}>
            {tabActiva === "pendiente" ? "Pedidos pendientes" :
             tabActiva === "aprobado"  ? "Pedidos aprobados" : "Pedidos rechazados"}
          </Text>

          {listaPedidos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={52} color={D.hint} />
              <Text style={styles.emptyText}>No hay pedidos {tabActiva === "pendiente" ? "pendientes" : tabActiva === "aprobado" ? "aprobados" : "rechazados"}</Text>
            </View>
          ) : (
            listaPedidos.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                onAprobar={p.estado === "pendiente" ? () => cambiarEstado(p, "aprobado") : undefined}
                onRechazar={p.estado === "pendiente" ? () => cambiarEstado(p, "rechazado") : undefined}
              />
            ))
          )}
        </ScrollView>
      )}

      <NavbarLateral visible={navbarVisible} onClose={() => setNavbarVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  header: {
    backgroundColor: D.header, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  pendienteBadge: {
    backgroundColor: "#FF9800", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, minWidth: 28, alignItems: "center",
  },
  pendienteBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tabs: {
    flexDirection: "row", backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: D.border,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActiva: { borderBottomColor: D.accent },
  tabLabel: { fontSize: 12, color: D.hint, fontWeight: "600" },
  tabLabelActiva: { color: D.accent },
  tabCount: {
    backgroundColor: "#E0E8E4", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tabCountActiva: { backgroundColor: D.accent },
  tabCountText: { fontSize: 10, color: D.hint, fontWeight: "700" },
  tabCountTextActiva: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 48 },
  pageTitle: { fontSize: 20, fontWeight: "700", color: D.label, marginBottom: 16, fontStyle: "italic" },
  emptyBox: { alignItems: "center", paddingTop: 48, gap: 10 },
  emptyText: { fontSize: 14, color: D.hint },
  card: {
    backgroundColor: D.card, borderRadius: 14,
    borderWidth: 1, borderColor: D.border,
    marginBottom: 14, overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 14, borderBottomWidth: 1, borderBottomColor: "#f5f0eb",
  },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  cardCliente: { fontSize: 15, fontWeight: "700", color: D.label },
  cardFecha: { fontSize: 12, color: D.hint, marginTop: 2 },
  estadoBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  estadoBadgeText: { fontSize: 11, fontWeight: "700" },
  itemsList: { paddingHorizontal: 14, paddingTop: 10 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  itemCant: { fontSize: 13, fontWeight: "700", color: D.accent, width: 22 },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 13, fontWeight: "600", color: D.label },
  itemPers: { fontSize: 11, color: D.hint, marginTop: 1 },
  itemPrecio: { fontSize: 13, fontWeight: "700", color: D.label },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f5f0eb",
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: D.label },
  totalValor: { fontSize: 16, fontWeight: "800", color: D.accent },
  tipoBadge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tipoBadgeLlevar: { backgroundColor: "#FFF8E1" },
  tipoBadgeLocal:  { backgroundColor: "#E8F5E9" },
  tipoBadgeText:   { fontSize: 12, fontWeight: "700", color: D.label },
  comprobanteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f5f0eb",
  },
  comprobanteBtnText: { flex: 1, fontSize: 13, color: D.accent, fontWeight: "600" },
  sinComprobante: {
    fontSize: 12, color: D.hint, fontStyle: "italic",
    paddingHorizontal: 14, paddingBottom: 10,
  },
  comprobanteImg: { width: "100%", height: 200, backgroundColor: "#f9f9f9" },
  acciones: {
    flexDirection: "row", gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: "#f5f0eb",
  },
  btnRechazar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: D.danger, borderRadius: 12, paddingVertical: 12,
  },
  btnAprobar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#1B5E20", borderRadius: 12, paddingVertical: 12,
  },
  btnAccionText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
