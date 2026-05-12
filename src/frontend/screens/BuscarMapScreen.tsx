import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import MapboxGL from "@rnmapbox/maps";
import { sucursalesService, type SucursalConCafe } from "@/frontend/services/sucursales.service";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

// Centro por defecto — Cochabamba, Bolivia
const DEFAULT_CENTER: [number, number] = [-66.1568, -17.3895];
const DEFAULT_ZOOM = 12;

const D = {
  bg:       "#091A17",
  card:     "#112820",
  border:   "#1A3A2C",
  primary:  "#FFFFFF",
  secondary:"#8BA89A",
  accent:   "#4CAF84",
  header:   "#091A17",
} as const;

function calcularEstado(ap: string | null, ci: string | null) {
  if (!ap || !ci) return "cerrado" as const;
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [hA, mA] = ap.split(":").map(Number);
  const [hC, mC] = ci.split(":").map(Number);
  const mAp = hA * 60 + mA;
  const mCi = hC * 60 + mC;
  if (mins < mAp || mins >= mCi) return "cerrado" as const;
  if (mCi - mins <= 30) return "cierra-pronto" as const;
  return "abierto" as const;
}

function PinView({ seleccionado }: { seleccionado: boolean }) {
  return (
    <View style={[styles.pin, seleccionado && styles.pinSelected]}>
      <Ionicons name="cafe" size={14} color="#fff" />
    </View>
  );
}

