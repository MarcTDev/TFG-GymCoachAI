import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { completarEjercicio, obtenerCompletadoHoy, estimarKcalEjercicio } from "../../services/workout";

export default function EjercicioDetalleScreen() {
  const { id, rutina_ejercicio_id, series, repeticiones, descanso_seg } = useLocalSearchParams<{ id: string; rutina_ejercicio_id?: string; series?: string; repeticiones?: string; descanso_seg?: string; }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const styles = makeStyles(colors);

  let seriesNum = null;
  if (series) {
    seriesNum = parseInt(series, 10);
  }
  
  let repsNum = null;
  if (repeticiones) {
    repsNum = parseInt(repeticiones, 10);
  }
  
  const kcalEstim = estimarKcalEjercicio(seriesNum, repsNum);

  const [ejercicio, setEjercicio] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [completado, setCompletado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const pedirDatos = async () => {
      try {
        if (!id) return;
        const res = await supabase.from("ejercicio_catalogo").select("*").eq("id", id).single();
        if (res.data) {
          setEjercicio(res.data);
        }
        
        if (user && rutina_ejercicio_id) {
          const reg = await obtenerCompletadoHoy(user.id, rutina_ejercicio_id);
          if (reg && reg.completado) {
            setCompletado(true);
          }
        }
      } finally {
        setCargando(false);
      }
    };

    pedirDatos();
  }, [id, user, rutina_ejercicio_id]);

  const handleCompletar = async () => {
    if (!user || !rutina_ejercicio_id || guardando || completado) return;
    setGuardando(true);
    try {
      const res = await completarEjercicio({
        userId: user.id,
        rutinaEjercicioId: rutina_ejercicio_id,
        series: seriesNum,
        repeticiones: repsNum,
      });
      if (!res.error) {
        setCompletado(true);
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ejercicio) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ejercicio no encontrado</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnError}>
          <Text style={styles.backBtnErrorText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  let musculosStr = "";
  if (ejercicio.musculos_secundarios) {
    musculosStr = ejercicio.musculos_secundarios;
  }
  let musculosRaw = musculosStr.split(",");
  let musculos = [];
  for (let i = 0; i < musculosRaw.length; i++) {
    let m = musculosRaw[i].trim();
    if (m !== "") {
      musculos.push(m);
    }
  }

  let consejosStr = "";
  if (ejercicio.consejos) {
    consejosStr = ejercicio.consejos;
  }
  let consejosRaw = consejosStr.split("-");
  let consejos = [];
  for (let i = 0; i < consejosRaw.length; i++) {
    let c = consejosRaw[i].trim();
    if (c !== "") {
      consejos.push(c);
    }
  }

  let nivelDificultad = "";
  if (ejercicio.dificultad) {
    nivelDificultad = ejercicio.dificultad.charAt(0).toUpperCase() + ejercicio.dificultad.slice(1);
  }

  let btnCompletarText = "Marcar como completado";
  if (completado) {
    btnCompletarText = "Completado";
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        
        <View style={styles.hero}>
          {ejercicio.imagen_url ? (
            <Image source={{ uri: ejercicio.imagen_url }} style={styles.heroImg} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <FontAwesome name="dumbbell" size={56} color={Colors.primary} solid />
            </View>
          )}
          
          <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={16} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.nombre}>{ejercicio.nombre}</Text>

          <View style={styles.chipsRow}>
            {ejercicio.dificultad && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Nivel: {nivelDificultad}</Text>
              </View>
            )}
            {ejercicio.equipamiento && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Equipo: {ejercicio.equipamiento}</Text>
              </View>
            )}
          </View>

          {(series || repeticiones) && (
            <View style={styles.rutinaCard}>
              <Text style={styles.rutinaCardLabel}>EN TU RUTINA DE HOY</Text>
              <Text style={styles.rutinaTextoGrande}>{series} series × {repeticiones} reps</Text>
              {descanso_seg && <Text style={{color: colors.textSecondary}}>Descanso: {descanso_seg} seg</Text>}
              {kcalEstim > 0 && <Text style={{color: colors.textSecondary, marginTop: 4}}>≈ {kcalEstim} kcal</Text>}
            </View>
          )}

          {rutina_ejercicio_id && (
            <Pressable
              style={[styles.completarBtn, completado && styles.completarBtnDone, guardando && { opacity: 0.7 }]}
              onPress={handleCompletar}
              disabled={completado || guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <FontAwesome name={completado ? "check-circle" : "check"} size={16} color="#fff" solid />
                  <Text style={styles.completarBtnText}>
                    {btnCompletarText}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>Músculo principal</Text>
          <Text style={styles.textoNormal}>{ejercicio.grupo_muscular}</Text>
          
          {musculos.length > 0 && (
            <View style={{marginTop: 15}}>
              <Text style={styles.sectionTitle}>Músculos secundarios</Text>
              {musculos.map((m, i) => (
                <Text key={i} style={styles.textoNormal}>• {m}</Text>
              ))}
            </View>
          )}

          {ejercicio.descripcion && (
            <View style={{marginTop: 20}}>
              <Text style={styles.sectionTitle}>Cómo se hace</Text>
              <Text style={styles.textoLargo}>{ejercicio.descripcion}</Text>
            </View>
          )}

          {consejos.length > 0 && (
            <View style={{marginTop: 20}}>
              <Text style={styles.sectionTitle}>Consejos</Text>
              <View style={styles.consejosCard}>
                {consejos.map((c, i) => (
                  <Text key={i} style={styles.textoNormal}>{c}</Text>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: 18, color: colors.text, marginBottom: 15 },
  backBtnError: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnErrorText: { color: "#fff", fontWeight: "bold" },
  hero: { width: "100%", height: 250 },
  heroImg: { width: "100%", height: 250 },
  heroPlaceholder: { width: "100%", height: 250, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface },
  backBtn: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  nombre: { fontSize: 26, fontWeight: "bold", color: colors.text, marginBottom: 15 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip: { backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: colors.divider },
  chipText: { fontSize: 14, fontWeight: "bold", color: colors.textSecondary },
  rutinaCard: { backgroundColor: colors.primarySubtle, borderRadius: 14, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary },
  rutinaCardLabel: { fontSize: 12, fontWeight: "bold", color: Colors.primary, marginBottom: 5 },
  rutinaTextoGrande: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 10 },
  textoNormal: { fontSize: 16, color: colors.text, marginBottom: 5 },
  textoLargo: { fontSize: 16, color: colors.text, lineHeight: 24 },
  consejosCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 15, gap: 10, borderWidth: 1, borderColor: colors.divider },
  completarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginBottom: 20 },
  completarBtnDone: { backgroundColor: "#4CAF50" },
  completarBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});