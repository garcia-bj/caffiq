import { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const DEFAULT_LNG = -66.1568;
const DEFAULT_LAT = -17.3895;
const MAP_HEIGHT  = 240;

interface Props {
  latitud: number | null;
  longitud: number | null;
  onChange: (lat: number, lng: number) => void;
}

function buildPickerHTML(initLat: number | null, initLng: number | null): string {
  const centerLng = initLng ?? DEFAULT_LNG;
  const centerLat = initLat ?? DEFAULT_LAT;
  const zoom      = initLat != null ? 15 : 13;

  const initMarker = initLat != null && initLng != null
    ? `placeMarker(${initLng}, ${initLat});`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      width:100%; height:100%;
      overflow:hidden;
      background:#f0f0f0;
    }
    #map {
      position:absolute;
      top:0; left:0; right:0; bottom:0;
      width:100%; height:100%;
    }
    .mapboxgl-ctrl-logo,
    .mapboxgl-ctrl-attrib { display:none !important; }

    #hint {
      position:fixed;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      pointer-events:none;
      display:flex; flex-direction:column; align-items:center; gap:6px;
      transition:opacity .3s;
      z-index:10;
    }
    #hint.hidden { opacity:0; }
    .hint-ring {
      width:42px; height:42px; border-radius:50%;
      border:2px dashed rgba(13,90,82,0.5);
      animation:spin 4s linear infinite;
    }
    .hint-text {
      background:rgba(255,255,255,0.9);
      color:#0D5A52;
      font-size:12px; font-family:sans-serif; font-weight:600;
      padding:4px 10px; border-radius:20px;
      white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.15);
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    .picker-pin {
      width:34px; height:34px;
      background:#0D5A52;
      border:2.5px solid #4CAF84;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:16px;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
<div id="map"></div>
<div id="hint">
  <div class="hint-ring"></div>
  <span class="hint-text">Toca para marcar la ubicación</span>
</div>
<script>
  if (!mapboxgl.supported()) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#555;font-size:13px;text-align:center;padding:20px;">Tu dispositivo no soporta mapas interactivos.<br/>Ingresa las coordenadas manualmente.</div>';
  } else {
    mapboxgl.accessToken = '${MAPBOX_TOKEN}';

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [${centerLng}, ${centerLat}],
      zoom: ${zoom},
      attributionControl: false,
    });

    let marker = null;
    const hint = document.getElementById('hint');

    function makePinEl() {
      const el = document.createElement('div');
      el.className = 'picker-pin';
      el.textContent = '📍';
      return el;
    }

    function placeMarker(lng, lat) {
      if (marker) {
        marker.setLngLat([lng, lat]);
      } else {
        marker = new mapboxgl.Marker({ element: makePinEl(), anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);
      }
      hint.classList.add('hidden');
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
    }

    map.on('click', function(e) {
      placeMarker(e.lngLat.lng, e.lngLat.lat);
    });

    map.on('load', function() {
      ${initMarker}
    });
  }
</script>
</body>
</html>`;
}

export function LocationMapPicker({ latitud, longitud, onChange }: Props) {
  const webViewRef = useRef<WebView>(null);

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      if (typeof lat === "number" && typeof lng === "number") {
        onChange(lat, lng);
      }
    } catch {}
  };

  const tieneUbicacion = latitud != null && longitud != null;

  return (
    <View style={styles.container}>
      {/* Altura fija explícita para que Mapbox calcule bien el contenedor */}
      <View style={{ height: MAP_HEIGHT }}>
        <WebView
          ref={webViewRef}
          style={{ flex: 1 }}
          source={{ html: buildPickerHTML(latitud, longitud) }}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          originWhitelist={["*"]}
          onMessage={onMessage}
          androidLayerType="hardware"
        />
      </View>

      <View style={styles.coordBar}>
        {tieneUbicacion ? (
          <>
            <Ionicons name="location" size={14} color="#0D5A52" />
            <Text style={styles.coordText}>
              {latitud!.toFixed(6)},  {longitud!.toFixed(6)}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Marcado ✓</Text>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="location-outline" size={14} color="#999" />
            <Text style={styles.coordEmpty}>Toca el mapa para marcar</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#C5D9CE",
  },
  coordBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F7F4",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#C5D9CE",
  },
  coordText:  { flex: 1, fontSize: 12, color: "#2C1819", fontFamily: "monospace" },
  coordEmpty: { flex: 1, fontSize: 12, color: "#999" },
  badge: {
    backgroundColor: "#D4EDDA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: "#0D5A52", fontWeight: "700" },
});
