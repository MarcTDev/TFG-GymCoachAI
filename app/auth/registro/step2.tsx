import { useRouter } from "expo-router";
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

export default function RegistroStep2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = makeStyles(colors);

  const { data: contextData, setData } = useRegistro();

  let inicialEdad = "";
  if (contextData.edad) inicialEdad = contextData.edad;
  
  let inicialPeso = "";
  if (contextData.peso) inicialPeso = contextData.peso;
  
  let inicialAltura = "";
  if (contextData.altura) inicialAltura = contextData.altura;

  const [edad, setEdad] = useState(inicialEdad);
  const [peso, setPeso] = useState(inicialPeso);
  const [altura, setAltura] = useState(inicialAltura);

  const [errores, setErrores] = useState({ edad: "", peso: "", altura: "" });

  const handleNext = () => {
    let valid = true;
    let errEdad = "";
    let errPeso = "";
    let errAltura = "";

    if (edad.trim() === "") { 
      errEdad = "Requerido"; 
      valid = false; 
    }
    if (peso.trim() === "") { 
      errPeso = "Requerido"; 
      valid = false; 
    }
    if (altura.trim() === "") { 
      errAltura = "Requerido"; 
      valid = false; 
    }

    setErrores({ edad: errEdad, peso: errPeso, altura: errAltura });

    if (valid) {
      setData({ edad: edad, peso: peso, altura: altura });
      router.push("/auth/registro/step3");
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={kbBehavior}>
      <View style={styles.wrapper}>
        <StatusBar barStyle={statusStyle} />

        <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 64, paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <FontAwesome name="ruler-vertical" size={22} color={Colors.primary} solid />
          </View>

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Cuéntanos sobre ti</Text>
          <ProgressBar step={1} totalSteps={4} />

          <View style={styles.card}>
            <InputField label="Edad" placeholder="Tu edad" value={edad} onChangeText={setEdad} error={errores.edad} keyboardType="number-pad" maxLength={3} />
            <InputField label="Peso (kg)" placeholder="Tu peso en kg" value={peso} onChangeText={setPeso} error={errores.peso} keyboardType="decimal-pad" maxLength={6} />
            <InputField label="Altura (cm)" placeholder="Tu altura en cm" value={altura} onChangeText={setAltura} error={errores.altura} keyboardType="number-pad" maxLength={3} />
          </View>

          <Button title="Siguiente" onPress={handleNext} style={{ marginTop: 4 }} />
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