import { useAuth } from "@/frontend/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const D = {
  bg: "#EDF7F4",
  card: "#ffffff",
  cardBorder: "#C8DDD7",
  surface: "#D4EDE6",
  primary: "#2C1819",
  secondary: "#6FA58B",
  accent: "#0D5A52",
  accentBg: "#C0DDD5",
  border: "#C8DDD7",
} as const;

interface FaqItem {
  q: string;
  a: string;
}

const faqCliente: FaqItem[] = [
  {
    q: "¿Cómo hago un pedido?",
    a: "Ve a la pestaña Cafeterías, elige una sucursal cercana, selecciona los productos del menú, personalízalos a tu gusto y agrégalos al carrito. Cuando termines, ve al carrito y confirma tu pedido.",
  },
  {
    q: "¿Cómo personalizo un producto?",
    a: "Al tocar el botón [+] en un producto se abre la pantalla de personalización. Puedes elegir tamaño, temperatura, nivel de azúcar, tipo de leche y agregar extras. El precio se actualiza en tiempo real.",
  },
  {
    q: "¿Cómo busco cafeterías cercanas?",
    a: "Usa la pestaña Buscar para ver cafeterías en un mapa interactivo. La app usa tu ubicación actual para mostrarte las sucursales más cercanas. También puedes buscar por nombre.",
  },
  {
    q: "¿Cómo pago mi pedido?",
    a: "Al confirmar tu pedido, recibirás un código QR que debes mostrar en caja. El pago se realiza directamente en la cafetería. También puedes acceder a tu QR de pago desde la sección de Configuración.",
  },
  {
    q: "¿Cómo reviso mis pedidos anteriores?",
    a: "Ve a tu perfil y selecciona 'Mis pedidos'. Ahí verás el historial completo con el estado de cada uno: pendiente, en preparación, listo o entregado.",
  },
  {
    q: "¿Cómo cambio mis datos de perfil?",
    a: "En la pantalla de Perfil, toca el botón 'Editar'. Puedes cambiar tu nombre completo y número de WhatsApp. El correo electrónico no es editable por seguridad.",
  },
];

const faqAdmin: FaqItem[] = [
  {
    q: "¿Cómo agrego una sucursal?",
    a: "Desde el panel de administración, ve a la sección de Sucursales. Toca el botón [+] para agregar una nueva. Completa nombre, dirección, coordenadas en el mapa, y horarios de atención.",
  },
  {
    q: "¿Cómo administro el menú?",
    a: "Selecciona una sucursal y entra a la sección Menú. Puedes agregar, modificar o eliminar productos. Cada producto puede tener personalizaciones configurables (tamaños, extras, etc.).",
  },
  {
    q: "¿Cómo gestiono los pedidos?",
    a: "En la sección Pedidos verás todos los pedidos entrantes en tiempo real. Puedes cambiar su estado: pendiente → en preparación → listo → entregado. Activa las notificaciones push para recibir alertas inmediatas.",
  },
  {
    q: "¿Cómo configuro el QR de pago?",
    a: "Ve a Configuración → QR de Pago. Ahí puedes generar o actualizar el código QR que tus clientes usarán para identificarse al pagar en caja.",
  },
  {
    q: "¿Cómo activo las notificaciones?",
    a: "En tu perfil, baja hasta la sección 'Notificaciones'. Activa el switch. Recibirás una notificación push cada vez que un cliente haga un nuevo pedido en tu cafetería.",
  },
  {
    q: "¿Cómo agrego personalizaciones a un producto?",
    a: "Al editar un producto en el menú, puedes agregar grupos de personalización (tamaño, temperatura, azúcar, tipo de leche, extras). Cada grupo puede tener opciones con precio adicional.",
  },
];

function Accordion({
  item,
  expanded,
  onToggle,
}: {
  item: FaqItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.accordionQ}>{item.q}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={D.secondary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionA}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

export default function AyudaScreen() {
  const { usuario } = useAuth() as any;
  const isAdmin = usuario?.rol === "admin";
  const faq = isAdmin ? faqAdmin : faqCliente;

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setExpandedIdx(expandedIdx === idx ? null : idx);

  const handleContactWhatsApp = () => {
    Linking.openURL(
      "https://wa.me/591XXXXXXXXX?text=Hola%20Caffiq,%20necesito%20ayuda%20con:",
    ).catch(() => {});
  };

  const handleContactEmail = () => {
    Linking.openURL("mailto:soporte@caffiq.com").catch(() => {});
  };

  const renderHeader = () => (
    <Text style={styles.heroText}>Centro de ayuda</Text>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroIconWrap}>
            <Ionicons name="help-circle" size={44} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Ayuda y soporte</Text>
          <Text style={styles.heroSub}>
            Encuentra respuestas a tus preguntas frecuentes
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubbles-outline" size={18} color={D.accent} />
          <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
        </View>

        <View style={styles.card}>
          {faq.map((item, idx) => (
            <View key={idx}>
              <Accordion
                item={item}
                expanded={expandedIdx === idx}
                onToggle={() => toggle(idx)}
              />
              {idx < faq.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="headset-outline" size={18} color={D.accent} />
          <Text style={styles.sectionTitle}>Contactar soporte</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleContactEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="mail-outline" size={22} color="#E65100" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Correo electrónico</Text>
              <Text style={styles.contactSub}>soporte@caffiq.com</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={D.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Caffiq {String.fromCharCode(0x00a9)} 2026 Todos los derechos
          reservados
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingBottom: 60 },

  hero: {
    backgroundColor: D.accent,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  heroText: { fontSize: 22, fontWeight: "800", color: "#fff", marginLeft: 56 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: D.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: D.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.cardBorder,
    overflow: "hidden",
  },
  separator: { height: 1, backgroundColor: D.surface, marginHorizontal: 16 },

  accordion: {},
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  accordionQ: { flex: 1, fontSize: 14, fontWeight: "600", color: D.primary },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 14 },
  accordionA: { fontSize: 13, color: D.secondary, lineHeight: 20 },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 14, fontWeight: "600", color: D.primary },
  contactSub: { fontSize: 12, color: D.secondary, marginTop: 1 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, fontWeight: "500", color: D.primary },
  infoValue: { fontSize: 14, fontWeight: "600", color: D.accent },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: D.secondary,
    marginTop: 24,
    marginBottom: 10,
  },
});
