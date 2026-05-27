import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

const COMIDA_ICON: Record<string, string> = { desayuno: "sun", almuerzo: "cloud-sun", cena: "moon", snack: "cookie-bite" };

export function HeaderComida({ tipo, onAnadir }: { tipo: string; onAnadir: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const titulo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  return (
    <View style={styles.seccionHeader}>
      <View style={styles.seccionIcono}>
        <FontAwesome name={(COMIDA_ICON[tipo] ?? "utensils") as any} size={13} color={Colors.primary} solid />
      </View>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <Pressable style={styles.btnAnadir} onPress={onAnadir}>
        <FontAwesome name="plus" size={11} color={Colors.primary} />
        <Text style={{ fontSize: 12, fontWeight: "bold", color: Colors.primary }}>Añadir</Text>
      </Pressable>
    </View>
  );
}

export function TarjetaComida({ comida, registro, tipo, onMarcar, onDeshacer, onCambiar, onVerReceta }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const receta = comida.receta_catalogo;
  const completada = registro?.completada;
  const saltada = registro?.saltada;

  return (
    <View style={[styles.tarjetaComida, completada && styles.tarjetaCompletada, saltada && { opacity: 0.5 }]}>
      <Pressable style={styles.tarjetaFila} onPress={() => onVerReceta(receta, comida, completada)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nombrePlato, saltada && { textDecorationLine: "line-through", color: colors.textTertiary }]}>
            {receta?.nombre ?? "—"}
          </Text>
          <Text style={styles.macrosPlato}>
            P {Math.round(receta?.proteinas_g ?? 0)}g · C {Math.round(receta?.carbos_g ?? 0)}g · G {Math.round(receta?.grasas_g ?? 0)}g
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.kcalNum}>{receta?.kcal ?? 0}</Text>
          <Text style={styles.kcalLabel}>kcal</Text>
        </View>
      </Pressable>

      {!completada && !saltada && (
        <View style={styles.botonesAccion}>
          <Pressable style={styles.btnCompletar} onPress={() => onMarcar(comida, "completada")}>
            <FontAwesome name="check" size={11} color={Colors.white} solid />
            <Text style={{ color: Colors.white, fontWeight: "bold", fontSize: 11 }}>Completada</Text>
          </Pressable>
          <Pressable style={styles.btnCambiar} onPress={() => onCambiar(tipo, comida.id)}>
            <FontAwesome name="exchange-alt" size={11} color={Colors.primary} solid />
            <Text style={{ color: Colors.primary, fontWeight: "bold", fontSize: 11 }}>Cambiar</Text>
          </Pressable>
          <Pressable style={styles.btnSaltar} onPress={() => onMarcar(comida, "saltada")}>
            <FontAwesome name="times" size={11} color={colors.textTertiary} solid />
            <Text style={{ color: colors.textTertiary, fontSize: 11 }}>Saltar</Text>
          </Pressable>
        </View>
      )}

      {(completada || saltada) && (
        <View style={styles.estadoFila}>
          <FontAwesome name={completada ? "check-circle" : "minus-circle"} size={13} color={completada ? Colors.success : colors.divider} solid />
          <Text style={{ fontSize: 12, fontWeight: "bold", color: completada ? Colors.success : colors.textTertiary, flex: 1 }}>
            {completada ? "Completada" : "Saltada"}
          </Text>
          <Pressable onPress={() => onDeshacer(comida.id)}>
            <Text style={{ fontSize: 12, color: colors.textTertiary, textDecorationLine: "underline" }}>Deshacer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function TarjetaComidaExtra({ extra, onEliminar }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.tarjetaComida, { borderStyle: "dashed", borderColor: Colors.success }]}>
      <View style={styles.tarjetaFila}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text style={styles.nombrePlato}>{extra.nombre}</Text>
            <View style={styles.badgeExtra}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: Colors.success }}>EXTRA</Text>
            </View>
          </View>
          <Text style={styles.macrosPlato}>
            P {Math.round(extra.proteinas_g ?? 0)}g · C {Math.round(extra.carbos_g ?? 0)}g · G {Math.round(extra.grasas_g ?? 0)}g
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.kcalNum}>{extra.kcal ?? 0}</Text>
          <Text style={styles.kcalLabel}>kcal</Text>
        </View>
      </View>
      <View style={styles.botonesAccion}>
        <Pressable style={[styles.btnSaltar, { flex: 0, paddingHorizontal: 16 }]} onPress={() => onEliminar(extra.id)}>
          <FontAwesome name="trash" size={11} color={Colors.danger} solid />
          <Text style={{ color: Colors.danger, fontSize: 11 }}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  seccionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  seccionIcono: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.infoSubtle, justifyContent: "center", alignItems: "center" },
  seccionTitulo: { fontSize: 16, fontWeight: "bold", color: colors.text, flex: 1 },
  btnAnadir: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.infoSubtle },
  tarjetaComida: { backgroundColor: colors.surface, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.divider },
  tarjetaCompletada: { borderColor: Colors.success, backgroundColor: colors.successSubtle },
  tarjetaFila: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  nombrePlato: { fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 3 },
  macrosPlato: { fontSize: 11, color: colors.textTertiary },
  kcalNum: { fontSize: 16, fontWeight: "bold", color: colors.text },
  kcalLabel: { fontSize: 10, color: colors.textTertiary },
  botonesAccion: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.divider, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, overflow: "hidden" },
  btnCompletar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, backgroundColor: Colors.success },
  btnCambiar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: colors.divider },
  btnSaltar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: colors.divider },
  estadoFila: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingBottom: 10, paddingTop: 2 },
  badgeExtra: { backgroundColor: colors.successSubtle, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.success },
});