import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, StatusBar, Platform } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../../components/Button";
import { ProgressBar } from "../../../components/ProgressBar";
import { InputField } from "../../../components/InputField";
import { ErrorModal } from "../../../components/ErrorModal";
import { ModalOnboarding, formatearPrefs, PreferenciasData } from "../../../components/ModalOnboarding";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useAuth } from "../../../context/AuthContext";
import { useRegistro } from "../../../context/RegistroContext";
import { useTheme } from "../../../context/ThemeContext";
import { registrarUsuario } from "../../../services/auth";

export default function RegistroStep4() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = makeStyles(colors);

  const { setIsRegistering } = useAuth();
  const { data: contextData, resetData } = useRegistro();

  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const { email: inicialEmail = "", infoAdicional: inicialInfo = "" } = contextData;

  const [email, setEmail] = useState(inicialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [infoAdicional, setInfoAdicional] = useState(inicialInfo);

  const [errores, setErrores] = useState({ email: "", password: "", passwordConfirm: "" });

  const handleFinalizar = () => {
    let valid = true;
    let errEmail = "";
    let errPassword = "";
    let errConfirm = "";

    if (email.includes("@") === false) { 
      errEmail = "Introduce un correo válido"; 
      valid = false; 
    }
    
    if (password.length < 6) { 
      errPassword = "Mínimo 6 caracteres"; 
      valid = false; 
    }
    
    if (password !== passwordConfirm) { 
      errConfirm = "Las contraseñas no coinciden"; 
      valid = false; 
    }

    setErrores({ email: errEmail, password: errPassword, passwordConfirm: errConfirm });
    
    if (valid === false) {
      return;
    }

    setOnboardingVisible(true);
  };

  const handleOnboardingComplete = async (prefs: PreferenciasData) => {
    setOnboardingVisible(false);
    setIsRegistering(true);
    setLoading(true);
    try {
      await registrarUsuario(email, password, {
        nombre: contextData.nombre,
        apellidos: contextData.apellidos,
        nombre_usuario: contextData.nombreUsuario,
        edad: contextData.edad,
        peso: contextData.peso,
        altura: contextData.altura,
        objetivo: contextData.objetivo,
        actividad: contextData.actividad,
        info_adicional: formatearPrefs(prefs, infoAdicional),
      });

      resetData();
      router.replace("/auth/generating" as any);

    } catch (error: any) {
      setIsRegistering(false);
      const msg = error?.message || "Inténtalo de nuevo.";
      setErrorModal({ visible: true, title: "Error al registrarse", message: msg });
    } finally {
      setLoading(false);
    }
  };

  let kbBehavior = undefined;
  if (Platform.OS === "ios") {
    kbBehavior = "padding" as const;
  }
  
  const statusStyle = colorScheme === "dark" ? "light-content" : "dark-content";
  
  let btnText = "Finalizar";
  if (loading) {
    btnText = "Creando cuenta...";
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={kbBehavior}>
      <View style={styles.wrapper}>
        <StatusBar barStyle={statusStyle} />

        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ title: errorModal.title, message: errorModal.message, visible: false })}
        />

        <ModalOnboarding visible={onboardingVisible} onComplete={handleOnboardingComplete} />

        <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 64, paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <FontAwesome name="lock" size={22} color={Colors.primary} solid />
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Casi listo, un último paso</Text>
          <ProgressBar step={3} totalSteps={4} />

          <View style={styles.card}>
            <InputField label="Correo electrónico" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} error={errores.email} keyboardType="email-address" autoCapitalize="none" />
            <InputField label="Contraseña" placeholder="Mínimo 6 caracteres" secureTextEntry value={password} onChangeText={setPassword} error={errores.password} />
            <InputField label="Confirmar contraseña" placeholder="Repite tu contraseña" secureTextEntry value={passwordConfirm} onChangeText={setPasswordConfirm} error={errores.passwordConfirm} />

            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Información adicional (opcional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enfermedades, alergias, lesiones..."
                placeholderTextColor={colors.textSecondary}
                value={infoAdicional}
                onChangeText={setInfoAdicional}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Button title={btnText} onPress={handleFinalizar} loading={loading} style={{ marginTop: 4 }} />
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
  label: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  textArea: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: 10, padding: 12, minHeight: 90, fontFamily: "NotoSans", fontSize: 15, color: colors.text },
});