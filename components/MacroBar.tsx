import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ColorScheme } from '../constants/Colors';

interface MacroBarProps {
  value: number;
  max: number;
  color: string;
}

export function MacroBar({ value, max, color }: MacroBarProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  let porcentaje = (value / max) * 100;
  if (porcentaje > 100) porcentaje = 100;
  if (porcentaje < 0) porcentaje = 0;

  return (
    <View style={styles.background}>
      <View style={[styles.fill, { width: `${porcentaje}%`, backgroundColor: color }]} />
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  background: { height: 6, backgroundColor: colors.divider, borderRadius: 3, width: '100%', marginTop: 4 },
  fill: { height: '100%', borderRadius: 3 }
});