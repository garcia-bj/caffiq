import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCart, type CartItem } from "@/frontend/context/CartContext";

const D = {
  bg:        "#091A17",
  card:      "#112820",
  border:    "#1A3A2C",
  primary:   "#FFFFFF",
  secondary: "#8BA89A",
  accent:    "#4CAF84",
  danger:    "#FF6B6B",
  price:     "#4CAF84",
  summary:   "#0A2218",
} as const;

function ItemRow({ item }: { item: CartItem }) {
  const { actualizar, eliminar } = useCart();
  const subtotal = (item.producto.precio * item.cantidad).toFixed(2);

  return (
    <View style={styles.itemRow}>
      {/* Imagen */}
      <View style={styles.itemImgWrap}>
        {item.producto.imagen_url ? (
          <Image source={{ uri: item.producto.imagen_url }} style={styles.itemImg} resizeMode="cover" />
        ) : (
          <Text style={styles.itemEmoji}>☕</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre} numberOfLines={2}>{item.producto.nombre}</Text>
        <Text style={styles.itemPrecio}>${item.producto.precio.toFixed(2)} c/u</Text>

        {/* Controles de cantidad */}
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => actualizar(item.producto.id, item.cantidad - 1)}
          >
            <Ionicons name="remove" size={16} color={D.accent} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.cantidad}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => actualizar(item.producto.id, item.cantidad + 1)}
          >
            <Ionicons name="add" size={16} color={D.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtotal + eliminar */}
      <View style={styles.itemRight}>
        <Text style={styles.itemSubtotal}>${subtotal}</Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => eliminar(item.producto.id)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={D.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyCart() {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name="bag-outline" size={64} color={D.secondary} />
      <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
      <Text style={styles.emptySub}>Agrega productos desde el menú de una cafetería</Text>
      <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)" as never)}>
        <Text style={styles.browseBtnText}>Ver cafeterías</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CarritoScreen() {
  const { items, cafeteria_nombre, total, cantidad_total, vaciar } = useCart();

  const handleVaciar = () => {
    Alert.alert(
      "Vaciar carrito",
      "¿Seguro que quieres eliminar todos los productos?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Vaciar", style: "destructive", onPress: vaciar },
      ],
    );
  };

  const handlePedido = () => {
    Alert.alert(
      "Pedido",
      "La funcionalidad de pedidos estará disponible próximamente.",
      [{ text: "OK" }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi carrito</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleVaciar} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          {/* Nombre de cafetería */}
          <View style={styles.cafeHeader}>
            <Ionicons name="storefront-outline" size={15} color={D.accent} />
            <Text style={styles.cafeNombre} numberOfLines={1}>{cafeteria_nombre}</Text>
            <View style={styles.badgeCant}>
              <Text style={styles.badgeCantText}>{cantidad_total}</Text>
            </View>
          </View>

          {/* Lista */}
          <FlatList
            data={items}
            keyExtractor={(i) => i.producto.id}
            renderItem={({ item }) => <ItemRow item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Resumen + botón pedido */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cantidad_total} {cantidad_total === 1 ? "producto" : "productos"})</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.pedidoBtn} onPress={handlePedido} activeOpacity={0.85}>
              <Ionicons name="bag-check-outline" size={20} color="#fff" />
              <Text style={styles.pedidoBtnText}>Realizar pedido</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: D.primary },
  clearBtn:    { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#2E0D0D", borderRadius: 10 },
  clearText:   { fontSize: 13, color: D.danger, fontWeight: "600" },

  cafeHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: D.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: D.border,
  },
  cafeNombre:     { flex: 1, fontSize: 13, fontWeight: "700", color: D.primary },
  badgeCant:      { backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeCantText:  { fontSize: 12, color: "#fff", fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 8 },
  separator:   { height: 1, backgroundColor: D.border, marginHorizontal: 4 },

  itemRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14,
  },
  itemImgWrap: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: "#1A3A2C", overflow: "hidden",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemImg:   { width: "100%", height: "100%" },
  itemEmoji: { fontSize: 28 },

  itemInfo:   { flex: 1, gap: 4 },
  itemNombre: { fontSize: 14, fontWeight: "700", color: D.primary, lineHeight: 18 },
  itemPrecio: { fontSize: 12, color: D.secondary },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#0D2E1E", alignItems: "center", justifyContent: "center",
  },
  qtyText: { fontSize: 15, fontWeight: "700", color: D.primary, minWidth: 20, textAlign: "center" },

  itemRight:    { alignItems: "flex-end", gap: 12, flexShrink: 0 },
  itemSubtotal: { fontSize: 15, fontWeight: "800", color: D.price },
  deleteBtn:    { padding: 4 },

  // Estado vacío
  emptyBox:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: D.primary },
  emptySub:   { fontSize: 14, color: D.secondary, textAlign: "center", lineHeight: 20 },
  browseBtn:  { marginTop: 8, backgroundColor: "#0D5A52", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { color: D.primary, fontWeight: "700", fontSize: 14 },

  // Resumen
  summary: {
    backgroundColor: D.summary, borderTopWidth: 1, borderTopColor: D.border,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 10,
  },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: D.secondary },
  summaryValue: { fontSize: 14, color: D.primary, fontWeight: "600" },
  totalRow:     { borderTopWidth: 1, borderTopColor: D.border, paddingTop: 10 },
  totalLabel:   { fontSize: 16, fontWeight: "800", color: D.primary },
  totalValue:   { fontSize: 18, fontWeight: "800", color: D.accent },
  pedidoBtn: {
    marginTop: 4, backgroundColor: "#0D5A52", borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 10,
  },
  pedidoBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
