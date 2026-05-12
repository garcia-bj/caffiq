// app.config.js — configuración dinámica para poder leer env vars en los plugins nativos
const { withInfoPlist } = require("@expo/config-plugins");

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  name: "caffiq",
  slug: "caffiq",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "caffiq",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "expo-secure-store",
    [
      "@rnmapbox/maps",
      {
        // Token de descarga del SDK (sk.eyJ...) — obtenerlo en mapbox.com → Tokens → Create a token con scope "Downloads:Read"
        RNMAPBOX_MAPS_DOWNLOAD_TOKEN: process.env.MAPBOX_DOWNLOADS_TOKEN ?? "",
      },
    ],
    "expo-web-browser"
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
