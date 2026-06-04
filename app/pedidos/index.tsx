import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Image, RefreshControl, Modal,
  TextInput, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { useNavbar } from "@/frontend/context/NavbarContext";
import { pedidosService, type Pedido, type EstadoPedido, type TipoPedido } from "@/frontend/services/pedidos.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

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

function AdminItemRow({ item }: { item: { cantidad: number; nombre: string; precio_unitario: number; personalizaciones: Array<{ nombre?: string; opcion: string; precio_adicional?: number }>; tipo_pedido?: string } }) {
  const [expandido, setExpandido] = useState(false);
  const tienePers = item.personalizaciones.length > 0;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandido((v) => !v);
  };

  return (
    <View style={styles.adminItemWrap}>
      <View style={styles.itemRow}>
        <Text style={styles.itemCant}>{item.cantidad}×</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre}>{item.nombre}</Text>
          {item.tipo_pedido && (
            <View style={[styles.itemTipoBadge, item.tipo_pedido === "local" ? styles.itemTipoLocal : styles.itemTipoLlevar]}>
              <Text style={styles.itemTipoText}>
                {item.tipo_pedido === "local" ? "🪑 En el local" : "🛍️ Para llevar"}
              </Text>
            </View>
          )}
          {tienePers && (
            <>
              <TouchableOpacity style={styles.persToggle} onPress={toggle} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={11} color={D.hint} />
                <Text style={styles.persToggleText}>
                  {item.personalizaciones.length} opción{item.personalizaciones.length > 1 ? "es" : ""}
                </Text>
                <Ionicons name={expandido ? "chevron-up" : "chevron-down"} size={11} color={D.hint} />
              </TouchableOpacity>
              {expandido && (
                <View style={styles.persLista}>
                  {item.personalizaciones.map((p, j) => (
                    <View key={j} style={styles.persItem}>
                      <View style={styles.persDot} />
                      {p.nombre && <Text style={styles.persNombre}>{p.nombre}:</Text>}
                      <Text style={styles.persOpcion}>{p.opcion}</Text>
                      {(p.precio_adicional ?? 0) > 0 && (
                        <Text style={styles.persPrecio}>+Bs. {p.precio_adicional!.toFixed(2)}</Text>
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

function PedidoCard({
  pedido,
  onAprobar,
  onRechazar,
}: {
  pedido: Pedido;
  onAprobar?: () => void;
  onRechazar?: () => void;
}) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

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
          <AdminItemRow key={i} item={item} />
        ))}
      </View>

      {/* Tipo de pedido + Total */}
      <View style={styles.totalRow}>
        <View style={{ flex: 1 }}>
          <View style={[
            styles.tipoBadge,
            pedido.tipo_pedido === "local"
              ? styles.tipoBadgeLocal
              : styles.tipoBadgeLlevar,
          ]}>
            <Ionicons
              name={pedido.tipo_pedido === "local" ? "cafe-outline" : "bag-outline"}
              size={14}
              color={pedido.tipo_pedido === "local" ? "#1B5E20" : "#B45309"}
            />
            <Text style={[
              styles.tipoBadgeText,
              pedido.tipo_pedido === "local" ? styles.tipoBadgeTextLocal : styles.tipoBadgeTextLlevar,
            ]}>
              {pedido.tipo_pedido === "local" ? "En el local" : "Para llevar"}
            </Text>
          </View>
          {pedido.hora_recogida && (
            <View style={styles.horaDestacada}>
              <Ionicons name="alarm-outline" size={15} color="#B45309" />
              <Text style={styles.horaDestacadaLabel}>Recoger a las</Text>
              <Text style={styles.horaDestacadaValor}>
                {new Date(pedido.hora_recogida).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.totalValor}>Bs. {pedido.total.toFixed(2)}</Text>
      </View>

      {/* Comprobante */}
      {pedido.comprobante_url ? (
        <TouchableOpacity
          style={styles.comprobanteBtn}
          onPress={() => setFotoUrl(pedido.comprobante_url!)}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={16} color={D.accent} />
          <Text style={styles.comprobanteBtnText}>Ver comprobante de pago</Text>
          <Ionicons name="expand-outline" size={14} color={D.accent} />
        </TouchableOpacity>
      ) : (
        <Text style={styles.sinComprobante}>Sin comprobante adjunto</Text>
      )}

      {/* Motivo de rechazo */}
      {pedido.estado === "rechazado" && pedido.motivo_rechazo && (
        <View style={styles.motivoBox}>
          <Ionicons name="information-circle-outline" size={14} color={D.danger} />
          <Text style={styles.motivoText}>{pedido.motivo_rechazo}</Text>
        </View>
      )}

      <Modal visible={!!fotoUrl} transparent animationType="fade" onRequestClose={() => setFotoUrl(null)}>
        <View style={styles.fotoModalOverlay}>
          <TouchableOpacity style={styles.fotoModalClose} onPress={() => setFotoUrl(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.fotoModalImg} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

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
  const { open: openNavbar } = useNavbar();
  const { fs } = useResponsive();
  const [tabActiva, setTabActiva] = useState<Tab>("pendiente");
  const [pedidos, setPedidos] = useState<Record<Tab, Pedido[]>>({
    pendiente: [], aprobado: [], rechazado: [],
  });
  const [cargando, setCargando]     = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Modal de rechazo con justificante
  const [modalRechazo, setModalRechazo]   = useState(false);
  const [pedidoArechazar, setPedidoArechazar] = useState<Pedido | null>(null);
  const [motivo, setMotivo]               = useState("");
  const [rechazando, setRechazando]       = useState(false);

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

  const aprobarPedido = (pedido: Pedido) => {
    Alert.alert(
      "¿Aprobar pedido?",
      `El pedido de ${pedido.cliente?.nom_completo ?? "este cliente"} — Bs. ${pedido.total.toFixed(2)} será aprobado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: async () => {
            if (!token || !usuario?.cafeteria_id) return;
            try {
              await pedidosService.actualizarEstado(token, pedido.id, usuario.cafeteria_id, "aprobado");
              await cargar(true);
            } catch (err: any) { Alert.alert("Error", err.message); }
          },
        },
      ],
    );
  };

  const abrirRechazo = (pedido: Pedido) => {
    setPedidoArechazar(pedido);
    setMotivo("");
    setModalRechazo(true);
  };

  const confirmarRechazo = async () => {
    if (!pedidoArechazar || !token || !usuario?.cafeteria_id) return;
    setRechazando(true);
    try {
      await pedidosService.actualizarEstado(
        token, pedidoArechazar.id, usuario.cafeteria_id, "rechazado", motivo.trim() || undefined,
      );
      setModalRechazo(false);
      await cargar(true);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setRechazando(false);
    }
  };

  const listaPedidos = pedidos[tabActiva];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={D.header} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openNavbar}>
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
                onAprobar={p.estado === "pendiente" ? () => aprobarPedido(p) : undefined}
                onRechazar={p.estado === "pendiente" ? () => abrirRechazo(p) : undefined}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal rechazo con justificante */}
      <Modal visible={modalRechazo} transparent animationType="fade" onRequestClose={() => setModalRechazo(false)}>
        <KeyboardAvoidingView style={styles.rechazoOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.rechazoBox}>
            <Text style={styles.rechazoTitulo}>Rechazar pedido</Text>
            <Text style={styles.rechazoSub}>
              {`Pedido de ${pedidoArechazar?.cliente?.nom_completo ?? "cliente"} · Bs. ${pedidoArechazar?.total.toFixed(2) ?? "0.00"}`}
            </Text>
            <Text style={styles.rechazoLabel}>Motivo del rechazo <Text style={styles.rechazoOpcional}>(opcional)</Text></Text>
            <TextInput
              style={styles.rechazoInput}
              placeholder="Ej: Producto no disponible, horario cerrado..."
              placeholderTextColor={D.hint}
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.rechazoBtns}>
              <TouchableOpacity style={styles.rechazoCancelar} onPress={() => setModalRechazo(false)}>
                <Text style={styles.rechazoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rechazoConfirmar, rechazando && { opacity: 0.6 }]} onPress={confirmarRechazo} disabled={rechazando}>
                {rechazando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.rechazoConfirmarText}>Rechazar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  scroll: { padding: 16, paddingBottom: 84 },
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
  adminItemWrap: { marginBottom: 6 },
  persToggle:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-start" },
  persToggleText:{ fontSize: 10, color: D.hint, fontWeight: "600" },
  persLista:     { marginTop: 5, backgroundColor: "#f8f9fa", borderRadius: 6, padding: 8, gap: 3 },
  persItem:      { flexDirection: "row", alignItems: "center", gap: 4 },
  persDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: D.hint },
  persNombre:    { fontSize: 10, color: D.hint, fontWeight: "700" },
  persOpcion:    { fontSize: 11, color: D.label, flex: 1 },
  persPrecio:    { fontSize: 10, color: D.accent, fontWeight: "700" },
  itemTipoBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  itemTipoLocal:  { backgroundColor: "#E8F5E9" },
  itemTipoLlevar: { backgroundColor: "#FFF8E1" },
  itemTipoText:   { fontSize: 10, fontWeight: "700", color: D.label },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f5f0eb",
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: D.label },
  totalValor: { fontSize: 16, fontWeight: "800", color: D.accent },
  tipoBadge:       { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  tipoBadgeLlevar: { backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FDE68A" },
  tipoBadgeLocal:  { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#A5D6A7" },
  tipoBadgeText:   { fontSize: 13, fontWeight: "700" },
  tipoBadgeTextLlevar: { color: "#B45309" },
  tipoBadgeTextLocal:  { color: "#1B5E20" },
  horaDestacada: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "#FFFBEB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#FDE68A" },
  horaDestacadaLabel: { fontSize: 12, color: "#92400E", fontWeight: "600" },
  horaDestacadaValor: { fontSize: 14, fontWeight: "800", color: "#B45309" },
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
  fotoModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  fotoModalClose: { position: "absolute", top: 48, right: 16, zIndex: 10, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 22, padding: 10 },
  fotoModalImg: { width: "100%", height: "75%" },

  motivoBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#FFF5F5", borderTopWidth: 1, borderTopColor: "#FFCDD2" },
  motivoText: { flex: 1, fontSize: 12, color: D.danger, fontStyle: "italic" },

  rechazoOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  rechazoBox:      { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  rechazoTitulo:   { fontSize: 18, fontWeight: "700", color: D.danger, marginBottom: 4 },
  rechazoSub:      { fontSize: 13, color: D.hint, marginBottom: 20 },
  rechazoLabel:    { fontSize: 13, fontWeight: "600", color: D.label, marginBottom: 8 },
  rechazoOpcional: { fontWeight: "400", color: D.hint },
  rechazoInput:    { backgroundColor: "#f9f9f9", borderRadius: 10, borderWidth: 1, borderColor: D.border, padding: 12, fontSize: 14, color: D.label, minHeight: 90, marginBottom: 20 },
  rechazoBtns:     { flexDirection: "row", gap: 10 },
  rechazoCancelar: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#f0f0f0", alignItems: "center" },
  rechazoCancelarText: { fontWeight: "700", color: D.hint },
  rechazoConfirmar:    { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: D.danger, alignItems: "center" },
  rechazoConfirmarText:{ fontWeight: "700", color: "#fff" },
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
