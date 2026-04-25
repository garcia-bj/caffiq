import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";

const T = {
  bg:       "#091A17",
  border:   "#1A3A2C",
  active:   "#4CAF84",
  inactive: "#4A6B5E",
};

export default function TabLayout() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.bg,
          borderTopColor: T.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: T.active,
        tabBarInactiveTintColor: T.inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {/* ── Pantalla inicio cliente (oculta para admin) ────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* ── Pantalla cafeterías admin (oculta para cliente) ─────────── */}
      <Tabs.Screen
        name="cafeterias"
        options={{
          title: "Cafeterías",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
        }}
      />

      {/* ── Buscar (solo cliente) ────────────────────────────────────── */}
      <Tabs.Screen
        name="buscar"
        options={{
          title: "Buscar",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />

      {/* ── Carrito (solo cliente) ───────────────────────────────────── */}
      <Tabs.Screen
        name="carrito"
        options={{
          title: "Carrito",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
        }}
      />

      {/* ── Perfil (ambos roles) ─────────────────────────────────────── */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />

      {/* ── Ocultar pantallas que no van en el tab bar ───────────────── */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
