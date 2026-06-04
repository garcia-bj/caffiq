import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView, Dimensions, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService, type CafeteriaPublica } from "@/frontend/services/cafeterias.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";

const { width: SW } = Dimensions.get("window");

const D = {
  bg:      "#F5FAF8",
  card:    "#FFFFFF",
  teal:    "#0D5A52",
  sage:    "#6FA58B",
  border:  "#DFF0EA",
  primary: "#1A2E2B",
  muted:   "#7A9E96",
  surface: "#E8F4EF",
  gold:    "#C9A84C",
} as const;

const ACCENT_COLORS = ["#0D5A52", "#2C1819", "#1A3A5C", "#3D2219", "#1A4A3A", "#2C1A3D"];
const FEAT_W = SW * 0.72;
const FEAT_GAP = 12;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
}

function fakeRating(id: string) {
  return (4.2 + (id.charCodeAt(0) % 10) * 0.08).toFixed(1);
}

function estadoCalc(ap: string | null, ci: string | null) {
  if (!ap || !ci) return null;
  const m = new Date().getHours() * 60 + new Date().getMinutes();
  const [hA, mA] = ap.split(":").map(Number);
  const [hC, mC] = ci.split(":").map(Number);
  const open = hA * 60 + mA, close = hC * 60 + mC;
  if (m < open || m >= close) return null;
  return close - m <= 30 ? ("warn" as const) : ("open" as const);
}

