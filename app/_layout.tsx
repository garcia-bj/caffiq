import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "./global.css";
import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { API_BASE } from "@/frontend/lib/apiUrl";
import { AuthProvider, useAuth } from "@/frontend/context/AuthContext";
import { CartProvider } from "@/frontend/context/CartContext";
import { NavbarProvider, useNavbar } from "@/frontend/context/NavbarContext";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import { obtenerExpoPushToken } from "@/frontend/services/notifications.service";

// Las notificaciones push remotas no existen en Expo Go desde SDK 53
const esExpoGo = Constants.appOwnership === "expo";

// Configurar handler solo en builds reales
if (!esExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

// ── Sidebar global ────────────────────────────────────────────────────────────
function GlobalNavbar() {
  const { isOpen, close } = useNavbar();
  return <NavbarLateral visible={isOpen} onClose={close} />;
}

// ── Registro de push token + navegación al tocar notificación ─────────────────
function NotificationSetup() {
  const { usuario, token } = useAuth();
  const router = useRouter();
  const responseListenerRef = useRef<{ remove: () => void } | null>(null);

  // Registrar token cuando el admin inicia sesión (solo en builds reales)
  useEffect(() => {
    if (esExpoGo || usuario?.rol !== "admin" || !token) return;

    obtenerExpoPushToken().then(async (pushToken) => {
      if (!pushToken || pushToken === "FIREBASE_NOT_CONFIGURED") return;
      try {
        await fetch(
          `${API_BASE}/api/auth/push-token`,
          {
            method:  "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ token: pushToken }),
          },
        );
      } catch {
        // Non-fatal
      }
    });
  }, [usuario?.id, usuario?.rol]);

  // Escuchar taps en notificaciones (solo en builds reales)
  useEffect(() => {
    if (esExpoGo) return;
    const Notifications = require("expo-notifications");
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.screen === "pedidos") {
          router.push("/pedidos" as any);
        }
      },
    );
    return () => responseListenerRef.current?.remove();
  }, []);

  return null;
}

// ── Barra inferior para admin fuera de (tabs) ─────────────────────────────────
const TAB_PATHS = new Set([
  "/", "/cafeterias", "/buscar", "/carrito",
  "/mis-pedidos", "/perfil", "/explore",
]);

function AdminBottomBar() {
  const { usuario } = useAuth();
  const pathname  = usePathname();
  const router    = useRouter();

  if (usuario?.rol !== "admin") return null;
  if (TAB_PATHS.has(pathname))  return null;

  return (
    <View style={abStyles.bar}>
      <TouchableOpacity
        style={abStyles.tab}
        onPress={() => router.replace("/(tabs)/cafeterias" as any)}
        activeOpacity={0.75}
      >
        <Ionicons name="grid-outline" size={22} color="#0D5A52" />
        <Text style={abStyles.label}>Dashboard</Text>
      </TouchableOpacity>

      <View style={abStyles.sep} />

      <TouchableOpacity
        style={abStyles.tab}
        onPress={() => router.replace("/(tabs)/perfil" as any)}
        activeOpacity={0.75}
      >
        <Ionicons name="person-outline" size={22} color="#6FA58B" />
        <Text style={[abStyles.label, { color: "#6FA58B" }]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const abStyles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 64,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#D4E6DF",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 6,
    elevation: 12,
    shadowColor: "#0D5A52",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  sep: {
    width: 1, height: 32,
    backgroundColor: "#D4E6DF",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D5A52",
  },
});

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavbarProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <GlobalNavbar />
          <AdminBottomBar />
          <NotificationSetup />
          <StatusBar style="auto" />
        </NavbarProvider>
      </CartProvider>
    </AuthProvider>
  );
}
