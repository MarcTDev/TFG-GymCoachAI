import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ColorScheme, Colors } from "../../constants/Colors";
import { marcarComida } from "../../services/diet";
import { localDate } from "../../lib/dates";

export default function RecetaDetalleScreen() {
  const { id, id_dieta_comida, tipo_comida, ya_completada } = useLocalSearchParams<{ id: string; id_dieta_comida?: string; tipo_comida?: string; ya_completada?: string; }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const styles = makeStyles(colors);

  const [receta, setReceta] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  let initCompletada = false;
  if (ya_completada === "1") {
    initCompletada = true;
  }
  const [completada, setCompletada] = useState(initCompletada);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      try {
        const res = await supabase.from("receta_catalogo").select("*").eq("id", id).single();
        if (res.data) {
          setReceta(res.data);
        }
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [id]);

  const marcarComoConsumida = async () => {
    if (!user || !id_dieta_comida || !receta) return;
    
    let tipo = "snack";
    if (tipo_comida) {
      tipo = tipo_comida;
    }
    
    let kcalReceta = 0;
    if (receta.kcal) {
      kcalReceta = receta.kcal;
    }

    const comida = {
      id: id_dieta_comida,
      tipo_comida: tipo,
      receta_catalogo: { kcal: kcalReceta },
    };
    
    const res = await marcarComida(user.id, comida, "completada", localDate(0));
    if (!res.error) {
      setCompletada(true);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!receta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontró la receta</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnError}>
          <Text style={styles.backBtnErrorText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  let ingredientesStr = "";
  if (receta.ingredientes) {
    ingredientesStr = receta.ingredientes;
  }
  let ingredientesRaw = ingredientesStr.split(/[,\n]|\s-\s/);
  let ingredientes = [];
  for (let i = 0; i < ingredientesRaw.length; i++) {
    let ing = ingredientesRaw[i].trim();
    if (ing !== "") {
      ingredientes.push(ing);
    }
  }

  let pasosStr = "";
  if (receta.instrucciones) {
    pasosStr = receta.instrucciones;
  }
  let pasosRaw = pasosStr.split(/\d+\.\s+/);
  let pasos = [];
  for (let i = 0; i < pasosRaw.length; i++) {
    let p = pasosRaw[i].trim();
    if (p !== "") {
      pasos.push(p);
    }
  }

  let btnTexto = "Marcar como comida realizada";
  if (completada) {
    btnTexto = "¡Comida Completada!";
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>

        <View style={styles.heroContainer}>
          {receta.imagen_url ? (
            <Image source={{ uri: receta.imagen_url }} style={styles.heroImg} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <FontAwesome name="utensils" size={48} color={colors.textSecondary} />
            </View>
          )}
          <Pressable style={[styles.btnAtrasTop, { position: "absolute", top: 50, left: 20 }]} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={16} color={colors.text} />
          </Pressable>
          {tipo_comida && (
            <View style={[styles.badgeTipo, { position: "absolute", top: 55, right: 20 }]}>
              <Text style={styles.badgeText}>{tipo_comida.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.nombre}>{receta.nombre}</Text>
          
          <View style={styles.macrosTarjeta}>
            <View style={styles.macroCaja}>
              <Text style={styles.macroNum}>{receta.kcal}</Text>
              <Text style={styles.macroTexto}>Kcal</Text>
            </View>
            <View style={styles.macroCaja}>
              <Text style={styles.macroNum}>{receta.proteinas_g}g</Text>
              <Text style={styles.macroTexto}>Prot</Text>
            </View>
            <View style={styles.macroCaja}>
              <Text style={styles.macroNum}>{receta.carbos_g}g</Text>
              <Text style={styles.macroTexto}>Carb</Text>
            </View>
            <View style={styles.macroCaja}>
              <Text style={styles.macroNum}>{receta.grasas_g}g</Text>
              <Text style={styles.macroTexto}>Grasa</Text>
            </View>
          </View>

          {receta.descripcion && (
            <Text style={styles.descripcion}>{receta.descripcion}</Text>
          )}

          <Text style={styles.seccionTitulo}>Ingredientes</Text>
          <View style={styles.listaCaja}>
            {ingredientes.map((ing, i) => (
              <Text key={i} style={styles.textoLista}>• {ing}</Text>
            ))}
          </View>

          <Text style={styles.seccionTitulo}>Preparación</Text>
          <View style={styles.listaCaja}>
            {pasos.map((paso, i) => (
              <Text key={i} style={styles.textoLista}>{i + 1}. {paso}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {id_dieta_comida && (
        <View style={[styles.barraInferior, { paddingBottom: insets.bottom + 15 }]}>
          <Pressable 
            style={[styles.botonPrincipal, completada && { backgroundColor: '#1fa876' }]} 
            onPress={completada ? undefined : marcarComoConsumida}
          >
            <Text style={styles.botonTexto}>{btnTexto}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: colors.text, marginBottom: 15 },
  backBtnError: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnErrorText: { color: "#fff", fontWeight: "bold" },
  heroContainer: { width: "100%", height: 240 },
  heroImg: { width: "100%", height: 240 },
  heroPlaceholder: { width: "100%", height: 240, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" },
  btnAtrasTop: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.divider },
  badgeTipo: { backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  content: { padding: 20 },
  nombre: { fontSize: 26, fontWeight: "bold", color: colors.text, marginBottom: 20 },
  descripcion: { fontSize: 16, color: colors.textSecondary, marginBottom: 20, lineHeight: 24 },
  macrosTarjeta: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.divider, marginBottom: 25 },
  macroCaja: { alignItems: "center" },
  macroNum: { fontSize: 18, fontWeight: "bold", color: Colors.primary },
  macroTexto: { fontSize: 12, color: colors.textSecondary, marginTop: 5 },
  seccionTitulo: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 15 },
  listaCaja: { backgroundColor: colors.surface, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.divider, marginBottom: 25 },
  textoLista: { fontSize: 16, color: colors.text, marginBottom: 10, lineHeight: 24 },
  barraInferior: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.divider },
  botonPrincipal: { backgroundColor: Colors.secondary, padding: 18, borderRadius: 15, alignItems: "center" },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});