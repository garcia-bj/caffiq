import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
  TextInput, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";

const D = {
  bg:         "#091A17",
  card:       "#112820",
  cardBorder: "#1A3A2C",
  primary:    "#FFFFFF",
  secondary:  "#8BA89A",
  label:      "#4A8A72",
  accent:     "#4CAF84",
  accentBg:   "#0D2E1E",
  inputBg:    "#0D2118",
  red:        "#FF6B6B",
  redBg:      "rgba(255,107,107,0.1)",
  redBorder:  "rgba(255,107,107,0.25)",
  avatarBg:   "#1A3D2A",
  adminBg:    "#1A2E3D",
  adminText:  "#4CA8CF",
} as const;

/* ─── InfoRow (modo vista) ─────────────────────────────────────── */
function InfoRow({
  icon, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={D.accent} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
      </View>
    </View>
  );
}

/* ─── EditRow (modo edición) ──────────────────────────────────── */
function EditRow({
  icon, label, value, onChange, placeholder, keyboardType,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: "#1A3D2A" }]}>
        <Ionicons name={icon} size={18} color={D.accent} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TextInput
          style={styles.editInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor={D.secondary}
          keyboardType={keyboardType ?? "default"}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

/* ─── Screen ──────────────────────────────────────────────────── */
export default function PerfilScreen() {
  const { usuario, token, setUsuario, logout } = useAuth() as any;
  const [loggingOut, setLoggingOut] = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Campos editables
  const [nomCompleto, setNomCompleto] = useState(usuario?.nom_completo ?? "");
  const [telefono,    setTelefono]    = useState(usuario?.num_telefono ?? "");

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("¿Estás seguro que deseas cerrar sesión?")) return;
      setLoggingOut(true);
      await logout();
      router.replace("/(auth)/welcome");
    } else {
      Alert.alert(
        "Cerrar sesión",
        "¿Estás seguro que deseas salir?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar sesión",
            style: "destructive",
            onPress: async () => {
              setLoggingOut(true);
              await logout();
              router.replace("/(auth)/welcome");
            },
          },
        ]
      );
    }
  };

  const handleEdit = () => {
    setNomCompleto(usuario?.nom_completo ?? "");
    setTelefono(usuario?.num_telefono ?? "");
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    if (!nomCompleto.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío.");
      return;
    }
    if (!token) return;
    try {
      setSaving(true);
      const updated = await authService.updateMe(token, {
        nom_completo: nomCompleto.trim(),
        num_telefono: telefono.trim(),
      });
      // Actualizar contexto local
      if (setUsuario && updated.usuario) {
        setUsuario(updated.usuario);
      }
      setEditMode(false);
      Keyboard.dismiss();
      Alert.alert("✓ Guardado", "Tu perfil ha sido actualizado.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin  = usuario?.rol === "admin";
  const inicial  = usuario?.nom_completo?.charAt(0).toUpperCase() ?? "U";
  const joinDate = usuario?.created_at
    ? new Date(usuario.created_at).toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header / Avatar ─────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{inicial}</Text>
            </View>
            {/* Botón editar sobre avatar */}
            {!editMode && (
              <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEdit}>
                <Ionicons name="create-outline" size={14} color={D.primary} />
              </TouchableOpacity>
            )}
            <View style={[styles.rolBadge, isAdmin && styles.rolBadgeAdmin]}>
              <Ionicons
                name={isAdmin ? "storefront-outline" : "person-outline"}
                size={11}
                color={isAdmin ? D.adminText : D.accent}
              />
              <Text style={[styles.rolBadgeText, isAdmin && { color: D.adminText }]}>
                {isAdmin ? "Administrador" : "Cliente"}
              </Text>
            </View>
          </View>
          <Text style={styles.nombre}>{usuario?.nom_completo ?? "Usuario"}</Text>
          <Text style={styles.correo}>{usuario?.nom_usuario ?? ""}</Text>
        </View>

        {/* ── Tarjeta de información / edición ──────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {editMode ? "EDITAR PERFIL" : "INFORMACIÓN DE CUENTA"}
            </Text>
            {!editMode ? (
              <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                <Ionicons name="create-outline" size={14} color={D.accent} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color={D.primary} />
                    : <Text style={styles.saveBtnText}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editMode ? (
            <>
              <EditRow
                icon="person-circle-outline"
                label="Nombre completo"
                value={nomCompleto}
                onChange={setNomCompleto}
                placeholder="Tu nombre completo"
              />
              <View style={styles.divider} />
              <EditRow
                icon="call-outline"
                label="WhatsApp"
                value={telefono}
                onChange={setTelefono}
                placeholder="+521XXXXXXXXXX"
                keyboardType="phone-pad"
              />
              <View style={styles.divider} />
              <InfoRow icon="mail-outline"     label="Correo (no editable)"   value={usuario?.nom_usuario  ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="calendar-outline" label="Miembro desde"           value={joinDate} />
            </>
          ) : (
            <>
              <InfoRow icon="mail-outline"     label="Correo electrónico" value={usuario?.nom_usuario  ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="call-outline"     label="WhatsApp"           value={usuario?.num_telefono ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="calendar-outline" label="Miembro desde"      value={joinDate} />
              <View style={styles.divider} />
              <InfoRow
                icon={usuario?.telefono_verificado ? "checkmark-circle-outline" : "close-circle-outline"}
                label="Teléfono verificado"
                value={usuario?.telefono_verificado ? "Verificado ✓" : "Sin verificar"}
              />
            </>
          )}
        </View>

        {/* ── Configuración ─────────────────────────────────── */}
        {!editMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CONFIGURACIÓN</Text>
            <TouchableOpacity style={styles.optionRow} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color={D.accent} />
              <Text style={styles.optionText}>Editar perfil</Text>
              <Ionicons name="chevron-forward" size={16} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert("Próximamente", "Notificaciones en desarrollo.")}>
              <Ionicons name="notifications-outline" size={20} color={D.accent} />
              <Text style={styles.optionText}>Notificaciones</Text>
              <Ionicons name="chevron-forward" size={16} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert("Próximamente", "Ayuda en desarrollo.")}>
              <Ionicons name="help-circle-outline" size={20} color={D.accent} />
              <Text style={styles.optionText}>Ayuda y soporte</Text>
              <Ionicons name="chevron-forward" size={16} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Cerrar sesión ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={D.red} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={D.red} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>Caffiq v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingBottom: 100 },

  // Header
  header:         { alignItems: "center", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  avatarWrap:     { alignItems: "center", marginBottom: 12 },
  avatar:         { width: 88, height: 88, borderRadius: 44, backgroundColor: D.avatarBg, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: `${D.accent}50` },
  avatarText:     { fontSize: 36, fontWeight: "800", color: D.accent },
  editAvatarBtn:  { position: "absolute", bottom: 26, right: -8, width: 26, height: 26, borderRadius: 13, backgroundColor: D.chipActive, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: D.bg },
  rolBadge:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: D.accentBg, marginTop: 8 },
  rolBadgeAdmin:  { backgroundColor: D.adminBg },
  rolBadgeText:   { fontSize: 11, fontWeight: "700", color: D.accent, letterSpacing: 0.5 },
  nombre:         { fontSize: 22, fontWeight: "800", color: D.primary, marginBottom: 4 },
  correo:         { fontSize: 13, color: D.secondary },

  // Cards
  card:         { marginHorizontal: 16, marginBottom: 12, backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, overflow: "hidden" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  cardTitle:    { fontSize: 10, fontWeight: "700", color: D.label, letterSpacing: 1.5 },
  divider:      { height: 1, backgroundColor: D.cardBorder, marginHorizontal: 16 },

  // Edit controls
  editBtn:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: D.accentBg, borderWidth: 1, borderColor: `${D.accent}40` },
  editBtnText:   { fontSize: 12, fontWeight: "700", color: D.accent },
  editActions:   { flexDirection: "row", gap: 8 },
  cancelBtn:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: D.cardBorder },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: D.secondary },
  saveBtn:       { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, backgroundColor: D.accent },
  saveBtnText:   { fontSize: 12, fontWeight: "700", color: D.primary },

  // Info row
  infoRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.accentBg, alignItems: "center", justifyContent: "center" },
  infoText:     { flex: 1 },
  infoLabel:    { fontSize: 11, color: D.secondary, marginBottom: 2 },
  infoValue:    { fontSize: 14, fontWeight: "600", color: D.primary },
  editInput:    { fontSize: 14, fontWeight: "600", color: D.primary, borderBottomWidth: 1, borderBottomColor: `${D.accent}60`, paddingVertical: 2 },

  // Option row
  optionRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  optionText: { fontSize: 14, fontWeight: "600", color: D.primary },

  // Logout
  logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, marginTop: 8, paddingVertical: 16, backgroundColor: D.redBg, borderRadius: 16, borderWidth: 1, borderColor: D.redBorder },
  logoutText: { fontSize: 16, fontWeight: "700", color: D.red },

  version: { textAlign: "center", fontSize: 11, color: D.label, marginTop: 20 },

  // alias para el chipActive que se usa en editAvatarBtn
  chipActive: { backgroundColor: "#1A7A58" },
});