/* ─────────────────────────────────────────────────────────
   Featured card — horizontal carousel
───────────────────────────────────────────────────────── */
function FeaturedCard({ item, index, onPress }: {
  item: CafeteriaPublica; index: number; onPress: () => void;
}) {
  const bg     = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const status = estadoCalc((item as any).horario_apertura ?? null, (item as any).horario_cierre ?? null);

  return (
    <Pressable style={[styles.featCard, { backgroundColor: bg }]} onPress={onPress} android_ripple={{ color: "#ffffff18" }}>
      {/* Ghost initial — decorative */}
      <Text style={styles.featGhost}>{item.nom_cafeteria.charAt(0).toUpperCase()}</Text>

      {/* Status pill — only when open */}
      {status && (
        <View style={styles.featStatusPill}>
          <View style={[styles.featDot, { backgroundColor: status === "open" ? "#4ADE80" : "#FBBF24" }]} />
          <Text style={styles.featStatusTxt}>{status === "open" ? "Abierto" : "Cierra pronto"}</Text>
        </View>
      )}

      {/* Bottom content */}
      <View style={styles.featBottom}>
        <Text style={styles.featName} numberOfLines={1}>{item.nom_cafeteria}</Text>
        <View style={styles.featLocRow}>
          <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.5)" />
          <Text style={styles.featLoc}>{item.ciudad}</Text>
        </View>
        <TouchableOpacity style={styles.featBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.featBtnTxt}>Ver menú</Text>
          <Ionicons name="arrow-forward" size={12} color={bg} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────
   Cafetería list card — compact horizontal
───────────────────────────────────────────────────────── */
function CafeCard({ item, index }: { item: CafeteriaPublica; index: number }) {
  const bg     = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const r      = fakeRating(item.id);
  const status = estadoCalc((item as any).horario_apertura ?? null, (item as any).horario_cierre ?? null);

  return (
    <Pressable
      style={styles.cafeCard}
      onPress={() => router.push({ pathname: "/cafeteria/[id]" as never, params: { id: item.id, nom_cafeteria: item.nom_cafeteria } })}
      android_ripple={{ color: D.surface }}
    >
      {/* Colored avatar */}
      <View style={[styles.cafeAvatar, { backgroundColor: bg }]}>
        <Text style={styles.cafeAvatarTxt}>{item.nom_cafeteria.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Info */}
      <View style={styles.cafeInfo}>
        <Text style={styles.cafeName} numberOfLines={1}>{item.nom_cafeteria}</Text>
        <View style={styles.cafeLocRow}>
          <Ionicons name="location-outline" size={11} color={D.muted} />
          <Text style={styles.cafeLoc} numberOfLines={1}>{item.descripcion || item.ciudad}</Text>
        </View>
        {status && (
          <View style={styles.cafeStatusRow}>
            <View style={[styles.cafeStatusDot, { backgroundColor: status === "open" ? "#10B981" : "#F59E0B" }]} />
            <Text style={[styles.cafeStatusTxt, { color: status === "open" ? "#047857" : "#B45309" }]}>
              {status === "open" ? "Abierto ahora" : "Cierra pronto"}
            </Text>
          </View>
        )}
      </View>

      {/* Right — rating + arrow */}
      <View style={styles.cafeRight}>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={10} color={D.gold} />
          <Text style={styles.ratingTxt}>{r}</Text>
        </View>
        <Ionicons name="chevron-forward" size={15} color={D.border} />
      </View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────
   Main screen
───────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const { token, usuario } = useAuth();
  const { fs, wp } = useResponsive();
  const [cafeterias, setCafeterias] = useState<CafeteriaPublica[]>([]);
  const [filtered,   setFiltered]   = useState<CafeteriaPublica[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [featIdx,    setFeatIdx]    = useState(0);
  const featData = cafeterias.slice(0, 5);

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
    setFiltered(q
      ? cafeterias.filter(c => c.nom_cafeteria.toLowerCase().includes(q) || c.ciudad.toLowerCase().includes(q))
      : cafeterias
    );
  }, [search, cafeterias]);

  const nombre  = usuario?.nom_completo?.split(" ")[0] ?? "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  const Header = (
    <View>
      {/* ══════════ TEAL HEADER ══════════ */}
      <View style={styles.header}>
        {/* Row: avatar + greeting + actions */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{inicial}</Text>
          </View>
          <View style={styles.headerMid}>
            <Text style={styles.headerSub}>{greeting()}</Text>
            <Text style={styles.headerName}>{nombre}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push("/(tabs)/mis-pedidos" as never)}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={D.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cafeterías..."
            placeholderTextColor="#9DBDB4"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={D.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ══════════ BODY (curved top) ══════════ */}
      <View style={styles.body}>

        {/* ── Destacados ── */}
        {featData.length > 0 && !search && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Destacados</Text>
              <View style={styles.dotsRow}>
                {featData.map((_, i) => (
                  <View key={i} style={[styles.dot, i === featIdx && styles.dotOn]} />
                ))}
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={FEAT_W + FEAT_GAP}
              decelerationRate="fast"
              onScroll={e => setFeatIdx(Math.round(e.nativeEvent.contentOffset.x / (FEAT_W + FEAT_GAP)))}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, gap: FEAT_GAP }}
            >
              {featData.map((item, i) => (
                <FeaturedCard
                  key={item.id}
                  item={item}
                  index={i}
                  onPress={() => router.push({ pathname: "/cafeteria/[id]" as never, params: { id: item.id, nom_cafeteria: item.nom_cafeteria } })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── List header ── */}
        <View style={styles.listHead}>
          <Text style={styles.sectionTitle}>
            {search ? `"${search}"` : "Todas las cafeterías"}
          </Text>
          {!search && filtered.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillTxt}>{filtered.length}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: D.teal }]} edges={["top"]}>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={D.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: D.teal }]} edges={["top"]}>
      <FlatList
        style={{ backgroundColor: D.bg }}
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrap}>
            <CafeCard item={item} index={index} />
          </View>
        )}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={D.teal} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cafe-outline" size={32} color={D.sage} />
            </View>
            <Text style={styles.emptyTitle}>{search ? "Sin resultados" : "Sin cafeterías"}</Text>
            <Text style={styles.emptySub}>
              {search ? `No hay cafeterías que coincidan con "${search}"` : "No hay cafeterías disponibles aún"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  loadWrap: { flex: 1, backgroundColor: D.bg, alignItems: "center", justifyContent: "center" },

  /* ── Header ── */
  header: {
    backgroundColor: D.teal,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: D.sage,
    alignItems: "center", justifyContent: "center",
  },
  avatarTxt:  { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerMid:  { flex: 1 },
  headerSub:  { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  headerName: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 1 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: D.primary, fontWeight: "500" },

  /* ── Body — curved top ── */
  body: {
    backgroundColor: D.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: 26,
  },

  section:     { marginBottom: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: D.primary },

  dotsRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: D.border },
  dotOn:   { width: 18, height: 4, borderRadius: 2, backgroundColor: D.sage },

  countPill:    { backgroundColor: D.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: D.border },
  countPillTxt: { fontSize: 12, color: D.teal, fontWeight: "700" },

  /* ── Featured card ── */
  featCard: {
    width: FEAT_W,
    height: 185,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 18,
  },
  featGhost: {
    position: "absolute",
    top: -18, right: 4,
    fontSize: 130, fontWeight: "900",
    color: "rgba(255,255,255,0.07)",
    lineHeight: 140,
  },
  featStatusPill: {
    position: "absolute",
    top: 14, right: 14,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4,
  },
  featDot:       { width: 5, height: 5, borderRadius: 3 },
  featStatusTxt: { fontSize: 10, fontWeight: "700", color: "#fff" },

  featBottom:  { gap: 5 },
  featName:    { fontSize: 19, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  featLocRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  featLoc:     { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  featBtn: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6,
  },
  featBtnTxt: { fontSize: 12, fontWeight: "800", color: D.teal },

  /* ── List card ── */
  cardWrap: { paddingHorizontal: 16, marginBottom: 8 },
  cafeCard: {
    backgroundColor: D.card,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    gap: 13,
    borderWidth: 1,
    borderColor: "#EEF6F2",
    shadowColor: "#0A4A42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cafeAvatar: {
    width: 52, height: 52,
    borderRadius: 14, flexShrink: 0,
    alignItems: "center", justifyContent: "center",
  },
  cafeAvatarTxt: { fontSize: 22, fontWeight: "900", color: "rgba(255,255,255,0.92)" },

  cafeInfo:   { flex: 1, gap: 3 },
  cafeName:   { fontSize: 15, fontWeight: "800", color: D.primary },
  cafeLocRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cafeLoc:    { fontSize: 12, color: D.muted, flex: 1 },
  cafeStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  cafeStatusDot: { width: 6, height: 6, borderRadius: 3 },
  cafeStatusTxt: { fontSize: 11, fontWeight: "600" },

  cafeRight: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(201,168,76,0.10)",
    borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingTxt: { fontSize: 11, fontWeight: "700", color: "#8A6118" },

  /* ── Empty ── */
  emptyWrap:  { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40, alignItems: "center", gap: 10 },
  emptyIcon:  { width: 68, height: 68, borderRadius: 20, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: D.primary },
  emptySub:   { fontSize: 13, color: D.muted, textAlign: "center", lineHeight: 19 },
});
