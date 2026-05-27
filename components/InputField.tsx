import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

interface InputFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  style?: any;
  error?: string;
  leftIcon?: string;
}

export const InputField = ({ label, style, secureTextEntry, error, leftIcon, ...inputProps }: InputFieldProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? { borderColor: 'red' } : null]}>
        {leftIcon && (
          <FontAwesome name={leftIcon as any} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          secureTextEntry={isPassword && !passwordVisible}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={{ padding: 10 }}>
            <FontAwesome name={passwordVisible ? "eye" : "eye-slash"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { width: "100%", marginVertical: 10 },
  label: { marginBottom: 5, fontSize: 14, fontWeight: "bold", color: colors.textSecondary },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.divider, borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: colors.text },
  errorText: { marginTop: 5, color: "red", fontSize: 12 },
});