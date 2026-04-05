import { useEffect } from "react";

import { getUsuarios } from "@/backend/usuarios";

import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { HelloWave } from "@/frontend/components/hello-wave";
import ParallaxScrollView from "@/frontend/components/parallax-scroll-view";
import { ThemedText } from "@/frontend/components/themed-text";
import { ThemedView } from "@/frontend/components/themed-view";
// imagenes
import { useState } from "react";
import { Button, Image as RNImage } from "react-native";

import { subirImagenCloudinary } from "@/frontend/services/cloudinary";
import { seleccionarImagen } from "@/frontend/services/imagePicker";

export default function HomeScreen() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    probarConexion();
  }, []);

  async function probarConexion() {
    const { data, error } = await getUsuarios();

    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Datos:", data);
    }
  }

  const handleSubirImagen = async () => {
    try {
      const uri = await seleccionarImagen();
      if (!uri) return;

      const urlCloud = await subirImagenCloudinary(uri);

      console.log("URL CLOUDINARY:", urlCloud);

      setUrl(urlCloud);
    } catch (error) {
      console.log("ERROR:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("../../assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Caffiq app funcionando 🚀</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes.
        </ThemedText>
      </ThemedView>

      <ThemedView style={{ marginTop: 20 }}>
        <Button title="Subir Imagen" onPress={handleSubirImagen} />

        {url && (
          <RNImage
            source={{ uri: url }}
            style={{ width: 200, height: 200, marginTop: 20 }}
          />
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    position: "absolute",
  },
});
