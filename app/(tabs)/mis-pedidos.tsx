import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, LayoutAnimation, Platform, UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { pedidosService, type Pedido, type EstadoPedido } from "@/frontend/services/pedidos.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const D = {
  bg:         "#EDF7F4",
  card:       "#ffffff",
  cardBorder: "#C8DDD7",
  surface:    "#D4EDE6",
  primary:    "#2C1819",
  secondary:  "#6FA58B",
  accent:     "#0D5A52",
  accentBg:   "#C0DDD5",
  danger:     "#541A1A",
  pendiente:  { bg: "#FFF8E1", text: "#B45309", border: "#FDE68A" },
  aprobado:   { bg: "#C0DDD5", text: "#0D5A52", border: "#6FA58B" },
  rechazado:  { bg: "#FFF0F0", text: "#541A1A", border: "#FECACA" },
} as const;

type TabKey = "pendiente" | "aprobado" | "rechazado";

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "pendiente", label: "Pendientes",  icon: "time-outline"             },
  { key: "aprobado",  label: "Aprobados",   icon: "checkmark-circle-outline" },
  { key: "rechazado", label: "Rechazados",  icon: "close-circle-outline"     },
];

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const col = D[estado];
  return (
    <View style={[styles.badge, { backgroundColor: col.bg, borderColor: col.border }]}>
      <Text style={[styles.badgeText, { color: col.text }]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Text>
    </View>
  );
}

