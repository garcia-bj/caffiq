import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, TouchableWithoutFeedback,
  ScrollView, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.72;

interface NavbarLateralProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_SECTIONS = [
  {
    key: "inicio",
    label: "Inicio",
    icon: "home-outline" as const,
    opciones: [
      { label: "Dashboard",  ruta: "/(tabs)/cafeterias", icon: "grid-outline" as const },
      { label: "Mi Perfil",  ruta: "/(tabs)/perfil",     icon: "person-outline" as const },
    ],
  },
  {
    key: "sucursales",
    label: "Sucursales",
    icon: "location-outline" as const,
    opciones: [
      { label: "Añadir sucursal",    ruta: "/sucursales/agregar",   icon: "add-circle-outline" as const },
      { label: "Modificar sucursal", ruta: "/sucursales/modificar", icon: "create-outline" as const },
      { label: "Eliminar sucursal",  ruta: "/sucursales/eliminar",  icon: "remove-circle-outline" as const },
    ],
  },
  {
    key: "menu",
    label: "Menú",
    icon: "cafe-outline" as const,
    opciones: [
      { label: "Añadir producto",    ruta: "/menu/agregar",   icon: "add-circle-outline" as const },
      { label: "Modificar producto", ruta: "/menu/modificar", icon: "create-outline" as const },
      { label: "Eliminar producto",  ruta: "/menu/eliminar",  icon: "remove-circle-outline" as const },
    ],
  },
  {
    key: "personalizacion",
    label: "Personalización",
    icon: "options-outline" as const,
    opciones: [
      { label: "Opciones del producto", ruta: "/personalizacion", icon: "list-outline" as const },
    ],
  },
  {
    key: "pedidos",
    label: "Pedidos",
    icon: "receipt-outline" as const,
    opciones: [
      { label: "Gestionar pedidos", ruta: "/pedidos", icon: "clipboard-outline" as const },
    ],
  },
  {
    key: "configuracion",
    label: "Configuración",
    icon: "settings-outline" as const,
    opciones: [
      { label: "QR de Pago", ruta: "/configuracion/qr-pago", icon: "qr-code-outline" as const },
    ],
  },
  {
    key: "ayuda",
    label: "Soporte",
    icon: "help-circle-outline" as const,
    opciones: [
      { label: "Centro de Ayuda", ruta: "/ayuda", icon: "information-circle-outline" as const },
    ],
  },
];

export function NavbarLateral({ visible, onClose }: NavbarLateralProps) {
  const router = useRouter();
  const { usuario, logout } = useAuth();

  const inicial       = usuario?.nom_completo?.charAt(0).toUpperCase() ?? "A";
  const nombreMostrar = usuario?.nom_completo ?? "Administrador";
  const rolMostrar    = usuario?.rol === "admin" ? "Administrador" : "Cliente";

  const handleLogout = () => {
    const doLogout = async () => {
      onClose();
      await logout();
      router.replace("/(auth)/welcome" as never);
    };
    if (Platform.OS === "web") {
      if (window.confirm("¿Cerrar sesión?")) doLogout();
    } else {
      Alert.alert("Cerrar sesión", "¿Estás seguro que deseas salir?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>

        {/* ── Header usuario ── */}
        <View style={styles.drawerHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{inicial}</Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>{nombreMostrar}</Text>
          <View style={styles.rolRow}>
            <Ionicons name="storefront-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.userRole}>{rolMostrar}</Text>
          </View>
        </View>

        {/* ── Menú estático ── */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {MENU_SECTIONS.map((section) => (
            <View key={section.key} style={styles.section}>
              {/* Etiqueta de sección */}
              <View style={styles.sectionLabel}>
                <Ionicons name={section.icon} size={13} color="rgba(255,255,255,0.55)" />
                <Text style={styles.sectionLabelText}>{section.label.toUpperCase()}</Text>
              </View>

              {/* Opciones directas */}
              {section.opciones.map((opcion) => (
                <TouchableOpacity
                  key={opcion.label}
                  style={styles.menuItem}
                  onPress={() => { router.push(opcion.ruta as any); onClose(); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={opcion.icon} size={16} color="rgba(255,255,255,0.85)" />
                  </View>
                  <Text style={styles.menuText}>{opcion.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={17} color="#FFCDD2" />
          </View>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999, flexDirection: "row",
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  drawer: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#0D5A52",
    paddingTop: 56, paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 24,
  },

  /* ── Header ── */
  drawerHeader: {
    alignItems: "center", paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.12)",
    marginBottom: 8,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#6FA58B",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  avatarLetter: { fontSize: 26, fontWeight: "800", color: "#fff" },
  userName:     { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4, textAlign: "center" },
  rolRow:       { flexDirection: "row", alignItems: "center", gap: 4 },
  userRole:     { fontSize: 11, color: "rgba(255,255,255,0.65)" },

  /* ── Menu ── */
  menuScroll: { flex: 1, paddingHorizontal: 12 },

  section: { marginBottom: 4 },
  sectionLabel: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 8, paddingTop: 14, paddingBottom: 6,
  },
  sectionLabelText: {
    fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.4,
  },

  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12,
    marginBottom: 3,
  },
  menuItemIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  menuText: { flex: 1, fontSize: 13, color: "#fff", fontWeight: "600" },

  /* ── Logout ── */
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 16, paddingHorizontal: 20,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)",
  },
  logoutIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  logoutText: { fontSize: 14, color: "#FFCDD2", fontWeight: "700" },
});
