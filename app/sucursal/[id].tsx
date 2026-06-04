import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { useCart, type OpcionSeleccionada } from "@/frontend/context/CartContext";
import { productosService, type ProductoPublico } from "@/frontend/services/productos.service";
import { personalizacionesService, type Personalizacion } from "@/frontend/services/personalizaciones.service";
import { PersonalizacionModal } from "@/frontend/components/PersonalizacionModal";
import { useResponsive } from "@/frontend/hooks/use-responsive";

function estadoCalc(apertura?: string, cierre?: string): "open" | "warn" | null {
  if (!apertura || !cierre) return "open";
  const now = new Date();
  const [ah, am] = apertura.split(":").map(Number);
  const [ch, cm] = cierre.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const aMin = ah * 60 + am;
  const cMin = ch * 60 + cm;
  if (nowMin < aMin || nowMin >= cMin) return null;
  if (cMin - nowMin <= 30) return "warn";
  return "open";
}

const D = {
  bg:         "#EDF7F4",
  header:     "#0D5A52",
  card:       "#ffffff",
  cardBorder: "#C8DDD7",
  surface:    "#D4EDE6",
  primary:    "#2C1819",
  secondary:  "#6FA58B",
  accent:     "#0D5A52",
  accentBg:   "#C0DDD5",
  price:      "#0D5A52",
  stockWarn:  "#B45309",
  stockOut:   "#541A1A",
  badgeColors: {
    Popular: { bg: "#541A1A", text: "#FFFFFF" },
    Nuevo:   { bg: "#0D5A52", text: "#FFFFFF" },
    Fresco:  { bg: "#1A4A30", text: "#FFFFFF" },
  } as Record<string, { bg: string; text: string }>,
} as const;

