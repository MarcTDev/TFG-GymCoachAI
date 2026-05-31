import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { InputField } from "../../components/InputField";
import { Button } from "../../components/Button";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { login } from "../../services/auth";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({ email: "", password: "", general: "" });

  const limpiarError = (campo: string) => {
    let nuevosErrores = { email: errores.email, password: errores.password, general: errores.general };
    if (campo === "email") nuevosErrores.email = "";
    if (campo === "password") nuevosErrores.password = "";
    if (campo === "general") nuevosErrores.general = "";
    setErrores(nuevosErrores);
  };

  const handleLogin = async () => {
    let errEmail = "";
    let errPassword = "";
    let hayError = false;

    if (email.trim() === "") {
      errEmail = "Introduce tu correo electrónico";
      hayError = true;
    }
    
    if (password === "") {
      errPassword = "Introduce tu contraseña";
      hayError = true;
    }
    
    setErrores({ email: errEmail, password: errPassword, general: "" });
    
    if (hayError) {
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.error) {
      setErrores({ email: "", password: "", general: "El correo o la contraseña no son correctos." });
      return;
    }
    
    // Comprobar si el usuario tiene rutina y dieta creadas
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rutina } = await supabase.from("rutina_semana").select("id").eq("usuario_id", user.id).limit(1);
        const { data: dieta } = await supabase.from("dieta_semana").select("id").eq("usuario_id", user.id).limit(1);
        
        if (!rutina || rutina.length === 0 || !dieta || dieta.length === 0) {
          router.replace("/auth/generating" as any);
          return;
        }
      }
    } catch (err) {
      // Ignorar errores de red/db y permitir pasar a workout si falla la verificación
    }
    
    router.replace("/(tabs)/workout" as any);
  };

  let btnText = "Entrar";
  if (loading) {
    btnText = "Entrando...";
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={18} color={colors.text} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.card}>
          <InputField
            label="Correo electrónico" placeholder="correo@ejemplo.com"
            value={email} keyboardType="email-address" autoCapitalize="none" error={errores.email}
            onChangeText={(v) => { setEmail(v); limpiarError("email"); limpiarError("general"); }}
          />
          <InputField
            label="Contraseña" placeholder="••••••••••••" secureTextEntry
            value={password} error={errores.password}
            onChangeText={(v) => { setPassword(v); limpiarError("password"); limpiarError("general"); }}
          />
          {errores.general !== "" && <Text style={styles.generalError}>{errores.general}</Text>}
          <Pressable style={styles.forgotContainer} onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <Button title={btnText} onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <Link href={"/auth/registro" as any} style={styles.link}>Regístrate</Link>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingTop: 80, paddingBottom: 40 },
  backButton: { position: "absolute", top: 50, left: 20, zIndex: 10, padding: 8 },
  title: { fontFamily: "NotoSans", fontSize: 30, fontWeight: "bold", color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: "NotoSans", fontSize: 16, color: colors.textSecondary, marginBottom: 28 },
  card: { backgroundColor: colors.surface, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 16 },
  generalError: { fontFamily: "NotoSans", fontSize: 14, color: "#DC2626", fontWeight: "600", marginTop: 4, marginBottom: 4, marginLeft: 4 },
  forgotContainer: { alignItems: "flex-end", marginTop: 4, marginBottom: 4 },
  forgotText: { fontFamily: "NotoSans", color: Colors.primary, fontSize: 14, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontFamily: "NotoSans", color: colors.textSecondary },
  link: { fontFamily: "NotoSans", color: Colors.primary, fontWeight: "bold" },
});