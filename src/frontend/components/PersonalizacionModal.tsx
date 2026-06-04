import { useState, useMemo } from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ProductoPublico } from "@/frontend/services/productos.service";
import type { Personalizacion, OpcionPersonalizacion } from "@/frontend/services/personalizaciones.service";
import type { OpcionSeleccionada } from "@/frontend/context/CartContext";
import { useResponsive } from "@/frontend/hooks/use-responsive";

const D = {
  bg:         "#ffffff",
  surface:    "#EDF7F4",
  border:     "#C8DDD7",
  primary:    "#2C1819",
  secondary:  "#6FA58B",
  accent:     "#0D5A52",
  accentBg:   "#C0DDD5",
  accentLight:"#6FA58B",
  danger:     "#541A1A",
  dangerBg:   "#FFF0F0",
  selected:   "#C0DDD5",
  selBorder:  "#0D5A52",
} as const;

interface Props {
  visible: boolean;
  producto: ProductoPublico | null;
  personalizaciones: Personalizacion[];
  cargando: boolean;
  onConfirmar: (seleccionadas: OpcionSeleccionada[]) => void;
  onCancelar: () => void;
}

export function PersonalizacionModal({ visible, producto, personalizaciones, cargando, onConfirmar, onCancelar }: Props) {
  const { fs } = useResponsive();
  const [seleccion, setSeleccion] = useState<Record<string, OpcionPersonalizacion>>({});

  const seleccionar = (pers: Personalizacion, opcion: OpcionPersonalizacion) =>
    setSeleccion((prev) => ({ ...prev, [pers.id]: opcion }));

  const requeridas      = personalizaciones.filter((p) => p.requerido);
  const todasResueltas  = requeridas.every((p) => seleccion[p.id]);
  const precioExtra     = useMemo(() => Object.values(seleccion).reduce((s, o) => s + o.precio_adicional, 0), [seleccion]);
  const precioTotal     = (producto?.precio ?? 0) + precioExtra;

  const confirmar = () => {
    const seleccionadas: OpcionSeleccionada[] = personalizaciones
      .filter((p) => seleccion[p.id])
      .map((p) => ({
        personalizacion_id:     p.id,
        personalizacion_nombre: p.nombre,
        opcion_id:              seleccion[p.id].id,
        opcion_nombre:          seleccion[p.id].nombre,
        precio_adicional:       seleccion[p.id].precio_adicional,
      }));
    setSeleccion({});
    onConfirmar(seleccionadas);
  };

  const cancelar = () => { setSeleccion({}); onCancelar(); };

  if (!producto) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Personaliza tu pedido</Text>
              <Text style={styles.headerProduct} numberOfLines={1}>{producto.nombre}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={cancelar} hitSlop={8}>
              <Ionicons name="close" size={18} color={D.primary} />
            </TouchableOpacity>
          </View>

          {cargando ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={D.accent} />
              <Text style={styles.hint}>Cargando opciones...</Text>
            </View>
          ) : personalizaciones.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.hint}>No hay personalizaciones configuradas.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {personalizaciones.map((pers) => (
                <View key={pers.id} style={styles.grupo}>
                  <View style={styles.grupoHeader}>
                    <Text style={styles.grupoNombre}>{pers.nombre}</Text>
                    {pers.requerido
                      ? <View style={styles.reqBadge}><Text style={styles.reqText}>Requerido</Text></View>
                      : <Text style={styles.optText}>Opcional</Text>
                    }
                  </View>
                  {pers.opciones.slice().sort((a, b) => a.orden - b.orden).map((opcion) => {
                    const sel = seleccion[pers.id]?.id === opcion.id;
                    return (
                      <TouchableOpacity key={opcion.id} style={[styles.opcion, sel && styles.opcionSel]} onPress={() => seleccionar(pers, opcion)} activeOpacity={0.8}>
                        <View style={[styles.radio, sel && styles.radioSel]}>
                          {sel && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.opcionNombre, sel && styles.opcionNombreSel]}>{opcion.nombre}</Text>
                        <Text style={[styles.opcionPrecio, sel && styles.opcionPrecioSel]}>
                          {opcion.precio_adicional === 0 ? "Incluido" : `+Bs. ${opcion.precio_adicional.toFixed(2)}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.precioRow}>
              <Text style={styles.precioLabel}>Total</Text>
              <Text style={styles.precioValor}>Bs. {precioTotal.toFixed(2)}</Text>
              {precioExtra > 0 && <Text style={styles.precioExtra}>(+Bs. {precioExtra.toFixed(2)} extras)</Text>}
            </View>
            {!todasResueltas && <Text style={styles.alertReq}>Selecciona todas las opciones requeridas *</Text>}
            <TouchableOpacity style={[styles.btnAgregar, !todasResueltas && styles.btnAgregarDisabled]} onPress={confirmar} disabled={!todasResueltas} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={19} color="#fff" />
              <Text style={styles.btnAgregarText}>Agregar al carrito</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(44,24,25,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: D.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "88%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: D.surface },
  headerInfo: { flex: 1, marginRight: 12 },
  headerLabel:  { fontSize: 11, color: D.secondary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  headerProduct:{ fontSize: 18, fontWeight: "800", color: D.primary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },

  center: { paddingVertical: 40, alignItems: "center", gap: 10 },
  hint:   { color: D.secondary, fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingVertical: 16 },

  grupo:       { marginBottom: 22 },
  grupoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  grupoNombre: { fontSize: 15, fontWeight: "700", color: D.primary },
  reqBadge:    { backgroundColor: D.dangerBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  reqText:     { fontSize: 10, color: D.danger, fontWeight: "700" },
  optText:     { fontSize: 11, color: D.secondary },

  opcion: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: D.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: D.border,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
  },
  opcionSel: { backgroundColor: D.selected, borderColor: D.selBorder },
  radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: D.accentLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioSel:  { borderColor: D.accent },
  radioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: D.accent },
  opcionNombre:    { flex: 1, fontSize: 14, fontWeight: "500", color: D.primary },
  opcionNombreSel: { fontWeight: "700", color: D.accent },
  opcionPrecio:    { fontSize: 13, fontWeight: "600", color: D.secondary },
  opcionPrecioSel: { color: D.accent },

  footer:    { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, borderTopWidth: 1, borderTopColor: D.surface, gap: 10 },
  precioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  precioLabel:{ fontSize: 14, fontWeight: "700", color: D.primary },
  precioValor:{ fontSize: 22, fontWeight: "800", color: D.accent },
  precioExtra:{ fontSize: 12, color: D.secondary },
  alertReq:  { fontSize: 12, color: D.danger, fontWeight: "600" },
  btnAgregar: { backgroundColor: D.accent, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  btnAgregarDisabled: { backgroundColor: D.accentLight },
  btnAgregarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
