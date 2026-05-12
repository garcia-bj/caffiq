import MapboxGL from "@rnmapbox/maps";
import { View, StyleSheet, TouchableOpacity, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

export interface MapInnerProps {
  latitud: number;
  longitud: number;
  nombre: string;
  direccion?: string;
}

export default function SucursalMapInner({ latitud, longitud, nombre, direccion }: MapInnerProps) {
  const coordinate: [number, number] = [longitud, latitud]; // Mapbox: [lng, lat]

  const abrirEnMaps = () => {
    Linking.openURL(`https://maps.google.com/?q=${latitud},${longitud}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={16} color="#4CAF84" />
        <Text style={styles.title}>Ubicación</Text>
      </View>

      <View style={styles.mapWrap}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Dark}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
        >
          <MapboxGL.Camera
            zoomLevel={15}
            centerCoordinate={coordinate}
            animationMode="none"
          />
          <MapboxGL.PointAnnotation id="sucursal-pin" coordinate={coordinate} title={nombre}>
            <View style={styles.pin}>
              <Ionicons name="cafe" size={16} color="#fff" />
            </View>
          </MapboxGL.PointAnnotation>
        </MapboxGL.MapView>

        <TouchableOpacity style={styles.overlay} onPress={abrirEnMaps} activeOpacity={0.7}>
          <View style={styles.openBtn}>
            <Ionicons name="navigate-outline" size={14} color="#fff" />
            <Text style={styles.openBtnText}>Abrir en Maps</Text>
          </View>
        </TouchableOpacity>
      </View>

      {direccion ? (
        <Text style={styles.direccion} numberOfLines={2}>{direccion}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#112820",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A3A2C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  mapWrap: { height: 200, position: "relative" },
  map:     { flex: 1 },

  pin: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#0D5A52",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#4CAF84",
  },

  overlay: { position: "absolute", bottom: 10, right: 10 },
  openBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(13,90,82,0.92)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  openBtnText: { fontSize: 12, color: "#fff", fontWeight: "700" },

  direccion: { fontSize: 12, color: "#8BA89A", paddingHorizontal: 14, paddingBottom: 12 },
});
