import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/Button";
import { InputField } from "../../../components/InputField";
import { ColorScheme } from "../../../constants/Colors";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome5";

export default function ChangePswdScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({ actual: "", nueva: "", confirm: "" });

  const handleCambiar = async () => {
    let errActual = "";
    let errNueva = "";
    let errConfirm = "";
    let hayError = false;

    if (passwordActual.length < 6) {
      errActual = "Introduce tu contraseña actual";
      hayError = true;
    }
    if (passwordNueva.length < 6) {
      errNueva = "Mínimo 6 caracteres";
      hayError = true;
    }
    if (passwordNueva !== passwordConfirm) {
      errConfirm = "Las contraseñas no coinciden";
      hayError = true;
    }

    setErrores({ actual: errActual, nueva: errNueva, confirm: errConfirm });

    if (hayError) {
      return;
    }

    setLoading(true);
    try {
      let email = "";
      if (user && user.email) {
        email = user.email;
      } else {
        return;
      }

      const resSignIn = await supabase.auth.signInWithPassword({ email: email, password: passwordActual });
      if (resSignIn.error) {
        setErrores({ actual: "Contraseña actual incorrecta", nueva: "", confirm: "" });
        return;
      }

      const resUpdate = await supabase.auth.updateUser({ password: passwordNueva });
      if (resUpdate.error) {
        setErrores({ actual: "", nueva: resUpdate.error.message, confirm: "" });
        return;
      }

      router.back();
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  let btnText = "Cambiar contraseña";
  if (loading) {
    btnText = "Guardando...";
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>Cambiar contraseña</Text>
      </View>

      <View style={styles.content}>
        <InputField label="Contraseña actual" placeholder="Tu contraseña actual" secureTextEntry value={passwordActual} onChangeText={setPasswordActual} error={errores.actual} />
        <InputField label="Nueva contraseña" placeholder="Mínimo 6 caracteres" secureTextEntry value={passwordNueva} onChangeText={setPasswordNueva} error={errores.nueva} />
        <InputField label="Confirmar nueva contraseña" placeholder="Repite la nueva contraseña" secureTextEntry value={passwordConfirm} onChangeText={setPasswordConfirm} error={errores.confirm} />
        <Button title={btnText} onPress={handleCambiar} loading={loading} style={{ marginTop: 16 }} />
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.divider },
  backButton: { width: 40, height: 40, marginRight: 12, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontFamily: "NotoSans", fontSize: 24, fontWeight: "bold", color: colors.text, flex: 1 },
  content: { flex: 1, padding: 24 },
});