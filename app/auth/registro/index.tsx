import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../../components/Button";
import { ProgressBar } from "../../../components/ProgressBar";
import { InputField } from "../../../components/InputField";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useRegistro } from "../../../context/RegistroContext";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

export default function RegistroStep1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = makeStyles(colors);

  const { data: contextData, setData, resetData } = useRegistro();
  const { setIsRegistering } = useAuth();

  let inicialNombre = "";
  if (contextData.nombre) inicialNombre = contextData.nombre;
  
  let inicialApellidos = "";
  if (contextData.apellidos) inicialApellidos = contextData.apellidos;
  
  let inicialUsuario = "";
  if (contextData.nombreUsuario) inicialUsuario = contextData.nombreUsuario;

  const [nombre, setNombre] = useState(inicialNombre);
  const [apellidos, setApellidos] = useState(inicialApellidos);
  const [nombreUsuario, setNombreUsuario] = useState(inicialUsuario);

  const [errores, setErrores] = useState({ nombre: "", apellidos: "", nombreUsuario: "" });

  const handleBack = () => {
    if (contextData.viaGoogle) {
      resetData();
      setIsRegistering(false);
    }
    router.back();
  };

  const handleNext = () => {
    let valid = true;
    let errNombre = "";
    let errApellidos = "";
    let errUsuario = "";

    if (nombre.trim() === "") { 
      errNombre = "El nombre es obligatorio"; 
      valid = false; 
    }
    
    if (apellidos.trim() === "") { 
      errApellidos = "Los apellidos son obligatorios"; 
      valid = false; 
    }
    
    if (nombreUsuario.trim() === "") { 
      errUsuario = "El nombre de usuario es obligatorio"; 
      valid = false; 
    }

    setErrores({ nombre: errNombre, apellidos: errApellidos, nombreUsuario: errUsuario });

    if (valid) {
      setData({ nombre: nombre, apellidos: apellidos, nombreUsuario: nombreUsuario });
      router.push("/auth/registro/step2");
    }
  };

  let kbBehavior = undefined;
  if (Platform.OS === "ios") {
    kbBehavior = "padding" as const;
  }
  
  const statusStyle = colorScheme === "dark" ? "light-content" : "dark-content";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={kbBehavior}>
      <View style={styles.wrapper}>
        <StatusBar barStyle={statusStyle} />

        <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={handleBack}>
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 64, paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <FontAwesome name="user-plus" size={22} color={Colors.primary} solid />
          </View>

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Empieza tu camino fitness hoy</Text>
          <ProgressBar step={0} totalSteps={4} />

          <View style={styles.card}>
            <InputField label="Nombre" placeholder="Tu nombre" value={nombre} onChangeText={setNombre} error={errores.nombre} />
            <InputField label="Apellidos" placeholder="Tus apellidos" value={apellidos} onChangeText={setApellidos} error={errores.apellidos} />
            <InputField label="Nombre de usuario" placeholder="Elige un nombre de usuario" value={nombreUsuario} onChangeText={setNombreUsuario} error={errores.nombreUsuario} autoCapitalize="none" />
          </View>

          <Button title="Siguiente" onPress={handleNext} style={{ marginTop: 4 }} />

          {!contextData.viaGoogle && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <Link href="/auth/login" style={styles.link}>Inicia sesión</Link>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backButton: { position: "absolute", left: 20, zIndex: 10, padding: 8 },
  iconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 2, borderColor: Colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  title: { fontFamily: "NotoSans", fontSize: 24, fontWeight: "bold", color: colors.text },
  subtitle: { fontFamily: "NotoSans", fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 15, padding: 14, borderWidth: 1, borderColor: colors.divider, marginTop: 16, marginBottom: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontFamily: "NotoSans", color: colors.textSecondary },
  link: { fontFamily: "NotoSans", color: Colors.primary, fontWeight: "bold" },
});