import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, TextInput, Modal, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/frontend/context/AuthContext";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";
import {
  personalizacionesService,
  type Personalizacion, type OpcionPersonalizacion,
} from "@/frontend/services/personalizaciones.service";

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
  chip:    "#6FA58B",
} as const;

interface GrupoFormState {
  nombre: string;
  requerido: boolean;
}

interface OpcionFormState {
  nombre: string;
  precio: string;
}

export default function PersonalizacionScreen() {
  const { token, usuario } = useAuth();
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [grupos, setGrupos] = useState<Personalizacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal nuevo grupo
  const [modalGrupo, setModalGrupo] = useState(false);
  const [editandoGrupo, setEditandoGrupo] = useState<Personalizacion | null>(null);
  const [formGrupo, setFormGrupo] = useState<GrupoFormState>({ nombre: "", requerido: false });
  const [guardandoGrupo, setGuardandoGrupo] = useState(false);

  // Modal nueva opción
  const [modalOpcion, setModalOpcion] = useState(false);
  const [grupoActivo, setGrupoActivo] = useState<Personalizacion | null>(null);
  const [editandoOpcion, setEditandoOpcion] = useState<OpcionPersonalizacion | null>(null);
  const [formOpcion, setFormOpcion] = useState<OpcionFormState>({ nombre: "", precio: "0" });
  const [guardandoOpcion, setGuardandoOpcion] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || !usuario?.cafeteria_id) return;
    try {
      const { personalizaciones } = await personalizacionesService.listar(token, usuario.cafeteria_id);
      setGrupos(personalizaciones);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [token, usuario?.cafeteria_id]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Grupo: abrir modal ───────────────────────────────────────────────────────
  const abrirNuevoGrupo = () => {
    setEditandoGrupo(null);
    setFormGrupo({ nombre: "", requerido: false });
    setModalGrupo(true);
  };

  const abrirEditarGrupo = (g: Personalizacion) => {
    setEditandoGrupo(g);
    setFormGrupo({ nombre: g.nombre, requerido: g.requerido });
    setModalGrupo(true);
  };

  const guardarGrupo = async () => {
    if (!token || !usuario?.cafeteria_id) return;
    if (!formGrupo.nombre.trim()) {
      Alert.alert("Requerido", "El nombre del grupo no puede estar vacío.");
      return;
    }
    setGuardandoGrupo(true);
    try {
      if (editandoGrupo) {
        const { personalizacion } = await personalizacionesService.actualizar(
          token, usuario.cafeteria_id, editandoGrupo.id,
          { nombre: formGrupo.nombre.trim(), requerido: formGrupo.requerido },
        );
        setGrupos((prev) => prev.map((g) => g.id === personalizacion.id ? { ...g, ...personalizacion } : g));
      } else {
        const { personalizacion } = await personalizacionesService.crear(
          token, usuario.cafeteria_id, formGrupo.nombre.trim(), formGrupo.requerido,
        );
        setGrupos((prev) => [...prev, { ...personalizacion, opciones: [] }]);
      }
      setModalGrupo(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setGuardandoGrupo(false);
    }
  };

  const eliminarGrupo = (g: Personalizacion) => {
    Alert.alert(
      "Eliminar grupo",
      `¿Eliminar "${g.nombre}" y todas sus opciones?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            if (!token || !usuario?.cafeteria_id) return;
            try {
              await personalizacionesService.eliminar(token, usuario.cafeteria_id, g.id);
              setGrupos((prev) => prev.filter((x) => x.id !== g.id));
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  // ── Opciones: abrir modal ────────────────────────────────────────────────────
  const abrirNuevaOpcion = (g: Personalizacion) => {
    setGrupoActivo(g);
    setEditandoOpcion(null);
    setFormOpcion({ nombre: "", precio: "0" });
    setModalOpcion(true);
  };

  const abrirEditarOpcion = (g: Personalizacion, o: OpcionPersonalizacion) => {
    setGrupoActivo(g);
    setEditandoOpcion(o);
    setFormOpcion({ nombre: o.nombre, precio: String(o.precio_adicional) });
    setModalOpcion(true);
  };

  const guardarOpcion = async () => {
    if (!token || !usuario?.cafeteria_id || !grupoActivo) return;
    if (!formOpcion.nombre.trim()) {
      Alert.alert("Requerido", "El nombre de la opción no puede estar vacío.");
      return;
    }
    const precio = parseFloat(formOpcion.precio) || 0;
    setGuardandoOpcion(true);
    try {
      if (editandoOpcion) {
        const { opcion } = await personalizacionesService.actualizarOpcion(
          token, usuario.cafeteria_id, grupoActivo.id, editandoOpcion.id,
          { nombre: formOpcion.nombre.trim(), precio_adicional: precio },
        );
        setGrupos((prev) => prev.map((g) =>
          g.id === grupoActivo.id
            ? { ...g, opciones: g.opciones.map((o) => o.id === opcion.id ? opcion : o) }
            : g,
        ));
      } else {
        const { opcion } = await personalizacionesService.crearOpcion(
          token, usuario.cafeteria_id, grupoActivo.id, formOpcion.nombre.trim(), precio,
        );
        setGrupos((prev) => prev.map((g) =>
          g.id === grupoActivo.id ? { ...g, opciones: [...g.opciones, opcion] } : g,
        ));
      }
      setModalOpcion(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setGuardandoOpcion(false);
    }
  };

  const eliminarOpcion = (g: Personalizacion, o: OpcionPersonalizacion) => {
    Alert.alert(
      "Eliminar opción",
      `¿Eliminar "${o.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            if (!token || !usuario?.cafeteria_id) return;
            try {
              await personalizacionesService.eliminarOpcion(token, usuario.cafeteria_id, g.id, o.id);
              setGrupos((prev) => prev.map((gr) =>
                gr.id === g.id ? { ...gr, opciones: gr.opciones.filter((x) => x.id !== o.id) } : gr,
              ));
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

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
        <TouchableOpacity style={styles.addBtn} onPress={abrirNuevoGrupo}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={D.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Personalización</Text>
          <Text style={styles.pageSubtitle}>Define las opciones que verán tus clientes al hacer un pedido (tamaño, azúcar, temperatura, etc.)</Text>

          {grupos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="options-outline" size={52} color={D.hint} />
              <Text style={styles.emptyTitle}>Sin grupos aún</Text>
              <Text style={styles.emptyText}>Agrega el primer grupo de personalización.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={abrirNuevoGrupo}>
                <Text style={styles.emptyBtnText}>+ Nuevo grupo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            grupos.map((g) => (
              <View key={g.id} style={styles.grupoCard}>
                {/* Header del grupo */}
                <View style={styles.grupoHeader}>
                  <View style={styles.grupoHeaderLeft}>
                    <Text style={styles.grupoNombre}>{g.nombre}</Text>
                    {g.requerido ? (
                      <View style={styles.reqBadge}><Text style={styles.reqBadgeText}>Requerido</Text></View>
                    ) : (
                      <View style={styles.optBadge}><Text style={styles.optBadgeText}>Opcional</Text></View>
                    )}
                  </View>
                  <View style={styles.grupoActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => abrirEditarGrupo(g)} hitSlop={6}>
                      <Ionicons name="create-outline" size={18} color={D.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => eliminarGrupo(g)} hitSlop={6}>
                      <Ionicons name="trash-outline" size={18} color="#B71C1C" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Opciones */}
                {g.opciones.length === 0 ? (
                  <Text style={styles.sinOpciones}>Sin opciones todavía</Text>
                ) : (
                  g.opciones.slice().sort((a, b) => a.orden - b.orden).map((o) => (
                    <View key={o.id} style={styles.opcionRow}>
                      <View style={styles.opcionDot} />
                      <Text style={styles.opcionNombre}>{o.nombre}</Text>
                      <Text style={styles.opcionPrecio}>
                        {o.precio_adicional === 0 ? "Incluido" : `+$${o.precio_adicional.toFixed(2)}`}
                      </Text>
                      <TouchableOpacity onPress={() => abrirEditarOpcion(g, o)} hitSlop={8}>
                        <Ionicons name="create-outline" size={15} color={D.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => eliminarOpcion(g, o)} hitSlop={8}>
                        <Ionicons name="close-circle-outline" size={15} color="#B71C1C" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <TouchableOpacity style={styles.addOpcionBtn} onPress={() => abrirNuevaOpcion(g)}>
                  <Ionicons name="add" size={15} color={D.accent} />
                  <Text style={styles.addOpcionText}>Agregar opción</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal: Nuevo/Editar grupo */}
      <Modal visible={modalGrupo} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editandoGrupo ? "Editar grupo" : "Nuevo grupo"}
            </Text>
            <Text style={styles.modalLabel}>Nombre del grupo</Text>
            <TextInput
              style={styles.modalInput}
              value={formGrupo.nombre}
              onChangeText={(t) => setFormGrupo((f) => ({ ...f, nombre: t }))}
              placeholder="Ej: Tamaño del vaso"
              placeholderTextColor={D.hint}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>¿Obligatorio para el cliente?</Text>
              <Switch
                value={formGrupo.requerido}
                onValueChange={(v) => setFormGrupo((f) => ({ ...f, requerido: v }))}
                trackColor={{ false: "#ccc", true: D.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalGrupo(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, guardandoGrupo && { opacity: 0.6 }]}
                onPress={guardarGrupo}
                disabled={guardandoGrupo}
              >
                {guardandoGrupo
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnSaveText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Nueva/Editar opción */}
      <Modal visible={modalOpcion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editandoOpcion ? "Editar opción" : `Nueva opción en "${grupoActivo?.nombre}"`}
            </Text>
            <Text style={styles.modalLabel}>Nombre de la opción</Text>
            <TextInput
              style={styles.modalInput}
              value={formOpcion.nombre}
              onChangeText={(t) => setFormOpcion((f) => ({ ...f, nombre: t }))}
              placeholder="Ej: Mediano"
              placeholderTextColor={D.hint}
            />
            <Text style={styles.modalLabel}>Precio adicional (0 = incluido)</Text>
            <TextInput
              style={styles.modalInput}
              value={formOpcion.precio}
              onChangeText={(t) => setFormOpcion((f) => ({ ...f, precio: t }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={D.hint}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalOpcion(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, guardandoOpcion && { opacity: 0.6 }]}
                onPress={guardarOpcion}
                disabled={guardandoOpcion}
              >
                {guardandoOpcion
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnSaveText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 48 },
  pageTitle: { fontSize: 24, fontWeight: "700", color: D.label, marginBottom: 6, fontStyle: "italic" },
  pageSubtitle: { fontSize: 13, color: D.hint, lineHeight: 18, marginBottom: 20 },
  emptyBox: { alignItems: "center", paddingTop: 48, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: D.label },
  emptyText: { fontSize: 13, color: D.hint, textAlign: "center" },
  emptyBtn: {
    backgroundColor: D.accent, borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  grupoCard: {
    backgroundColor: D.card, borderRadius: 14,
    borderWidth: 1, borderColor: D.border,
    marginBottom: 16, overflow: "hidden",
  },
  grupoHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: D.green, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: D.border,
  },
  grupoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  grupoNombre: { fontSize: 15, fontWeight: "700", color: D.label },
  reqBadge: {
    backgroundColor: "#FFEBEE", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  reqBadgeText: { fontSize: 10, color: "#B71C1C", fontWeight: "700" },
  optBadge: {
    backgroundColor: "#E8F5E9", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  optBadgeText: { fontSize: 10, color: "#1B5E20", fontWeight: "700" },
  grupoActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: D.border,
  },
  sinOpciones: {
    fontSize: 13, color: D.hint, fontStyle: "italic",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  opcionRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f5f0eb",
  },
  opcionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: D.chip },
  opcionNombre: { flex: 1, fontSize: 14, color: D.label, fontWeight: "500" },
  opcionPrecio: { fontSize: 13, color: D.accent, fontWeight: "600", marginRight: 4 },
  addOpcionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  addOpcionText: { fontSize: 13, color: D.accent, fontWeight: "600" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: D.label, marginBottom: 16 },
  modalLabel: { fontSize: 13, color: D.hint, marginBottom: 6, fontWeight: "500" },
  modalInput: {
    backgroundColor: "#f5f0eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: D.label, marginBottom: 14,
    borderWidth: 1, borderColor: D.border,
  },
  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20, paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, color: D.label, fontWeight: "500" },
  modalBtns: { flexDirection: "row", gap: 10 },
  btnCancel: {
    flex: 1, backgroundColor: "#e0e8e4", borderRadius: 20,
    paddingVertical: 14, alignItems: "center",
  },
  btnCancelText: { color: D.accent, fontWeight: "700" },
  btnSave: {
    flex: 1, backgroundColor: D.accent, borderRadius: 20,
    paddingVertical: 14, alignItems: "center",
  },
  btnSaveText: { color: "#fff", fontWeight: "700" },
});
