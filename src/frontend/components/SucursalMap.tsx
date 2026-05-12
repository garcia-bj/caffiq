import { useState, useEffect, Component, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { NativeModules } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface SucursalMapProps {
  latitud: number;
  longitud: number;
  nombre: string;
  direccion?: string;
}

// Comprobación síncrona: si el módulo nativo no existe, no intentamos cargar Mapbox
const MAPBOX_AVAILABLE = NativeModules.RNMBXModule != null;

function MapFallback({ latitud, longitud, nombre, direccion }: SucursalMapProps) {
  const abrirEnMaps = () => {
    Linking.openURL(`https://maps.google.com/?q=${latitud},${longitud}`).catch(() => {});
  };

  return (
    <View style={styles.fallback}>
      <View style={styles.fallbackHeader}>
        <Ionicons name="location" size={16} color="#4CAF84" />
        <Text style={styles.fallbackTitle}>Ubicación</Text>
      </View>
      <View style={styles.fallbackBody}>
        <Ionicons name="map-outline" size={40} color="#4A8A72" />
        <Text style={styles.fallbackNombre}>{nombre}</Text>
        {direccion ? <Text style={styles.fallbackAddr}>{direccion}</Text> : null}
        <TouchableOpacity style={styles.mapsBtn} onPress={abrirEnMaps} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={15} color="#fff" />
          <Text style={styles.mapsBtnText}>Ver en Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SucursalMap(props: SucursalMapProps) {
  const [MapInner, setMapInner] = useState<React.ComponentType<SucursalMapProps> | null>(null);
  const [failed, setFailed] = useState(!MAPBOX_AVAILABLE);

  useEffect(() => {
    if (!MAPBOX_AVAILABLE) return;
    import("./SucursalMapInner")
      .then((mod) => {
        if (mod && typeof mod.default === "function") {
          setMapInner(() => mod.default as React.ComponentType<SucursalMapProps>);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <MapFallback {...props} />;
  if (!MapInner) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#4CAF84" />
      </View>
    );
  }
  return <MapInner {...props} />;
}

const styles = StyleSheet.create({
  loading: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 24,
  },
  fallback: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#112820",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A3A2C",
  },
  fallbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fallbackTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  fallbackBody:  {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  fallbackNombre: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  fallbackAddr:   { fontSize: 12, color: "#8BA89A", textAlign: "center" },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#0D5A52",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mapsBtnText: { fontSize: 13, color: "#fff", fontWeight: "700" },
});
