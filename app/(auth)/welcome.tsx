import { Caffiq } from "@/frontend/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsive } from "@/frontend/hooks/use-responsive";

export default function WelcomeScreen() {
  const { fs } = useResponsive();
  return (
    <View style={styles.container}>
      {/* Imagen hero */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.heroImage}
          contentFit="contain"
        />
      </View>

      {/* Contenido inferior */}
      <SafeAreaView edges={["bottom"]} style={styles.content}>
        {/* Decoracion superior */}
        <View style={styles.decorLine} />

        <Text style={[styles.title, { fontSize: fs(28), lineHeight: fs(36) }]}>Vamos por un{"\n"}cafe</Text>
        <Text style={styles.subtitle}>
          El mejor grano, el cafe mas fino,{"\n"}el sabor mas potente.
        </Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Caffiq.pineTeal,
  },

  // ── Imagen ──────────────────────────────────────────────────────────────────
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  heroImage: {
    width: 300,
    height: 300,
  },

  // ── Contenido ────────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  decorLine: {
    width: 48,
    height: 4,
    backgroundColor: Caffiq.mutedTeal,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: Caffiq.white,
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Caffiq.mutedTeal,
    lineHeight: 22,
    marginBottom: 40,
  },

  // ── Boton ────────────────────────────────────────────────────────────────────
  button: {
    backgroundColor: Caffiq.coffeBean,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: Caffiq.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
