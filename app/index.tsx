import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/frontend/context/AuthContext";
import { Caffiq } from "@/frontend/constants/theme";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Caffiq.white }}>
        <ActivityIndicator size="large" color={Caffiq.pineTeal} />
      </View>
    );
  }

  return isAuthenticated
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/(auth)/welcome" />;
}
