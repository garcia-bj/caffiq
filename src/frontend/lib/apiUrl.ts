import Constants from "expo-constants";

function resolverApiUrl(): string {
  // 1. Variable de entorno explícita — máxima prioridad
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 2. En desarrollo: derivar la IP desde el servidor Metro automáticamente
  //    Esto funciona sin importar qué IP tenga tu computadora
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:3000`;
    }
  }
  return "http://localhost:3000";
}

export const API_BASE = resolverApiUrl();