function BottomCard({
  sucursal,
  onClose,
  slideAnim,
}: {
  sucursal: SucursalConCafe;
  onClose: () => void;
  slideAnim: Animated.Value;
}) {
  const estado = calcularEstado(sucursal.horario_apertura, sucursal.horario_cierre);

  const irAlMenu = () => {
    onClose();
    router.push({
      pathname: "/sucursal/[id]" as never,
      params: {
        id:                 sucursal.id,
        cafeteria_id:       sucursal.cafeteria_id,
        cafeteria_nombre:   sucursal.nom_cafeteria ?? "Cafetería",
        sucursal_nombre:    sucursal.nombre,
        sucursal_direccion: sucursal.direccion,
        latitud:            sucursal.latitud  != null ? String(sucursal.latitud)  : undefined,
        longitud:           sucursal.longitud != null ? String(sucursal.longitud) : undefined,
      },
    });
  };

  return (
    <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Botón cerrar */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
        <Ionicons name="close" size={18} color={D.secondary} />
      </TouchableOpacity>

      {/* Contenido */}
      <View style={styles.cardContent}>
        {/* Imagen o ícono */}
        <View style={styles.cardImgWrap}>
          {sucursal.imagen_url ? (
            <Image source={{ uri: sucursal.imagen_url }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={styles.cardImgPlaceholder}>
              <Ionicons name="cafe-outline" size={28} color={D.accent} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardCafeteria} numberOfLines={1}>
            {sucursal.nom_cafeteria ?? "Cafetería"}
          </Text>
          <Text style={styles.cardNombre} numberOfLines={1}>{sucursal.nombre}</Text>

          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={12} color={D.secondary} />
            <Text style={styles.cardDireccion} numberOfLines={1}>{sucursal.direccion}</Text>
          </View>

          {sucursal.horario_apertura && sucursal.horario_cierre ? (
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={D.secondary} />
              <Text style={styles.cardHorario}>
                {sucursal.horario_apertura} – {sucursal.horario_cierre}
              </Text>
              <View style={[
                styles.estadoBadge,
                estado === "abierto"       && { backgroundColor: "#0D2E1E" },
                estado === "cierra-pronto" && { backgroundColor: "#3A1D00" },
                estado === "cerrado"       && { backgroundColor: "#2E0D0D" },
              ]}>
                <Text style={[
                  styles.estadoText,
                  estado === "abierto"       && { color: "#4DC384" },
                  estado === "cierra-pronto" && { color: "#FF9500" },
                  estado === "cerrado"       && { color: "#FF6B6B" },
                ]}>
                  {estado === "abierto" ? "Abierto" : estado === "cierra-pronto" ? "Cierra pronto" : "Cerrado"}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.menuBtn} onPress={irAlMenu} activeOpacity={0.85}>
        <Text style={styles.menuBtnText}>Ver menú</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BuscarMapScreen() {
  const [sucursales, setSucursales] = useState<SucursalConCafe[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<SucursalConCafe | null>(null);
  const cameraRef                   = useRef<MapboxGL.Camera>(null);
  const slideAnim                   = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    sucursalesService.listarTodas()
      .then((data) => { setSucursales(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const seleccionar = (s: SucursalConCafe) => {
    setSelected(s);
    // Animar cámara al pin
    if (s.latitud != null && s.longitud != null) {
      cameraRef.current?.flyTo([s.longitud, s.latitud], 600);
    }
    // Slide-up del bottom card
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const deseleccionar = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelected(null));
  };

  const conUbicacion = sucursales.filter(
    (s) => s.latitud != null && s.longitud != null,
  );

  // Centro inicial: promedio de todas las sucursales con coordenadas, o default
  const centroInicial: [number, number] = conUbicacion.length > 0
    ? [
        conUbicacion.reduce((s, x) => s + x.longitud!, 0) / conUbicacion.length,
        conUbicacion.reduce((s, x) => s + x.latitud!,  0) / conUbicacion.length,
      ]
    : DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      {/* Mapa pantalla completa */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        onPress={() => { if (selected) deseleccionar(); }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={centroInicial}
          animationMode="flyTo"
          animationDuration={800}
        />

        {conUbicacion.map((s) => (
          <MapboxGL.PointAnnotation
            key={s.id}
            id={s.id}
            coordinate={[s.longitud!, s.latitud!]}
            onSelected={() => seleccionar(s)}
          >
            <PinView seleccionado={selected?.id === s.id} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="map" size={18} color={D.accent} />
            <Text style={styles.headerTitle}>Sucursales cercanas</Text>
          </View>
          {!loading && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{conUbicacion.length} en mapa</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Estado de carga / error */}
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={D.accent} />
            <Text style={styles.loadingText}>Cargando sucursales…</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom card de la sucursal seleccionada */}
      {selected ? (
        <BottomCard
          sucursal={selected}
          onClose={deseleccionar}
          slideAnim={slideAnim}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },

  // Header sobre el mapa
  headerOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(9,26,23,0.90)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: D.border,
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:   { fontSize: 15, fontWeight: "700", color: D.primary },
  counterBadge:  { backgroundColor: D.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  counterText:   { fontSize: 12, color: D.accent, fontWeight: "600" },

  // Pin del mapa
  pin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0D5A52",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#4CAF84",
  },
  pinSelected: {
    backgroundColor: "#4CAF84",
    borderColor: "#fff",
    transform: [{ scale: 1.2 }],
  },

  // Loader / error overlay
  loadingOverlay: {
    position: "absolute",
    bottom: 100, left: 0, right: 0,
    alignItems: "center",
  },
  loadingBox: {
    flexDirection: "row", gap: 8, alignItems: "center",
    backgroundColor: "rgba(9,26,23,0.92)",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  loadingText: { fontSize: 13, color: D.secondary },
  errorBox: {
    flexDirection: "row", gap: 8, alignItems: "center",
    backgroundColor: "rgba(46,13,13,0.95)",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  errorText: { fontSize: 13, color: "#FF6B6B" },

  // Bottom card
  bottomCard: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: D.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: D.border,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: D.border,
    alignSelf: "center", marginBottom: 16,
  },
  closeBtn: {
    position: "absolute", top: 16, right: 20,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#1A3A2C",
    alignItems: "center", justifyContent: "center",
  },
  cardContent: { flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: 16 },
  cardImgWrap: { flexShrink: 0 },
  cardImg:     { width: 64, height: 64, borderRadius: 12 },
  cardImgPlaceholder: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: "#0D2E1E",
    alignItems: "center", justifyContent: "center",
  },
  cardInfo:      { flex: 1, gap: 4 },
  cardCafeteria: { fontSize: 12, color: D.accent, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cardNombre:    { fontSize: 17, fontWeight: "800", color: D.primary },
  cardMeta:      { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  cardDireccion: { fontSize: 12, color: D.secondary, flex: 1 },
  cardHorario:   { fontSize: 12, color: D.secondary },
  estadoBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  estadoText:    { fontSize: 10, fontWeight: "700" },

  menuBtn: {
    backgroundColor: "#0D5A52", borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, gap: 8,
  },
  menuBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
