import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { getSucursalesAPI } from "@/frontend/services/sucursalService";
import { Sucursal } from "@/frontend/types/sucursal";

export default function CafeteriasScreen() {
  // Estados para la lógica
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      const datos = await getSucursalesAPI();
      setSucursales(datos);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const alRefrescar = () => {
    setRefrescando(true);
    obtenerDatos();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar con tu color Pine Teal */}
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      {/* Header Estilo CAFFIQ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setNavbarVisible(true)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CAFFIQ</Text>

        <View style={styles.logoContainer}>
          {/* Espacio para el logo o icono */}
        </View>
      </View>

      {/* Cuerpo de la pantalla */}
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D5A52" />
          <Text style={styles.loadingText}>Cargando cafeterías...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor="#0D5A52" />
          }
        >
          <Text style={styles.sectionTitle}>Cafeterías disponibles</Text>

          {sucursales.length === 0 ? (
            <Text style={styles.emptyText}>No hay sucursales disponibles por ahora.</Text>
          ) : (
            sucursales.map((cafe) => (
              <TouchableOpacity 
                key={cafe.id_sucursal} // Usando uuid de la DB
                style={styles.card} 
                activeOpacity={0.85}
              >
                {/* Imagen dinámica de la DB */}
                <Image 
                  source={{ uri: cafe.imagen || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600" }} 
                  style={styles.cardImage} 
                />
                
                <View style={styles.cardOverlay}>
                  {/* Nombre dinámico */}
                  <Text style={styles.cardNombre}>{cafe.nombre}</Text>
                </View>

                <View style={styles.cardInfo}>
                  {/* Dirección dinámica */}
                  <Text style={styles.cardDireccion}>
                    Direccion........ {cafe.direccion || "Dirección no especificada"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Navbar lateral */}
      <NavbarLateral
        visible={navbarVisible}
        onClose={() => setNavbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White
  },
  header: {
    backgroundColor: "#0D5A52", // Pine Teal
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  menuBtn: {
    gap: 5,
    padding: 4,
  },
  menuLine: {
    width: 24,
    height: 2.5,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 3,
  },
  logoContainer: {
    width: 36,
    height: 36,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#0D5A52",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C1819", // Coffee Bean
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardOverlay: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cardInfo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  cardDireccion: {
    fontSize: 13,
    color: "#6FA58B", // Muted Teal
  },
});