import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, FlatList } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

export type BibliotecaItem = { id: string; nombre: string; imagen_url?: string | null; [k: string]: any };

interface Props {
  label: string;
  titulo: string;
  rutaDetalle: string;
  placeholderBuscar: string;
  textoVacio: string;
  categorias: string[];
  campoCategoria: string;
  textoCategoriaPorDefecto: string;
  iconoPorCategoria: (categoria: string) => string;
  cargarDatos: () => Promise<BibliotecaItem[]>;
}

export function BibliotecaLista(props: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [original, setOriginal] = useState<BibliotecaItem[]>([]);
  const [mostrados, setMostrados] = useState<BibliotecaItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(props.categorias[0] ?? "Todas");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await props.cargarDatos();
        setOriginal(data);
        setMostrados(data);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const filtrados = original.filter((item) => {
      const valor = (item[props.campoCategoria] ?? "").toLowerCase();
      const pasaCategoria = categoriaActiva === props.categorias[0] || valor.includes(categoriaActiva.toLowerCase());
      const pasaTexto = busqueda === "" || (item.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase());
      return pasaCategoria && pasaTexto;
    });
    setMostrados(filtrados);
  }, [busqueda, categoriaActiva, original]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={15} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{props.label}</Text>
          <Text style={styles.title}>{props.titulo}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{mostrados.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <FontAwesome name="search" size={13} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={props.placeholderBuscar}
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda !== "" && (
          <Pressable onPress={() => setBusqueda("")}>
            <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {props.categorias.map((c) => (
          <Pressable key={c} style={[styles.catChip, categoriaActiva === c && styles.catChipActiva]} onPress={() => setCategoriaActiva(c)}>
            {c !== props.categorias[0] && <FontAwesome name={props.iconoPorCategoria(c) as any} size={11} color={categoriaActiva === c ? Colors.white : colors.textSecondary} solid />}
            <Text style={[styles.catChipText, categoriaActiva === c && { color: Colors.white }]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {cargando ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : mostrados.length === 0 ? (
        <View style={styles.centered}><Text style={styles.emptyText}>{props.textoVacio}</Text></View>
      ) : (
        <FlatList
          data={mostrados}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: props.rutaDetalle as any, params: { id: item.id } })}>
              {item.imagen_url ? (
                <Image source={{ uri: item.imagen_url }} style={styles.cardImg} contentFit="cover" />
              ) : (
                <View style={styles.cardImgPlaceholder}>
                  <FontAwesome name={props.iconoPorCategoria(item[props.campoCategoria]) as any} size={28} color={Colors.primary} solid />
                </View>
              )}
              <View style={styles.tipoBadge}>
                <Text style={styles.tipoBadgeText}>{item[props.campoCategoria] || props.textoCategoriaPorDefecto}</Text>
              </View>
              <Text style={styles.cardNombre} numberOfLines={2}>{item.nombre}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontFamily: "NotoSans", fontSize: 16, color: colors.textSecondary },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, justifyContent: "center", alignItems: "center" },
  label: { fontFamily: "NotoSans", fontSize: 10, fontWeight: "bold", color: colors.textSecondary, letterSpacing: 1 },
  title: { fontFamily: "NotoSans", fontSize: 22, fontWeight: "bold", color: colors.text },
  countBadge: { backgroundColor: colors.primarySubtle, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  countText: { fontFamily: "NotoSans", fontSize: 13, fontWeight: "bold", color: Colors.primary },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: colors.divider, marginHorizontal: 20, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, fontFamily: "NotoSans", fontSize: 14, color: colors.text },
  catScroll: { flexGrow: 0, marginBottom: 16 },
  catContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  catChipActiva: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontFamily: "NotoSans", fontSize: 12, fontWeight: "bold", color: colors.textSecondary },
  card: { flex: 1, margin: 5, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" },
  cardImg: { width: "100%", height: 120 },
  cardImgPlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center", backgroundColor: colors.primarySubtle },
  tipoBadge: { alignSelf: "flex-start", backgroundColor: colors.inputBackground, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginHorizontal: 10, marginTop: 10 },
  tipoBadgeText: { fontFamily: "NotoSans", fontSize: 9, fontWeight: "bold", color: colors.textSecondary },
  cardNombre: { fontFamily: "NotoSans", fontSize: 14, fontWeight: "bold", color: colors.text, marginHorizontal: 10, marginVertical: 10 },
});