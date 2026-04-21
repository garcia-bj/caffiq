import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService, type SucursalPublica } from "@/frontend/services/cafeterias.service";

const D = {
  bg:           "#091A17",
  card:         "#112820",
  cardBorder:   "#1A3A2C",
  primary:      "#FFFFFF",
  secondary:    "#8BA89A",
  label:        "#4A8A72",
  accentText:   "#4CAF84",
  openBg:       "#0D2E1E",
  openText:     "#4DC384",
  closeSoonBg:  "#3A1D00",
  closeSoonText:"#FF9500",
} as const;

const ICON_COLORS = ["#1A3D2A", "#3D1A1A", "#1A1A3D", "#3D3D1A", "#2A1A3D", "#1A3D3A"];

type EstadoApertura = "abierto" | "cierra-pronto" | "cerrado";

function calcularEstado(ap: string | null, ci: string | null): EstadoApertura {
  if (!ap || !ci) return "cerrado";
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [hA, mA] = ap.split(":").map(Number);
  const [hC, mC] = ci.split(":").map(Number);
  const mAp = hA * 60 + mA;
  const mCi = hC * 60 + mC;
  if (mins < mAp || mins >= mCi) return "cerrado";
  if (mCi - mins <= 30) return "cierra-pronto";
  return "abierto";
}

function EstadoBadge({ estado }: { estado: EstadoApertura }) {
  if (estado === "abierto") {
    return (
      <View style={[styles.badge, { backgroundColor: D.openBg }]}>
        <Text style={[styles.badgeText, { color: D.openText }]}>Abierto</Text>
      </View>
    );
  }
  if (estado === "cierra-pronto") {
    return (
      <View style={[styles.badge, { backgroundColor: D.closeSoonBg }]}>
        <Text style={[styles.badgeText, { color: D.closeSoonText }]}>Cerrado pronto</Text>
      </View>
    );
  }
  return null;
}

function SucursalItem({ item, index }: { item: SucursalPublica; index: number }) {
  const estado = calcularEstado(item.horario_apertura, item.horario_cierre);
  const iconBg = ICON_COLORS[index % ICON_COLORS.length];

  return (
    <View style={styles.card}>
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
          <Ionicons name="location" size={22} color={D.accentText} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
          <EstadoBadge estado={estado} />
        </View>
        <Text style={styles.cardDireccion}>{item.direccion}</Text>
        {item.horario_apertura && item.horario_cierre ? (
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color={D.secondary} />
            <Text style={styles.metaText}>{item.horario_apertura} – {item.horario_cierre}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function CafeteriaDetailScreen() {
  const { id, nom_cafeteria } = useLocalSearchParams<{ id: string; nom_cafeteria: string }>();
  const { token }             = useAuth();
  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token || !id) return;
    try {
      const { sucursales: data } = await cafeteriasService.sucursales(token, id);
      setSucursales(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando sucursales");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={D.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{nom_cafeteria}</Text>
          {!loading ? (
            <Text style={styles.headerSub}>
              {sucursales.length}{" "}
              {sucursales.length === 1 ? "sucursal disponible" : "sucursales disponibles"}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="map-outline" size={20} color={D.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="menu" size={20} color={D.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={D.accentText} />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sucursales}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <SucursalItem item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={48} color={D.secondary} />
              <Text style={styles.emptyText}>No hay sucursales registradas</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: D.bg },
  listContent: { padding: 16, paddingBottom: 32 },

  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: D.card, alignItems: "center", justifyContent: "center" },
  headerCenter:  { flex: 1, paddingHorizontal: 4 },
  headerTitle:   { fontSize: 18, fontWeight: "800", color: D.primary },
  headerSub:     { fontSize: 12, color: D.secondary, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: D.card, alignItems: "center", justifyContent: "center" },

  card:       { flexDirection: "row", alignItems: "flex-start", backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 16, marginBottom: 10 },
  cardIcon:   { width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 },
  cardImg:    { width: 54, height: 54, borderRadius: 12, marginRight: 14, flexShrink: 0 },
  cardInfo:   { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardName:   { fontSize: 15, fontWeight: "700", color: D.primary, flex: 1, marginRight: 8 },
  cardDireccion: { fontSize: 13, color: D.secondary },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metaText:   { fontSize: 11, color: D.secondary },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorBox:   { margin: 20, padding: 14, backgroundColor: "#3D1010", borderRadius: 12 },
  errorText:  { color: "#FF6B6B", fontSize: 13, textAlign: "center" },
  emptyBox:   { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText:  { color: D.secondary, fontSize: 15 },
});
