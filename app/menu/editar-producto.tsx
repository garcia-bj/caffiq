import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView,
  ImageBackground, Modal, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavbar } from "@/frontend/context/NavbarContext";
import { useAuth } from "@/frontend/context/AuthContext";
import { productosService, type ProductoPublico } from "@/frontend/services/productos.service";
import { useResponsive } from "@/frontend/hooks/use-responsive";
import { subirImagenCloudinary } from "@/frontend/services/cloudinary";

export default function EditarProducto() {
  const router = useRouter();
  const { productoId, cafeteria_id: cafParam } = useLocalSearchParams<{ productoId: string; cafeteria_id?: string }>();
  const { token, usuario } = useAuth();
  const { fs } = useResponsive();
  const cafeteriaId = cafParam ?? usuario?.cafeteria_id ?? "";

  const { open: openNavbar } = useNavbar();
  const [modalConfirm, setModalConfirm] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [producto, setProducto] = useState<ProductoPublico | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [suspendido, setSuspendido] = useState(false);
  const [categoria, setCategoria] = useState("Café");
  const CATS = ["Café", "Bebidas", "Repostería", "Salados"];

  useEffect(() => {
    cargarProducto();
  }, [token, cafeteriaId, productoId]);

  const cargarProducto = async () => {
    if (!token || !cafeteriaId || !productoId) return;
    setCargando(true);
    try {
      const { producto: datos } = await productosService.obtener(token, cafeteriaId, productoId as string);
      setProducto(datos);
      setNombre(datos.nombre ?? "");
      setDescripcion(datos.descripcion ?? "");
      setPrecio(String(datos.precio ?? ""));
      setStock(String(datos.stock ?? ""));
      setImagen(datos.imagen_url ?? null);
      setSuspendido(!datos.disponible);
      setCategoria(datos.categoria ?? "Café");
    } catch {
      Alert.alert("Error", "No se pudo cargar el producto");
    } finally {
      setCargando(false);
    }
  };

  const cambiarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!resultado.canceled) setImagen(resultado.assets[0].uri);
  };

  const intentarGuardar = () => {
    if (!nombre.trim()) return Alert.alert("Requerido", "El nombre no puede estar vacío.");
    const precioNum = Number(precio);
    if (!precio.trim() || isNaN(precioNum) || precioNum <= 0) {
      return Alert.alert("Precio inválido", "El precio debe ser un número mayor a 0.");
    }
    if (stock.trim()) {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
        return Alert.alert("Stock inválido", "El stock debe ser un entero igual o mayor a 0.");
      }
      if (stockNum === 0 && !suspendido) {
        Alert.alert(
          "Advertencia de stock",
          "Con stock en 0 el producto quedará como 'No disponible' para los clientes. ¿Continuar?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Guardar igual", onPress: () => setModalConfirm(true) },
          ],
        );
        return;
      }
    }
    setModalConfirm(true);
  };

  const confirmarGuardar = async () => {
    if (!token || !cafeteriaId || !productoId) return;
    setCargandoGuardar(true);
    setModalConfirm(false);
    try {
      let urlImagen = imagen ?? "";
      if (imagen?.startsWith("file://")) {
        urlImagen = await subirImagenCloudinary(imagen);
      }

      await productosService.modificar(token, cafeteriaId, productoId as string, {
        nom_producto:    nombre,
        descripcion:     descripcion || undefined,
        precio:          Number(precio),
        stock:           stock ? Number(stock) : 0,
        imagen_producto: urlImagen || undefined,
        estado:          !suspendido,
        categoria,
      });

      Alert.alert("✅ Éxito", "Producto actualizado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo actualizar el producto");
    } finally {
      setCargandoGuardar(false);
    }
  };

  const stockNum = stock ? parseInt(stock) : 0;

  const getBadge = () => {
    if (suspendido) return { label: "Suspendido", color: "#888888" };
    if (stockNum > 0) return { label: "Disponible", color: "#0D5A52" };
    return { label: "No disponible", color: "#541A1A" };
  };

  const badge = getBadge();

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0D5A52" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!producto) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20, color: "#541A1A" }}>Producto no encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5A52" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openNavbar}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAFFIQ</Text>
        <View style={styles.logoContainer}><Text style={styles.logoEmoji}>☕</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0D5A52" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Datos del Producto</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Producto</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripcion del Producto</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={descripcion} onChangeText={setDescripcion}
            multiline numberOfLines={4} textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.catRow}>
            {CATS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, categoria === cat && styles.catChipSel]}
                onPress={() => setCategoria(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catChipText, categoria === cat && styles.catChipTextSel]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rowGroup}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Precio</Text>
            <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Stock</Text>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado del producto</Text>
          <View style={styles.estadoRow}>
            <TouchableOpacity style={styles.radioOption} onPress={() => setSuspendido(false)}>
              <View style={[styles.radioCircle, !suspendido && styles.radioActivo]} />
              <Text style={styles.radioLabel}>Activo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioOption} onPress={() => setSuspendido(true)}>
              <View style={[styles.radioCircle, suspendido && styles.radioSuspendido]} />
              <Text style={styles.radioLabel}>Suspendido</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.estadoBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.estadoBadgeText}>{badge.label}</Text>
            </View>
            {!suspendido && <Text style={styles.estadoHint}>(Disponibilidad según stock)</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Foto del Producto</Text>
          {imagen ? (
            <View style={styles.previewContainer}>
              <ImageBackground source={{ uri: imagen }} style={styles.previewImage} imageStyle={{ borderRadius: 10 }}>
                <TouchableOpacity style={styles.removeBtn} onPress={() => setImagen(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.changeBtn} onPress={cambiarImagen}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.changeBtnText}>  Cambiar imagen</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={cambiarImagen}>
              <Ionicons name="cloud-upload-outline" size={36} color="#fff" />
              <Text style={styles.uploadText}>Coloque un archivo aquí</Text>
              <Text style={styles.uploadSubtext}>Toca para abrir la galería</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnGuardar, cargandoGuardar && { opacity: 0.6 }]}
          onPress={intentarGuardar}
          disabled={cargandoGuardar}
        >
          {cargandoGuardar
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Guardar cambios</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={modalConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Guardar cambios?</Text>
            <Text style={styles.modalDesc}>
              Se actualizará <Text style={styles.modalNombre}>"{nombre}"</Text> en el menú.
            </Text>
            <View style={styles.modalResumen}>
              <Text style={styles.resumenItem}>💰 Precio: Bs. {precio}</Text>
              <Text style={styles.resumenItem}>📦 Stock: {stock}</Text>
              <Text style={styles.resumenItem}>🔘 Estado: {badge.label}</Text>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalConfirm(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarGuardar}>
                <Text style={styles.btnConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f0eb" },
  header: { backgroundColor: "#0D5A52", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50 },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 24, height: 2.5, backgroundColor: "#fff", borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  logoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 84 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, color: "#0D5A52", fontWeight: "600" },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#2C1819", marginBottom: 20, fontStyle: "italic" },
  inputGroup: { marginBottom: 14 },
  rowGroup: { flexDirection: "row", marginBottom: 14 },
  label: { fontSize: 13, color: "#2C1819", marginBottom: 5, fontWeight: "500" },
  catRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catChip: { borderRadius: 20, borderWidth: 1.5, borderColor: "#C5D9CE", paddingVertical: 8, paddingHorizontal: 18, backgroundColor: "#fff" },
  catChipSel: { borderColor: "#0D5A52", backgroundColor: "#0D5A52" },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#6FA58B" },
  catChipTextSel: { color: "#fff" },
  input: { backgroundColor: "#6FA58B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#fff" },
  inputMultiline: { height: 100, paddingTop: 12 },
  estadoRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 10 },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#0D5A52" },
  radioActivo: { backgroundColor: "#0D5A52", borderColor: "#0D5A52" },
  radioSuspendido: { backgroundColor: "#888888", borderColor: "#888888" },
  radioLabel: { fontSize: 13, color: "#2C1819" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  estadoHint: { fontSize: 11, color: "#999", fontStyle: "italic" },
  previewContainer: { borderRadius: 10, overflow: "hidden" },
  previewImage: { width: "100%", height: 200, justifyContent: "space-between" },
  removeBtn: { margin: 8, backgroundColor: "rgba(0,0,0,0.6)", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  changeBtn: { backgroundColor: "rgba(13,90,82,0.82)", paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  changeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  uploadBox: { backgroundColor: "#6FA58B", borderRadius: 10, height: 140, alignItems: "center", justifyContent: "center", gap: 6 },
  uploadText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  btnGuardar: { backgroundColor: "#541A1A", borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "85%", elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0D5A52", textAlign: "center", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16, lineHeight: 20 },
  modalNombre: { fontWeight: "700", color: "#2C1819" },
  modalResumen: { backgroundColor: "#f0f7f4", borderRadius: 10, padding: 12, marginBottom: 20, gap: 6 },
  resumenItem: { fontSize: 13, color: "#2C1819" },
  modalBtns: { flexDirection: "row", gap: 10 },
  btnCancelar: { flex: 1, backgroundColor: "#6FA58B", borderRadius: 20, paddingVertical: 12, alignItems: "center" },
  btnCancelarText: { color: "#fff", fontWeight: "700" },
  btnConfirmar: { flex: 1, backgroundColor: "#0D5A52", borderRadius: 20, paddingVertical: 12, alignItems: "center" },
  btnConfirmarText: { color: "#fff", fontWeight: "700" },
});
