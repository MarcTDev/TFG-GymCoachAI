import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import { RegistroProvider } from "../context/RegistroContext";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider } from "../context/ThemeContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ NotoSans: require("../assets/fonts/NotoSans.ttf") });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <RegistroProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </RegistroProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}