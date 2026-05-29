import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Pressable, ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService, type CafeteriaPublica } from "@/frontend/services/cafeterias.service";

const { width: SW } = Dimensions.get("window");

const D = {
  bg:      "#EDF7F4",
  card:    "#ffffff",
  border:  "#C8DDD7",
  primary: "#2C1819",
  sage:    "#6FA58B",
  teal:    "#0D5A52",
  dark:    "#2C1819",
  gold:    "#C9A84C",
  surface: "#D4EDE6",
} as const;

const CARD_COLORS = ["#0D5A52", "#2C1819", "#1A3A5C", "#3D2219", "#1A4A3A", "#2C1A3D"];
const CATS = ["Todos", "Espresso", "Cold Brew", "Especialidad", "Vegan"];
const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Todos: "cafe-outline", Espresso: "flash-outline",
  "Cold Brew": "snow-outline", Especialidad: "star-outline", Vegan: "leaf-outline",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
}

function rating(id: string) {
  return (4.2 + (id.charCodeAt(0) % 10) * 0.08).toFixed(1);
}

function estadoCalc(ap: string | null, ci: string | null) {
  if (!ap || !ci) return "cerrado" as const;
  const m = new Date().getHours() * 60 + new Date().getMinutes();
  const [hA, mA] = ap.split(":").map(Number);
  const [hC, mC] = ci.split(":").map(Number);
  const open = hA * 60 + mA, close = hC * 60 + mC;
  if (m < open || m >= close) return "cerrado" as const;
  return close - m <= 30 ? "cierra-pronto" as const : "abierto" as const;
}

