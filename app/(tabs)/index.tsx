import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService, type CafeteriaPublica } from "@/frontend/services/cafeterias.service";

const D = {
  bg:               "#091A17",
  card:             "#112820",
  cardBorder:       "#1A3A2C",
  primary:          "#FFFFFF",
  secondary:        "#8BA89A",
  label:            "#4A8A72",
  accentText:       "#4CAF84",
  chipActive:       "#1A7A58",
  chip:             "#162E26",
  chipTextInactive: "#8BA89A",
  searchBg:         "#122820",
  openBg:           "#0D2E1E",
  openText:         "#4DC384",
  closeSoonBg:      "#3A1D00",
  closeSoonText:    "#FF9500",
} as const;

const ICON_COLORS = ["#1A3D2A", "#3D1A1A", "#1A1A3D", "#3D3D1A", "#2A1A3D", "#1A3A2A"];

type EstadoApertura = "abierto" | "cierra-pronto" | "cerrado";

function calcularEstado(ap: string | null, ci: string | null): EstadoApertura {
  if (!ap || !ci) return "cerrado";
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [hA, mA] = ap.split(":").map(Number);
  const [hC, mC] = ci.split(":").map(Number);
  const mAp = hA * 60 + mA;
  const mCi = hC * 60 + mC;
  if (mins < mAp || mins >= mCi) return "cerrado";
  if (mCi - mins <= 30) return "cierra-pronto";
  return "abierto";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function EstadoBadge({ estado }: { estado: EstadoApertura }) {
  if (estado === "cerrado") return null;
  const bg    = estado === "abierto" ? D.openBg       : D.closeSoonBg;
  const color = estado === "abierto" ? D.openText     : D.closeSoonText;
  const label = estado === "abierto" ? "Abierto"      : "Cierra pronto";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function CafeteriaItem({ item, index }: { item: CafeteriaPublica; index: number }) {
  const estado  = calcularEstado(item.horario_apertura, item.horario_cierre);
  const iconBg  = ICON_COLORS[index % ICON_COLORS.length];
  const initial = item.nom_cafeteria.charAt(0).toUpperCase();

  return (
    <Pressable
      style={styles.listItem}
      onPress={() =>
        router.push({
          pathname: "/cafeteria/[id]" as never,
          params: { id: item.id, nom_cafeteria: item.nom_cafeteria },
        })
      }
    >
      <View style={[styles.listIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.listInitial}>{initial}</Text>
      </View>
      <View style={styles.listInfo}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={1}>{item.nom_cafeteria}</Text>
          <EstadoBadge estado={estado} />
        </View>
        <Text style={styles.listCity}>{item.ciudad}</Text>
        {item.horario_apertura && item.horario_cierre ? (
          <View style={styles.listMeta}>
            <Ionicons name="time-outline" size={11} color={D.secondary} />
            <Text style={styles.metaText}>{item.horario_apertura} – {item.horario_cierre}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={D.label} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { token, usuario } = useAuth();
  const [cafeterias, setCafeterias]   = useState<CafeteriaPublica[]>([]);
  const [filtered, setFiltered]       = useState<CafeteriaPublica[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState("");

  // Admin va directo a su pantalla
  useEffect(() => {
    if (usuario?.rol === "admin") {
      router.replace("/(tabs)/cafeterias" as never);
    }
  }, [usuario]);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const { cafeterias: data } = await cafeteriasService.listar(token);
      setCafeterias(data);
      setFiltered(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? cafeterias.filter(c =>
        c.nom_cafeteria.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q)
      ) : cafeterias
    );
  }, [search, cafeterias]);

  const Header = (
    <View>
      {/* Saludo */}
      <View style={styles.greetRow}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} ☕</Text>
          <Text style={styles.greetSub}>
            {usuario?.nom_completo?.split(" ")[0] ?? "Usuario"}
          </Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {usuario?.nom_completo?.charAt(0).toUpperCase() ?? "U"}
          </Text>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={D.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cafetería o ciudad..."
            placeholderTextColor={D.secondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={D.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        {filtered.length} {filtered.length === 1 ? "cafetería" : "cafeterías"} disponibles
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accentText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <CafeteriaItem item={item} index={index} />}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(); }}
            tintColor={D.accentText}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={48} color={D.secondary} />
            <Text style={styles.emptyText}>
              {search ? "Sin resultados para tu búsqueda" : "No hay cafeterías disponibles"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: D.bg },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 32 },

  // Saludo
  greetRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  greeting:     { fontSize: 20, fontWeight: "800", color: D.primary },
  greetSub:     { fontSize: 13, color: D.secondary, marginTop: 2 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: D.chipActive, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 18, fontWeight: "800", color: D.primary },

  // Búsqueda
  searchRow:    { paddingHorizontal: 16, marginBottom: 16 },
  searchBox:    { flexDirection: "row", alignItems: "center", backgroundColor: D.searchBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: D.cardBorder },
  searchInput:  { flex: 1, fontSize: 14, color: D.primary },

  sectionLabel: { fontSize: 12, color: D.label, fontWeight: "600", paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5 },

  // Item cafetería
  listItem:    { flexDirection: "row", alignItems: "center", backgroundColor: D.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: D.cardBorder, padding: 14, gap: 12 },
  listIcon:    { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  listInitial: { fontSize: 20, fontWeight: "800", color: D.primary },
  listInfo:    { flex: 1 },
  listTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  listName:    { fontSize: 15, fontWeight: "700", color: D.primary, flex: 1, marginRight: 8 },
  listCity:    { fontSize: 12, color: D.secondary },
  listMeta:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText:    { fontSize: 11, color: D.secondary },

  badge:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  empty:     { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: D.secondary, fontSize: 14, textAlign: "center" },
});
