import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Animated,
} from "react-native";
import { NativeModules } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { sucursalesService, type SucursalConCafe } from "@/frontend/services/sucursales.service";

const D = {
  bg:       "#091A17",
  card:     "#112820",
  border:   "#1A3A2C",
  primary:  "#FFFFFF",
  secondary:"#8BA89A",
  accent:   "#4CAF84",
} as const;

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

const DEFAULT_LNG = -66.1568;
const DEFAULT_LAT = -17.3895;

// ── HTML del mapa ─────────────────────────────────────────────────────────────
function buildHTML(
  sucursales: SucursalConCafe[],
  userLat: number | null,
  userLng: number | null,
): string {
  const conUbicacion = sucursales.filter(
    (s) => s.latitud != null && s.longitud != null,
  );

  // Centro: ubicación del usuario si está disponible, sino promedio de sucursales
  const centerLng = userLng ?? (
    conUbicacion.length > 0
      ? conUbicacion.reduce((s, x) => s + x.longitud!, 0) / conUbicacion.length
      : DEFAULT_LNG
  );
  const centerLat = userLat ?? (
    conUbicacion.length > 0
      ? conUbicacion.reduce((s, x) => s + x.latitud!, 0) / conUbicacion.length
      : DEFAULT_LAT
  );

  const markersData = JSON.stringify(
    conUbicacion.map((s) => ({
      id:               s.id,
      nombre:           s.nombre,
      nom_cafeteria:    s.nom_cafeteria ?? "Cafetería",
      direccion:        s.direccion,
      horario_apertura: s.horario_apertura,
      horario_cierre:   s.horario_cierre,
      imagen_url:       s.imagen_url,
      cafeteria_id:     s.cafeteria_id,
      latitud:          s.latitud,
      longitud:         s.longitud,
    })),
  );

  const userLocScript = userLat != null && userLng != null
    ? `addUserLocation(${userLat}, ${userLng});`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#091A17; overflow:hidden; }
    #map { width:100vw; height:100vh; }

    /* Pin de sucursal */
    .pin {
      width:38px; height:38px;
      background:#0D5A52;
      border:2.5px solid #4CAF84;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; cursor:pointer;
      box-shadow:0 3px 10px rgba(0,0,0,0.5);
      transition:transform .15s, background .15s, border-color .15s;
      user-select:none;
    }
    .pin.active { background:#4CAF84; border-color:#fff; transform:scale(1.25); }

    /* Pin de ubicación actual — punto azul con pulso */
    .user-dot {
      width:18px; height:18px;
      background:#4A90E2;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      animation:pulse 2s infinite;
    }
    .user-dot::before {
      content:'';
      position:absolute;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:44px; height:44px;
      background:rgba(74,144,226,0.2);
      border-radius:50%;
      animation:ring 2s infinite;
    }
    @keyframes pulse {
      0%,100% { box-shadow:0 0 0 0 rgba(74,144,226,0.4); }
      50%      { box-shadow:0 0 0 10px rgba(74,144,226,0); }
    }
    @keyframes ring {
      0%   { transform:translate(-50%,-50%) scale(0.5); opacity:1; }
      100% { transform:translate(-50%,-50%) scale(1.4); opacity:0; }
    }

    .mapboxgl-ctrl-logo,
    .mapboxgl-ctrl-attrib { display:none !important; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  mapboxgl.accessToken = '${MAPBOX_TOKEN}';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [${centerLng}, ${centerLat}],
    zoom: 14,
    attributionControl: false,
  });

  const sucursales = ${markersData};
  let activePinEl = null;

  // Marcadores de sucursales
  sucursales.forEach(function(s) {
    const el = document.createElement('div');
    el.className = 'pin';
    el.textContent = '☕';

    el.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activePinEl && activePinEl !== el) activePinEl.classList.remove('active');
      el.classList.add('active');
      activePinEl = el;
      window.ReactNativeWebView.postMessage(JSON.stringify({ action:'select', data:s }));
    });

    new mapboxgl.Marker({ element: el })
      .setLngLat([s.longitud, s.latitud])
      .addTo(map);
  });

  // Tap en fondo → deseleccionar
  map.on('click', function() {
    if (activePinEl) { activePinEl.classList.remove('active'); activePinEl = null; }
    window.ReactNativeWebView.postMessage(JSON.stringify({ action:'deselect' }));
  });

  // Función para agregar pin de usuario (llamada desde React Native via injectJavaScript)
  window.addUserLocation = function(lat, lng) {
    const el = document.createElement('div');
    el.className = 'user-dot';
    new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);
  };

  // Si se pasan coordenadas del usuario desde el HTML inicial
  ${userLocScript}
