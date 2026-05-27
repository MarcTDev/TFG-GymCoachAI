import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { cargarStats, calcularDiasEntrenadosSemana, calcularKcalEjercicio14d, calcularAdherencia, calcularKcalDieta7d, calcularAgua7d, calcularRacha } from "../../../services/stats";

const CHART_H = 160;

function CardHeader({ icon, color, titulo, sub }: { icon: string; color: string; titulo: string; sub: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color + "1A", justifyContent: "center", alignItems: "center" }}>
        <FontAwesome name={icon as any} size={14} color={color} solid />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.text }}>{titulo}</Text>
        <Text style={{ fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>{sub}</Text>
      </View>
    </View>
  );
}

function NoData({ text, icon }: { text: string; icon?: string }) {
  let nameIcon = "chart-line";
  if (icon) {
    nameIcon = icon;
  }
  return (
    <View style={{ height: CHART_H, justifyContent: "center", alignItems: "center", gap: 10 }}>
      <FontAwesome name={nameIcon as any} size={28} color="#ddd" solid />
      <Text style={{ fontFamily: "NotoSans", fontSize: 12, color: "#999", textAlign: "center", paddingHorizontal: 20 }}>
        {text}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { width: screenW } = useWindowDimensions();
  const CHART_W = screenW - 110;

  const [pesos, setPesos] = useState<{ fecha: string; peso: number }[]>([]);
  const [diasEntrenados, setDiasEntrenados] = useState<{ label: string; value: number }[]>([]);
  const [kcalEjercicio, setKcalEjercicio] = useState<{ label: string; value: number }[]>([]);
  const [adherencia, setAdherencia] = useState<{ label: string; value: number }[]>([]);
  const [kcalDieta, setKcalDieta] = useState<{ label: string; consumidas: number; objetivo: number }[]>([]);
  const [agua, setAgua] = useState<{ label: string; value: number }[]>([]);
  const [racha, setRacha] = useState(0);
  
  const [cargando, setCargando] = useState(true);

  const cargarTodo = async () => {
    if (!user) return;
    setCargando(true);
    try {
      const datos = await cargarStats(user.id);
      setPesos(datos.pesos);
      setDiasEntrenados(calcularDiasEntrenadosSemana(datos.regDia));
      setKcalEjercicio(calcularKcalEjercicio14d(datos.regEj, datos.regEjExtra));
      setAdherencia(calcularAdherencia(datos.adherencia));
      setKcalDieta(calcularKcalDieta7d(datos.regComida, datos.regComidaExtra, datos.dietaDias));
      setAgua(calcularAgua7d(datos.regAgua));
      setRacha(calcularRacha(datos.rachaFechas));
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [user])
  );

  const lineDataPesos = [];
  for (let i = 0; i < pesos.length; i++) {
    let label = "";
    if (i % 5 === 0) {
      label = pesos[i].fecha.slice(5);
    }
    lineDataPesos.push({
      value: pesos[i].peso,
      label: label,
      labelTextStyle: { color: colors.textSecondary, fontSize: 9 },
    });
  }

  let hayDatosAgua = false;
  let sumaAgua = 0;
  for (let i = 0; i < agua.length; i++) {
    sumaAgua = sumaAgua + agua[i].value;
    if (agua[i].value > 0) hayDatosAgua = true;
  }
  let promedioAgua = Math.round((sumaAgua / 7) * 10) / 10;

  let hayDatosDieta = false;
  for (let i = 0; i < kcalDieta.length; i++) {
    if (kcalDieta[i].consumidas > 0) hayDatosDieta = true;
  }

  let hayDatosKcalEj = false;
  let sumaKcalEj = 0;
  for (let i = 0; i < kcalEjercicio.length; i++) {
    sumaKcalEj = sumaKcalEj + kcalEjercicio[i].value;
    if (kcalEjercicio[i].value > 0) hayDatosKcalEj = true;
  }
  let promedioKcalEj = Math.round(sumaKcalEj / 14);

  let lineDataAgua = [];
  for (let i = 0; i < agua.length; i++) {
    lineDataAgua.push({
      value: agua[i].value,
      label: agua[i].label,
      labelTextStyle: { color: colors.textSecondary, fontSize: 10, fontWeight: "bold" }
    });
  }

  let barDataDias = [];
  for (let i = 0; i < diasEntrenados.length; i++) {
    barDataDias.push({
      value: diasEntrenados[i].value,
      label: diasEntrenados[i].label,
      frontColor: Colors.primary,
      gradientColor: Colors.primary + "80",
      labelTextStyle: { color: colors.textSecondary, fontSize: 10, fontWeight: "bold" }
    });
  }

  let barDataKcalEj = [];
  for (let i = 0; i < kcalEjercicio.length; i++) {
    barDataKcalEj.push({
      value: kcalEjercicio[i].value,
      label: kcalEjercicio[i].label,
      frontColor: "#F8D24A",
      gradientColor: "#F8D24A80",
      labelTextStyle: { color: colors.textSecondary, fontSize: 9, fontWeight: "bold" }
    });
  }

  let lineDataAdherencia = [];
  for (let i = 0; i < adherencia.length; i++) {
    lineDataAdherencia.push({
      value: adherencia[i].value,
      label: adherencia[i].label,
      labelTextStyle: { color: colors.textSecondary, fontSize: 10, fontWeight: "bold" }
    });
  }

  let maxAgua = 8;
  for (let i = 0; i < agua.length; i++) {
    if (agua[i].value > maxAgua) {
      maxAgua = agua[i].value;
    }
  }

  let barDataDieta = [];
  let maxDietaValue = 2000;
  for (let i = 0; i < kcalDieta.length; i++) {
    if (kcalDieta[i].consumidas > maxDietaValue) maxDietaValue = kcalDieta[i].consumidas;
    if (kcalDieta[i].objetivo > maxDietaValue) maxDietaValue = kcalDieta[i].objetivo;
    
    barDataDieta.push({
      value: kcalDieta[i].consumidas,
      label: kcalDieta[i].label,
      frontColor: Colors.primary,
      gradientColor: Colors.primary + "80",
      spacing: 2,
      labelTextStyle: { color: colors.textSecondary, fontSize: 10, fontWeight: "bold" }
    });
    barDataDieta.push({
      value: kcalDieta[i].objetivo,
      frontColor: colors.divider,
      spacing: 14
    });
  }
  let yMaxDieta = Math.ceil(maxDietaValue / 500) * 500;

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={15} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Estadísticas</Text>
        </View>

        <View style={styles.rachaCard}>
          <View style={styles.rachaIconBox}>
            <FontAwesome name="fire" size={20} color="#FF791C" solid />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rachaTitulo}>Racha activa</Text>
            <Text style={styles.rachaSubtitulo}>Días consecutivos con comidas registradas</Text>
          </View>
          <View style={styles.rachaNumBox}>
            <Text style={styles.rachaNum}>{racha}</Text>
            <Text style={styles.rachaDias}>días</Text>
          </View>
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="weight" color={Colors.secondary}
            titulo="Evolución de peso"
            sub={pesos.length > 0 ? `Último: ${pesos[pesos.length - 1].peso} kg · ${pesos.length} registros` : "Sin registros"}
          />
          {lineDataPesos.length >= 2 ? (
            <LineChart
              data={lineDataPesos} width={CHART_W} height={CHART_H}
              color={Colors.secondary} thickness={3}
              dataPointsColor={colors.surface} dataPointsRadius={4}
              startFillColor={Colors.secondary} startOpacity={0.35} endFillColor={Colors.secondary} endOpacity={0.02}
              areaChart curved
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisLabelSuffix=" kg"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} initialSpacing={12}
              spacing={Math.max(28, CHART_W / Math.max(lineDataPesos.length, 1))}
            />
          ) : <NoData icon="weight" text="Registra tu peso diariamente para ver la evolución" />}
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="fire-alt" color={Colors.primary}
            titulo="Calorías dieta · 7 días"
            sub={hayDatosDieta ? "Comparativa consumidas vs objetivo" : "Sin datos esta semana"}
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendText}>Consumidas</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.divider }]} /><Text style={styles.legendText}>Objetivo</Text></View>
          </View>
          {hayDatosDieta ? (
            <BarChart
              data={barDataDieta}
              width={CHART_W} height={CHART_H} barWidth={14}
              barBorderTopLeftRadius={4} barBorderTopRightRadius={4}
              showGradient
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} initialSpacing={6}
              maxValue={yMaxDieta}
            />
          ) : <NoData icon="utensils" text="Marca comidas como completadas para ver stats" />}
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="tint" color="#5BA8FF"
            titulo="Vasos de agua · 7 días"
            sub={`Meta: 8 vasos · Promedio: ${promedioAgua}`}
          />
          {hayDatosAgua ? (
            <LineChart
              data={lineDataAgua}
              width={CHART_W} height={CHART_H}
              color="#5BA8FF" thickness={3}
              dataPointsColor={colors.surface} dataPointsRadius={5}
              startFillColor="#5BA8FF" startOpacity={0.4} endFillColor="#5BA8FF" endOpacity={0.02}
              areaChart curved
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} maxValue={maxAgua}
              initialSpacing={10} endSpacing={30}
              spacing={Math.floor((CHART_W - 40) / 6)}
              referenceLine1Config={{ color: "#5BA8FF", dashWidth: 4, dashGap: 4, thickness: 1.5 }}
              referenceLine1Position={8}
            />
          ) : <NoData icon="tint" text="Registra tus vasos de agua diarios para ver el progreso" />}
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="dumbbell" color={Colors.primary}
            titulo="Días entrenados / semana"
            sub={diasEntrenados.length > 0 ? `Última semana: ${diasEntrenados[diasEntrenados.length - 1].value} días` : "Sin registros"}
          />
          {diasEntrenados.length > 0 ? (
            <BarChart
              data={barDataDias}
              width={CHART_W} height={CHART_H} barWidth={24} spacing={14}
              barBorderTopLeftRadius={6} barBorderTopRightRadius={6}
              showGradient
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} maxValue={7} initialSpacing={14}
            />
          ) : <NoData icon="dumbbell" text="Empieza a entrenar para ver stats" />}
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="fire" color="#F8D24A"
            titulo="Kcal quemadas · 14 días"
            sub={hayDatosKcalEj ? `Promedio: ${promedioKcalEj} kcal` : "Sin registros"}
          />
          {hayDatosKcalEj ? (
            <BarChart
              data={barDataKcalEj}
              width={CHART_W} height={CHART_H} barWidth={13} spacing={7}
              barBorderTopLeftRadius={4} barBorderTopRightRadius={4}
              showGradient
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} initialSpacing={6}
            />
          ) : <NoData icon="fire" text="Completa ejercicios para ver las kcal quemadas" />}
        </View>

        <View style={styles.card}>
          <CardHeader
            icon="bullseye" color={Colors.tertiary}
            titulo="Adherencia a rutinas"
            sub={adherencia.length > 0 ? `Última: ${adherencia[adherencia.length - 1].value}%` : "Sin historial"}
          />
          {adherencia.length >= 2 ? (
            <LineChart
              data={lineDataAdherencia}
              width={CHART_W} height={CHART_H}
              color={Colors.tertiary} thickness={3}
              dataPointsColor={colors.surface} dataPointsRadius={4}
              startFillColor={Colors.tertiary} startOpacity={0.35} endFillColor={Colors.tertiary} endOpacity={0.02}
              areaChart curved
              yAxisLabelSuffix="%"
              rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisThickness={0} yAxisThickness={0}
              noOfSections={4} maxValue={100} initialSpacing={10}
              spacing={Math.max(28, CHART_W / Math.max(adherencia.length, 1))}
            />
          ) : <NoData icon="bullseye" text="Sin historial de rutinas aún" />}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, justifyContent: "center", alignItems: "center" },
  title: { fontFamily: "NotoSans", fontSize: 22, fontWeight: "bold", color: colors.text },
  rachaCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 16 },
  rachaIconBox: { width: 44, height: 44, borderRadius: 13, backgroundColor: "#FF791C22", justifyContent: "center", alignItems: "center" },
  rachaTitulo: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.text },
  rachaSubtitulo: { fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  rachaNumBox: { alignItems: "center", minWidth: 44 },
  rachaNum: { fontFamily: "NotoSans", fontSize: 32, fontWeight: "bold", color: "#FF791C" },
  rachaDias: { fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary, marginTop: -4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 16 },
  cardTitle: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 2 },
  cardSub: { fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary, marginBottom: 14 },
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary },
});