function Badge({ label }: { label: string }) {
  const colors = D.badgeColors[label] ?? { bg: "#333", text: "#FFF" };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function ProductoCard({
  item,
  cartQuantity,
  onAgregar,
}: {
  item: ProductoPublico;
  cartQuantity: number;
  onAgregar: (producto: ProductoPublico) => void;
}) {
  const stockLimite = item.stock !== null && item.stock !== undefined;
  const atLimit     = stockLimite && cartQuantity >= (item.stock as number);
  const remaining   = stockLimite ? (item.stock as number) - cartQuantity : null;
  const lowStock    = remaining !== null && remaining <= 3 && remaining > 0;
  const noStock     = stockLimite && (item.stock as number) === 0;

  return (
    <View style={styles.productoCard}>
      {item.badge ? (
        <View style={styles.badgeWrap}>
          <Badge label={item.badge} />
        </View>
      ) : null}

      {/* Indicador de stock bajo — sobre la imagen */}
      {noStock ? (
        <View style={styles.stockOutBanner}>
          <Text style={styles.stockOutText}>Sin stock</Text>
        </View>
      ) : atLimit ? (
        <View style={styles.stockLimitBanner}>
          <Text style={styles.stockLimitText}>Límite alcanzado</Text>
        </View>
      ) : lowStock ? (
        <View style={styles.stockLowBanner}>
          <Text style={styles.stockLowText}>¡Solo quedan {remaining}!</Text>
        </View>
      ) : null}

      <View style={[styles.productoImgWrap, { height: hp(14) }]}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.productoImg} resizeMode="cover" />
        ) : (
          <Text style={[styles.productoEmoji, { fontSize: fs(30) }]}>☕</Text>
        )}
      </View>

      <View style={styles.productoInfo}>
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{item.categoria || "General"}</Text>
        </View>
        <Text style={styles.productoNombre} numberOfLines={2}>{item.nombre}</Text>
        {item.descripcion ? (
          <Text style={styles.productoDesc} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.productoPrecio}>Bs. {item.precio.toFixed(2)}</Text>
          {item.disponible && !noStock ? (
            <TouchableOpacity
              style={[styles.addBtn, atLimit && styles.addBtnDisabled]}
              onPress={() => !atLimit && onAgregar(item)}
              disabled={atLimit}
              hitSlop={6}
            >
              <Ionicons name="add" size={18} color={atLimit ? "#C0C0C0" : "#fff"} />
              {cartQuantity > 0 && (
                <View style={styles.addBtnBadge}>
                  <Text style={styles.addBtnBadgeText}>{cartQuantity > 9 ? "9+" : cartQuantity}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.noDisponible}>
              {noStock ? "Sin stock" : "No disponible"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function SucursalMenuScreen() {
  const {
    id: sucursal_id, cafeteria_id, cafeteria_nombre, sucursal_nombre,
    horario_apertura, horario_cierre,
  } = useLocalSearchParams<{
    id: string;
    cafeteria_id: string;
    cafeteria_nombre: string;
    sucursal_nombre: string;
    horario_apertura?: string;
    horario_cierre?: string;
  }>();

  const { token }   = useAuth();
  const { agregar, actualizar, vaciar, items, cantidad_total, cafeteria_id: cartCafId } = useCart();
  const { fs, hp } = useResponsive();
  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [personalizaciones, setPersonalizaciones] = useState<Personalizacion[]>([]);
  const [cargandoPers, setCargandoPers] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoPublico | null>(null);
  const [catActiva, setCatActiva] = useState("Todas");

  const CATEGORIAS = ["Todas", "Café", "Bebidas", "Repostería", "Salados"];

  const cargar = useCallback(async () => {
    if (!token || !cafeteria_id || !sucursal_id) return;
    setLoading(true);
    try {
      const [{ productos: data }, { personalizaciones: pers }] = await Promise.all([
        productosService.listarPorSucursal(token, cafeteria_id, sucursal_id),
        personalizacionesService.listar(token, cafeteria_id, sucursal_id),
      ]);
      setProductos(data);
      setPersonalizaciones(pers);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando menú");
    } finally {
      setLoading(false);
    }
  }, [token, cafeteria_id, sucursal_id]);

  useEffect(() => { cargar(); }, [cargar]);

  const estadoSucursal = estadoCalc(
    horario_apertura ?? undefined,
    horario_cierre   ?? undefined,
  );

  const getCartQuantity = (productoId: string) =>
    items.filter((i) => i.producto.id === productoId).reduce((s, i) => s + i.cantidad, 0);

  const agregarConPersonalizacion = (producto: ProductoPublico, seleccionadas: OpcionSeleccionada[]) => {
    const sid  = sucursal_id ?? "";
    const snom = sucursal_nombre ?? "";
    const resultado = agregar(producto, cafeteria_id!, cafeteria_nombre ?? "Cafetería", sid, snom, seleccionadas);
    if (resultado === "cafeteria_conflict") {
      Alert.alert(
        "Carrito con otro pedido",
        `Tu carrito tiene productos de otra cafetería. ¿Quieres vaciarlo y agregar de ${cafeteria_nombre}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Vaciar y agregar",
            style: "destructive",
            onPress: () => {
              vaciar();
              agregar(producto, cafeteria_id!, cafeteria_nombre ?? "Cafetería", sid, snom, seleccionadas);
            },
          },
        ],
      );
    } else if (resultado === "stock_exceeded") {
      Alert.alert("Stock agotado", `Ya agregaste el máximo disponible de "${producto.nombre}".`);
    }
  };

  const handleAgregar = (producto: ProductoPublico) => {
    if (personalizaciones.length > 0) {
      setProductoSeleccionado(producto);
      setModalVisible(true);
    } else {
      agregarConPersonalizacion(producto, []);
    }
  };

  const handleReducir = (productoId: string) => {
    // Reduce el último ítem del mismo producto (sin importar personalización)
    const ultimo = [...items].reverse().find((i) => i.producto.id === productoId);
    if (ultimo) actualizar(ultimo.id, ultimo.cantidad - 1);
  };

  const irAlCarrito = () => router.push("/(tabs)/carrito" as never);

  const renderItem = ({ item }: { item: ProductoPublico }) => (
    <ProductoCard
      item={item}
      cartQuantity={getCartQuantity(item.id)}
      onAgregar={handleAgregar}
    />
  );

  const tienePersonalizaciones = personalizaciones.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={irAlCarrito}>
          <Ionicons name="bag-outline" size={22} color="#FFFFFF" />
          {cantidad_total > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cantidad_total > 9 ? "9+" : cantidad_total}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* ── Títulos ───────────────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text style={styles.cafeteriaNombre}>{cafeteria_nombre ?? "Cafetería"}</Text>
        <View style={styles.sucursalRow}>
          <Ionicons name="location" size={13} color={D.accent} />
          <Text style={styles.sucursalNombre}>{sucursal_nombre ?? ""}</Text>
        </View>
        {horario_apertura && horario_cierre ? (
          <View style={styles.horarioRow}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.horarioTxt}>{horario_apertura} – {horario_cierre}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      {estadoSucursal === null ? (
        <View style={styles.cerradoContainer}>
          <View style={styles.cerradoIconWrap}>
            <Ionicons name="lock-closed" size={fs(44)} color={D.accent} />
          </View>
          <Text style={[styles.cerradoTitulo, { fontSize: fs(20) }]}>Fuera de horario</Text>
          <Text style={styles.cerradoDesc}>
            Esta sucursal no está recibiendo pedidos en este momento.
          </Text>
          {horario_apertura && horario_cierre ? (
            <View style={styles.cerradoHorarioBox}>
              <View style={styles.cerradoHoraItem}>
                <Ionicons name="sunny-outline" size={18} color="#B45309" />
                <View>
                  <Text style={styles.cerradoHoraLabel}>Apertura</Text>
                  <Text style={styles.cerradoHoraValor}>{horario_apertura}</Text>
                </View>
              </View>
              <View style={styles.cerradoHoraSep} />
              <View style={styles.cerradoHoraItem}>
                <Ionicons name="moon-outline" size={18} color="#1E3A5F" />
                <View>
                  <Text style={styles.cerradoHoraLabel}>Cierre</Text>
                  <Text style={styles.cerradoHoraValor}>{horario_cierre}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => cargar()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {estadoSucursal === "warn" ? (
            <View style={styles.warnBanner}>
              <Ionicons name="time-outline" size={14} color="#B45309" />
              <Text style={styles.warnBannerTxt}>La sucursal cierra pronto</Text>
            </View>
          ) : null}

          {/* ── Filtro de categorías ── */}
          <View style={styles.catRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, catActiva === cat && styles.catChipSel]}
                  onPress={() => setCatActiva(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catChipText, catActiva === cat && styles.catChipTextSel]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={catActiva === "Todas" ? productos : productos.filter((p) => p.categoria === catActiva)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ fontSize: fs(30) }}>☕</Text>
                <Text style={styles.emptyText}>No hay productos disponibles</Text>
              </View>
            }
          />
        </>
      )}

      {/* ── Barra flotante "Ver carrito" cuando hay ítems ─────────── */}
      {estadoSucursal !== null && cantidad_total > 0 && cafeteria_id === cartCafId ? (
        <TouchableOpacity style={styles.floatingCart} onPress={irAlCarrito} activeOpacity={0.9}>
          <View style={styles.floatingLeft}>
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>{cantidad_total}</Text>
            </View>
            <Text style={styles.floatingLabel}>Ver carrito</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <PersonalizacionModal
        visible={modalVisible}
        producto={productoSeleccionado}
        personalizaciones={personalizaciones}
        cargando={cargandoPers}
        onConfirmar={(seleccionadas) => {
          setModalVisible(false);
          if (productoSeleccionado) agregarConPersonalizacion(productoSeleccionado, seleccionadas);
          setProductoSeleccionado(null);
        }}
        onCancelar={() => {
          setModalVisible(false);
          setProductoSeleccionado(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: D.header, paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:  { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  cartBtn:  {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  cartBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#4CAF84", borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, color: "#fff", fontWeight: "800" },

  titleBlock:      { backgroundColor: D.header, paddingHorizontal: 18, paddingBottom: 20, paddingTop: 4 },
  cafeteriaNombre: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  sucursalRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  sucursalNombre: { fontSize: 13, color: "#B0C4BA", fontWeight: "500" },
  horarioRow:   { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  horarioTxt:   { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },

  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  row:         { justifyContent: "space-between", marginBottom: 12 },

  productoCard: {
    flex: 0.48, backgroundColor: D.card, borderRadius: 16,
    borderWidth: 1, borderColor: D.cardBorder, overflow: "hidden", paddingBottom: 12,
  },
  badgeWrap:       { position: "absolute", top: 8, left: 8, zIndex: 2 },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText:       { fontSize: 10, fontWeight: "700" },

  // Banners de stock
  stockOutBanner:   { position: "absolute", top: 8, right: 8, zIndex: 2, backgroundColor: D.stockOut, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stockOutText:     { color: "#fff", fontSize: 9, fontWeight: "800" },
  stockLimitBanner: { position: "absolute", top: 8, right: 8, zIndex: 2, backgroundColor: D.stockOut, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stockLimitText:   { color: "#fff", fontSize: 9, fontWeight: "800" },
  stockLowBanner:   { position: "absolute", top: 8, right: 8, zIndex: 2, backgroundColor: D.stockWarn, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stockLowText:     { color: "#fff", fontSize: 9, fontWeight: "800" },

  productoImgWrap: { height: 110, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },
  productoImg:     { width: "100%", height: "100%" },
  productoEmoji:   { fontSize: 44 },
  productoInfo:    { paddingHorizontal: 10, paddingTop: 8, gap: 3 },
  catBadge: { alignSelf: "flex-start", backgroundColor: D.accentBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  catBadgeText: { fontSize: 9, fontWeight: "700", color: D.accent, textTransform: "uppercase" },
  productoNombre:  { fontSize: 13, fontWeight: "700", color: D.primary },
  productoDesc:    { fontSize: 11, color: D.secondary, lineHeight: 15 },

  priceRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  productoPrecio: { fontSize: 15, fontWeight: "800", color: D.price },
  noDisponible:   { fontSize: 10, color: D.secondary, fontStyle: "italic" },

  addBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: D.accent,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  addBtnDisabled: { backgroundColor: D.cardBorder },
  addBtnBadge: {
    position: "absolute", top: -6, right: -6,
    backgroundColor: "#541A1A", borderRadius: 7,
    minWidth: 14, height: 14,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 2,
  },
  addBtnBadgeText: { fontSize: 8, fontWeight: "800", color: "#fff" },

  cerradoContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  cerradoIconWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  cerradoTitulo:    { fontSize: 22, fontWeight: "800", color: D.primary, textAlign: "center" },
  cerradoDesc:      { fontSize: 14, color: D.secondary, textAlign: "center", lineHeight: 20 },
  cerradoHorarioBox: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#FFFBF0", borderRadius: 16, borderWidth: 1.5, borderColor: "#FDE68A", paddingHorizontal: 24, paddingVertical: 16, marginTop: 4 },
  cerradoHoraItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  cerradoHoraLabel: { fontSize: 11, color: D.secondary, fontWeight: "600" },
  cerradoHoraValor: { fontSize: 18, fontWeight: "800", color: D.primary },
  cerradoHoraSep: { width: 1, height: 40, backgroundColor: "#FDE68A" },
  cerradoHorario:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: D.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  cerradoHorarioTxt:{ fontSize: 13, color: D.secondary, fontWeight: "600" },
  warnBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF8E1", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#FFE082" },
  warnBannerTxt: { fontSize: 12, color: "#B45309", fontWeight: "600" },
  catRow: { backgroundColor: "#fff", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: D.border },
  catScroll: { paddingHorizontal: 14, gap: 8 },
  catChip: { borderRadius: 20, borderWidth: 1.5, borderColor: D.border, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: "#fff" },
  catChipSel: { borderColor: D.accent, backgroundColor: D.accent },
  catChipText: { fontSize: 12, fontWeight: "600", color: D.secondary },
  catChipTextSel: { color: "#fff" },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  errorText: { color: "#D32F2F", fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  retryBtn:  { backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#FFF", fontWeight: "700" },
  emptyText: { color: D.secondary, fontSize: 14, textAlign: "center" },

  floatingCart: {
    position: "absolute", bottom: 20, left: 16, right: 16,
    backgroundColor: "#0D5A52", borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 8, shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  floatingLeft:      { flexDirection: "row", alignItems: "center", gap: 12 },
  floatingBadge:     { backgroundColor: "#4CAF84", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  floatingBadgeText: { fontSize: 13, color: "#fff", fontWeight: "800" },
  floatingLabel:     { fontSize: 15, color: "#fff", fontWeight: "700" },
});
