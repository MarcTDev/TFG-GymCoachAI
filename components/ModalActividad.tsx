import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { anadirActividadExtra, cargarCatalogoEjercicios, estimarKcalEjercicio } from "../services/workout";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ModalActividad({ visible, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [ejSel, setEjSel] = useState<any>(null);
  const [series, setSeries] = useState("3");
  const [reps, setReps] = useState("10");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBusqueda("");
    setEjSel(null);
    setSeries("3");
    setReps("10");
    if (catalogo.length > 0) return;
    
    const fetchCatalogo = async () => {
      setCargando(true);
      try {
        const data = await cargarCatalogoEjercicios();
        setCatalogo(data);
      } finally {
        setCargando(false);
      }
    };
    fetchCatalogo();
  }, [visible]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q === "") return catalogo.slice(0, 50);
    return catalogo.filter((e) => (e.nombre ?? "").toLowerCase().includes(q)).slice(0, 50);
  }, [busqueda, catalogo]);

  let seriesNum = parseInt(series, 10);
  if (isNaN(seriesNum)) seriesNum = 0;
  
  let repsNum = parseInt(reps, 10);
  if (isNaN(repsNum)) repsNum = 0;
  
  const kcalPrev = estimarKcalEjercicio(seriesNum, repsNum);

  const handleGuardar = async () => {
    if (!user || !ejSel || guardando) return;
    setGuardando(true);
    try {
      const { error } = await anadirActividadExtra({
        userId: user.id,
        ejercicioId: ejSel.id,
        nombre: ejSel.nombre,
        series: seriesNum || null,
        repeticiones: repsNum || null,
      });
      if (!error) onSuccess();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Añadir actividad</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <FontAwesome name="times" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {!ejSel ? (
            <View>
              <View style={styles.searchBox}>
                <FontAwesome name="search" size={13} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar ejercicio..."
                  placeholderTextColor={colors.textTertiary}
                  value={busqueda}
                  onChangeText={setBusqueda}
                />
              </View>
              {cargando ? (
                <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>
              ) : (
                <FlatList
                  data={filtrados}
                  keyExtractor={(i) => i.id}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 360 }}
                  renderItem={({ item }) => (
                    <Pressable style={styles.item} onPress={() => setEjSel(item)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNombre}>{item.nombre}</Text>
                        <Text style={styles.itemGrupo}>{item.grupo_muscular ?? "General"}</Text>
                      </View>
                      <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
                    </Pressable>
                  )}
                  ListEmptyComponent={<Text style={styles.vacio}>Sin resultados</Text>}
                />
              )}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Pressable style={styles.itemSel} onPress={() => setEjSel(null)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNombre}>{ejSel.nombre}</Text>
                  <Text style={styles.itemGrupo}>{ejSel.grupo_muscular ?? "General"}</Text>
                </View>
                <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: "bold" }}>Cambiar</Text>
              </Pressable>

              <View style={styles.fila}>
                <View style={styles.campo}>
                  <Text style={styles.label}>Series</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={series}
                    onChangeText={setSeries}
                  />
                </View>
                <View style={styles.campo}>
                  <Text style={styles.label}>Repeticiones</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>
              </View>

              <Text style={styles.kcalPrev}>≈ {kcalPrev} kcal</Text>

              <Pressable
                style={[styles.btnGuardar, guardando && { opacity: 0.7 }]}
                onPress={handleGuardar}
                disabled={guardando}
              >
                {guardando ? <ActivityIndicator color={Colors.white} /> : (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <FontAwesome name="plus" size={13} color={Colors.white} />
                    <Text style={styles.btnGuardarText}>Añadir</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: "85%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  titulo: { fontSize: 18, fontWeight: "bold", color: colors.text },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.divider },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  centered: { padding: 30, alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 10 },
  itemSel: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primarySubtle, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.primary },
  itemNombre: { fontSize: 14, fontWeight: "bold", color: colors.text },
  itemGrupo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  vacio: { textAlign: "center", color: colors.textSecondary, padding: 20 },
  fila: { flexDirection: "row", gap: 12 },
  campo: { flex: 1 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: "bold" },
  input: { backgroundColor: colors.inputBackground, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.divider },
  kcalPrev: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  btnGuardar: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14 },
  btnGuardarText: { color: Colors.white, fontSize: 15, fontWeight: "bold" },
});