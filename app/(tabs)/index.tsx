import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Pressable, ScrollView, Dimensions, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService, type CafeteriaPublica } from "@/frontend/services/cafeterias.service";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;

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
  heroBg:           "#1A3020",
  heroCard1:        "#2A1A1A",
  heroCard2:        "#1A2A20",
} as const;

const CATEGORIAS = ["Todos", "Espresso", "Cold Brew", "Especialidad", "Vegan"];
const ICON_COLORS = ["#1A3D2A", "#3D1A1A", "#1A1A3D", "#3D3D1A", "#2A1A3D", "#1A3A2A"];
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Todos": "cafe-outline",
  "Espresso": "flash-outline",
  "Cold Brew": "snow-outline",
  "Especialidad": "star-outline",
  "Vegan": "leaf-outline",
};

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

/* ─── Rating simulado ────────────────────────────────────────────── */
function getRating(id: string): string {
  const n = id.charCodeAt(0) % 10;
  return (4.2 + (n * 0.08)).toFixed(1);
}

/* ─── Badge estado ───────────────────────────────────────────────── */
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

/* ─── Icono inicial de cafetería ─────────────────────────────────── */
function CafeIcon({ name, index, size = 48 }: { name: string; index: number; size?: number }) {
  const bg      = ICON_COLORS[index % ICON_COLORS.length];
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[styles.cafeIcon, { backgroundColor: bg, width: size, height: size, borderRadius: size * 0.27 }]}>
      <Text style={[styles.cafeInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

/* ─── Tarjeta destacada (hero carousel) ──────────────────────────── */
function HeroCard({ item, index, onPress }: { item: CafeteriaPublica; index: number; onPress: () => void }) {
  const rating = getRating(item.id);
  const tags = ["Espresso", "Pastelería"];
  return (
    <Pressable style={styles.heroCard} onPress={onPress} android_ripple={{ color: "#ffffff10" }}>
      {/* Fondo degradado simulado */}
      <View style={[styles.heroBg, { backgroundColor: ICON_COLORS[index % ICON_COLORS.length] + "CC" }]} />
      <View style={styles.heroContent}>
        <View style={styles.heroLeft}>
          <View style={styles.heroDestBadge}>
            <Text style={styles.heroDestText}>★ DESTACADO</Text>
          </View>
          <Text style={styles.heroName} numberOfLines={2}>{item.nom_cafeteria}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroRating}>★ {rating}</Text>
            <View style={styles.heroDivider} />
            {tags.map((t) => (
              <View key={t} style={styles.heroTag}>
                <Text style={styles.heroTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.heroAvatarWrap}>
            <CafeIcon name={item.nom_cafeteria} index={index + 2} size={80} />
          </View>
          <TouchableOpacity style={styles.heroArrow} onPress={onPress}>
            <Ionicons name="arrow-forward" size={16} color={D.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Indicadores del carrusel ───────────────────────────────────── */
function CarouselDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

/* ─── Item de lista ──────────────────────────────────────────────── */
function CafeteriaItem({ item, index }: { item: CafeteriaPublica; index: number }) {
  const estado  = calcularEstado(item.horario_apertura ?? null, item.horario_cierre ?? null);
  const rating  = getRating(item.id);

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
      <CafeIcon name={item.nom_cafeteria} index={index} size={52} />
      <View style={styles.listInfo}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={1}>{item.nom_cafeteria}</Text>
          <View style={styles.listRating}>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={styles.listRatingText}>{rating}</Text>
          </View>
        </View>
        <Text style={styles.listCity} numberOfLines={1}>{item.descripcion || item.ciudad}</Text>
        <View style={styles.listTagsRow}>
          <View style={styles.listTag}><Text style={styles.listTagText}>Espresso</Text></View>
          <View style={styles.listTag}><Text style={styles.listTagText}>Pastelería</Text></View>
          <EstadoBadge estado={estado} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={D.label} />
    </Pressable>
  );
}

/* ─── Screen principal ───────────────────────────────────────────── */
export default function HomeScreen() {
  const { token, usuario } = useAuth();
  const [cafeterias, setCafeterias] = useState<CafeteriaPublica[]>([]);
  const [filtered, setFiltered]     = useState<CafeteriaPublica[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [catActiva, setCatActiva]   = useState("Todos");
  const [heroIdx, setHeroIdx]       = useState(0);

  const heroRef  = useRef<ScrollView>(null);
  const heroData = cafeterias.slice(0, 4);

  // Admin → redirigir
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

  const handleHeroScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    setHeroIdx(idx);
  };

  /* ── Header del FlatList ────────────────────────────────────────── */
  const Header = (
    <View>
      {/* Saludo */}
      <View style={styles.greetRow}>
        <View>
          <Text style={styles.greetLabel}>{getGreeting()}</Text>
          <Text style={styles.greetTitle}>Descubre tu café</Text>
        </View>
        <View style={styles.greetActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(tabs)/buscar" as never)}>
            <Ionicons name="grid-outline" size={18} color={D.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={18} color={D.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={D.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cafeterías..."
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
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sección DESTACADOS ─────────────────────────────────────── */}
      {heroData.length > 0 && !search && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DESTACADOS</Text>
            <CarouselDots total={heroData.length} active={heroIdx} />
          </View>

          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleHeroScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CARD_W + 16}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
            {heroData.map((item, i) => (
              <HeroCard
                key={item.id}
                item={item}
                index={i}
                onPress={() =>
                  router.push({
                    pathname: "/cafeteria/[id]" as never,
                    params: { id: item.id, nom_cafeteria: item.nom_cafeteria },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Chips de categoría ─────────────────────────────────────── */}
      {!search && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIAS.map((cat) => {
            const active = catActiva === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCatActiva(cat)}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat] ?? "cafe-outline"}
                  size={13}
                  color={active ? D.primary : D.chipTextInactive}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Encabezado sección lista ───────────────────────────────── */}
      <View style={styles.nearHeader}>
        <Text style={styles.nearTitle}>CERCA DE TI</Text>
        <TouchableOpacity>
          <Text style={styles.nearLink}>Ver mapa →</Text>
        </TouchableOpacity>
      </View>
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
  safe:        { flex: 1, backgroundColor: D.bg },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 100 },

  /* ─── Saludo ──────────────────────────────────────────────────── */
  greetRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  greetLabel:  { fontSize: 12, color: D.secondary, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  greetTitle:  { fontSize: 26, fontWeight: "800", color: D.primary },
  greetActions:{ flexDirection: "row", gap: 8 },
  iconBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, alignItems: "center", justifyContent: "center" },

  /* ─── Búsqueda ────────────────────────────────────────────────── */
  searchRow:   { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, gap: 10, alignItems: "center" },
  searchBox:   { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: D.searchBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: D.cardBorder },
  searchInput: { flex: 1, fontSize: 14, color: D.primary },
  filterBtn:   { backgroundColor: D.chipActive, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  filterText:  { color: D.primary, fontWeight: "700", fontSize: 13 },

  /* ─── Sección ─────────────────────────────────────────────────── */
  sectionBlock:  { marginBottom: 6 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:  { fontSize: 11, fontWeight: "800", color: D.label, letterSpacing: 1.5 },

  /* ─── Dots ────────────────────────────────────────────────────── */
  dotsRow:     { flexDirection: "row", gap: 6, alignItems: "center" },
  dot:         { height: 6, borderRadius: 3 },
  dotActive:   { width: 18, backgroundColor: D.accentText },
  dotInactive: { width: 6, backgroundColor: D.cardBorder },

  /* ─── Hero card ───────────────────────────────────────────────── */
  heroCard:     { width: CARD_W, borderRadius: 20, overflow: "hidden", backgroundColor: D.heroBg, borderWidth: 1, borderColor: D.cardBorder, minHeight: 180 },
  heroBg:       { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  heroContent:  { flexDirection: "row", padding: 20, gap: 16, flex: 1 },
  heroLeft:     { flex: 1, justifyContent: "flex-end" },
  heroRight:    { alignItems: "flex-end", justifyContent: "space-between" },
  heroDestBadge:{ backgroundColor: "rgba(76,175,132,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 8, borderWidth: 1, borderColor: "#4CAF8450" },
  heroDestText: { fontSize: 10, color: D.accentText, fontWeight: "800", letterSpacing: 0.8 },
  heroName:     { fontSize: 22, fontWeight: "800", color: D.primary, marginBottom: 10, lineHeight: 28 },
  heroMeta:     { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  heroRating:   { fontSize: 13, color: "#FFD700", fontWeight: "700" },
  heroDivider:  { width: 1, height: 14, backgroundColor: D.cardBorder },
  heroTag:      { backgroundColor: D.chip, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: D.cardBorder },
  heroTagText:  { fontSize: 11, color: D.secondary, fontWeight: "600" },
  heroAvatarWrap:{ width: 88, height: 88, borderRadius: 24, overflow: "hidden", backgroundColor: D.card, borderWidth: 2, borderColor: D.cardBorder, alignItems: "center", justifyContent: "center" },
  heroArrow:    { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(76,175,132,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#4CAF8440" },

  /* ─── Chips ───────────────────────────────────────────────────── */
  chipsRow:    { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  chip:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chip, borderWidth: 1, borderColor: D.cardBorder },
  chipActive:  { backgroundColor: D.chipActive, borderColor: D.chipActive },
  chipText:    { fontSize: 13, color: D.chipTextInactive, fontWeight: "600" },
  chipTextActive:{ color: D.primary },

  /* ─── Near header ─────────────────────────────────────────────── */
  nearHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 },
  nearTitle:   { fontSize: 11, fontWeight: "800", color: D.label, letterSpacing: 1.5 },
  nearLink:    { fontSize: 12, color: D.accentText, fontWeight: "600" },

  /* ─── Icono cafetería ─────────────────────────────────────────── */
  cafeIcon:    { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cafeInitial: { fontWeight: "800", color: D.primary },

  /* ─── Item lista ──────────────────────────────────────────────── */
  listItem:       { flexDirection: "row", alignItems: "center", backgroundColor: D.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 14, gap: 12 },
  listInfo:       { flex: 1 },
  listTopRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  listName:       { fontSize: 15, fontWeight: "700", color: D.primary, flex: 1, marginRight: 8 },
  listCity:       { fontSize: 12, color: D.secondary, marginBottom: 6 },
  listRating:     { flexDirection: "row", alignItems: "center", gap: 3 },
  listRatingText: { fontSize: 12, color: "#FFD700", fontWeight: "700" },
  listTagsRow:    { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  listTag:        { backgroundColor: D.chip, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: D.cardBorder },
  listTagText:    { fontSize: 10, color: D.secondary, fontWeight: "600" },

  /* ─── Badge estado ────────────────────────────────────────────── */
  badge:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  /* ─── Empty ───────────────────────────────────────────────────── */
  empty:     { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: D.secondary, fontSize: 14, textAlign: "center" },
});
