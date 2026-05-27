import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../../components/Button";
import { ProgressBar } from "../../../components/ProgressBar";
import { SelectField } from "../../../components/SelectField";
import { ModalOnboarding, formatearPrefs, PreferenciasData } from "../../../components/ModalOnboarding";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useRegistro } from "../../../context/RegistroContext";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { registrarPerfil } from "../../../services/auth";

const OBJETIVOS = [
  { label: "Perder peso", value: "perder_peso" },
  { label: "Ganar músculo", value: "ganar_musculo" },
  { label: "Mantener peso", value: "mantener_peso" },
  { label: "Mejorar resistencia", value: "mejorar_resistencia" },
  { label: "Salud general", value: "salud_general" },
];

const ACTIVIDADES = [
  { label: "1-2 días a la semana", value: "1-2_dias" },
  { label: "3-4 días a la semana", value: "3-4_dias" },
  { label: "5-6 días a la semana", value: "5-6_dias" },
  { label: "Todos los días", value: "todos_dias" },
];

export default function RegistroStep3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = makeStyles(colors);
  const { data: ctx, resetData } = useRegistro();
  const { setIsRegistering } = useAuth();

  let inicialObjetivo = "";
  if (ctx.objetivo) inicialObjetivo = ctx.objetivo;
  
  let inicialActividad = "";
  if (ctx.actividad) inicialActividad = ctx.actividad;

  const [objetivo, setObjetivo] = useState(inicialObjetivo);
  const [actividad, setActividad] = useState(inicialActividad);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({ objetivo: "", actividad: "" });
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const handleNext = () => {
    let errObjetivo = "";
    let errActividad = "";
    let hayError = false;

    if (objetivo === "") {
      errObjetivo = "Selecciona un objetivo";
      hayError = true;
    }
    
    if (actividad === "") {
      errActividad = "Selecciona tu nivel de actividad";
      hayError = true;
    }
    
    setErrores({ objetivo: errObjetivo, actividad: errActividad });
    
    if (hayError) {
      return;
    }

    if (ctx.viaGoogle) {
      setOnboardingVisible(true);
    } else {
      router.push("/auth/registro/step4");
    }
  };

  const handleOnboardingComplete = async (prefs: PreferenciasData) => {
    setOnboardingVisible(false);
    setLoading(true);
    try {
      await registrarPerfil(ctx.googleUserId, {
        nombre: ctx.nombre,
        apellidos: ctx.apellidos,
        nombre_usuario: ctx.nombreUsuario,
        edad: ctx.edad,
        peso: ctx.peso,
        altura: ctx.altura,
        objetivo: objetivo,
        actividad: actividad,
        info_adicional: formatearPrefs(prefs, ctx.infoAdicional),
      });
      router.replace("/auth/generating" as any);
      resetData();
    } catch (error: any) {
      let msg = "";
      if (error && error.message) {
        msg = error.message;
      }
      alert("Error al guardar el perfil: " + msg);
    } finally {
      setLoading(false);
      setIsRegistering(false);
    }
  };

  let kbBehavior = undefined;
  if (Platform.OS === "ios") {
    kbBehavior = "padding" as const;
  }
  
  let statusStyle = "dark-content" as const;
  if (colorScheme === "dark") {
    statusStyle = "light-content" as const;
  }

  let btnText = "Siguiente";
  if (ctx.viaGoogle) {
    btnText = "Finalizar";
  }
  if (loading) {
    btnText = "Guardando...";
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={kbBehavior}>
      <View style={styles.wrapper}>
        <StatusBar barStyle={statusStyle} />

        <ModalOnboarding visible={onboardingVisible} onComplete={handleOnboardingComplete} />

        <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 64, paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <FontAwesome name="bullseye" size={22} color={Colors.primary} solid />
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Define tus objetivos</Text>
          <ProgressBar step={2} totalSteps={4} />

          <View style={styles.card}>
            <SelectField label="Objetivo principal" placeholder="¿Cuál es tu objetivo?" value={objetivo} options={OBJETIVOS} onSelect={setObjetivo} error={errores.objetivo} />
            <SelectField label="Días de actividad a la semana" placeholder="¿Cuánto entrenas?" value={actividad} options={ACTIVIDADES} onSelect={setActividad} error={errores.actividad} />
          </View>

          <Button
            title={btnText}
            onPress={handleNext} loading={loading} style={{ marginTop: 4 }}
          />
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
});