// ── Ítem con acordeón de personalizaciones ────────────────────────────────────
function ItemRow({ item }: { item: Pedido["items"][number] }) {
  const [expandido, setExpandido] = useState(false);
  const tienePers = item.personalizaciones.length > 0;

  const toggleExpandir = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandido((v) => !v);
  };

  return (
    <View style={styles.itemWrap}>
      {/* Fila principal */}
      <View style={styles.itemRow}>
        <View style={styles.itemCantWrap}>
          <Text style={styles.itemCant}>{item.cantidad}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.itemNombre}>{item.nombre}</Text>

          {/* Tipo por ítem */}
          {item.tipo_pedido && (
            <View style={[styles.itemTipoBadge, item.tipo_pedido === "local" ? styles.tipoBadgeLocal : styles.tipoBadgeLlevar]}>
              <Ionicons
                name={item.tipo_pedido === "local" ? "cafe-outline" : "bag-outline"}
                size={11}
                color={item.tipo_pedido === "local" ? "#1B5E20" : "#B45309"}
              />
              <Text style={[styles.itemTipoText, item.tipo_pedido === "local" ? styles.itemTipoTextLocal : styles.itemTipoTextLlevar]}>
                {item.tipo_pedido === "local" ? "En el local" : "Para llevar"}
              </Text>
            </View>
          )}

          {/* Acordeón de personalizaciones */}
          {tienePers && (
            <>
              <TouchableOpacity style={styles.persToggle} onPress={toggleExpandir} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={12} color={D.secondary} />
                <Text style={styles.persToggleText}>
                  {item.personalizaciones.length} personalización{item.personalizaciones.length > 1 ? "es" : ""}
                </Text>
                <Ionicons name={expandido ? "chevron-up" : "chevron-down"} size={12} color={D.secondary} />
              </TouchableOpacity>

              {expandido && (
                <View style={styles.persLista}>
                  {item.personalizaciones.map((p, i) => (
                    <View key={i} style={styles.persItem}>
                      <View style={styles.persDot} />
                      <Text style={styles.persNombre}>{p.nombre}:</Text>
                      <Text style={styles.persOpcion}>{p.opcion}</Text>
                      {p.precio_adicional > 0 && (
                        <Text style={styles.persPrecio}>+Bs. {p.precio_adicional.toFixed(2)}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <Text style={styles.itemPrecio}>Bs. {(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
      </View>
    </View>
  );
}

// ── Card de pedido ────────────────────────────────────────────────────────────
function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [verFoto, setVerFoto] = useState(false);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.cardId}>#{pedido.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.cardFecha}>{formatFecha(pedido.created_at)}</Text>
        </View>
        <EstadoBadge estado={pedido.estado} />
      </View>

      {/* Ítems */}
      <View style={styles.itemsList}>
        {pedido.items.map((item, i) => (
          <ItemRow key={i} item={item} />
        ))}
      </View>

      {/* Total */}
      <View style={styles.footerRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.totalValor}>Bs. {pedido.total.toFixed(2)}</Text>
        </View>
      </View>

      {pedido.hora_recogida && (
        <View style={styles.horaDestacada}>
          <Ionicons name="alarm-outline" size={14} color="#B45309" />
          <Text style={styles.horaDestacadaLabel}>Recoger a las</Text>
          <Text style={styles.horaDestacadaValor}>
            {new Date(pedido.hora_recogida).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      )}

      {/* Comprobante */}
      {pedido.comprobante_url ? (
        <>
          <TouchableOpacity style={styles.comprobanteBtn} onPress={() => setVerFoto(!verFoto)} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={15} color={D.accent} />
            <Text style={styles.comprobanteBtnText}>{verFoto ? "Ocultar comprobante" : "Ver comprobante"}</Text>
            <Ionicons name={verFoto ? "chevron-up" : "chevron-down"} size={13} color={D.accent} />
          </TouchableOpacity>
          {verFoto && <Image source={{ uri: pedido.comprobante_url }} style={styles.comprobanteImg} resizeMode="contain" />}
        </>
      ) : null}

      {/* Banner aprobado */}
      {pedido.estado === "aprobado" && (
        <View style={styles.aprobadoBanner}>
          <Ionicons name="checkmark-circle" size={15} color={D.aprobado.text} />
          <Text style={styles.aprobadoBannerText}>Pedido aprobado — ¡ya puedes recogerlo!</Text>
        </View>
      )}

      {/* Banner rechazado + motivo */}
      {pedido.estado === "rechazado" && (
        <View style={styles.rechazadoBanner}>
          <View style={styles.rechazadoHeader}>
            <Ionicons name="close-circle" size={15} color={D.rechazado.text} />
            <Text style={styles.rechazadoBannerText}>Pedido rechazado por la cafetería</Text>
          </View>
          {pedido.motivo_rechazo ? (
            <View style={styles.motivoBox}>
              <Text style={styles.motivoLabel}>Motivo:</Text>
              <Text style={styles.motivoTexto}>{pedido.motivo_rechazo}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function MisPedidosScreen() {
  const { token } = useAuth();
  const { fs } = useResponsive();
  const [tabActiva, setTabActiva] = useState<TabKey>("pendiente");
  const [pedidos, setPedidos] = useState<Record<TabKey, Pedido[]>>({ pendiente: [], aprobado: [], rechazado: [] });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!token) return;
    if (!silencioso) setCargando(true);
    try {
      const { pedidos: todos } = await pedidosService.misPedidos(token);
      setPedidos({
        pendiente: todos.filter((p) => p.estado === "pendiente"),
        aprobado:  todos.filter((p) => p.estado === "aprobado"),
        rechazado: todos.filter((p) => p.estado === "rechazado"),
      });
    } catch {}
    finally { setCargando(false); setRefrescando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const lista = pedidos[tabActiva];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const activa = tabActiva === tab.key;
          const count  = pedidos[tab.key].length;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tab, activa && styles.tabActiva]} onPress={() => setTabActiva(tab.key)}>
              <Ionicons name={tab.icon} size={15} color={activa ? "#fff" : "rgba(255,255,255,0.55)"} />
              <Text style={[styles.tabLabel, activa && styles.tabLabelActiva]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activa && styles.tabBadgeActiva]}>
                  <Text style={[styles.tabBadgeText, activa && styles.tabBadgeTextActiva]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {cargando ? (
        <View style={styles.center}><ActivityIndicator size="large" color={D.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={D.accent} />}
        >
          {lista.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={36} color={D.secondary} />
              </View>
              <Text style={styles.emptyTitle}>
                {tabActiva === "pendiente" ? "Sin pedidos pendientes" : tabActiva === "aprobado" ? "Sin pedidos aprobados" : "Sin pedidos rechazados"}
              </Text>
              <Text style={styles.emptySub}>
                {tabActiva === "pendiente" ? "Tus pedidos aparecerán aquí mientras esperan confirmación" : tabActiva === "aprobado" ? "Los pedidos confirmados se mostrarán aquí" : "Los pedidos rechazados se mostrarán aquí"}
              </Text>
            </View>
          ) : (
            lista.map((p) => <PedidoCard key={p.id} pedido={p} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: { backgroundColor: D.accent, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 0 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", paddingBottom: 0 },

  tabsRow: { flexDirection: "row", backgroundColor: D.accent },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 13,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActiva:          { borderBottomColor: "#fff" },
  tabLabel:           { fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: "600" },
  tabLabelActiva:     { color: "#fff" },
  tabBadge:           { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActiva:     { backgroundColor: "rgba(255,255,255,0.3)" },
  tabBadgeText:       { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  tabBadgeTextActiva: { color: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 110 },

  emptyBox:     { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 20, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },
  emptyTitle:   { fontSize: 16, fontWeight: "700", color: D.primary, textAlign: "center" },
  emptySub:     { fontSize: 13, color: D.secondary, textAlign: "center", lineHeight: 20 },

  card: {
    backgroundColor: D.card, borderRadius: 16,
    borderWidth: 1, borderColor: D.cardBorder,
    marginBottom: 12, overflow: "hidden",
    shadowColor: "#0D5A52", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: D.surface },
  cardId:     { fontSize: 13, fontWeight: "700", color: D.primary, marginBottom: 2 },
  cardFecha:  { fontSize: 11, color: D.secondary },

  badge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  itemsList: { paddingHorizontal: 14, paddingVertical: 10 },
  itemWrap:  { marginBottom: 8 },
  itemRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  itemCantWrap: { width: 22, height: 22, borderRadius: 6, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center", marginTop: 1 },
  itemCant:  { fontSize: 11, fontWeight: "800", color: D.accent },
  itemNombre:{ fontSize: 13, fontWeight: "600", color: D.primary },
  itemPrecio:{ fontSize: 13, fontWeight: "700", color: D.primary, minWidth: 70, textAlign: "right" },

  itemTipoBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  tipoBadgeLlevar: { backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FDE68A" },
  tipoBadgeLocal:  { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#A5D6A7" },
  itemTipoText:    { fontSize: 10, fontWeight: "700" },
  itemTipoTextLlevar: { color: "#B45309" },
  itemTipoTextLocal:  { color: "#1B5E20" },

  // Acordeón de personalizaciones
  persToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5, alignSelf: "flex-start" },
  persToggleText: { fontSize: 11, color: D.secondary, fontWeight: "600" },
  persLista:  { marginTop: 6, backgroundColor: D.surface, borderRadius: 8, padding: 8, gap: 4 },
  persItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
  persDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: D.secondary },
  persNombre: { fontSize: 11, color: D.secondary, fontWeight: "600" },
  persOpcion: { fontSize: 11, color: D.primary, flex: 1 },
  persPrecio: { fontSize: 11, color: D.accent, fontWeight: "700" },

  footerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: D.surface,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: D.primary },
  totalValor: { fontSize: 16, fontWeight: "800", color: D.accent },
  horaDestacada: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 14, marginBottom: 10, backgroundColor: "#FFFBEB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#FDE68A" },
  horaDestacadaLabel: { fontSize: 12, color: "#92400E", fontWeight: "600" },
  horaDestacadaValor: { fontSize: 14, fontWeight: "800", color: "#B45309" },

  comprobanteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: D.surface,
  },
  comprobanteBtnText: { flex: 1, fontSize: 12, color: D.accent, fontWeight: "600" },
  comprobanteImg: { width: "100%", height: 180, backgroundColor: D.surface },

  aprobadoBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: D.aprobado.border,
    backgroundColor: D.aprobado.bg,
  },
  aprobadoBannerText: { fontSize: 12, color: D.aprobado.text, fontWeight: "600" },

  rechazadoBanner: {
    borderTopWidth: 1, borderTopColor: D.rechazado.border,
    backgroundColor: D.rechazado.bg,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  rechazadoHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  rechazadoBannerText: { fontSize: 12, color: D.rechazado.text, fontWeight: "600" },
  motivoBox:   { marginTop: 8, backgroundColor: "rgba(84,26,26,0.07)", borderRadius: 8, padding: 10 },
  motivoLabel: { fontSize: 10, fontWeight: "800", color: D.rechazado.text, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  motivoTexto: { fontSize: 13, color: D.rechazado.text, lineHeight: 18 },
});
