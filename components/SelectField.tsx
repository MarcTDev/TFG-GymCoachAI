import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ColorScheme } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

interface Option { label: string; value: string; }
interface SelectFieldProps { label?: string; placeholder?: string; value: string; options: Option[]; onSelect: (value: string) => void; style?: any; error?: string; }

export const SelectField = ({ label, placeholder, value, options, onSelect, style, error }: SelectFieldProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [modalVisible, setModalVisible] = useState(false);

  let selectedOption = null;
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      selectedOption = options[i];
      break;
    }
  }
  
  let displayText = placeholder || 'Selecciona';
  if (selectedOption) {
    displayText = selectedOption.label;
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
        <Text style={styles.inputText}>{displayText}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {options.map((item) => (
              <TouchableOpacity key={item.value} style={styles.option} onPress={() => { onSelect(item.value); setModalVisible(false); }}>
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { width: '100%', marginVertical: 10 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: 10, padding: 15, backgroundColor: colors.surface },
  inputText: { fontSize: 16, color: colors.text },
  errorText: { marginTop: 5, color: 'red' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: colors.surface, borderRadius: 10, padding: 10 },
  option: { padding: 15 },
  optionText: { fontSize: 16, color: colors.text }
});