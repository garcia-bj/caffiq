import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { sucursalesService, type SucursalPublica } from "@/frontend/services/sucursales.service";

const D = {
  bg:           "#EDF7F4",
  card:         "#ffffff",
  cardBorder:   "#C8DDD7",
  surface:      "#D4EDE6",
  primary:      "#2C1819",
  secondary:    "#6FA58B",
  accent:       "#0D5A52",
  accentBg:     "#C0DDD5",
  danger:       "#541A1A",
  dangerBg:     "#FFF0F0",
} as const;

const ICON_COLORS = ["#0D5A52", "#1A4A6A", "#3D1A4A", "#4A2C1A", "#1A3D2A", "#3D3A1A"];

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
      <View style={[styles.badge, { backgroundColor: D.accentBg, borderColor: "#B8D9CF" }]}>
        <Text style={[styles.badgeText, { color: D.accent }]}>Abierto</Text>
      </View>
    );
  }
  if (estado === "cierra-pronto") {
    return (
      <View style={[styles.badge, { backgroundColor: "#FFF8E1", borderColor: "#FDE68A" }]}>
        <Text style={[styles.badgeText, { color: "#B45309" }]}>Cierra pronto</Text>
      </View>
    );
  }
  return null;
}

function SucursalItem({
  item, index, isAdmin, cafeteriaId, nomCafeteria,
}: {
  item: SucursalPublica; index: number; isAdmin: boolean; cafeteriaId: string; nomCafeteria: string;
}) {
  const estado = calcularEstado(item.horario_apertura, item.horario_cierre);
  const iconBg = ICON_COLORS[index % ICON_COLORS.length];

  const irAlMenu = () => {
    if (isAdmin) return;
    router.push({
      pathname: "/sucursal/[id]" as never,
      params: {
        id:                 item.id,
        cafeteria_id:       cafeteriaId,
        cafeteria_nombre:   nomCafeteria,
        sucursal_nombre:    item.nombre,
        sucursal_direccion: item.direccion,
        horario_apertura:   item.horario_apertura  ?? undefined,
        horario_cierre:     item.horario_cierre    ?? undefined,
        latitud:            item.latitud  != null ? String(item.latitud)  : undefined,
        longitud:           item.longitud != null ? String(item.longitud) : undefined,
      },
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={irAlMenu} activeOpacity={isAdmin ? 1 : 0.75}>
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
          <Ionicons name="location" size={22} color="#fff" />
        </View>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
          <EstadoBadge estado={estado} />
        </View>
        <Text style={styles.cardDireccion} numberOfLines={1}>{item.direccion}</Text>
        {item.horario_apertura && item.horario_cierre ? (
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color={D.secondary} />
            <Text style={styles.metaText}>{item.horario_apertura} – {item.horario_cierre}</Text>
          </View>
        ) : null}

        {isAdmin ? (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() =>
                router.push({
                  pathname: "/sucursales/modificar" as never,
                  params: {
                    cafeteria_id: cafeteriaId,
                    sucursal_id:  item.id,
                    nombre:       item.nombre,
                    direccion:    item.direccion,
                    ciudad:       item.ciudad,
                    apertura:     item.horario_apertura ?? "",
                    cierre:       item.horario_cierre   ?? "",
                    imagen:       item.imagen_url        ?? "",
                  },
                })
              }
            >
              <Ionicons name="pencil-outline" size={13} color={D.accent} />
              <Text style={styles.adminBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminBtn, styles.adminBtnDanger]}
              onPress={() =>
                router.push({
                  pathname: "/sucursales/eliminar" as never,
                  params: { cafeteria_id: cafeteriaId, sucursal_id: item.id, nombre: item.nombre },
                })
              }
            >
              <Ionicons name="pause-circle-outline" size={13} color={D.danger} />
              <Text style={[styles.adminBtnText, { color: D.danger }]}>Suspender</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CafeteriaDetailScreen() {
  const { id, nom_cafeteria }   = useLocalSearchParams<{ id: string; nom_cafeteria: string }>();
  const { token, usuario }      = useAuth();
  const isAdmin = usuario?.rol === "admin" && usuario?.cafeteria_id === id;

  const [sucursales, setSucursales] = useState<SucursalPublica[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token || !id) return;
    try {
      const { sucursales: data } = await sucursalesService.listar(token, id);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
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

        {isAdmin ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              router.push({
                pathname: "/sucursales/agregar" as never,
                params: { cafeteria_id: id },
              })
            }
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="map-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color={D.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sucursales}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SucursalItem
              item={item}
              index={index}
              isAdmin={isAdmin}
              cafeteriaId={id!}
              nomCafeteria={nom_cafeteria ?? ""}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="location-outline" size={36} color={D.secondary} />
              </View>
              <Text style={styles.emptyTitle}>No hay sucursales registradas</Text>
              <Text style={styles.emptySub}>
                {isAdmin ? "Agrega la primera sucursal con el botón +" : "Esta cafetería aún no tiene sucursales activas"}
              </Text>
              {isAdmin ? (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/sucursales/agregar" as never,
                      params: { cafeteria_id: id },
                    })
                  }
                >
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={styles.emptyAddText}>Agregar primera sucursal</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: D.surface },
  listContent: { padding: 16, paddingBottom: 32 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
    backgroundColor: D.accent,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, paddingHorizontal: 4 },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub:    { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },

  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: D.card, borderRadius: 16,
    borderWidth: 1, borderColor: D.cardBorder,
    padding: 14, marginBottom: 10,
    shadowColor: "#0D5A52", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardIcon: { width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 },
  cardImg:  { width: 54, height: 54, borderRadius: 12, marginRight: 14, flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardName:   { fontSize: 15, fontWeight: "700", color: D.primary, flex: 1, marginRight: 8 },
  cardDireccion: { fontSize: 13, color: D.secondary },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metaText:   { fontSize: 11, color: D.secondary },

  adminActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  adminBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: D.accentBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#B8D9CF",
  },
  adminBtnDanger: { backgroundColor: D.dangerBg, borderColor: "#FECACA" },
  adminBtnText:   { fontSize: 12, color: D.accent, fontWeight: "600" },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, margin: 20, padding: 14, backgroundColor: D.dangerBg, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" },
  errorText:  { color: D.danger, fontSize: 13, flex: 1 },

  emptyBox:     { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 20, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: D.cardBorder },
  emptyTitle:   { fontSize: 16, fontWeight: "700", color: D.primary, textAlign: "center" },
  emptySub:     { fontSize: 13, color: D.secondary, textAlign: "center", lineHeight: 20 },
  emptyAddBtn:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: D.accent, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  emptyAddText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
