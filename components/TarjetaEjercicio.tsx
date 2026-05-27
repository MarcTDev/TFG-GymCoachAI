import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

const GRUPO_ICON: {[key: string]: string} = { pecho: "hand-rock", espalda: "arrow-up", piernas: "running", hombros: "arrows-alt", brazos: "hand-paper", abdomen: "circle", cardio: "heartbeat", general: "dumbbell" };

function getIconoGrupo(grupo: string): string {
  let g = "";
  if (grupo) {
      g = grupo.toLowerCase();
  }
  
  let claves = Object.keys(GRUPO_ICON);
  for(let i=0; i<claves.length; i++){
      if(g.includes(claves[i])){
          return GRUPO_ICON[claves[i]];
      }
  }
  return "dumbbell";
}

export function TarjetaEjercicio({ ej, indice, registro, onPress, onCompletar, onSaltar, onDeshacer }: { ej: any; indice: number; registro?: any; onPress: () => void; onCompletar: () => void; onSaltar: () => void; onDeshacer: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  const nombre = ej.ejercicio_catalogo?.nombre ?? "Ejercicio";
  const grupo = ej.ejercicio_catalogo?.grupo_muscular ?? "General";
  
  let completado = false;
  if(registro && registro.completado){
      completado = true;
  }
  
  let saltado = false;
  if(registro && registro.saltado){
      saltado = true;
  }

  return (
    <View style={[styles.tarjetaEjercicio, completado && styles.tarjetaCompletada, saltado && { opacity: 0.5 }]}>
      <Pressable style={styles.ejFila} onPress={onPress}>
        <View style={styles.numeroCaja}><Text style={styles.numero}>{indice + 1}</Text></View>
        <View style={styles.iconoCaja}><FontAwesome name={getIconoGrupo(grupo) as any} size={14} color={Colors.primary} solid /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.ejNombre, saltado && { textDecorationLine: "line-through", color: colors.textSecondary }]}>{nombre}</Text>
          <Text style={styles.ejGrupo}>{grupo}</Text>
        </View>
        <Text style={styles.ejSeries}>{ej.series} × {ej.repeticiones}</Text>
        <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
      </Pressable>

      {!completado && !saltado && (
        <View style={styles.botonesAccion}>
          <Pressable style={styles.btnCompletar} onPress={onCompletar}>
            <FontAwesome name="check" size={11} color={Colors.white} solid />
            <Text style={{ color: Colors.white, fontWeight: "bold", fontSize: 11 }}>Completado</Text>
          </Pressable>
          <Pressable style={styles.btnSaltar} onPress={onSaltar}>
            <FontAwesome name="times" size={11} color={colors.textSecondary} solid />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Saltar</Text>
          </Pressable>
        </View>
      )}

      {(completado || saltado) && (
        <View style={styles.estadoFila}>
          <FontAwesome name={completado ? "check-circle" : "minus-circle"} size={13} color={completado ? Colors.secondary : colors.divider} solid />
          <Text style={{ fontSize: 12, fontWeight: "bold", color: completado ? Colors.secondary : colors.textSecondary, flex: 1 }}>
            {completado ? `Completado${registro?.kcal_estimadas ? ` · ${registro.kcal_estimadas} kcal` : ""}` : "Saltado"}
          </Text>
          <Pressable onPress={onDeshacer}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textDecorationLine: "underline" }}>Deshacer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function TarjetaEjercicioExtra({ extra, onEliminar }: { extra: any; onEliminar: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  return (
    <View style={[styles.tarjetaEjercicio, { borderStyle: "dashed", borderColor: Colors.secondary }]}>
      <View style={styles.ejFila}>
        <View style={[styles.iconoCaja, { backgroundColor: colors.secondarySubtle }]}>
          <FontAwesome name="plus" size={12} color={Colors.secondary} solid />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.ejNombre}>{extra.nombre}</Text>
            <View style={styles.badgeExtra}><Text style={{ fontSize: 9, fontWeight: "bold", color: Colors.secondary }}>EXTRA</Text></View>
          </View>
          <Text style={styles.ejGrupo}>{extra.series ?? "-"} × {extra.repeticiones ?? "-"} · {extra.kcal_estimadas ?? 0} kcal</Text>
        </View>
        <Pressable onPress={onEliminar} hitSlop={8}>
          <FontAwesome name="trash" size={13} color="#DC2626" solid />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  tarjetaEjercicio: { backgroundColor: colors.surface, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.divider },
  tarjetaCompletada: { borderColor: Colors.secondary, backgroundColor: colors.secondarySubtle },
  ejFila: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  botonesAccion: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.divider, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, overflow: "hidden" },
  btnCompletar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, backgroundColor: Colors.secondary },
  btnSaltar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: colors.divider },
  estadoFila: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingBottom: 10, paddingTop: 2 },
  badgeExtra: { backgroundColor: "#EBFCF6", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#32D49A", marginLeft: 6 },
  numeroCaja: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.inputBackground, justifyContent: "center", alignItems: "center" },
  numero: { fontSize: 12, fontWeight: "bold", color: colors.textSecondary },
  iconoCaja: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySubtle, justifyContent: "center", alignItems: "center", marginLeft: 10 },
  ejNombre: { fontSize: 14, fontWeight: "bold", color: colors.text },
  ejGrupo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ejSeries: { fontSize: 15, fontWeight: "bold", color: colors.text },
});