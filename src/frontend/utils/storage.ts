import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "caffiq_token";
const USER_KEY  = "caffiq_user";

// Web fallback: localStorage (expo-secure-store no soporta web)
const webStorage = {
  get: (key: string): string | null =>
    typeof localStorage !== "undefined" ? localStorage.getItem(key) : null,
  set: (key: string, value: string): void =>
    typeof localStorage !== "undefined" ? localStorage.setItem(key, value) : undefined,
  remove: (key: string): void =>
    typeof localStorage !== "undefined" ? localStorage.removeItem(key) : undefined,
};

const isWeb = Platform.OS === "web";

export const storage = {
  async setToken(token: string) {
    if (isWeb) webStorage.set(TOKEN_KEY, token);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    if (isWeb) return webStorage.get(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken() {
    if (isWeb) webStorage.remove(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async setUser(user: object) {
    const value = JSON.stringify(user);
    if (isWeb) webStorage.set(USER_KEY, value);
    else await SecureStore.setItemAsync(USER_KEY, value);
  },

  async getUser<T>(): Promise<T | null> {
    const raw = isWeb
      ? webStorage.get(USER_KEY)
      : await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async removeUser() {
    if (isWeb) webStorage.remove(USER_KEY);
    else await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clear() {
    if (isWeb) {
      webStorage.remove(TOKEN_KEY);
      webStorage.remove(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  },
};
