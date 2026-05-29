import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Image, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { cafeteriasService } from "@/frontend/services/cafeterias.service";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary.service";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";

const D = {
  bg:      "#f5f0eb",
  header:  "#0D5A52",
  card:    "#fff",
  accent:  "#0D5A52",
  danger:  "#541A1A",
  label:   "#2C1819",
  hint:    "#7a9a8a",
  border:  "#C5D9CE",
  green:   "#EDF7F2",
} as const;

export default function QrPagoScreen() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [qrActual, setQrActual] = useState<string | null>(null);
  const [qrNuevo, setQrNuevo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || !usuario?.cafeteria_id) return;
    try {
      const { cafeteria } = await cafeteriasService.obtener(token, usuario.cafeteria_id);
      setQrActual(cafeteria.qr_pago_url ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [token, usuario?.cafeteria_id]);

  useEffect(() => { cargar(); }, [cargar]);

  const seleccionarQr = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!resultado.canceled) setQrNuevo(resultado.assets[0].uri);
  };

  const guardar = async () => {
    if (!token || !usuario?.cafeteria_id) return;
    if (!qrNuevo && !qrActual) {
      Alert.alert("Sin QR", "Selecciona una imagen de QR primero.");
      return;
    }
    setGuardando(true);
    try {
      let qr_pago_url = qrActual;
      if (qrNuevo) {
        qr_pago_url = await subirImagenCloudinary(qrNuevo);
      }
      await cafeteriasService.actualizar(token, usuario.cafeteria_id, { qr_pago_url });
      setQrActual(qr_pago_url);
      setQrNuevo(null);
      Alert.alert("Guardado", "Tu QR de pago fue actualizado correctamente.");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo guardar el QR.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarQr = () => {
    Alert.alert(
      "Eliminar QR",
      "¿Seguro que quieres quitar el QR de pago?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            if (!token || !usuario?.cafeteria_id) return;
            setGuardando(true);
            try {
              await cafeteriasService.actualizar(token, usuario.cafeteria_id, { qr_pago_url: null });
              setQrActual(null);
              setQrNuevo(null);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setGuardando(false);
            }
          },
        },
      ],
    );
  };

  const imagenMostrada = qrNuevo ?? qrActual;
  const hayCambio = qrNuevo !== null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={D.header} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavbarVisible(true)}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>☕</Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>QR de Pago</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={D.accent} />
            <Text style={styles.infoText}>
              Este QR se mostrará a tus clientes cuando realicen un pedido. Sube el código QR de tu billetera digital o cuenta bancaria.
            </Text>
          </View>

          {/* Vista previa del QR */}
          <View style={styles.qrSection}>
            {imagenMostrada ? (
              <View style={styles.qrCard}>
                <Image source={{ uri: imagenMostrada }} style={styles.qrImage} resizeMode="contain" />
                {hayCambio && (
                  <View style={styles.nuevoBadge}>
                    <Text style={styles.nuevoBadgeText}>Nuevo (sin guardar)</Text>
                  </View>
                )}
                <View style={styles.qrActions}>
                  <TouchableOpacity style={styles.btnCambiar} onPress={seleccionarQr}>
                    <Ionicons name="image-outline" size={16} color={D.accent} />
                    <Text style={styles.btnCambiarText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnEliminar} onPress={eliminarQr}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.btnEliminarText}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={seleccionarQr} activeOpacity={0.85}>
                <View style={styles.uploadIcon}>
                  <Ionicons name="qr-code-outline" size={48} color={D.accent} />
                </View>
                <Text style={styles.uploadTitle}>Subir QR de pago</Text>
                <Text style={styles.uploadSub}>Toca para seleccionar desde tu galería</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btnGuardar, (!hayCambio || guardando) && styles.btnGuardarDisabled]}
            onPress={guardar}
            disabled={!hayCambio || guardando}
            activeOpacity={0.85}
          >
            {guardando
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.btnGuardarText}>Guardar QR</Text>
                </>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      )}

      <NavbarLateral visible={navbarVisible} onClose={() => setNavbarVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  header: {
    backgroundColor: D.header,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  logoEmoji: { fontSize: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 48 },
  pageTitle: {
    fontSize: 24, fontWeight: "700", color: D.label,
    marginBottom: 20, fontStyle: "italic",
  },
  infoBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: D.green, borderRadius: 12,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: D.border,
  },
  infoText: { flex: 1, fontSize: 13, color: D.accent, lineHeight: 18 },
  qrSection: { marginBottom: 24 },
  qrCard: {
    backgroundColor: D.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: D.border,
    overflow: "hidden",
  },
  qrImage: {
    width: "100%", height: 280,
    backgroundColor: "#f9f9f9",
  },
  nuevoBadge: {
    backgroundColor: "#FF9800",
    paddingVertical: 6, alignItems: "center",
  },
  nuevoBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  qrActions: {
    flexDirection: "row", padding: 12, gap: 10,
  },
  btnCambiar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: D.green, borderRadius: 10,
    paddingVertical: 10, borderWidth: 1, borderColor: D.border,
  },
  btnCambiarText: { fontSize: 14, fontWeight: "600", color: D.accent },
  btnEliminar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#541A1A", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  btnEliminarText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  uploadBox: {
    backgroundColor: D.card, borderRadius: 16,
    borderWidth: 2, borderColor: D.border, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    paddingVertical: 48, gap: 10,
  },
  uploadIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: D.green, alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  uploadTitle: { fontSize: 16, fontWeight: "700", color: D.label },
  uploadSub: { fontSize: 13, color: D.hint },
  btnGuardar: {
    backgroundColor: D.accent, borderRadius: 30,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  btnGuardarDisabled: { backgroundColor: "#a0bfb5" },
  btnGuardarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
