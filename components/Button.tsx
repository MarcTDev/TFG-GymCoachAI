import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ title, onPress, style, textStyle, loading = false, disabled = false, variant = 'primary' }: ButtonProps) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, styles[`${variant}Button` as keyof typeof styles], isDisabled && styles.disabledButton, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? Colors.white : Colors.primary} />
      ) : (
        <Text style={[styles.buttonText, styles[`${variant}ButtonText` as keyof typeof styles], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  primaryButton: { backgroundColor: Colors.primary },
  secondaryButton: { backgroundColor: Colors.secondary },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  disabledButton: { opacity: 0.55 },
  buttonText: { fontFamily: 'NotoSans', fontSize: 16, fontWeight: 'bold' },
  primaryButtonText: { color: Colors.white },
  secondaryButtonText: { color: Colors.white },
  outlineButtonText: { color: Colors.primary },
});