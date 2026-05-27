import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

interface ProgressBarProps {
  step: number;
  totalSteps: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar = ({ step, totalSteps, color = Colors.primary, backgroundColor }: ProgressBarProps) => {
  const { colors } = useTheme();
  let resolvedBg = colors.divider;
  if (backgroundColor) {
    resolvedBg = backgroundColor;
  }

  const porcentaje = ((step + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Paso {step + 1} de {totalSteps}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: resolvedBg }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${porcentaje}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 15 },
  labels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontFamily: "NotoSans", fontSize: 12, fontWeight: "bold" },
  track: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});