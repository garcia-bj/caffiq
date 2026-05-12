import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { useCart } from "@/frontend/context/CartContext";
import { productosService, type ProductoPublico } from "@/frontend/services/productos.service";
import { SucursalMap } from "@/frontend/components/SucursalMap";

const D = {
  bg:          "#F5F0E8",
  header:      "#2C1A0E",
  card:        "#FFFFFF",
  cardBorder:  "#EDE8DF",
  primary:     "#1A1A1A",
  secondary:   "#7A6A5A",
  accent:      "#0D5A52",
  chipActive:  "#0D5A52",
  chipText:    "#FFFFFF",
  chipBg:      "#E8E0D4",
  chipTextOff: "#5A4A3A",
  price:       "#0D5A52",
  badgeColors: {
    Popular: { bg: "#541A1A", text: "#FFFFFF" },
    Nuevo:   { bg: "#0D5A52", text: "#FFFFFF" },
    Fresco:  { bg: "#1A4A30", text: "#FFFFFF" },
  } as Record<string, { bg: string; text: string }>,
} as const;

const CATEGORIAS = ["Todos", "Espresso", "Cold Brew", "Frappé", "Especialidad"];

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
  onAgregar,
}: {
  item: ProductoPublico;
  onAgregar: (producto: ProductoPublico) => void;
}) {
  return (
    <View style={styles.productoCard}>
      {item.badge ? (
        <View style={styles.badgeWrap}>
          <Badge label={item.badge} />
        </View>
      ) : null}

      <View style={styles.productoImgWrap}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.productoImg} resizeMode="cover" />
        ) : (
          <Text style={styles.productoEmoji}>☕</Text>
        )}
      </View>

      <View style={styles.productoInfo}>
        <Text style={styles.productoNombre} numberOfLines={2}>{item.nombre}</Text>
        {item.descripcion ? (
          <Text style={styles.productoDesc} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.productoPrecio}>${item.precio.toFixed(2)}</Text>
          {item.disponible ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAgregar(item)}
              hitSlop={6}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function SucursalMenuScreen() {
  const {
    cafeteria_id, cafeteria_nombre, sucursal_nombre,
    sucursal_direccion, latitud: latStr, longitud: lngStr,
  } = useLocalSearchParams<{
    cafeteria_id: string;
    cafeteria_nombre: string;
    sucursal_nombre: string;
    sucursal_direccion?: string;
    latitud?: string;
    longitud?: string;
  }>();

  const { token }                              = useAuth();
  const { agregar, vaciar, cantidad_total, cafeteria_id: cartCafId } = useCart();
  const [categoriaActiva, setCategoriaActiva]  = useState("Todos");
  const [productos, setProductos]              = useState<ProductoPublico[]>([]);
  const [loading, setLoading]                  = useState(true);
  const [error, setError]                      = useState<string | null>(null);

  const latitud  = latStr  ? Number(latStr)  : null;
  const longitud = lngStr ? Number(lngStr) : null;
  const tieneUbicacion = latitud !== null && longitud !== null && !isNaN(latitud) && !isNaN(longitud);

  const cargar = useCallback(async (cat: string) => {
    if (!token || !cafeteria_id) return;
    setLoading(true);
    try {
      const { productos: data } = await productosService.listar(token, cafeteria_id, cat);
      setProductos(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando menú");
    } finally {
      setLoading(false);
    }
  }, [token, cafeteria_id]);

  useEffect(() => { cargar(categoriaActiva); }, [cargar, categoriaActiva]);

  const handleAgregar = (producto: ProductoPublico) => {
    const ok = agregar(producto, cafeteria_id!, cafeteria_nombre ?? "Cafetería");
    if (!ok) {
      // Conflicto: hay productos de otra cafetería
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
              agregar(producto, cafeteria_id!, cafeteria_nombre ?? "Cafetería");
            },
          },
        ],
      );
    }
  };

  const irAlCarrito = () => router.push("/(tabs)/carrito" as never);

  const renderItem = ({ item }: { item: ProductoPublico }) => (
    <ProductoCard item={item} onAgregar={handleAgregar} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        {/* Botón carrito con badge */}
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
      </View>

      {/* ── Chips de categoría ────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, categoriaActiva === cat && styles.chipActive]}
            onPress={() => setCategoriaActiva(cat)}
          >
            <Text style={[styles.chipText, categoriaActiva === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => cargar(categoriaActiva)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>☕</Text>
              <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
            </View>
          }
          ListFooterComponent={
            tieneUbicacion ? (
              <SucursalMap
                latitud={latitud!}
                longitud={longitud!}
                nombre={sucursal_nombre ?? "Sucursal"}
                direccion={sucursal_direccion}
              />
            ) : null
          }
        />
      )}

      {/* ── Barra flotante "Ver carrito" cuando hay ítems ─────────── */}
      {cantidad_total > 0 && cafeteria_id === cartCafId ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: D.header,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, color: "#fff", fontWeight: "800" },

  titleBlock:      { backgroundColor: D.header, paddingHorizontal: 18, paddingBottom: 20, paddingTop: 4 },
  cafeteriaNombre: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  sucursalRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  sucursalNombre:  { fontSize: 13, color: "#B0C4BA", fontWeight: "500" },

  chipsRow:       { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chipBg },
  chipActive:     { backgroundColor: D.chipActive },
  chipText:       { fontSize: 13, fontWeight: "600", color: D.chipTextOff },
  chipTextActive: { color: D.chipText },

  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  row:         { justifyContent: "space-between", marginBottom: 12 },

  productoCard: {
    flex: 0.48,
    backgroundColor: D.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.cardBorder,
    overflow: "hidden",
    paddingBottom: 12,
  },
  badgeWrap:       { position: "absolute", top: 8, left: 8, zIndex: 1 },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText:       { fontSize: 10, fontWeight: "700" },
  productoImgWrap: { height: 110, backgroundColor: "#F0EAE0", alignItems: "center", justifyContent: "center" },
  productoImg:     { width: "100%", height: "100%" },
  productoEmoji:   { fontSize: 44 },
  productoInfo:    { paddingHorizontal: 10, paddingTop: 8, gap: 3 },
  productoNombre:  { fontSize: 13, fontWeight: "700", color: D.primary },
  productoDesc:    { fontSize: 11, color: D.secondary, lineHeight: 15 },
  priceRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  productoPrecio:  { fontSize: 14, fontWeight: "800", color: D.price },
  addBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: D.accent,
    alignItems: "center", justifyContent: "center",
  },

  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  errorText: { color: "#D32F2F", fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  retryBtn:  { backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#FFF", fontWeight: "700" },
  emptyText: { color: D.secondary, fontSize: 14, textAlign: "center" },

  // Barra flotante carrito
  floatingCart: {
    position: "absolute",
    bottom: 20, left: 16, right: 16,
    backgroundColor: "#0D5A52",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingLeft:       { flexDirection: "row", alignItems: "center", gap: 12 },
  floatingBadge:      { backgroundColor: "#4CAF84", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  floatingBadgeText:  { fontSize: 13, color: "#fff", fontWeight: "800" },
  floatingLabel:      { fontSize: 15, color: "#fff", fontWeight: "700" },
});
