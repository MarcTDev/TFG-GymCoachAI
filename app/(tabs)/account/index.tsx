import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, RefreshControl, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { LineChart } from "react-native-gifted-charts";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useAuth } from "../../../context/AuthContext";
import { useUser } from "../../../context/UserContext";
import { useTheme } from "../../../context/ThemeContext";
import { supabase } from "../../../lib/supabase";
import { localDate } from "../../../lib/dates";
import { registrarPesoHoy } from "../../../services/peso";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { perfil, refetch } = useUser();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [pesos, setPesos] = useState<any[]>([]);
  const [pesoInput, setPesoInput] = useState("");
  const [guardandoPeso, setGuardandoPeso] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { width: screenW } = useWindowDimensions();
  const CHART_W = screenW - 110;

  const fechaHoy = localDate(0);

  const cargarDatos = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from("registro_progreso")
        .select("fecha, peso").eq("usuario_id", user.id)
        .gte("fecha", localDate(-29))
        .order("fecha", { ascending: true }).limit(30);
      
      if (data) {
        setPesos(data);
        for (let i = 0; i < data.length; i++) {
          if (data[i].fecha === fechaHoy) {
            setPesoInput(String(data[i].peso));
            break;
          }
        }
      } else {
        setPesos([]);
      }
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => { 
      cargarDatos(); 
    }, [user])
  );

  const onRefresh = async () => { 
    setRefreshing(true); 
    await cargarDatos(); 
    setRefreshing(false); 
  };

  const guardarPeso = async () => {
    if (!user) return;
    let pesoLimpio = pesoInput;
    if (pesoLimpio.includes(",")) {
      pesoLimpio = pesoLimpio.replace(",", ".");
    }
    const val = parseFloat(pesoLimpio);
    if (isNaN(val) || val < 20 || val > 300) return;
    
    setGuardandoPeso(true);
    const { error } = await registrarPesoHoy(user.id, val);
    setGuardandoPeso(false);
    
    if (error) return;
    await cargarDatos();
    await refetch();
  };

  let iniciales = "?";
  if (perfil && perfil.nombre) {
    let apellidoLetra = "";
    if (perfil.apellidos) {
      apellidoLetra = perfil.apellidos[0];
    }
    iniciales = (perfil.nombre[0] + apellidoLetra).toUpperCase();
  }

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

  let subio = false;
  let diff = 0;
  if (pesos.length >= 2) {
    diff = pesos[pesos.length - 1].peso - pesos[0].peso;
    if (diff > 0) {
      subio = true;
    }
  }

  let diffAbsoluta = diff;
  if (diffAbsoluta < 0) {
    diffAbsoluta = diffAbsoluta * -1;
  }
  diffAbsoluta = Math.round(diffAbsoluta * 10) / 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{iniciales}</Text></View>
        <View style={styles.headerInfo}>
          <Text style={styles.nombre}>{perfil?.nombre} {perfil?.apellidos}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {perfil?.objetivo ? `Objetivo: ${perfil.objetivo.charAt(0).toUpperCase() + perfil.objetivo.slice(1)}` : "Sin objetivo"}
          </Text>
          <View style={styles.statsRow}>
            {perfil?.peso_actual && <Text style={styles.statText}>Peso: {perfil.peso_actual} kg</Text>}
            {perfil?.altura && <Text style={styles.statText}>Altura: {perfil.altura} cm</Text>}
          </View>
        </View>
      </View>

      <View style={styles.pesoCard}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10, color: colors.text }}>Peso de hoy</Text>
        <View style={styles.pesoInputWrap}>
          <TextInput style={styles.pesoInput} value={pesoInput} onChangeText={setPesoInput}
            keyboardType="decimal-pad" placeholder="ej. 75.5" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.pesoKg}>kg</Text>
        </View>
        <Pressable style={styles.pesoBtn} onPress={guardarPeso} disabled={guardandoPeso}>
          {guardandoPeso ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.pesoBtnText}>Guardar peso</Text>}
        </Pressable>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartIconBox}>
            <FontAwesome name="weight" size={14} color={Colors.secondary} solid />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartTitle}>Evolución de peso</Text>
            <Text style={styles.chartSub}>
              {pesos.length > 0
                ? `Último: ${pesos[pesos.length - 1].peso} kg · ${pesos.length} registros`
                : "Aún no hay registros"}
            </Text>
          </View>
          
          {pesos.length >= 2 && (
            <View style={[styles.diffBadge, { backgroundColor: subio ? "#FFEDED" : "#E8F8F0" }]}>
              <FontAwesome name={subio ? "arrow-up" : "arrow-down"} size={9} color={subio ? "#E63946" : "#1FA876"} solid />
              <Text style={{ fontFamily: "NotoSans", fontSize: 11, fontWeight: "bold", color: subio ? "#E63946" : "#1FA876" }}>{diffAbsoluta} kg</Text>
            </View>
          )}
        </View>

        {cargando ? (
          <ActivityIndicator color={Colors.primary} style={{ height: 160 }} />
        ) : lineDataPesos.length >= 2 ? (
          <LineChart
            data={lineDataPesos} width={CHART_W} height={160}
            color={Colors.secondary} thickness={3}
            dataPointsColor={colors.surface} dataPointsRadius={4}
            startFillColor={Colors.secondary} startOpacity={0.35} endFillColor={Colors.secondary} endOpacity={0.02}
            areaChart curved
            yAxisLabelSuffix=" kg"
            rulesType="dashed" rulesColor={colors.divider} rulesThickness={1}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            xAxisThickness={0} yAxisThickness={0}
            noOfSections={4} initialSpacing={12}
            spacing={Math.max(28, CHART_W / Math.max(lineDataPesos.length, 1))}
          />
        ) : (
          <View style={{ height: 160, justifyContent: "center", alignItems: "center", gap: 10 }}>
            <FontAwesome name="weight" size={28} color="#ddd" solid />
            <Text style={{ fontFamily: "NotoSans", fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
              Registra tu peso varios días para ver la evolución
            </Text>
          </View>
        )}
      </View>

      <Pressable style={styles.configRow} onPress={() => router.push("/account/stats" as any)}>
        <FontAwesome name="chart-line" size={16} color={Colors.primary} />
        <Text style={styles.configTitle}>Estadísticas completas</Text>
        <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
      </Pressable>
      
      <Pressable style={styles.configRow} onPress={() => router.push("/account/settings" as any)}>
        <FontAwesome name="cog" size={16} color={Colors.primary} />
        <Text style={styles.configTitle}>Ajustes de la app</Text>
        <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginHorizontal: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.divider },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: "NotoSans", fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerInfo: { flex: 1, gap: 5 },
  nombre: { fontFamily: "NotoSans", fontSize: 17, fontWeight: "bold", color: colors.text },
  statsRow: { flexDirection: "row", gap: 10 },
  statText: { fontFamily: "NotoSans", fontSize: 12, color: colors.textSecondary },
  pesoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.divider },
  pesoInputWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  pesoInput: { flex: 1, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.divider, fontFamily: "NotoSans", fontSize: 16, fontWeight: "bold", color: colors.text },
  pesoKg: { fontFamily: "NotoSans", fontSize: 13, color: colors.textSecondary, fontWeight: "bold" },
  pesoBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  pesoBtnText: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: "#fff" },
  chartCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.divider },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  chartIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.secondary + "1A", justifyContent: "center", alignItems: "center" },
  chartTitle: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.text },
  chartSub: { fontFamily: "NotoSans", fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  diffBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  configRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: colors.divider },
  configTitle: { fontFamily: "NotoSans", fontSize: 15, fontWeight: "bold", color: colors.text },
});