import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, TextInput } from "react-native";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./Button";

export interface PreferenciasData {
  equipamiento: string[];
  dias_entrenamiento: string[];
  duracion_sesion: string;
  limitaciones: string;
}

interface Props {
  visible: boolean;
  onComplete: (prefs: PreferenciasData) => void;
}

const PASOS = [
  { titulo: "Equipamiento disponible", opciones: ["Gimnasio completo", "Mancuernas en casa", "Bandas elásticas", "Barra y discos", "Máquinas cardio", "Solo peso corporal"], multi: true },
  { titulo: "Días para entrenar", opciones: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], multi: true },
  { titulo: "Duración de la sesión", opciones: ["30 min", "45 min", "60 min", "+90 min"], multi: false },
];

export const formatearPrefs = (p: PreferenciasData, info: string) => {
  const partes: string[] = [];
  if (p.equipamiento.length > 0) partes.push(`Equipamiento: ${p.equipamiento.join(", ")}`);
  if (p.dias_entrenamiento.length > 0) partes.push(`Días: ${p.dias_entrenamiento.join(", ")}`);
  if (p.duracion_sesion !== "") partes.push(`Duración: ${p.duracion_sesion}`);
  if (p.limitaciones !== "") partes.push(`Limitaciones: ${p.limitaciones}`);
  if (info !== "") partes.push(info);
  return partes.join(". ");
};

const toggle = (item: string, lista: string[]) => {
  if (lista.includes(item)) {
    return lista.filter((i) => i !== item);
  } else {
    return [...lista, item];
  }
};

export const ModalOnboarding = ({ visible, onComplete }: Props) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [step, setStep] = useState(0);
  const [equipamiento, setEquipamiento] = useState<string[]>([]);
  const [dias, setDias] = useState<string[]>([]);
  const [duracion, setDuracion] = useState("");
  const [limitaciones, setLimitaciones] = useState("");

  const pasoActual = PASOS[step];
  const totalPasos = PASOS.length + 1;

  const seleccionar = (op: string) => {
    if (step === 0) setEquipamiento(toggle(op, equipamiento));
    else if (step === 1) setDias(toggle(op, dias));
    else if (step === 2) setDuracion(op);
  };

  const estaSeleccionado = (op: string) => {
    if (step === 0) return equipamiento.includes(op);
    if (step === 1) return dias.includes(op);
    if (step === 2) return duracion === op;
    return false;
  };

  const finalizar = () => onComplete({ equipamiento, dias_entrenamiento: dias, duracion_sesion: duracion, limitaciones });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.headerTitle}>Paso {step + 1} de {totalPasos}</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {step < 3 ? (
              <View>
                <Text style={styles.stepTitle}>{pasoActual.titulo}</Text>
                {pasoActual.opciones.map((op) => {
                  const activo = estaSeleccionado(op);
                  return (
                    <Pressable key={op} style={[styles.optionItem, activo && styles.optionItemActive]} onPress={() => seleccionar(op)}>
                      <Text style={[styles.optionText, activo && styles.optionTextActive]}>{op}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View>
                <Text style={styles.stepTitle}>¿Alguna limitación física?</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Ej: Dolor de rodilla..."
                  placeholderTextColor={colors.textSecondary}
                  value={limitaciones}
                  onChangeText={setLimitaciones}
                />
              </View>
            )}

          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <Button title="Atrás" variant="outline" onPress={() => setStep(step - 1)} style={styles.footerBtn} />
            ) : (
              <View style={styles.footerBtn} />
            )}
            <Button
              title={step === totalPasos - 1 ? "Finalizar" : "Siguiente"}
              onPress={() => {
                if (step < totalPasos - 1) {
                  setStep(step + 1);
                } else {
                  finalizar();
                }
              }}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "80%", padding: 20 },
  headerTitle: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: Colors.primary, marginBottom: 16, letterSpacing: 0.5 },
  body: { flex: 1 },
  stepTitle: { fontFamily: "NotoSans", fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 20 },
  optionItem: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, marginBottom: 10 },
  optionItemActive: { borderColor: Colors.primary, backgroundColor: colors.primarySubtle },
  optionText: { fontFamily: "NotoSans", fontSize: 15, color: colors.text },
  optionTextActive: { fontWeight: "bold", color: Colors.primary },
  textInput: { borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, borderRadius: 10, padding: 15, height: 100, textAlignVertical: "top", fontFamily: "NotoSans", fontSize: 15, color: colors.text },
  footer: { flexDirection: "row", gap: 10, marginTop: 16 },
  footerBtn: { flex: 1 },
});