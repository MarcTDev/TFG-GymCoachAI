import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorModal = ({ visible, title, message, onClose, onRetry }: ErrorModalProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  let showRetryButton = false;
  if (onRetry) {
    showRetryButton = true;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color={Colors.danger} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </Pressable>
            {showRetryButton && (
              <Pressable style={[styles.button, styles.retryButton]} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: colors.surface, borderRadius: 15, padding: 20, width: "85%", alignItems: "center" },
  iconContainer: { marginBottom: 15 },
  title: { fontFamily: "NotoSans", fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 10, textAlign: "center" },
  message: { fontFamily: "NotoSans", fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  buttonContainer: { flexDirection: "row", width: "100%", gap: 10 },
  button: { flex: 1, backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  retryButton: { backgroundColor: Colors.secondary },
  buttonText: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: Colors.white },
  retryButtonText: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: Colors.white },
});