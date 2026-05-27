import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StatusBar, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const POLL_INTERVAL = 2500;
const MAX_WAIT = 120000;

export default function Generating() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { setIsRegistering } = useAuth();

  const [rutinaLista, setRutinaLista] = useState(false);
  const [dietaLista, setDietaLista] = useState(false);

  const elapsed = useRef(0);

  useEffect(() => {
    setIsRegistering(false);
    return () => { setIsRegistering(false); };
  }, []);

  useEffect(() => {
    if (rutinaLista && dietaLista) {
      setTimeout(() => {
        router.replace("/(tabs)/workout" as any);
      }, 900);
    }
  }, [rutinaLista, dietaLista]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      elapsed.current = elapsed.current + POLL_INTERVAL;

      const resUser = await supabase.auth.getUser();
      const user = resUser.data.user;
      
      if (!user) return;

      const resRutina = await supabase.from("rutina_semana").select("id").eq("usuario_id", user.id).limit(1);
      const resDieta = await supabase.from("dieta_semana").select("id").eq("usuario_id", user.id).limit(1);

      if (resRutina.data && resRutina.data.length > 0) {
        setRutinaLista(true);
      }
      
      if (resDieta.data && resDieta.data.length > 0) {
        setDietaLista(true);
      }

      if (elapsed.current >= MAX_WAIT) {
        clearInterval(interval);
        setTimeout(() => {
          router.replace("/(tabs)/workout" as any);
        }, 500);
      }
    };

    const initial = setTimeout(() => {
      poll();
      interval = setInterval(poll, POLL_INTERVAL);
    }, 3000);

    return () => { 
      clearTimeout(initial); 
      clearInterval(interval); 
    };
  }, []);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={[styles.logoCircle, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
          <Image
            source={require("../../assets/images/LogoH.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Creando tu plan</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          La IA está preparando tu programa
        </Text>

        <View style={styles.cards}>
          <ProgressCard
            icon="dumbbell"
            label="Rutina de ejercicios"
            sublabel="Entrenamiento semanal personalizado"
            done={rutinaLista}
            colors={colors}
          />
          <ProgressCard
            icon="utensils"
            label="Plan de dieta"
            sublabel="Alimentación adaptada a tu objetivo"
            done={dietaLista}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

function ProgressCard({ icon, label, sublabel, done, colors }: { icon: string; label: string; sublabel: string; done: boolean; colors: any; }) {
  const checkScale = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!done) {
      spinValue.setValue(0);
      spinLoop.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      );
      spinLoop.current.start();
    } else {
      if (spinLoop.current) {
        spinLoop.current.stop();
      }
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 6,
      }).start();
    }
  }, [done]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  let cardBgColor = colors.surface;
  let cardBorderColor = colors.divider;
  if (done) {
    cardBorderColor = Colors.primary + "60";
  }

  let iconBgColor = colors.background;
  let iconBorderColor = colors.divider;
  if (done) {
    iconBgColor = Colors.primary + "15";
    iconBorderColor = Colors.primary + "80";
  }

  let labelColor = colors.textSecondary;
  if (done) {
    labelColor = colors.text;
  }

  let iconColor = colors.textSecondary;
  if (done) {
    iconColor = Colors.primary;
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBgColor, borderColor: iconBorderColor }]}>
        <FontAwesome name={icon as any} size={16} color={iconColor} solid />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.cardLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.cardSublabel, { color: colors.textSecondary }]}>{sublabel}</Text>
      </View>

      {done ? (
        <Animated.View style={[styles.checkCircle, styles.checkCircleDone, { transform: [{ scale: checkScale }] }]}>
          <FontAwesome name="check" size={11} color="#fff" solid />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.checkCircle, { transform: [{ rotate: spin }] }]}>
          <FontAwesome name="spinner" size={13} color={colors.textSecondary} solid />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F7F8FA", justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", paddingHorizontal: 28, width: "100%" },
  logoCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, justifyContent: "center", alignItems: "center", marginBottom: 28 },
  logo: { width: 72, height: 72 },
  title: { fontFamily: "NotoSans", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  subtitle: { fontFamily: "NotoSans", fontSize: 14, textAlign: "center", marginBottom: 32 },
  cards: { width: "100%", gap: 12 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  textBlock: { flex: 1 },
  cardLabel: { fontFamily: "NotoSans", fontSize: 15, fontWeight: "bold" },
  cardSublabel: { fontFamily: "NotoSans", fontSize: 12, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#EBEBEB", justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  checkCircleDone: { borderColor: Colors.primary, backgroundColor: Colors.primary },
});