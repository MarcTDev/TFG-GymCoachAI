import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useUser } from "../../../context/UserContext";
import { InputField } from "../../../components/InputField";
import { SelectField } from "../../../components/SelectField";
import { registrarPesoHoy } from "../../../services/peso";

const OBJETIVO_OPTIONS = [
  { label: "Perder peso", value: "perder_peso" },
  { label: "Ganar masa muscular", value: "ganar_masa" },
  { label: "Mantenimiento", value: "mantenimiento" },
  { label: "Mejorar resistencia", value: "mejorar_resistencia" },
  { label: "Definición", value: "definicion" },
];

const ACTIVIDAD_OPTIONS = [
  { label: "Sedentario", value: "sedentario" },
  { label: "Ligeramente activo", value: "ligeramente_activo" },
  { label: "Moderadamente activo", value: "moderadamente_activo" },
  { label: "Muy activo", value: "muy_activo" },
  { label: "Extremadamente activo", value: "extremadamente_activo" },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { perfil, updatePerfil, refetch } = useUser();
  const styles = makeStyles(colors);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [actividad, setActividad] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre || "");
    setApellidos(perfil.apellidos || "");
    if (perfil.edad) setEdad(String(perfil.edad));
    if (perfil.peso_actual) setPeso(String(perfil.peso_actual));
    if (perfil.altura) setAltura(String(perfil.altura));
    setObjetivo(perfil.objetivo || "");
    setActividad(perfil.nivel_actividad || "");
  }, [perfil]);

  const guardar = async () => {
    if (nombre.trim() === "") return;
    setGuardando(true);
    
    let pesoLimpio = peso;
    if (pesoLimpio.includes(",")) {
      pesoLimpio = pesoLimpio.replace(",", ".");
    }
    const pesoNum = parseFloat(pesoLimpio);

    let alturaLimpia = altura;
    if (alturaLimpia.includes(",")) {
      alturaLimpia = alturaLimpia.replace(",", ".");
    }
    const alturaNum = parseFloat(alturaLimpia);

    let edadNum = parseInt(edad);

    const res = await updatePerfil({
      nombre: nombre.trim(),
      apellidos: apellidos.trim() || null,
      edad: isNaN(edadNum) ? null : edadNum,
      altura: isNaN(alturaNum) ? null : alturaNum,
      objetivo: objetivo || null,
      nivel_actividad: actividad || null,
    });

    if (!res.error && !isNaN(pesoNum) && user) {
      await registrarPesoHoy(user.id, pesoNum);
    }
    
    setGuardando(false);
    if (res.error) return;
    
    await refetch();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Editar perfil</Text>
        <Pressable style={styles.saveBtn} onPress={guardar} disabled={guardando}>
          {guardando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>DATOS PERSONALES</Text>
        <InputField label="Nombre" placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
        <InputField label="Apellidos" placeholder="Tus apellidos" value={apellidos} onChangeText={setApellidos} />
        <InputField label="Edad" placeholder="Tu edad" value={edad} onChangeText={setEdad} keyboardType="numeric" />

        <Text style={[styles.groupLabel, { marginTop: 8 }]}>MEDIDAS</Text>
        <InputField label="Peso actual (kg)" placeholder="ej. 75.5" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
        <InputField label="Altura (cm)" placeholder="ej. 175" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" />

        <Text style={[styles.groupLabel, { marginTop: 8 }]}>OBJETIVOS</Text>
        <SelectField label="Objetivo" options={OBJETIVO_OPTIONS} value={objetivo} onSelect={setObjetivo} />
        <SelectField label="Nivel de actividad" options={ACTIVIDAD_OPTIONS} value={actividad} onSelect={setActividad} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.inputBackground, justifyContent: "center", alignItems: "center" },
  title: { fontFamily: "NotoSans", fontSize: 18, fontWeight: "bold", color: colors.text, flex: 1 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, minWidth: 80, alignItems: "center" },
  saveBtnText: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: "#fff" },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  groupLabel: { fontFamily: "NotoSans", fontSize: 11, fontWeight: "bold", color: colors.textSecondary, letterSpacing: 1, marginBottom: 12 },
});