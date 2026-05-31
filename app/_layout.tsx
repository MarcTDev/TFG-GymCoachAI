import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import { RegistroProvider } from "../context/RegistroContext";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ThemeProvider as NavigationProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, colors } = useTheme();

  const customTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.divider,
      notification: colors.primary,
    },
  };

  return (
    <NavigationProvider value={customTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationProvider>
  );
}

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
            <RootLayoutNav />
          </RegistroProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}