</script>
</body>
</html>`;
}

// ── Helpers estado apertura ───────────────────────────────────────────────────
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

// ── Bottom card ───────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 60;

function BottomCard({
  sucursal, onClose, slideAnim,
}: {
  sucursal: SucursalConCafe;
  onClose: () => void;
  slideAnim: Animated.Value;
}) {
  const insets = useSafeAreaInsets();
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

  const bottomPad = insets.bottom + TAB_BAR_HEIGHT + 8;

  return (
    <Animated.View style={[styles.bottomCard, { paddingBottom: bottomPad, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.handle} />

      <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
        <Ionicons name="close" size={18} color={D.secondary} />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        {sucursal.imagen_url ? (
          <Image source={{ uri: sucursal.imagen_url }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={styles.cardImgPlaceholder}>
            <Ionicons name="cafe-outline" size={28} color={D.accent} />
          </View>
        )}

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

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function BuscarScreen() {
  const [sucursales, setSucursales] = useState<SucursalConCafe[]>([]);
  const [userLat, setUserLat]       = useState<number | null>(null);
  const [userLng, setUserLng]       = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<SucursalConCafe | null>(null);
  const slideAnim                   = useRef(new Animated.Value(300)).current;
  const webViewRef                  = useRef<WebView>(null);
  const webViewLoaded               = useRef(false);
  const pendingLocation             = useRef<{ lat: number; lng: number } | null>(null);

  // Cargar sucursales y ubicación en paralelo
  useEffect(() => {
    sucursalesService.listarTodas()
      .then((data) => { setSucursales(data); setLoading(false); })
      .catch(()    => setLoading(false));

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      } catch {}
    })();
  }, []);

  // Inyectar pin de usuario si la ubicación llega después de que el WebView ya cargó
  useEffect(() => {
    if (userLat == null || userLng == null) return;
    if (loading) return; // esperar que el WebView esté montado
    if (webViewLoaded.current) {
      webViewRef.current?.injectJavaScript(
        `window.addUserLocation(${userLat}, ${userLng}); true;`,
      );
    } else {
      pendingLocation.current = { lat: userLat, lng: userLng };
    }
  }, [userLat, userLng, loading]);

  const onWebViewLoad = () => {
    webViewLoaded.current = true;
    if (pendingLocation.current) {
      const { lat, lng } = pendingLocation.current;
      webViewRef.current?.injectJavaScript(
        `window.addUserLocation(${lat}, ${lng}); true;`,
      );
      pendingLocation.current = null;
    }
  };

  const seleccionar = (s: SucursalConCafe) => {
    setSelected(s);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start();
  };

  const deseleccionar = () => {
    Animated.timing(slideAnim, {
      toValue: 300, duration: 200, useNativeDriver: true,
    }).start(() => setSelected(null));
  };

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.action === "select")   seleccionar(msg.data as SucursalConCafe);
      if (msg.action === "deselect") deseleccionar();
    } catch {}
  };

  const conUbicacion = sucursales.filter(
    (s) => s.latitud != null && s.longitud != null,
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={D.accent} />
        <Text style={styles.loadingText}>Cargando mapa…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: buildHTML(sucursales, userLat, userLng) }}
        javaScriptEnabled
        geolocationEnabled
        onMessage={onMessage}
        onLoadEnd={onWebViewLoad}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        originWhitelist={["*"]}
      />

      {/* Header */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="map" size={16} color={D.accent} />
            <Text style={styles.headerTitle}>Sucursales</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{conUbicacion.length} en mapa</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom card */}
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
  container:   { flex: 1, backgroundColor: D.bg },
  map:         { flex: 1 },
  center:      { alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: D.secondary, fontSize: 13 },

  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "rgba(9,26,23,0.92)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: D.border,
  },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:  { fontSize: 15, fontWeight: "700", color: D.primary },
  counterBadge: { backgroundColor: D.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  counterText:  { fontSize: 12, color: D.accent, fontWeight: "600" },

  bottomCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: D.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: D.border,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: D.border, alignSelf: "center", marginBottom: 16,
  },
  closeBtn: {
    position: "absolute", top: 16, right: 20,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#1A3A2C", alignItems: "center", justifyContent: "center",
  },
  cardContent: { flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: 16 },
  cardImg: { width: 64, height: 64, borderRadius: 12, flexShrink: 0 },
  cardImgPlaceholder: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: "#0D2E1E", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardInfo:      { flex: 1, gap: 4 },
  cardCafeteria: { fontSize: 11, color: D.accent, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
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
