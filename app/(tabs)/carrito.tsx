import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/frontend/context/AuthContext";
import { useCart, type CartItem, type TipoPedidoItem } from "@/frontend/context/CartContext";
import { cafeteriasService } from "@/frontend/services/cafeterias.service";
import { pedidosService, type PedidoItem, type TipoPedido } from "@/frontend/services/pedidos.service";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

const D = {
  bg:         "#EDF7F4",
  card:       "#ffffff",
  border:     "#C8DDD7",
  surface:    "#D4EDE6",
  primary:    "#2C1819",
  secondary:  "#6FA58B",
  accent:     "#0D5A52",
  accentBg:   "#C0DDD5",
  danger:     "#541A1A",
  dangerBg:   "#FFF0F0",
} as const;

const TAB_BAR_H = 64;

function ItemRow({ item }: { item: CartItem }) {
  const { actualizar, eliminar, items, actualizarTipo } = useCart();
  const precioUnit = item.producto.precio + item.personalizaciones.reduce((s, p) => s + p.precio_adicional, 0);
  const subtotal   = (precioUnit * item.cantidad).toFixed(2);
  const stock      = item.producto.stock;
  const totalProducto = items.filter((i) => i.producto.id === item.producto.id).reduce((s, i) => s + i.cantidad, 0);
  const atLimit    = stock !== null && stock !== undefined && totalProducto >= stock;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemImgWrap}>
        {item.producto.imagen_url
          ? <Image source={{ uri: item.producto.imagen_url }} style={styles.itemImg} resizeMode="cover" />
          : <Text style={styles.itemEmoji}>☕</Text>
        }
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre} numberOfLines={2}>{item.producto.nombre}</Text>
        {item.personalizaciones.length > 0 && (
          <Text style={styles.itemPers} numberOfLines={1}>{item.personalizaciones.map((p) => p.opcion_nombre).join(" · ")}</Text>
        )}
        <Text style={styles.itemPrecioUnit}>Bs. {precioUnit.toFixed(2)} c/u</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => actualizar(item.id, item.cantidad - 1)}>
            <Ionicons name="remove" size={15} color={D.accent} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.cantidad}</Text>
          <TouchableOpacity style={[styles.qtyBtn, atLimit && styles.qtyBtnDisabled]} onPress={() => !atLimit && actualizar(item.id, item.cantidad + 1)} disabled={atLimit}>
            <Ionicons name="add" size={15} color={atLimit ? D.secondary : D.accent} />
          </TouchableOpacity>
        </View>

        {/* ── Tipo de pedido por ítem ── */}
        <View style={styles.itemTipoRow}>
          <TouchableOpacity
            style={[styles.itemTipoChip, item.tipo_pedido === "llevar" && styles.itemTipoChipSelLlevar]}
            onPress={() => actualizarTipo(item.id, "llevar")}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-outline" size={13} color={item.tipo_pedido === "llevar" ? "#fff" : D.secondary} />
            <Text style={[styles.itemTipoText, item.tipo_pedido === "llevar" && styles.itemTipoTextSelLlevar]}>Llevar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.itemTipoChip, item.tipo_pedido === "local" && styles.itemTipoChipSel]}
            onPress={() => actualizarTipo(item.id, "local")}
            activeOpacity={0.8}
          >
            <Ionicons name="cafe-outline" size={13} color={item.tipo_pedido === "local" ? D.accent : D.secondary} />
            <Text style={[styles.itemTipoText, item.tipo_pedido === "local" && styles.itemTipoTextSel]}>Aquí</Text>
          </TouchableOpacity>
        </View>

        {/* ── Banner recordatorio cuando es para llevar ── */}
        {item.tipo_pedido === "llevar" && (
          <View style={styles.itemLlevarBanner}>
            <Ionicons name="time-outline" size={11} color="#B45309" />
            <Text style={styles.itemLlevarBannerText}>Selecciona hora de recogida abajo</Text>
          </View>
        )}

        {atLimit && <Text style={styles.stockWarn}>Máx. disponible: {stock}</Text>}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemSubtotal}>Bs. {subtotal}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminar(item.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={17} color={D.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyCart() {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bag-outline" size={48} color={D.secondary} />
      </View>
      <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
      <Text style={styles.emptySub}>Agrega productos desde el menú de una cafetería</Text>
      <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)" as never)}>
        <Text style={styles.browseBtnText}>Ver cafeterías</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CarritoScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { items, cafeteria_id, cafeteria_nombre, sucursal_id, total, cantidad_total, vaciar } = useCart();
  const { fs, wp, hp } = useResponsive();

  const [modalVisible, setModalVisible] = useState(false);
  const [paso, setPaso] = useState<"qr" | "comprobante" | "enviando" | "exito">("qr");
  const [qrUrl, setQrUrl]              = useState<string | null>(null);
  const [comprobante, setComprobante]  = useState<string | null>(null);
  const [cargandoQr, setCargandoQr]    = useState(false);

  const [horaRecogida, setHoraRecogida] = useState<string | null>(null);
  const [horaCustom, setHoraCustom] = useState("");
  const [mostrarCustom, setMostrarCustom] = useState(false);

  const tieneLlevar = items.some((i) => i.tipo_pedido === "llevar");

  const generarPresets = () => {
    const ahora = new Date();
    const presets: { label: string; value: string }[] = [];
    [15, 30, 45, 60].forEach((min) => {
      const d = new Date(ahora.getTime() + min * 60 * 1000);
      const h = d.getHours().toString().padStart(2, "0");
      const m = d.getMinutes().toString().padStart(2, "0");
      presets.push({ label: `En ${min} min (${h}:${m})`, value: d.toISOString() });
    });
    return presets;
  };

  const presets = generarPresets();

  const handleVaciar = () =>
    Alert.alert("Vaciar carrito", "¿Eliminar todos los productos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vaciar", style: "destructive", onPress: vaciar },
    ]);

  const irAQr = async () => {
    if (!token || !cafeteria_id) return;
    setCargandoQr(true); setPaso("qr");
    try {
      const { cafeteria } = await cafeteriasService.obtener(token, cafeteria_id);
      setQrUrl(cafeteria.qr_pago_url ?? null);
    } catch { setQrUrl(null); }
    finally { setCargandoQr(false); }
  };

  const abrirModalPago = () => {
    setComprobante(null); setQrUrl(null);
    setModalVisible(true);
    irAQr();
  };

  const seleccionarComprobante = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para subir el comprobante."); return; }
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        quality: 0.85,
      });
      if (!resultado.canceled && resultado.assets.length > 0) {
        setComprobante(resultado.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "No se pudo abrir la galería. Intenta de nuevo.");
    }
  };

  const enviarPedido = async () => {
    if (!token || !cafeteria_id || !sucursal_id) return;
    setPaso("enviando");
    try {
      let comprobante_url: string | undefined;
      if (comprobante) comprobante_url = await subirImagenCloudinary(comprobante);

      const pedidoItems: PedidoItem[] = items.map((item) => ({
        producto_id:     item.producto.id,
        nombre:          item.producto.nombre,
        precio_unitario: item.producto.precio + item.personalizaciones.reduce((s, p) => s + p.precio_adicional, 0),
        cantidad:        item.cantidad,
        tipo_pedido:     item.tipo_pedido,
        personalizaciones: item.personalizaciones.map((p) => ({
          nombre: p.personalizacion_nombre,
          opcion: p.opcion_nombre,
          precio_adicional: p.precio_adicional,
        })),
      }));

      // Tipo de pedido a nivel de orden: "local" si algún ítem es para el local
      const localCount  = items.filter((i) => i.tipo_pedido === "local").length;
      const tipoOrden: TipoPedido = localCount >= items.length / 2 && localCount > 0 ? "local" : "llevar";

      await pedidosService.crear(token, {
        cafeteria_id, sucursal_id, items: pedidoItems,
        total, tipo_pedido: tipoOrden, comprobante_url,
        hora_recogida: horaRecogida ?? undefined,
      });
      vaciar();
      setPaso("exito");
    } catch (err: any) {
      setModalVisible(false);
      Alert.alert("Error", err.message ?? "No se pudo enviar el pedido.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi carrito</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleVaciar} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? <EmptyCart /> : (
        <>
          <View style={styles.cafeBar}>
            <Ionicons name="storefront-outline" size={14} color={D.accent} />
            <Text style={styles.cafeNombre} numberOfLines={1}>{cafeteria_nombre}</Text>
            <View style={styles.cantBadge}><Text style={styles.cantBadgeText}>{cantidad_total}</Text></View>
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <ItemRow item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          <View style={[styles.summary, { paddingBottom: TAB_BAR_H + insets.bottom + 12 }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cantidad_total} {cantidad_total === 1 ? "producto" : "productos"})</Text>
              <Text style={styles.summaryValue}>Bs. {total.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Bs. {total.toFixed(2)}</Text>
            </View>

            {tieneLlevar && (
              <View style={styles.horaSection}>
                <View style={styles.horaHeaderRow}>
                  <View style={styles.horaIconWrap}>
                    <Ionicons name="alarm-outline" size={18} color="#B45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.horaTitle}>Hora de recogida</Text>
                    <Text style={styles.horaSub}>Selecciona cuándo pasarás a recoger tu pedido</Text>
                  </View>
                </View>
                <View style={styles.presetsRow}>
                  {presets.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      style={[styles.presetChip, horaRecogida === p.value && styles.presetChipSel]}
                      onPress={() => { setHoraRecogida(p.value); setMostrarCustom(false); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.presetChipText, horaRecogida === p.value && styles.presetChipTextSel]}>
                        {p.label.split(" (")[0]}
                      </Text>
                      <Text style={[styles.presetChipHora, horaRecogida === p.value && styles.presetChipTextSel]}>
                        {p.label.match(/\((.+)\)/)?.[1] ?? ""}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.presetChip, mostrarCustom && styles.presetChipSel]}
                    onPress={() => { setMostrarCustom(!mostrarCustom); setHoraRecogida(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetChipText, mostrarCustom && styles.presetChipTextSel]}>Otra hora</Text>
                    <Ionicons name="create-outline" size={12} color={mostrarCustom ? "#B45309" : D.secondary} />
                  </TouchableOpacity>
                </View>
                {mostrarCustom && (
                  <View style={styles.customRow}>
                    <Ionicons name="time-outline" size={16} color={D.accent} />
                    <TextInput
                      style={styles.customInput}
                      placeholder="Ej: 15:30"
                      placeholderTextColor={D.secondary}
                      value={horaCustom}
                      onChangeText={setHoraCustom}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <TouchableOpacity
                      style={[styles.customBtn, !horaCustom && { opacity: 0.5 }]}
                      onPress={() => {
                        if (horaCustom && /^\d{1,2}:\d{2}$/.test(horaCustom)) {
                          const [h, m] = horaCustom.split(":").map(Number);
                          const d = new Date();
                          d.setHours(h, m, 0, 0);
                          setHoraRecogida(d.toISOString());
                        }
                      }}
                      disabled={!horaCustom}
                    >
                      <Text style={styles.customBtnText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {horaRecogida && (
                  <View style={styles.horaConfirmada}>
                    <Ionicons name="checkmark-circle" size={16} color="#1B5E20" />
                    <Text style={styles.horaConfirmadaText}>
                      Recoger a las {new Date(horaRecogida).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                )}
                {!horaRecogida && (
                  <Text style={styles.horaWarning}>Selecciona una hora para continuar</Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.pedidoBtn} onPress={abrirModalPago} activeOpacity={0.85}>
              <Ionicons name="bag-check-outline" size={19} color="#fff" />
              <Text style={styles.pedidoBtnText}>Realizar pedido</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Modal de pago ── */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { minHeight: hp(40) }]}>

            {paso === "exito" ? (
              <View style={styles.exitoBox}>
                <View style={styles.exitoIconWrap}>
                  <Ionicons name="checkmark-circle" size={64} color={D.accent} />
                </View>
                <Text style={styles.exitoTitle}>¡Pedido enviado!</Text>
                <Text style={styles.exitoSub}>Tu pedido está pendiente de aprobación. Te avisaremos cuando sea confirmado.</Text>
                <TouchableOpacity style={styles.exitoBtn} onPress={() => { setModalVisible(false); router.push("/(tabs)/mis-pedidos" as never); }}>
                  <Text style={styles.exitoBtnText}>Ver mis pedidos</Text>
                </TouchableOpacity>
              </View>

            ) : paso === "enviando" ? (
              <View style={styles.exitoBox}>
                <ActivityIndicator size="large" color={D.accent} />
                <Text style={styles.enviandoText}>Enviando pedido...</Text>
              </View>

            ) : (
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Header del modal */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {paso === "qr" ? "Realizar pago" : "Comprobante"}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose} hitSlop={8}>
                    <Ionicons name="close" size={18} color={D.primary} />
                  </TouchableOpacity>
                </View>

                {/* Indicador de pasos */}
                <View style={styles.pasosRow}>
                  {(["qr", "comprobante"] as const).map((p, idx) => {
                    const pasoIdx    = ["qr", "comprobante"].indexOf(paso);
                    const activo     = paso === p;
                    const completado = pasoIdx > idx;
                    const labels     = ["Pagar QR", "Comprobante"];
                    return (
                      <React.Fragment key={p}>
                        {idx > 0 && <View style={[styles.pasoLinea, completado && styles.pasoLineaOk]} />}
                        <View style={styles.paso}>
                          <View style={[styles.pasoCircle, activo && styles.pasoCircleActivo, completado && styles.pasoCircleOk]}>
                            {completado
                              ? <Ionicons name="checkmark" size={12} color="#fff" />
                              : <Text style={[styles.pasoNum, (activo || completado) && styles.pasoNumActivo]}>{idx + 1}</Text>
                            }
                          </View>
                          <Text style={[styles.pasoLabel, activo && styles.pasoLabelActivo]}>{labels[idx]}</Text>
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* ── Paso 1: QR ── */}
                {paso === "qr" && (
                  <>
                    <Text style={styles.instruccion}>Escanea el QR y realiza el pago de:</Text>
                    <Text style={[styles.totalDestacado, { fontSize: fs(26) }]}>Bs. {total.toFixed(2)}</Text>
                    {cargandoQr ? (
                      <View style={styles.qrPlaceholder}><ActivityIndicator size="large" color={D.accent} /></View>
                    ) : qrUrl ? (
                      <View style={styles.qrBox}>
                        <Image source={{ uri: qrUrl }} style={[styles.qrImage, { width: wp(55), height: wp(55) }]} resizeMode="contain" />
                      </View>
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code-outline" size={48} color={D.secondary} />
                        <Text style={styles.qrNoDisp}>El administrador aún no configuró el QR de pago</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => setPaso("comprobante")}>
                      <Text style={styles.btnPrimaryText}>Ya pagué → Subir comprobante</Text>
                      <Ionicons name="arrow-forward" size={17} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}

                {/* ── Paso 2: Comprobante ── */}
                {paso === "comprobante" && (
                  <>
                    <Text style={styles.instruccion}>Sube una foto o captura de tu comprobante de pago.</Text>
                    {comprobante ? (
                      <View style={styles.comprobBox}>
                        <Image source={{ uri: comprobante }} style={[styles.comprobImg, { height: hp(28) }]} resizeMode="cover" />
                        <TouchableOpacity style={styles.comprobCambiar} onPress={seleccionarComprobante}>
                          <Ionicons name="camera-outline" size={15} color="#fff" />
                          <Text style={styles.comprobCambiarText}>Cambiar imagen</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.uploadBox} onPress={seleccionarComprobante} activeOpacity={0.85}>
                        <View style={styles.uploadIconWrap}>
                          <Ionicons name="cloud-upload-outline" size={32} color={D.accent} />
                        </View>
                        <Text style={styles.uploadTitle}>Seleccionar comprobante</Text>
                        <Text style={styles.uploadSub}>Toca para abrir la galería</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.botonesRow}>
                      <TouchableOpacity style={styles.btnSecondary} onPress={() => setPaso("qr")}>
                        <Text style={styles.btnSecondaryText}>Volver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnPrimary, { flex: 2 }, !comprobante && styles.btnDisabled]} onPress={enviarPedido} disabled={!comprobante}>
                        <Ionicons name="send-outline" size={15} color="#fff" />
                        <Text style={styles.btnPrimaryText}>Enviar pedido</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: D.accent, paddingHorizontal: 20, paddingVertical: 18 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  clearBtn:    { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 },
  clearText:   { fontSize: 13, color: "#fff", fontWeight: "600" },

  cafeBar: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: D.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: D.border },
  cafeNombre:   { flex: 1, fontSize: 13, fontWeight: "700", color: D.primary },
  cantBadge:    { backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cantBadgeText:{ fontSize: 12, color: "#fff", fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 8 },
  separator:   { height: 1, backgroundColor: D.border, marginHorizontal: 4 },

  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14 },
  itemImgWrap: { width: 64, height: 64, borderRadius: 14, backgroundColor: D.surface, overflow: "hidden", alignItems: "center", justifyContent: "center", flexShrink: 0, borderWidth: 1, borderColor: D.border },
  itemImg:     { width: "100%", height: "100%" },
  itemEmoji:   { fontSize: 26 },
  itemInfo:    { flex: 1, gap: 3 },
  itemNombre:  { fontSize: 14, fontWeight: "700", color: D.primary, lineHeight: 18 },
  itemPers:    { fontSize: 11, color: D.accent, fontWeight: "600" },
  itemPrecioUnit: { fontSize: 12, color: D.secondary },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center" },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyText: { fontSize: 15, fontWeight: "700", color: D.primary, minWidth: 20, textAlign: "center" },
  stockWarn: { fontSize: 10, color: "#B45309", fontWeight: "600", marginTop: 2 },

  itemTipoRow:     { flexDirection: "row", gap: 8, marginTop: 6 },
  itemTipoChip:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, borderWidth: 1.5, borderColor: D.border, paddingVertical: 7, backgroundColor: D.card },
  itemTipoChipSel: { borderColor: D.accent, backgroundColor: D.accentBg },
  itemTipoChipSelLlevar: { borderColor: "#B45309", backgroundColor: "#B45309" },
  itemTipoEmoji:   { fontSize: 12 },
  itemTipoText:    { fontSize: 12, fontWeight: "700", color: D.secondary },
  itemTipoTextSel: { color: D.accent },
  itemTipoTextSelLlevar: { color: "#fff" },
  itemLlevarBanner: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, backgroundColor: "#FFF8E1", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  itemLlevarBannerText: { fontSize: 10, color: "#B45309", fontWeight: "600" },

  itemRight:    { alignItems: "flex-end", gap: 10, flexShrink: 0 },
  itemSubtotal: { fontSize: 15, fontWeight: "800", color: D.accent },
  deleteBtn:    { padding: 4 },

  emptyBox:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyIconWrap:{ width: 90, height: 90, borderRadius: 24, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },
  emptyTitle:   { fontSize: 20, fontWeight: "800", color: D.primary },
  emptySub:     { fontSize: 14, color: D.secondary, textAlign: "center", lineHeight: 20 },
  browseBtn:    { marginTop: 8, backgroundColor: D.accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText:{ color: "#fff", fontWeight: "700", fontSize: 14 },

  summary: { backgroundColor: D.surface, borderTopWidth: 1, borderTopColor: D.border, paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: D.secondary },
  summaryValue: { fontSize: 14, color: D.primary, fontWeight: "600" },
  totalRow:     { borderTopWidth: 1, borderTopColor: D.border, paddingTop: 10 },
  totalLabel:   { fontSize: 16, fontWeight: "800", color: D.primary },
  totalValue:   { fontSize: 18, fontWeight: "800", color: D.accent },
  pedidoBtn:    { backgroundColor: D.accent, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10, marginTop: 4 },
  pedidoBtnText:{ fontSize: 16, fontWeight: "800", color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(44,24,25,0.45)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", minHeight: 300 },
  modalScroll:  { padding: 22, paddingBottom: 40 },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  modalTitle:   { fontSize: 20, fontWeight: "800", color: D.primary },
  modalClose:   { width: 34, height: 34, borderRadius: 17, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },

  pasosRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  paso:     { alignItems: "center", gap: 4 },
  pasoCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: D.border, alignItems: "center", justifyContent: "center" },
  pasoCircleActivo: { backgroundColor: D.accent },
  pasoCircleOk:     { backgroundColor: "#1B5E20" },
  pasoNum:          { fontSize: 12, fontWeight: "800", color: D.secondary },
  pasoNumActivo:    { color: "#fff" },
  pasoLabel:        { fontSize: 10, color: D.secondary, fontWeight: "600" },
  pasoLabelActivo:  { color: D.accent },
  pasoLinea:        { flex: 1, height: 2, backgroundColor: D.border, marginHorizontal: 6, marginBottom: 16 },
  pasoLineaOk:      { backgroundColor: "#1B5E20" },

  instruccion:    { fontSize: 14, color: D.secondary, lineHeight: 20, marginBottom: 14, textAlign: "center" },
  totalDestacado: { fontSize: 34, fontWeight: "800", color: D.accent, textAlign: "center", marginBottom: 18 },
  qrBox:          { backgroundColor: D.surface, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: D.border, marginBottom: 22 },
  qrImage:        { width: 220, height: 220 },
  qrPlaceholder:  { height: 180, backgroundColor: D.surface, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1.5, borderColor: D.border, borderStyle: "dashed", marginBottom: 22 },
  qrNoDisp:       { fontSize: 13, color: D.secondary, textAlign: "center", paddingHorizontal: 24 },

  comprobBox:        { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  comprobImg:        { width: "100%", height: 220 },
  comprobCambiar:    { backgroundColor: "rgba(13,90,82,0.88)", paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  comprobCambiarText:{ color: "#fff", fontWeight: "700", fontSize: 14 },
  uploadBox:         { backgroundColor: D.surface, borderRadius: 18, borderWidth: 2, borderColor: D.border, borderStyle: "dashed", alignItems: "center", paddingVertical: 40, gap: 8, marginBottom: 20 },
  uploadIconWrap:    { width: 60, height: 60, borderRadius: 16, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center" },
  uploadTitle:       { fontSize: 15, fontWeight: "700", color: D.primary },
  uploadSub:         { fontSize: 12, color: D.secondary },

  botonesRow: { flexDirection: "row", gap: 10 },
  btnPrimary: { flex: 1, backgroundColor: D.accent, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, gap: 8 },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnSecondary:   { flex: 1, backgroundColor: D.surface, borderRadius: 16, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: D.border },
  btnSecondaryText:{ color: D.accent, fontWeight: "700", fontSize: 14 },
  btnDisabled:    { backgroundColor: D.border },

  exitoBox:     { alignItems: "center", padding: 40, gap: 14 },
  exitoIconWrap:{ width: 96, height: 96, borderRadius: 28, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center" },
  exitoTitle:   { fontSize: 24, fontWeight: "800", color: D.primary },
  exitoSub:     { fontSize: 14, color: D.secondary, textAlign: "center", lineHeight: 20 },
  exitoBtn:     { backgroundColor: D.accent, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  exitoBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  enviandoText: { fontSize: 16, color: D.primary, fontWeight: "600", marginTop: 12 },

  horaSection: { marginTop: 4, borderTopWidth: 1, borderTopColor: D.border, paddingTop: 14, backgroundColor: "#FFFBF0", borderRadius: 14, paddingHorizontal: 14, paddingBottom: 14, borderWidth: 1.5, borderColor: "#FDE68A" },
  horaHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  horaIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF8E1", alignItems: "center", justifyContent: "center" },
  horaTitle: { fontSize: 14, fontWeight: "800", color: "#B45309" },
  horaSub: { fontSize: 11, color: D.secondary, marginTop: 2 },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  presetChip: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, borderWidth: 1, borderColor: D.border, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: D.card },
  presetChipSel: { borderColor: "#B45309", backgroundColor: "#FFF8E1" },
  presetChipText: { fontSize: 11, fontWeight: "600", color: D.secondary },
  presetChipTextSel: { color: "#B45309" },
  presetChipHora: { fontSize: 10, color: D.secondary },
  customRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  customInput: { flex: 1, backgroundColor: D.card, borderRadius: 8, borderWidth: 1, borderColor: D.border, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: D.primary },
  customBtn: { backgroundColor: "#B45309", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  customBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  horaConfirmada: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "#E8F5E9", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  horaConfirmadaText: { fontSize: 13, fontWeight: "700", color: "#1B5E20" },
  horaWarning: { fontSize: 11, color: "#DC2626", fontWeight: "600", marginTop: 10, textAlign: "center" },
});
