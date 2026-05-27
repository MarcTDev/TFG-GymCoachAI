import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../../../constants/Colors";
import { useTheme } from "../../../context/ThemeContext";
import { supabase } from "../../../lib/supabase";

const THEME_OPTIONS = [
  { value: "system", label: "Sistema", icon: "mobile-alt" },
  { value: "light", label: "Claro", icon: "sun" },
  { value: "dark", label: "Oscuro", icon: "moon" },
];

const CUENTA_OPTIONS = [
  { label: "Editar perfil", icon: "user-edit", route: "/account/edit-profile" },
  { label: "Cambiar contraseña", icon: "lock", route: "/account/change-pswd" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const styles = makeStyles(colors);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={15} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Configuración</Text>
        </View>

        <Text style={styles.groupLabel}>APARIENCIA</Text>
        <View style={styles.group}>
          {THEME_OPTIONS.map((opt, i) => {
            let activo = false;
            if (preference === opt.value) {
              activo = true;
            }
            return (
              <Pressable key={opt.value} style={[styles.row, activo && styles.rowActive, i === 0 && styles.rowFirst, i > 0 && styles.rowMiddle, i === THEME_OPTIONS.length - 1 && styles.rowLast]}
                onPress={() => setPreference(opt.value as any)}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, activo && styles.iconBoxActive]}>
                    <FontAwesome name={opt.icon as any} size={13} color={activo ? "#fff" : colors.textSecondary} solid />
                  </View>
                  <Text style={[styles.rowLabel, activo && { color: Colors.primary }]}>{opt.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.groupLabel}>CUENTA</Text>
        <View style={styles.group}>
          {CUENTA_OPTIONS.map((opt, i) => (
            <Pressable key={opt.route} style={[styles.row, i === 0 && styles.rowFirst, i > 0 && styles.rowMiddle, i === CUENTA_OPTIONS.length - 1 && styles.rowLast]}
              onPress={() => router.push(opt.route as any)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}><FontAwesome name={opt.icon as any} size={13} color={colors.textSecondary} solid /></View>
                <Text style={styles.rowLabel}>{opt.label}</Text>
              </View>
              <FontAwesome name="chevron-right" size={11} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <FontAwesome name="sign-out-alt" size={14} color="#fff" solid />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, justifyContent: "center", alignItems: "center" },
  title: { fontFamily: "NotoSans", fontSize: 22, fontWeight: "bold", color: colors.text },
  groupLabel: { fontFamily: "NotoSans", fontSize: 11, fontWeight: "bold", color: colors.textSecondary, letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  group: { borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.divider },
  rowActive: { backgroundColor: colors.primarySubtle, borderColor: Colors.primary },
  rowFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  rowLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  rowMiddle: { borderTopWidth: 0 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.inputBackground, justifyContent: "center", alignItems: "center" },
  iconBoxActive: { backgroundColor: Colors.primary },
  rowLabel: { fontFamily: "NotoSans", fontSize: 15, color: colors.text, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#DC2626", borderRadius: 14, paddingVertical: 14, marginTop: 32 },
  logoutText: { fontFamily: "NotoSans", fontSize: 15, fontWeight: "bold", color: "#fff" },
});