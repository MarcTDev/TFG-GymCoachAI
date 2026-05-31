import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Tabs, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { session, loading, isRegistering } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/");
    }
  }, [session, loading]);

  if (loading || !session || isRegistering) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 65 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 5,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderColor: colors.divider,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        tabBarLabelStyle: {
          fontFamily: "NotoSans",
          fontSize: 10,
          fontWeight: "bold",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="workout" options={{ title: "Entrenar",
          tabBarIcon: ({ color }) => <FontAwesome size={20} name="dumbbell" color={color} solid />,
        }}
      />
      <Tabs.Screen
        name="diet" options={{ title: "Dieta",
          tabBarIcon: ({ color }) => <FontAwesome size={20} name="utensils" color={color} solid />,
        }}
      />
      <Tabs.Screen
        name="coach" options={{ title: "Coach",
          tabBarIcon: ({ color }) => <FontAwesome size={20} name="robot" color={color} solid />,
        }}
      />
      <Tabs.Screen
        name="scanner" options={{ title: "Escáner",
          tabBarIcon: ({ color }) => <FontAwesome size={20} name="camera" color={color} solid />,
        }}
      />
      <Tabs.Screen
        name="account" options={{ title: "Perfil",
          tabBarIcon: ({ color }) => <FontAwesome size={20} name="user" color={color} solid />,
        }}
      />
    </Tabs>
  );
}