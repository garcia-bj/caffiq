import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_BASE } from "@/frontend/lib/apiUrl";

// Las notificaciones push remotas no funcionan en Expo Go desde SDK 53
const esExpoGo = Constants.appOwnership === "expo";

export async function obtenerExpoPushToken(): Promise<string | null> {
  if (esExpoGo) return null;
  if (!Device.isDevice) return null;

  // Import diferido para no cargar expo-notifications en Expo Go
  const Notifications = require("expo-notifications");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pedidos", {
      name:             "Pedidos",
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#0D5A52",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return result.data;
  } catch (e: any) {
    const msg = e?.message ?? "";
    if (msg.includes("FirebaseApp") || msg.includes("FCM")) {
      console.warn("[Push] Firebase no configurado — falta google-services.json");
      return "FIREBASE_NOT_CONFIGURED";
    }
    console.warn("[Push] No se pudo obtener push token:", e);
    return null;
  }
}
