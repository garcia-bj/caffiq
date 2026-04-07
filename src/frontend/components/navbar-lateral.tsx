import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.72;

interface NavbarLateralProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_SECTIONS = [
  {
    key: "sucursales",
    label: "Gestionar sucursales",
    opciones: [
      { label: "Añadir sucursal",    ruta: "/sucursales/agregar"   },
      { label: "Modificar sucursal", ruta: "/sucursales/modificar" },
      { label: "Eliminar sucursal",  ruta: "/sucursales/eliminar"  },
    ],
  },
  {
    key: "menu",
    label: "Gestionar Menu",
    opciones: [
      { label: "Añadir menu",    ruta: "/menu/"   },
      { label: "Modificar menu", ruta: "/menu/" },
      { label: "Eliminar menu",  ruta: "/menu/"  },
    ],
  },
  {
    key: "productos",
    label: "Gestionar Productos",
    opciones: [
      { label: "Añadir producto",    ruta: "/productos/"   },
      { label: "Modificar producto", ruta: "/productos/" },
      { label: "Eliminar producto",  ruta: "/productos/"  },
    ],
  },
];

export function NavbarLateral({ visible, onClose }: NavbarLateralProps) {
  // ✅ useRouter DENTRO del componente
  const router = useRouter();

  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const animatedHeights = React.useRef(
    Object.fromEntries(MENU_SECTIONS.map((s) => [s.key, new Animated.Value(0)]))
  ).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const toggleSection = (key: string) => {
    const isOpening = openSection !== key;

    if (openSection) {
      Animated.timing(animatedHeights[openSection], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (isOpening) {
      Animated.timing(animatedHeights[key], {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }

    setOpenSection(isOpening ? key : null);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>

        {/* Header usuario */}
        <View style={styles.drawerHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.userName}>Nombre de usuario</Text>
          <Text style={styles.userRole}>Rol del usuario</Text>
        </View>

        {/* Menú con acordeones */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {MENU_SECTIONS.map((section) => {
            const isOpen = openSection === section.key;
            const subMenuHeight = animatedHeights[section.key].interpolate({
              inputRange: [0, 1],
              outputRange: [0, section.opciones.length * 46],
            });

            return (
              <View key={section.key} style={styles.sectionWrapper}>
                {/* Botón principal */}
                <TouchableOpacity
                  style={[styles.menuItem, isOpen && styles.menuItemActive]}
                  onPress={() => toggleSection(section.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuText}>{section.label}</Text>
                  <Text style={styles.chevron}>{isOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {/* Subopciones animadas */}
                <Animated.View
                  style={[styles.subMenu, { height: subMenuHeight, overflow: "hidden" }]}
                >
                  {section.opciones.map((opcion) => (
                    <TouchableOpacity
                      key={opcion.label}
                      style={styles.subMenuItem}
                      onPress={() => {
                        router.push(opcion.ruta as any);
                        onClose();
                      }}
                    >
                      <Text style={styles.subMenuText}>{opcion.label}</Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              </View>
            );
          })}
        </ScrollView>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#6FA58B",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    alignItems: "center",
    paddingBottom: 24,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, elevation: 4,
  },
  avatarIcon: { fontSize: 36 },
  userName: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  userRole: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  menuScroll: { flex: 1 },
  sectionWrapper: { marginBottom: 8 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0D5A52",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: "#0a4840",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  menuText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
  chevron: { fontSize: 11, color: "#FFFFFF" },
  subMenu: {
    backgroundColor: "#0D5A52",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 8,
  },
  subMenuItem: {
    height: 46,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  subMenuText: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "400" },
  logoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    marginTop: 8,
  },
  logoutText: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" },
});