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
  featuredCard:     "#4A1515",
  primary:          "#FFFFFF",
  secondary:        "#8BA89A",
  label:            "#4A8A72",
  accentText:       "#4CAF84",
  chipActive:       "#1A7A58",
  chip:             "#162E26",
  chipTextInactive: "#8BA89A",
  searchBg:         "#122820",
  filterBtn:        "#1A7A58",
  openBg:           "#0D2E1E",
  openText:         "#4DC384",
  closeSoonBg:      "#3A1D00",
  closeSoonText:    "#FF9500",
  star:             "#FFD700",
} as const;

const CATEGORIES = ["Todos", "Espresso", "Cold Brew", "Especialidad"];
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pathname: "/cafeteria/[id]" as any,
          params: { id: item.id, nom_cafeteria: item.nom_cafeteria },
        })
      }
    >
      <View style={[styles.listIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.listIconText}>{initial}</Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.nom_cafeteria}</Text>
        <Text style={styles.listDesc} numberOfLines={1}>
          {item.descripcion ?? item.ciudad}
        </Text>
        {item.horario_apertura && item.horario_cierre && (
          <Text style={styles.listHours}>
            {item.horario_apertura} – {item.horario_cierre}
          </Text>
        )}
      </View>
      <View style={styles.listRight}>
        <EstadoBadge estado={estado} />
        <Ionicons name="chevron-forward" size={16} color={D.secondary} style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { usuario, token }  = useAuth();
  const [cafeterias, setCafeterias] = useState<CafeteriaPublica[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [categoria, setCategoria]   = useState("Todos");

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const { cafeterias: data } = await cafeteriasService.listar(token);
      setCafeterias(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando cafeterías");
    }
  }, [token]);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  const featured = cafeterias[0] ?? null;

  const ListHeader = (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting().toUpperCase()}</Text>
          <Text style={styles.title}>Descubre tu café</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="grid-outline" size={22} color={D.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={D.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Buscador ────────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={D.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cafeterías..."
            placeholderTextColor={D.secondary}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Destacados ──────────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>DESTACADOS</Text>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={D.accentText} />
        </View>
      ) : featured ? (
        <Pressable
          style={styles.featuredCard}
          onPress={() =>
            router.push({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pathname: "/cafeteria/[id]" as any,
              params: { id: featured.id, nom_cafeteria: featured.nom_cafeteria },
            })
          }
        >
          <View style={styles.featuredTopRow}>
            <View style={styles.destacadoPill}>
              <Text style={styles.destacadoText}>+ DESTACADO</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={20} color={D.primary} />
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.featuredLeft}>
              <Text style={styles.featuredName}>{featured.nom_cafeteria}</Text>
              <View style={styles.featuredMeta}>
                <Ionicons name="star" size={14} color={D.star} />
                <Text style={styles.featuredCity}>{featured.ciudad}</Text>
              </View>
              {featured.descripcion ? (
                <Text style={styles.featuredDesc} numberOfLines={1}>
                  {featured.descripcion}
                </Text>
              ) : null}
            </View>
            <Ionicons name="cafe-outline" size={56} color={`${D.primary}40`} />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* ── Categorías ──────────────────────────────────────────────────── */}
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, categoria === cat && styles.chipActive]}
            onPress={() => setCategoria(cat)}
          >
            <Text style={[styles.chipText, categoria === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Cerca de ti ─────────────────────────────────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>CERCA DE TI</Text>
        <TouchableOpacity>
          <Text style={styles.verMapa}>Ver mapa →</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={cafeterias}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <CafeteriaItem item={item} index={index} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.accentText} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="cafe-outline" size={48} color={D.secondary} />
              <Text style={styles.emptyText}>No hay cafeterías disponibles</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: D.bg },
  listContent: { paddingBottom: 32 },

  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting:    { fontSize: 11, fontWeight: "600", color: D.secondary, letterSpacing: 1.5 },
  title:       { fontSize: 26, fontWeight: "800", color: D.primary, marginTop: 2 },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: D.card, alignItems: "center", justifyContent: "center" },

  searchRow:  { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  searchBar:  { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: D.searchBg, borderRadius: 12, paddingHorizontal: 14, height: 44 },
  searchInput:{ flex: 1, color: D.primary, fontSize: 14 },
  filterBtn:  { backgroundColor: D.filterBtn, borderRadius: 12, paddingHorizontal: 18, height: 44, justifyContent: "center" },
  filterText: { color: D.primary, fontWeight: "700", fontSize: 14 },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: D.label, letterSpacing: 1.5, paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
  sectionRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
  verMapa:      { fontSize: 13, color: D.accentText, fontWeight: "600" },

  featuredCard:    { marginHorizontal: 20, borderRadius: 20, backgroundColor: D.featuredCard, padding: 20, minHeight: 150, overflow: "hidden" },
  loadingCard:     { marginHorizontal: 20, borderRadius: 20, backgroundColor: D.card, height: 150, alignItems: "center", justifyContent: "center" },
  featuredTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  destacadoPill:   { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  destacadoText:   { color: D.primary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  featuredContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  featuredLeft:    { flex: 1, paddingRight: 8 },
  featuredName:    { fontSize: 28, fontWeight: "800", color: D.primary, lineHeight: 32 },
  featuredMeta:    { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  featuredCity:    { color: D.secondary, fontSize: 13, marginLeft: 4 },
  featuredDesc:    { color: "rgba(139,168,154,0.8)", fontSize: 12, marginTop: 4 },

  dotsRow:   { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14, marginBottom: 6 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: D.card },
  dotActive: { width: 20, backgroundColor: D.accentText },

  chipRow:         { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginVertical: 4 },
  chip:            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chip },
  chipActive:      { backgroundColor: D.chipActive },
  chipText:        { fontSize: 13, fontWeight: "600", color: D.chipTextInactive },
  chipTextActive:  { color: D.primary },

  listItem:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(26,58,44,0.5)" },
  listIcon:     { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  listIconText: { fontSize: 22, fontWeight: "800", color: D.primary },
  listInfo:     { flex: 1 },
  listName:     { fontSize: 16, fontWeight: "700", color: D.primary },
  listDesc:     { fontSize: 13, color: D.secondary, marginTop: 2 },
  listHours:    { fontSize: 11, color: D.label, marginTop: 3 },
  listRight:    { alignItems: "flex-end", gap: 4 },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  errorBox:  { margin: 20, padding: 14, backgroundColor: "#3D1010", borderRadius: 12 },
  errorText: { color: "#FF6B6B", fontSize: 13, textAlign: "center" },
  emptyBox:  { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { color: D.secondary, fontSize: 15 },
});
