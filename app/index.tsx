import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useAuth } from "../context/AuthContext";
import { useRegistro } from "../context/RegistroContext";
import { Colors } from "../constants/Colors";
import { loginConGoogle } from "../services/auth";
import { supabase } from "../lib/supabase";

export default function IndexScreen() {
  const { session, loading, setIsRegistering } = useAuth();
  const router = useRouter();
  const { setData } = useRegistro();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)/workout");
    }
  }, [session, loading]);

  const handleGoogle = async () => {
    setIsRegistering(true);
    setGoogleLoading(true);
    const { error, user } = await loginConGoogle();
    setGoogleLoading(false);

    if (error || !user) {
      setIsRegistering(false);
      return;
    }

    const { data: perfil } = await supabase.from("perfil").select("usuario_id").eq("usuario_id", user.id).single();

    if (perfil) {
      setIsRegistering(false);
      router.replace("/(tabs)/workout");
    } else {
      let nombreGoogle = "";
      let apellidosGoogle = "";
      if (user.user_metadata && user.user_metadata.full_name) {
        const partes = user.user_metadata.full_name.split(" ");
        nombreGoogle = partes[0];
        apellidosGoogle = partes.slice(1).join(" ");
      }
      
      setData({ viaGoogle: true, googleUserId: user.id, nombre: nombreGoogle, apellidos: apellidosGoogle });
      router.push("/auth/registro");
    }
  };

  if (loading || session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image source={require("../assets/images/LogoH.png")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>GymCoach <Text style={styles.appNameAccent}>AI</Text></Text>
          <Text style={styles.tagline}>Tu entrenador personal inteligente.{"\n"}Resultados reales, sin excusas.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/auth/registro")}>
            <Text style={styles.primaryButtonText}>Comenzar gratis</Text>
            <FontAwesome name="arrow-right" size={14} color={Colors.white} />
          </Pressable>

          <Pressable style={styles.googleButton} onPress={handleGoogle} disabled={googleLoading}>
            <FontAwesome name="google" size={16} color="#111" />
            <Text style={styles.googleButtonText}>
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/auth/login")}>
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta · </Text>
            <Text style={styles.secondaryButtonAccent}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F7F8FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F8FA" },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between", paddingTop: 80, paddingBottom: 40 },
  heroSection: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  logoWrapper: { width: 110, height: 110, borderRadius: 30, backgroundColor: "#fff", borderWidth: 2, borderColor: Colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  logo: { width: 70, height: 70 },
  appName: { fontSize: 38, fontWeight: "bold", color: "#111", textAlign: "center" },
  appNameAccent: { color: Colors.primary },
  tagline: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 23, marginTop: 4 },
  footer: { gap: 12, paddingBottom: 8 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, paddingVertical: 17, borderRadius: 30 },
  primaryButtonText: { fontSize: 16, fontWeight: "bold", color: Colors.white },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 30, borderWidth: 2, borderColor: "#EBEBEB", backgroundColor: "#fff" },
  googleButtonText: { fontSize: 15, fontWeight: "bold", color: "#111" },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 30, borderWidth: 2, borderColor: Colors.primary, backgroundColor: "#fff" },
  secondaryButtonText: { fontSize: 15, color: "#666" },
  secondaryButtonAccent: { fontSize: 15, fontWeight: "bold", color: "#111" },
});