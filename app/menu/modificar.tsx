import { useNavbar } from "@/frontend/context/NavbarContext";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService, type SucursalPublica } from "@/frontend/services/sucursales.service";
import { productosService, type ProductoPublico } from "@/frontend/services/productos.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ModificarProductoMenu() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const { fs } = useResponsive();
  const { open: openNavbar } = useNavbar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState<string>("");
  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [catActiva, setCatActiva] = useState("Todas");
  const CATS = ["Todas", "Café", "Bebidas", "Repostería", "Salados"];

  useEffect(() => {
    cargarSucursales();
  }, [token, usuario?.cafeteria_id]);

  const cargarSucursales = async () => {
    if (!token || !usuario?.cafeteria_id) return;
    setCargandoLista(true);
    try {
      const { sucursales: datos } = await sucursalesService.listar(token, usuario.cafeteria_id);
      setSucursales(datos ?? []);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las sucursales");
    } finally {
      setCargandoLista(false);
    }
  };

  const seleccionarSucursal = async (id: string, nombre: string) => {
    if (!token || !usuario?.cafeteria_id) return;
    setSucursalId(id);
    setSucursalNombre(nombre);
    setDropdownOpen(false);
    setCargandoProductos(true);
    try {
      const { productos: datos } = await productosService.listarPorSucursal(token, usuario.cafeteria_id, id);
      setProductos(datos ?? []);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los productos");
    } finally {
      setCargandoProductos(false);
    }
  };

  const irAEditar = (producto: ProductoPublico) => {
    router.push({
      pathname: "/menu/editar-producto",
      params: { productoId: producto.id, cafeteria_id: usuario?.cafeteria_id },
    } as any);
  };

  const getBadge = (p: ProductoPublico) => {
    if (!p.disponible) return { label: "Suspendido", color: "#888888" };
    if ((p.stock ?? 0) === 0) return { label: "No disponible", color: "#541A1A" };
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openNavbar}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>☕</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Modificar Producto</Text>

        {/* Dropdown sucursal */}
        <View style={styles.inputGroup}>
          {cargandoLista ? (
            <ActivityIndicator size="small" color="#0D5A52" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.dropdownText}>
                  {sucursalNombre || "Seleccione una sucursal"}
                </Text>
                <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  {sucursales.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.dropdownItem}
                      onPress={() => seleccionarSucursal(s.id, s.nombre)}
                    >
                      <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Grid productos */}
        {sucursalId && (
          <>
            <Text style={styles.sectionTitle}>Menú de ({sucursalNombre})</Text>

            <View style={styles.catRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                {CATS.map((cat) => (
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

            {cargandoProductos ? (
              <ActivityIndicator size="large" color="#0D5A52" style={{ marginTop: 20 }} />
            ) : productos.length === 0 ? (
              <Text style={{ color: "#999", textAlign: "center", marginTop: 20 }}>
                No hay productos en esta sucursal
              </Text>
            ) : (
              <View style={styles.grid}>
                {(catActiva === "Todas" ? productos : productos.filter((p) => p.categoria === catActiva)).map((p) => {
                  const badge = getBadge(p);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.card}
                      onPress={() => irAEditar(p)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: p.imagen_url ?? undefined }} style={styles.cardImage} />
                      {badge && (
                        <View style={[styles.estadoBadge, { backgroundColor: badge.color }]}>
                          <Text style={styles.estadoBadgeText}>{badge.label}</Text>
                        </View>
                      )}
                      {catActiva === "Todas" && (
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{p.categoria || "General"}</Text>
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardNombre} numberOfLines={2}>{p.nombre}</Text>
                        <Text style={styles.cardPrecio}>Bs. {p.precio?.toFixed(2)}</Text>
                        <Text style={styles.cardStock}>Stock: {p.stock ?? 0}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f0eb" },
  header: {
    backgroundColor: "#0D5A52", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 84 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 16, fontStyle: "italic", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0D5A52", marginBottom: 12 },
  catRow: { marginBottom: 12 },
  catScroll: { gap: 8 },
  catChip: { borderRadius: 20, borderWidth: 1.5, borderColor: "#C5D9CE", paddingVertical: 6, paddingHorizontal: 16, backgroundColor: "#fff" },
  catChipSel: { borderColor: "#0D5A52", backgroundColor: "#0D5A52" },
  catChipText: { fontSize: 12, fontWeight: "600", color: "#6FA58B" },
  catChipTextSel: { color: "#fff" },
  inputGroup: { marginBottom: 16 },
  dropdown: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownText: { color: "#fff", fontSize: 14 },
  dropdownChevron: { color: "#fff", fontSize: 12 },
  dropdownList: { backgroundColor: "#fff", borderRadius: 8, marginTop: 4, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemText: { fontSize: 14, color: "#2C1819" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "47%", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", elevation: 3 },
  cardImage: { width: "100%", height: 110 },
  estadoBadge: { position: "absolute", top: 8, right: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  estadoBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  catBadge: { position: "absolute", bottom: 56, left: 6, backgroundColor: "#0D5A52", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  cardInfo: { padding: 8 },
  cardNombre: { fontSize: 12, fontWeight: "600", color: "#2C1819", marginBottom: 2 },
  cardPrecio: { fontSize: 13, fontWeight: "700", color: "#541A1A" },
  cardStock: { fontSize: 11, color: "#6FA58B", marginTop: 2 },
});
