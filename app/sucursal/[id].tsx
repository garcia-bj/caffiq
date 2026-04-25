import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { productosService, type ProductoPublico } from "@/frontend/services/productos.service";

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

function ProductoCard({ item }: { item: ProductoPublico }) {
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
        <Text style={styles.productoPrecio}>${item.precio.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export default function SucursalMenuScreen() {
  const {
    cafeteria_id, cafeteria_nombre, sucursal_nombre,
  } = useLocalSearchParams<{
    cafeteria_id: string;
    cafeteria_nombre: string;
    sucursal_nombre: string;
  }>();

  const { token } = useAuth();
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [productos, setProductos]             = useState<ProductoPublico[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

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

  const renderItem = ({ item }: { item: ProductoPublico }) => (
    <ProductoCard item={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="bag-outline" size={22} color="#FFFFFF" />
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

      {/* ── Lista de productos ────────────────────────────────────── */}
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  // Header oscuro
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
  cartBtn:  { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },

  // Títulos
  titleBlock:      { backgroundColor: D.header, paddingHorizontal: 18, paddingBottom: 20, paddingTop: 4 },
  cafeteriaNombre: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  sucursalRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  sucursalNombre:  { fontSize: 13, color: "#B0C4BA", fontWeight: "500" },

  // Chips
  chipsRow:       { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chipBg },
  chipActive:     { backgroundColor: D.chipActive },
  chipText:       { fontSize: 13, fontWeight: "600", color: D.chipTextOff },
  chipTextActive: { color: D.chipText },

  // Grid
  listContent: { paddingHorizontal: 12, paddingBottom: 32 },
  row:         { justifyContent: "space-between", marginBottom: 12 },

  // Carta de producto
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
  productoPrecio:  { fontSize: 14, fontWeight: "800", color: D.price, marginTop: 4 },

  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  errorText: { color: "#D32F2F", fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  retryBtn:  { backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#FFF", fontWeight: "700" },
  emptyText: { color: D.secondary, fontSize: 14, textAlign: "center" },
});
