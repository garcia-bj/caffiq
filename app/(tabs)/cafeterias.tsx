import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { NavbarLateral } from "@/frontend/components/navbar-lateral";

const CAFETERIAS = [
  {
    id: 1,
    nombre: "Cafe Martinez",
    direccion: "Av. Ballivián #123, Cochabamba",
    imagen: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
  },
  {
    id: 2,
    nombre: "The Coffee Club",
    direccion: "Calle Sucre #456, Cochabamba",
    imagen: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600",
  },
  {
    id: 3,
    nombre: "Juan Valdez Cafe",
    direccion: "Plaza Principal #789, Cochabamba",
    imagen: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600",
  },
];

export default function CafeteriasScreen() {
  const [navbarVisible, setNavbarVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a5c4a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setNavbarVisible(true)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CAFFIQ</Text>

        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}></Text>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Cafeterías disponibles</Text>

        {CAFETERIAS.map((cafe) => (
          <TouchableOpacity key={cafe.id} style={styles.card} activeOpacity={0.85}>
            <Image source={{ uri: cafe.imagen }} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <Text style={styles.cardNombre}>{cafe.nombre}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardDireccion}>Direccion........ {cafe.direccion}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navbar lateral */}
      <NavbarLateral
        visible={navbarVisible}
        onClose={() => setNavbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f0eb",
  },
  header: {
    backgroundColor: "#1a5c4a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  menuBtn: {
    gap: 5,
    padding: 4,
  },
  menuLine: {
    width: 24,
    height: 2.5,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 3,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d2d2d",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardOverlay: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cardInfo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  cardDireccion: {
    fontSize: 13,
    color: "#777",
  },
});