/* ── Featured carousel card ─────────────────────────── */
function FeaturedCard({ item, index, onPress }: { item: CafeteriaPublica; index: number; onPress: () => void }) {
  const bg = CARD_COLORS[index % CARD_COLORS.length];
  const r  = rating(item.id);
  return (
    <Pressable style={[styles.featCard, { backgroundColor: bg }]} onPress={onPress} android_ripple={{ color: "#ffffff18" }}>
      {/* Decorative blobs */}
      <View style={[styles.blob, { width: 160, height: 160, top: -50, right: -30, opacity: 0.07 }]} />
      <View style={[styles.blob, { width: 90,  height: 90,  bottom: -20, left: -20, opacity: 0.05 }]} />

      {/* Top row */}
      <View style={styles.featTop}>
        <View style={styles.featBadge}>
          <Ionicons name="star" size={9} color={D.gold} />
          <Text style={styles.featBadgeText}>DESTACADO</Text>
        </View>
        <View style={styles.featRating}>
          <Ionicons name="star" size={10} color={D.gold} />
          <Text style={styles.featRatingText}>{r}</Text>
        </View>
      </View>

      {/* Bottom info */}
      <View style={styles.featBottom}>
        <Text style={styles.featName} numberOfLines={1}>{item.nom_cafeteria}</Text>
        <View style={styles.featCityRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.6)" />
          <Text style={styles.featCity}>{item.ciudad}</Text>
        </View>
        <TouchableOpacity style={styles.featBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.featBtnText}>Ver menú</Text>
          <Ionicons name="arrow-forward" size={12} color={bg} />
        </TouchableOpacity>
      </View>

      {/* Big initial */}
      <View style={[styles.featInitialWrap, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
        <Text style={styles.featInitialText}>{item.nom_cafeteria.charAt(0).toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

/* ── Cafeteria list card ─────────────────────────────── */
function CafeCard({ item, index }: { item: CafeteriaPublica; index: number }) {
  const r    = rating(item.id);
  const est  = estadoCalc((item as any).horario_apertura ?? null, (item as any).horario_cierre ?? null);
  const bg   = CARD_COLORS[index % CARD_COLORS.length];
  const isOpen = est === "abierto";
  const isWarn = est === "cierra-pronto";

  return (
    <Pressable
      style={styles.cafeCard}
      onPress={() => router.push({ pathname: "/cafeteria/[id]" as never, params: { id: item.id, nom_cafeteria: item.nom_cafeteria } })}
      android_ripple={{ color: D.surface }}
    >
      {/* Colored top band */}
      <View style={[styles.cafeCardTop, { backgroundColor: bg }]}>
        <View style={styles.cafeCardInitialWrap}>
          <Text style={styles.cafeCardInitial}>{item.nom_cafeteria.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cafeCardTopInfo}>
          <Text style={styles.cafeCardName} numberOfLines={1}>{item.nom_cafeteria}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={D.gold} />
            <Text style={styles.ratingText}>{r}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.5)" style={{ marginLeft: "auto" }} />
      </View>

      {/* White bottom band */}
      <View style={styles.cafeCardBottom}>
        <View style={styles.cafeCardBottomRow}>
          <Ionicons name="location-outline" size={12} color={D.sage} />
          <Text style={styles.cafeCardCity} numberOfLines={1}>{item.descripcion || item.ciudad}</Text>
        </View>
        <View style={styles.cafeCardTags}>
          <View style={styles.tag}><Text style={styles.tagTxt}>Cafetería</Text></View>
          {(isOpen || isWarn) && (
            <View style={[styles.estadoTag, { backgroundColor: isOpen ? "#C0DDD5" : "#FDE68A40", borderColor: isOpen ? D.teal : "#B45309" }]}>
              <View style={[styles.estadoDot, { backgroundColor: isOpen ? D.teal : "#B45309" }]} />
              <Text style={[styles.estadoTxt, { color: isOpen ? D.teal : "#B45309" }]}>
                {isOpen ? "Abierto" : "Cierra pronto"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ── Main screen ─────────────────────────────────────── */
export default function HomeScreen() {
  const { token, usuario } = useAuth();
  const [cafeterias, setCafeterias] = useState<CafeteriaPublica[]>([]);
  const [filtered,   setFiltered]   = useState<CafeteriaPublica[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [cat,        setCat]        = useState("Todos");
  const [featIdx,    setFeatIdx]    = useState(0);
  const featRef = useRef<ScrollView>(null);
  const featData = cafeterias.slice(0, 5);
  const FEAT_W   = SW - 40;

  useEffect(() => {
    if (usuario?.rol === "admin") router.replace("/(tabs)/cafeterias" as never);
  }, [usuario]);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const { cafeterias: d } = await cafeteriasService.listar(token);
      setCafeterias(d); setFiltered(d);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? cafeterias.filter(c => c.nom_cafeteria.toLowerCase().includes(q) || c.ciudad.toLowerCase().includes(q)) : cafeterias);
  }, [search, cafeterias]);

  const nombre  = usuario?.nom_completo?.split(" ")[0] ?? "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  const Header = (
    <View>
      {/* ════════ HEADER (teal) ════════ */}
      <View style={styles.header}>
        {/* Decoración */}
        <View style={[styles.blob, { width: 220, height: 220, top: -80, right: -60, backgroundColor: "rgba(255,255,255,0.04)" }]} />
        <View style={[styles.blob, { width: 100, height: 100, bottom: 10, left: -30, backgroundColor: "rgba(255,255,255,0.03)" }]} />

        {/* Top row */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <View style={styles.headerGreet}>
            <Text style={styles.headerGreetSub}>{greeting()}</Text>
            <Text style={styles.headerGreetName}>{nombre}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/(tabs)/mis-pedidos" as never)}>
            <Ionicons name="receipt-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Big title */}
        <Text style={styles.headerTitle}>¿Qué café{"\n"}buscas hoy?</Text>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={D.sage} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cafeterías..."
              placeholderTextColor="#9DBDB4"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={15} color={D.sage} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* ════════ BODY ════════ */}
      <View style={styles.body}>

        {/* ── Destacados carousel ── */}
        {featData.length > 0 && !search && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>DESTACADOS</Text>
              <View style={styles.dotsRow}>
                {featData.map((_, i) => (
                  <View key={i} style={[styles.dot, i === featIdx ? styles.dotOn : styles.dotOff]} />
                ))}
              </View>
            </View>
            <ScrollView
              ref={featRef}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={e => setFeatIdx(Math.round(e.nativeEvent.contentOffset.x / FEAT_W))}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={FEAT_W}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 0 }}
            >
              {featData.map((item, i) => (
                <View key={item.id} style={{ width: FEAT_W, paddingRight: i < featData.length - 1 ? 12 : 0 }}>
                  <FeaturedCard
                    item={item} index={i}
                    onPress={() => router.push({ pathname: "/cafeteria/[id]" as never, params: { id: item.id, nom_cafeteria: item.nom_cafeteria } })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Categorías ── */}
        {!search && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
            {CATS.map(c => {
              const on = cat === c;
              return (
                <TouchableOpacity key={c} style={[styles.chip, on && styles.chipOn]} onPress={() => setCat(c)}>
                  <Ionicons name={CAT_ICONS[c] ?? "cafe-outline"} size={13} color={on ? "#fff" : D.sage} />
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Section header lista ── */}
        <View style={styles.listHead}>
          <Text style={styles.sectionLabel}>
            {search ? `RESULTADOS  "${search.toUpperCase()}"` : "CAFETERÍAS"}
          </Text>
          {!search && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeTxt}>{filtered.length}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: D.teal }]} edges={["top"]}>
        <View style={[styles.center, { backgroundColor: D.bg }]}>
          <ActivityIndicator size="large" color={D.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: D.teal }]} edges={["top"]}>
      <FlatList
        style={{ backgroundColor: D.teal }}
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrap}>
            <CafeCard item={item} index={index} />
          </View>
        )}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={D.teal} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cafe-outline" size={36} color={D.sage} />
              </View>
              <Text style={styles.emptyTitle}>{search ? "Sin resultados" : "Sin cafeterías"}</Text>
              <Text style={styles.emptySub}>{search ? "Prueba con otro término" : "No hay cafeterías disponibles"}</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  /* ── Shared blob shape ── */
  blob: { position: "absolute", borderRadius: 999 },

  /* ── Header ── */
  header: {
    backgroundColor: D.teal,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  headerRow:      { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: D.sage, alignItems: "center", justifyContent: "center",
  },
  avatarText:     { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerGreet:    { flex: 1, marginLeft: 10 },
  headerGreetSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  headerGreetName:{ fontSize: 15, fontWeight: "800", color: "#fff" },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 32, fontWeight: "900", color: "#fff",
    lineHeight: 38, letterSpacing: -0.5,
    marginBottom: 0,
  },

  searchWrap: { marginTop: 20 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: D.primary, fontWeight: "500" },

  /* ── Body ── */
  body: {
    backgroundColor: D.bg,
    paddingTop: 20,
  },

  section:      { marginBottom: 8 },
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  listHead:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: D.teal, letterSpacing: 1.6 },

  dotsRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot:     { height: 4, borderRadius: 2 },
  dotOn:   { width: 20, backgroundColor: D.teal },
  dotOff:  { width: 4, backgroundColor: D.border },

  countBadge:    { backgroundColor: D.sage, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },

  /* ── Featured card ── */
  featCard: {
    flex: 1,
    borderRadius: 22, overflow: "hidden", minHeight: 192,
    justifyContent: "space-between",
    padding: 20,
  },
  featTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featBadgeText:  { fontSize: 9, color: D.gold, fontWeight: "800", letterSpacing: 1 },
  featRating: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featRatingText: { fontSize: 12, color: "#fff", fontWeight: "700" },

  featBottom:  { gap: 5 },
  featName:    { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  featCityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  featCity:    { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  featBtn: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 6,
  },
  featBtnText: { fontSize: 12, fontWeight: "800", color: D.teal },

  featInitialWrap: {
    position: "absolute", top: 18, right: 18,
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  featInitialText: { fontSize: 32, fontWeight: "900", color: "rgba(255,255,255,0.8)" },

  /* ── Category chips ── */
  catsRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: D.border,
  },
  chipOn:    { backgroundColor: D.teal, borderColor: D.teal },
  chipTxt:   { fontSize: 12, color: D.sage, fontWeight: "700" },
  chipTxtOn: { color: "#fff" },

  /* ── Cafeteria list card ── */
  listContent: { paddingBottom: 110 },
  cardWrap:    { paddingHorizontal: 16, marginBottom: 10 },

  cafeCard: {
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#0D5A52",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  cafeCardTop: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  cafeCardInitialWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cafeCardInitial: { fontSize: 22, fontWeight: "900", color: "#fff" },
  cafeCardTopInfo: { flex: 1 },
  cafeCardName:    { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 3 },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText:{ fontSize: 11, color: D.gold, fontWeight: "700" },

  cafeCardBottom: {
    backgroundColor: "#fff",
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  cafeCardBottomRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cafeCardCity:      { fontSize: 12, color: D.sage, fontWeight: "500", flex: 1 },
  cafeCardTags:      { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },

  tag:    { backgroundColor: D.surface, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  tagTxt: { fontSize: 10, color: D.teal, fontWeight: "700" },

  estadoTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  estadoDot: { width: 5, height: 5, borderRadius: 3 },
  estadoTxt: { fontSize: 10, fontWeight: "700" },

  /* ── Empty state ── */
  emptyWrap:  { backgroundColor: D.bg },
  empty:      { alignItems: "center", paddingTop: 60, paddingBottom: 40, gap: 12 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 20, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: D.primary },
  emptySub:   { fontSize: 13, color: D.sage },
});
