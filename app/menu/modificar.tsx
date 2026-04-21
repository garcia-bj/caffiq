import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { SUCURSALES, getProductosPorSucursal, Producto } from "@/backend/menu-data";

export default function ModificarProductoMenu() {
  const router = useRouter();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);

  const sucursalNombre = SUCURSALES.find((s) => s.id === sucursalId)?.nombre;

  const seleccionarSucursal = (id: number) => {
    setSucursalId(id);
    setProductos(getProductosPorSucursal(id));
    setDropdownOpen(false);
  };

  const irAEditar = (producto: Producto) => {
    // Pasamos el id del producto como parámetro de ruta
    router.push({
      pathname: "/menu/editar-producto",
      params: { productoId: producto.id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}><Text style={styles.logoEmoji}>☕</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Modificar Producto</Text>

        {/* Dropdown sucursal */}
        <View style={styles.inputGroup}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>{sucursalNombre ?? "Seleccione una sucursal"}</Text>
            <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {SUCURSALES.map((s) => (
                <TouchableOpacity key={s.id} style={styles.dropdownItem}
                  onPress={() => seleccionarSucursal(s.id)}>
                  <Text style={styles.dropdownItemText}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Grid productos */}
        {sucursalId && (
          <>
            <Text style={styles.sectionTitle}>Menu de ({sucursalNombre})</Text>
            <View style={styles.grid}>
              {productos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  onPress={() => irAEditar(p)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.imagen }} style={styles.cardImage} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNombre} numberOfLines={2}>{p.nombre}</Text>
                    <Text style={styles.cardPrecio}>$ {p.precio.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <NavbarLateral visible={navbarVisible} onClose={() => setNavbarVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f0eb" },
  header: { backgroundColor: "#0D5A52", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50 },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 16, fontStyle: "italic", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0D5A52", marginBottom: 12 },
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
  cardInfo: { padding: 8 },
  cardNombre: { fontSize: 12, fontWeight: "600", color: "#2C1819", marginBottom: 2 },
  cardPrecio: { fontSize: 13, fontWeight: "700", color: "#541A1A" },
});