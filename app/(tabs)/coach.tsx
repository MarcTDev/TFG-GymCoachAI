import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getSystemPrompt, sendMessage as sendChatMessage, ChatMessage, logChatMessage } from "../../lib/chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function Coach() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const initChat = async () => {
      try {
        const result = await getSystemPrompt(user.id);
        setSystemPrompt(result.prompt);
        
        let displayName = "";
        if (result.nombre) {
          displayName = " " + result.nombre;
        } else if (user.email) {
          displayName = " " + user.email.split("@")[0];
        }

        setMessages([{
          _id: "1",
          text: `¡Hola${displayName}! Soy tu Coach personal impulsado por IA.\n\nEstoy aquí para ayudarte a alcanzar tus metas, resolver dudas sobre rutinas o nutrición y mantenerte motivado.\n\n¿En qué te puedo ayudar hoy?`,
          createdAt: new Date(),
          user: { _id: 2 },
        }]);
      } catch (error) {
        
      }
    };
    
    initChat();
  }, [user]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (text === "" || systemPrompt === "" || sending) return;

    setInputText("");
    Keyboard.dismiss();
    setSending(true);

    try {
      const userMsg = { _id: Date.now().toString(), text: text, createdAt: new Date(), user: { _id: 1 } };
      setMessages((prev) => [...prev, userMsg]);
      
      if (user && user.id) {
        await logChatMessage(user.id, text);
      }

      const newHistory: ChatMessage[] = [...history, { role: "user", content: text }];
      const reply = await sendChatMessage(newHistory, systemPrompt);
      
      const nextHistory: ChatMessage[] = [...newHistory, { role: "assistant", content: reply }];
      setHistory(nextHistory);
      
      if (user && user.id) {
        await logChatMessage(user.id, reply, "assistant");
      }

      const coachMsg = { _id: String(Date.now() + 1), text: reply, createdAt: new Date(), user: { _id: 2 } };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (error) {
      
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    let isUser = false;
    if (item.user._id === 1) {
      isUser = true;
    }

    return (
      <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperCoach]}>
        {!isUser && (
          <View style={styles.avatar}>
            <MaterialIcons name="smart-toy" size={16} color={Colors.white} />
          </View>
        )}
        <View style={styles.bubbleCol}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
            <Text style={[styles.messageText, { color: isUser ? Colors.white : colors.text }]}>
              {item.text.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <Text key={i} style={{ fontWeight: "bold" }}>{part.slice(2, -2)}</Text>;
                } else {
                  return <Text key={i}>{part}</Text>;
                }
              })}
            </Text>
          </View>
          <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampCoach]}>
            {formatTime(new Date(item.createdAt))}
          </Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  let kbBehavior = undefined;
  if (Platform.OS === "ios") {
    kbBehavior = "padding" as const;
  }

  let btnDisabled = false;
  if (inputText.trim() === "" || sending) {
    btnDisabled = true;
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={kbBehavior}>
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="smart-toy" size={20} color={Colors.white} />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerName}>AI Coach</Text>
          <Text style={styles.headerStatus}>En línea</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />

      <View style={[styles.inputBox, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, btnDisabled && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={btnDisabled}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <MaterialIcons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  headerName: { fontSize: 16, fontWeight: "bold", color: colors.text },
  headerStatus: { fontSize: 12, color: Colors.success, fontWeight: "bold" },
  listContent: { padding: 20, paddingBottom: 10 },
  wrapper: { flexDirection: "row", marginBottom: 10, alignItems: "flex-end" },
  wrapperUser: { justifyContent: "flex-end" },
  wrapperCoach: { justifyContent: "flex-start" },
  bubbleCol: { maxWidth: "80%" },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginRight: 8, marginBottom: 15 },
  bubble: { padding: 12, borderRadius: 16 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleCoach: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.divider },
  messageText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  timestampUser: { alignSelf: "flex-end" },
  timestampCoach: { alignSelf: "flex-start" },
  inputBox: { flexDirection: "row", padding: 15, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, alignItems: "center" },
  input: { flex: 1, backgroundColor: colors.inputBackground, borderRadius: 20, padding: 12, minHeight: 40, maxHeight: 100, marginRight: 10, fontSize: 15, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { backgroundColor: colors.divider },
});