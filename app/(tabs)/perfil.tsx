import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, TextInput, Keyboard, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@/frontend/context/AuthContext";
import { authService } from "@/frontend/services/auth.service";
import { obtenerExpoPushToken } from "@/frontend/services/notifications.service";

const esExpoGo = Constants.appOwnership === "expo";
import { API_BASE } from "@/frontend/lib/apiUrl";
const BASE_URL = `${API_BASE}/api`;

const D = {
  bg:         "#EDF7F4",
  card:       "#ffffff",
  cardBorder: "#C8DDD7",
  surface:    "#D4EDE6",
  primary:    "#2C1819",
  secondary:  "#6FA58B",
  accent:     "#0D5A52",
  accentBg:   "#C0DDD5",
  border:     "#C8DDD7",
  danger:     "#541A1A",
  dangerBg:   "#FFF0F0",
  dangerBorder:"#FECACA",
} as const;

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={17} color={D.accent} /></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function EditRow({ icon, label, value, onChange, placeholder, keyboardType }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.iconWrap, { backgroundColor: D.accentBg }]}><Ionicons name={icon} size={17} color={D.accent} /></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TextInput style={styles.editInput} value={value} onChangeText={onChange} placeholder={placeholder ?? label} placeholderTextColor={D.secondary} keyboardType={keyboardType ?? "default"} autoCorrect={false} />
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const { usuario, token, setUsuario, logout } = useAuth() as any;
  const [loggingOut, setLoggingOut] = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [nomCompleto, setNomCompleto] = useState(usuario?.nom_completo ?? "");
  const [telefono,    setTelefono]    = useState(usuario?.num_telefono ?? "");

  const handleLogout = async () => {
    const doLogout = async () => {
      setLoggingOut(true);
      await logout();
      router.replace("/(auth)/welcome");
    };
    if (Platform.OS === "web") {
      if (window.confirm("¿Cerrar sesión?")) doLogout();
    } else {
      Alert.alert("Cerrar sesión", "¿Estás seguro que deseas salir?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const handleEdit = () => { setNomCompleto(usuario?.nom_completo ?? ""); setTelefono(usuario?.num_telefono ?? ""); setEditMode(true); };
  const handleCancel = () => { setEditMode(false); Keyboard.dismiss(); };

  const handleSave = async () => {
    if (!nomCompleto.trim()) { Alert.alert("Error", "El nombre no puede estar vacío."); return; }
    if (!token) return;
    try {
      setSaving(true);
      const updated = await authService.updateMe(token, { nom_completo: nomCompleto.trim(), num_telefono: telefono.trim() });
      if (setUsuario && updated.usuario) setUsuario(updated.usuario);
      setEditMode(false); Keyboard.dismiss();
      Alert.alert("Guardado", "Tu perfil fue actualizado.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  };

  const isAdmin = usuario?.rol === "admin";
  const inicial = usuario?.nom_completo?.charAt(0).toUpperCase() ?? "U";
  const joinDate = usuario?.created_at ? new Date(usuario.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "—";

  // ── Notificaciones (solo admin, solo dev build) ──────────────────────────────
  const [notifActivas,  setNotifActivas]  = useState(false);
  const [notifCargando, setNotifCargando] = useState(false);

  useEffect(() => {
    if (!isAdmin || esExpoGo) return;
    (async () => {
      const Notifications = require("expo-notifications");
      const { status } = await Notifications.getPermissionsAsync();
      setNotifActivas(status === "granted");
    })();
  }, [isAdmin]);

  const toggleNotificaciones = async (activar: boolean) => {
    if (!token) return;
    setNotifCargando(true);
    try {
      if (activar) {
        const pushToken = await obtenerExpoPushToken();
        if (!pushToken) {
          Alert.alert(
            "Permisos denegados",
            "Ve a Ajustes → Caffiq → Notificaciones y actívalas manualmente.",
          );
          return;
        }
        if (pushToken === "FIREBASE_NOT_CONFIGURED") {
          Alert.alert(
            "Configuración pendiente",
            "Las notificaciones push requieren configurar Firebase. Consulta la guía de configuración del proyecto.",
          );
          return;
        }
        await fetch(`${BASE_URL}/auth/push-token`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ token: pushToken }),
        });
        setNotifActivas(true);
      } else {
        await fetch(`${BASE_URL}/auth/push-token`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ token: null }),
        });
        setNotifActivas(false);
      }
    } catch {
      Alert.alert("Error", "No se pudieron actualizar las notificaciones.");
    } finally {
      setNotifCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Hero header ── */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{inicial}</Text>
            </View>
            {!editMode && (
              <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEdit}>
                <Ionicons name="create-outline" size={13} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.heroName}>{usuario?.nom_completo ?? "Usuario"}</Text>
          <View style={[styles.rolBadge, isAdmin && styles.rolBadgeAdmin]}>
            <Ionicons name={isAdmin ? "storefront-outline" : "person-outline"} size={11} color={isAdmin ? "#fff" : D.accent} />
            <Text style={[styles.rolText, isAdmin && styles.rolTextAdmin]}>{isAdmin ? "Administrador" : "Cliente"}</Text>
          </View>
        </View>

        {/* ── Tarjeta de info ── */}
        <View style={styles.card}>
          <View style={styles.cardTitle}>
            <Text style={styles.cardTitleText}>{editMode ? "EDITAR PERFIL" : "INFORMACIÓN"}</Text>
            {!editMode ? (
              <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                <Ionicons name="create-outline" size={13} color={D.accent} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editMode ? (
            <>
              <EditRow icon="person-circle-outline" label="Nombre completo" value={nomCompleto} onChange={setNomCompleto} placeholder="Tu nombre completo" />
              <View style={styles.divider} />
              <EditRow icon="call-outline" label="WhatsApp" value={telefono} onChange={setTelefono} placeholder="+591XXXXXXXX" keyboardType="phone-pad" />
              <View style={styles.divider} />
              <InfoRow icon="mail-outline"     label="Correo (no editable)" value={usuario?.nom_usuario ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="calendar-outline" label="Miembro desde"        value={joinDate} />
            </>
          ) : (
            <>
              <InfoRow icon="mail-outline"     label="Correo electrónico" value={usuario?.nom_usuario  ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="call-outline"     label="WhatsApp"           value={usuario?.num_telefono ?? ""} />
              <View style={styles.divider} />
              <InfoRow icon="calendar-outline" label="Miembro desde"      value={joinDate} />
              <View style={styles.divider} />
              <InfoRow icon={usuario?.telefono_verificado ? "checkmark-circle-outline" : "close-circle-outline"} label="Teléfono" value={usuario?.telefono_verificado ? "Verificado ✓" : "Sin verificar"} />
            </>
          )}
        </View>

        {/* ── Opciones ── */}
        {!editMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitleText} style={[styles.cardTitleText, { paddingHorizontal: 16, paddingTop: 14 }]}>CONFIGURACIÓN</Text>
            <TouchableOpacity style={styles.optRow} onPress={handleEdit}>
              <View style={styles.iconWrap}><Ionicons name="create-outline" size={17} color={D.accent} /></View>
              <Text style={styles.optText}>Editar perfil</Text>
              <Ionicons name="chevron-forward" size={15} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optRow} onPress={() => router.push("/(tabs)/mis-pedidos" as never)}>
              <View style={styles.iconWrap}><Ionicons name="receipt-outline" size={17} color={D.accent} /></View>
              <Text style={styles.optText}>Mis pedidos</Text>
              <Ionicons name="chevron-forward" size={15} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optRow} onPress={() => router.push("/ayuda" as never)}>
              <View style={styles.iconWrap}><Ionicons name="help-circle-outline" size={17} color={D.accent} /></View>
              <Text style={styles.optText}>Ayuda y soporte</Text>
              <Ionicons name="chevron-forward" size={15} color={D.secondary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Notificaciones (solo admin) ── */}
        {isAdmin && !editMode && (
          <View style={styles.card}>
            <View style={styles.cardTitle}>
              <Text style={styles.cardTitleText}>NOTIFICACIONES</Text>
              {notifActivas && !esExpoGo && (
                <View style={styles.notifActivaBadge}>
                  <View style={styles.notifDot} />
                  <Text style={styles.notifActivaText}>Activas</Text>
                </View>
              )}
            </View>

            {esExpoGo ? (
              <View style={styles.notifExpoGoRow}>
                <Ionicons name="information-circle-outline" size={18} color={D.secondary} />
                <Text style={styles.notifExpoGoText}>
                  Las notificaciones push requieren un{" "}
                  <Text style={{ fontWeight: "700" }}>development build</Text>.
                  No están disponibles en Expo Go.
                </Text>
              </View>
            ) : (
              <View style={styles.notifRow}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={notifActivas ? "notifications" : "notifications-off-outline"}
                    size={17}
                    color={notifActivas ? D.accent : D.secondary}
                  />
                </View>
                <View style={styles.notifInfo}>
                  <Text style={styles.notifLabel}>Nuevos pedidos</Text>
                  <Text style={styles.notifSub}>
                    {notifActivas
                      ? "Recibirás una notificación cada vez que llegue un pedido"
                      : "Activa para recibir alertas de nuevos pedidos"}
                  </Text>
                </View>
                {notifCargando
                  ? <ActivityIndicator size="small" color={D.accent} />
                  : <Switch
                      value={notifActivas}
                      onValueChange={toggleNotificaciones}
                      trackColor={{ false: D.cardBorder, true: D.accent }}
                      thumbColor="#fff"
                    />
                }
              </View>
            )}
          </View>
        )}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut} activeOpacity={0.85}>
          {loggingOut
            ? <ActivityIndicator color={D.danger} />
            : <><Ionicons name="log-out-outline" size={19} color={D.danger} /><Text style={styles.logoutText}>Cerrar sesión</Text></>
          }
        </TouchableOpacity>

        <Text style={styles.version}>Caffiq v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingBottom: 110 },

  hero: { backgroundColor: D.accent, alignItems: "center", paddingTop: 28, paddingBottom: 32, paddingHorizontal: 24 },
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  editAvatarBtn: { position: "absolute", bottom: 0, right: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: D.secondary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: D.accent },
  rolBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 6 },
  rolBadgeAdmin: { backgroundColor: "rgba(255,255,255,0.15)" },
  rolText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  rolTextAdmin: { color: "#fff" },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },

  card: { marginHorizontal: 16, marginTop: 14, backgroundColor: D.card, borderRadius: 18, borderWidth: 1, borderColor: D.cardBorder, overflow: "hidden", shadowColor: "#0D5A52", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  cardTitleText: { fontSize: 10, fontWeight: "800", color: D.secondary, letterSpacing: 1.5 },
  divider: { height: 1, backgroundColor: D.surface, marginHorizontal: 16 },

  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: D.accentBg, borderWidth: 1, borderColor: D.border },
  editBtnText: { fontSize: 12, fontWeight: "700", color: D.accent },
  editActions: { flexDirection: "row", gap: 8 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.border },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: D.secondary },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, backgroundColor: D.accent },
  saveBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  infoRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoLabel:{ fontSize: 11, color: D.secondary, marginBottom: 2 },
  infoValue:{ fontSize: 14, fontWeight: "600", color: D.primary },
  editInput:{ fontSize: 14, fontWeight: "600", color: D.primary, borderBottomWidth: 1.5, borderBottomColor: D.accent, paddingVertical: 2 },

  optRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  optText: { fontSize: 14, fontWeight: "600", color: D.primary },

  notifActivaBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E8F5E9", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  notifDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2E7D32" },
  notifActivaText:  { fontSize: 10, fontWeight: "700", color: "#2E7D32" },
  notifRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  notifInfo:        { flex: 1 },
  notifLabel:       { fontSize: 14, fontWeight: "600", color: D.primary },
  notifSub:         { fontSize: 11, color: D.secondary, marginTop: 2, lineHeight: 15 },
  notifExpoGoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  notifExpoGoText:  { flex: 1, fontSize: 12, color: D.secondary, lineHeight: 18 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, marginTop: 14, paddingVertical: 16, backgroundColor: D.dangerBg, borderRadius: 16, borderWidth: 1, borderColor: D.dangerBorder },
  logoutText:{ fontSize: 15, fontWeight: "700", color: D.danger },
  version:   { textAlign: "center", fontSize: 11, color: D.secondary, marginTop: 20 },
});
