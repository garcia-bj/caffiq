import { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_LNG = -66.1568;
const DEFAULT_LAT = -17.3895;

interface Props {
  latitud:  number | null;
  longitud: number | null;
  onChange: (lat: number, lng: number) => void;
}

function buildMapHTML(initLat: number | null, initLng: number | null): string {
  const centerLng = initLng ?? DEFAULT_LNG;
  const centerLat = initLat ?? DEFAULT_LAT;
  const zoom      = initLat != null ? 16 : 13;
  const initMarker = initLat != null && initLng != null
    ? `placeMarker(${initLat}, ${initLng});`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; overflow:hidden; background:#f2f2f2; }
    #map { position:absolute; inset:0; }

    #guide {
      position:fixed; top:50%; left:50%;
      transform:translate(-50%,-50%);
      pointer-events:none; z-index:1000;
      display:flex; flex-direction:column; align-items:center; gap:8px;
      transition:opacity .25s;
    }
    #guide.hidden { opacity:0; }
    .g-ring {
      width:52px; height:52px; border-radius:50%;
      border:2px dashed rgba(13,90,82,0.6);
      animation:spin 4s linear infinite;
    }
    .g-label {
      background:rgba(255,255,255,0.95);
      color:#0D5A52; font-size:13px; font-family:sans-serif; font-weight:700;
      padding:5px 14px; border-radius:20px;
      box-shadow:0 2px 8px rgba(0,0,0,0.18); white-space:nowrap;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
<div id="map"></div>
<div id="guide">
  <div class="g-ring"></div>
  <span class="g-label">Toca el mapa para marcar</span>
</div>
<script>
  var map = L.map('map', {
    center: [${centerLat}, ${centerLng}],
    zoom: ${zoom},
    zoomControl: true,
    attributionControl: false,
  });

  // Tiles Carto Light — fondo blanco limpio, no requiere token
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  var marker = null;
  var guide  = document.getElementById('guide');

  var pinIcon = L.divIcon({
    html: '<div style="width:36px;height:36px;background:#0D5A52;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">📍</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    className: '',
  });

  function placeMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on('dragend', function() {
        var pos = marker.getLatLng();
        sendCoords(pos.lat, pos.lng);
      });
    }
    guide.classList.add('hidden');
    sendCoords(lat, lng);
  }

  function sendCoords(lat, lng) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
  }

  map.on('click', function(e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
  });

  ${initMarker}
</script>
</body>
</html>`;
}

export function LocationPickerButton({ latitud, longitud, onChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  const webViewRef = useRef<WebView>(null);

  const abrirModal = () => {
    setTempLat(latitud);
    setTempLng(longitud);
    setModalVisible(true);
  };

  const confirmar = () => {
    if (tempLat != null && tempLng != null) {
      onChange(tempLat, tempLng);
    }
    setModalVisible(false);
  };

  const cancelar = () => setModalVisible(false);

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data);
      if (typeof lat === "number" && typeof lng === "number") {
        setTempLat(lat);
        setTempLng(lng);
      }
    } catch {}
  };

  const tieneUbicacion = latitud != null && longitud != null;

  return (
    <>
      {tieneUbicacion ? (
        <View style={styles.ubicadoCard}>
          <View style={styles.ubicadoLeft}>
            <View style={styles.ubicadoIcon}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.ubicadoLabel}>Ubicación marcada</Text>
              <Text style={styles.ubicadoCoords}>
                {latitud!.toFixed(5)},  {longitud!.toFixed(5)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editarBtn} onPress={abrirModal} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color="#0D5A52" />
            <Text style={styles.editarText}>Editar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.marcarBtn} onPress={abrirModal} activeOpacity={0.85}>
          <View style={styles.marcarIcon}>
            <Ionicons name="map" size={22} color="#fff" />
          </View>
          <View style={styles.marcarTextos}>
            <Text style={styles.marcarTitulo}>Marcar ubicación en el mapa</Text>
            <Text style={styles.marcarSub}>Toca para abrir el mapa y seleccionar</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6FA58B" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" statusBarTranslucent hardwareAccelerated>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.modalContainer}>

          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalClose} onPress={cancelar} hitSlop={10}>
              <Ionicons name="close" size={22} color="#2C1819" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Marcar ubicación</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.instruccion}>
            <Ionicons name="information-circle-outline" size={15} color="#0D5A52" />
            <Text style={styles.instruccionText}>
              Toca el mapa para marcar la ubicación exacta de la sucursal. También puedes arrastrar el pin.
            </Text>
          </View>

          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              style={{ flex: 1 }}
              source={{ html: buildMapHTML(tempLat ?? latitud, tempLng ?? longitud) }}
              javaScriptEnabled
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              originWhitelist={["*"]}
              onMessage={onMessage}
              mixedContentMode="always"
              allowFileAccess
            />
          </View>

          <View style={styles.modalFooter}>
            {tempLat != null ? (
              <View style={styles.coordPreview}>
                <Ionicons name="location" size={14} color="#0D5A52" />
                <Text style={styles.coordText}>
                  {tempLat.toFixed(5)},  {tempLng!.toFixed(5)}
                </Text>
              </View>
            ) : (
              <Text style={styles.coordEmpty}>Sin ubicación marcada aún</Text>
            )}

            <TouchableOpacity
              style={[styles.confirmarBtn, tempLat == null && styles.confirmarBtnDisabled]}
              onPress={confirmar}
              disabled={tempLat == null}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.confirmarText}>Confirmar ubicación</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  marcarBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#C5D9CE", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  marcarIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#0D5A52",
    alignItems: "center", justifyContent: "center",
  },
  marcarTextos: { flex: 1 },
  marcarTitulo: { fontSize: 14, fontWeight: "700", color: "#2C1819" },
  marcarSub:    { fontSize: 12, color: "#7a9a8a", marginTop: 2 },

  ubicadoCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#EDF7F2",
    borderWidth: 1.5, borderColor: "#A8D5B8", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  ubicadoLeft:   { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  ubicadoIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#0D5A52", alignItems: "center", justifyContent: "center",
  },
  ubicadoLabel:  { fontSize: 13, fontWeight: "700", color: "#0D5A52" },
  ubicadoCoords: { fontSize: 11, color: "#5A8A72", fontFamily: "monospace", marginTop: 1 },
  editarBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#A8D5B8",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  editarText: { fontSize: 12, fontWeight: "700", color: "#0D5A52" },

  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#E8F0EB",
  },
  modalClose: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F0F7F4", alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#2C1819" },

  instruccion: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#F0F7F4",
    borderBottomWidth: 1, borderBottomColor: "#E8F0EB",
  },
  instruccionText: { fontSize: 13, color: "#0D5A52", flex: 1, lineHeight: 18 },

  mapContainer: { flex: 1 },

  modalFooter: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: "#E8F0EB", gap: 10,
  },
  coordPreview: { flexDirection: "row", alignItems: "center", gap: 6 },
  coordText:    { fontSize: 13, color: "#2C1819", fontFamily: "monospace" },
  coordEmpty:   { fontSize: 13, color: "#999" },

  confirmarBtn: {
    backgroundColor: "#0D5A52", borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, gap: 8,
  },
  confirmarBtnDisabled: { backgroundColor: "#A8C5B8" },
  confirmarText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
