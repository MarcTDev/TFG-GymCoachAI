import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { ModalComida } from "../../components/ModalComida";
import { HeaderComida, TarjetaComida, TarjetaComidaExtra } from "../../components/TarjetaComida";
import { cargarDieta, cargarAguaDia, marcarComida, deshacerComida, eliminarExtra, guardarAgua, sumarMacros } from "../../services/diet";
import { localDate, getDayOfWeek, getWeekDate } from "../../lib/dates";
import { useFocusLoader } from "../../lib/useFocusLoader";

// Nombre corto de cada día (índice 1 = Lunes)
const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Tipos de comida que puede tener una dieta
const TIPOS_COMIDA = ["desayuno", "almuerzo", "cena", "snack"];

export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Días de la semana del plan de dieta y el que está viendo el usuario
  const [diasSemana, setDiasSemana] = useState<any[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);

  // Comidas del día seleccionado (del plan) y extras añadidas por el usuario
  const [comidas, setComidas] = useState<any[]>([]);
  const [comidasExtra, setComidasExtra] = useState<any[]>([]);

  // Registro de cada comida (si está completada, saltada...)
  const [registroComidas, setRegistroComidas] = useState<Record<string, any>>({});

  // Vasos de agua y kcal objetivo del día
  const [vasosAgua, setVasosAgua] = useState(0);
  const [caloriasObjetivo, setCaloriasObjetivo] = useState(2000);

  // Estado del modal para añadir o sustituir una comida
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoComidaModal, setTipoComidaModal] = useState("snack");
  const [esSustitucion, setEsSustitucion] = useState(false);
  const [idDietaComidaSust, setIdDietaComidaSust] = useState<string | undefined>();

  const fechaHoy = localDate(0);
  const hoyNum = getDayOfWeek();

  // Referencia al scroller horizontal de los días para auto-scrollear si es fin de semana
  const diasScrollRef = useRef<ScrollView>(null);

  // Pide al servidor la dieta de la semana y los registros del día
  const { cargando, recargar: cargarPantalla } = useFocusLoader(async () => {
    if (!user) return;
    const { diasSemana: dias, registros, extras, vasosAgua: agua } = await cargarDieta(user.id, fechaHoy);

    if (dias.length) {
      const sorted = [...dias].sort((a, b) => a.dia_semana - b.dia_semana);
      setDiasSemana(sorted);
      const diaHoy = sorted.find(d => d.dia_semana === hoyNum) ?? sorted[0];
      if (diaHoy) {
        setComidas(diaHoy.dieta_comida ?? []);
        setDiaSeleccionado(diaHoy.dia_semana);
        setCaloriasObjetivo(diaHoy.calorias_dia ?? 2000);
      }
    }

    // Pasamos el array de registros a un objeto { id_comida: registro } para buscar más rápido
    const mapa: Record<string, any> = {};
    for (const r of registros) mapa[r.id_dieta_comida] = r;
    setRegistroComidas(mapa);
    setComidasExtra(extras);
    setVasosAgua(agua);
  }, [user]);

  // Cuando el usuario toca otro día, mostramos sus comidas y el agua de ese día
  const seleccionarDia = async (dia: any) => {
    setDiaSeleccionado(dia.dia_semana);
    setComidas(dia.dieta_comida ?? []);
    setCaloriasObjetivo(dia.calorias_dia ?? 2000);
    setVasosAgua(await cargarAguaDia(user!.id, getWeekDate(dia.dia_semana)));
  };

  // Marca una comida como completada o saltada
  const handleMarcarComida = async (comida: any, accion: "completada" | "saltada") => {
    if (!user) return;
    const { data, error } = await marcarComida(user.id, comida, accion, fechaHoy);
    if (error) return;
    setRegistroComidas(prev => ({
      ...prev,
      [comida.id]: {
        id: data?.[0]?.id,
        completada: accion === "completada",
        saltada: accion === "saltada",
        kcal: comida.receta_catalogo?.kcal ?? 0,
      },
    }));
  };

  // Quita el estado de una comida (vuelve a pendiente)
  const handleDeshacerComida = async (comidaId: string) => {
    if (!user) return;
    const { error } = await deshacerComida(user.id, comidaId, fechaHoy);
    if (error) return;
    setRegistroComidas(prev => {
      const next = { ...prev };
      delete next[comidaId];
      return next;
    });
  };

  // Borra una comida extra del día
  const handleEliminarExtra = async (id: string) => {
    await eliminarExtra(id);
    setComidasExtra(prev => prev.filter(c => c.id !== id));
  };

  // Sube o baja un vaso de agua (solo el día de hoy se puede cambiar)
  const cambiarAgua = async (nuevo: number) => {
    if (diaSeleccionado !== hoyNum) return;
    const valor = Math.max(0, Math.min(8, nuevo));
    setVasosAgua(valor);
    await guardarAgua(user!.id, fechaHoy, valor);
  };

  // Abre el modal para añadir o sustituir una comida
  const abrirModal = (tipo: string, sustitucion = false, idDieta?: string) => {
    setTipoComidaModal(tipo);
    setEsSustitucion(sustitucion);
    setIdDietaComidaSust(idDieta);
    setModalVisible(true);
  };

  // Navega al detalle de una receta
  const verReceta = (receta: any, comida: any, completada: boolean) => {
    if (!receta?.id) return;
    router.push({
      pathname: "/receta/[id]",
      params: {
        id: receta.id,
        id_dieta_comida: comida.id,
        tipo_comida: comida.tipo_comida,
        ya_completada: completada ? "1" : "0",
      },
    });
  };

  // Suma calorías y macros (completadas + extras)
  const { kcal: caloriasConsum, prot, carb, grasa } = sumarMacros(comidas, registroComidas, comidasExtra);
  const caloriasRestantes = Math.max(0, caloriasObjetivo - caloriasConsum);

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!diasSemana.length) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="utensils" size={40} color={colors.divider} solid />
        <Text style={styles.textoVacio}>Sin plan de dieta</Text>
        <Text style={{ color: colors.textTertiary, textAlign: "center" }}>Tu plan nutricional aparecerá aquí cuando esté listo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Nutrición</Text>

        {/* Selector de días */}
        <ScrollView
          ref={diasScrollRef} horizontal showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}
          onContentSizeChange={() => { if (hoyNum >= 6) diasScrollRef.current?.scrollToEnd({ animated: false }); }}
        >
          {diasSemana.map(dia => {
            const activo = dia.dia_semana === diaSeleccionado;
            return (
              <Pressable key={dia.dia_semana} style={[styles.diaChip, activo && styles.diaChipActivo]} onPress={() => seleccionarDia(dia)}>
                <Text style={[styles.diaTexto, activo && { color: Colors.white }]}>{DIAS[dia.dia_semana]}</Text>
                {dia.dia_semana === hoyNum && <View style={[styles.puntito, activo && { backgroundColor: Colors.white }]} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Resumen de calorías */}
        <View style={styles.tarjetaResumen}>
          <View style={styles.caloriasFila}>
            <View style={styles.caloriasBloque}>
              <Text style={styles.caloriasNum}>{caloriasConsum}</Text>
              <Text style={styles.caloriasLabel}>consumidas</Text>
            </View>
            <View style={styles.caloriasBloque}>
              <Text style={[styles.caloriasNum, { color: Colors.success }]}>{caloriasRestantes}</Text>
              <Text style={styles.caloriasLabel}>restantes</Text>
            </View>
            <View style={styles.caloriasBloque}>
              <Text style={styles.caloriasNum}>{caloriasObjetivo}</Text>
              <Text style={styles.caloriasLabel}>objetivo</Text>
            </View>
          </View>
          <View style={styles.macrosFila}>
            <Text style={styles.macroTexto}>P: <Text style={{ fontWeight: "bold" }}>{Math.round(prot)}g</Text></Text>
            <Text style={styles.macroTexto}>C: <Text style={{ fontWeight: "bold" }}>{Math.round(carb)}g</Text></Text>
            <Text style={styles.macroTexto}>G: <Text style={{ fontWeight: "bold" }}>{Math.round(grasa)}g</Text></Text>
          </View>
        </View>

        {/* Control de agua */}
        <View style={styles.tarjetaAgua}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <FontAwesome name="tint" size={14} color={Colors.info} solid />
            <View>
              <Text style={{ fontWeight: "bold", fontSize: 14, color: colors.text }}>Agua</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{vasosAgua * 250}ml de 2000ml</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable style={styles.btnAguaMenos} onPress={() => cambiarAgua(vasosAgua - 1)} disabled={vasosAgua === 0}>
              <FontAwesome name="minus" size={10} color={vasosAgua === 0 ? colors.divider : colors.textSecondary} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.info, minWidth: 20, textAlign: "center" }}>{vasosAgua}</Text>
            <Pressable style={styles.btnAguaMas} onPress={() => cambiarAgua(vasosAgua + 1)} disabled={vasosAgua >= 8}>
              <FontAwesome name="plus" size={10} color={vasosAgua >= 8 ? colors.divider : Colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Secciones de comida por tipo */}
        {TIPOS_COMIDA.map(tipo => {
          const comidasTipo = comidas.filter(c => c.tipo_comida?.toLowerCase() === tipo);
          const extrasTipo = comidasExtra.filter(e => e.tipo_comida?.toLowerCase() === tipo);

          // Ocultar secciones vacías excepto snack (para poder añadir extras)
          if (!comidasTipo.length && !extrasTipo.length) {
            if (tipo !== "snack") return null;
            return (
              <View key={tipo} style={{ marginBottom: 20 }}>
                <HeaderComida tipo={tipo} onAnadir={() => abrirModal(tipo)} />
              </View>
            );
          }

          return (
            <View key={tipo} style={{ marginBottom: 20 }}>
              <HeaderComida tipo={tipo} onAnadir={() => abrirModal(tipo)} />

              {comidasTipo.map(comida => (
                <TarjetaComida
                  key={comida.id}
                  comida={comida}
                  registro={registroComidas[comida.id]}
                  tipo={tipo}
                  onMarcar={handleMarcarComida}
                  onDeshacer={handleDeshacerComida}
                  onCambiar={(t: string, id: string) => abrirModal(t, true, id)}
                  onVerReceta={verReceta}
                />
              ))}

              {extrasTipo.map(extra => (
                <TarjetaComidaExtra key={extra.id} extra={extra} onEliminar={handleEliminarExtra} />
              ))}
            </View>
          );
        })}

        <View style={{ height: 2, backgroundColor: colors.divider, marginTop: 8, marginBottom: 4 }} />

        {/* Acceso a la biblioteca de recetas */}
        <Pressable style={styles.btnBiblioteca} onPress={() => router.push("/receta/biblioteca")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 }}>
            <View style={styles.iconoBiblioteca}>
              <FontAwesome name="book-open" size={16} color={Colors.secondary} solid />
            </View>
            <View>
              <Text style={styles.btnBibliotecaTitulo}>Biblioteca de recetas</Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>Explora todas las recetas con macros</Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
        </Pressable>
      </ScrollView>

      <ModalComida
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        tipo_comida={tipoComidaModal}
        onSuccess={() => { setModalVisible(false); cargarPantalla(); }}
        esSustitucion={esSustitucion}
        idDietaComida={idDietaComidaSust}
      />
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, gap: 12, backgroundColor: colors.background },
  titulo: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: colors.text },
  textoVacio: { fontSize: 18, fontWeight: "bold", color: colors.text },
  diaChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, alignItems: "center", minWidth: 52 },
  diaChipActivo: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  diaTexto: { fontSize: 13, fontWeight: "bold", color: colors.textSecondary },
  puntito: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.secondary, marginTop: 3 },
  tarjetaResumen: { backgroundColor: colors.surface, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.divider },
  caloriasFila: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  caloriasBloque: { alignItems: "center" },
  caloriasNum: { fontSize: 22, fontWeight: "bold", color: colors.text },
  caloriasLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  macrosFila: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  macroTexto: { fontSize: 13, color: colors.textSecondary },
  tarjetaAgua: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.divider, marginBottom: 20 },
  btnAguaMenos: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.divider, justifyContent: "center", alignItems: "center" },
  btnAguaMas: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.info, justifyContent: "center", alignItems: "center" },
  btnBiblioteca: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 16, paddingLeft: 16, paddingRight: 20, borderWidth: 1, borderColor: colors.divider, marginTop: 12 },
  iconoBiblioteca: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.tertiarySubtle, justifyContent: "center", alignItems: "center" },
  btnBibliotecaTitulo: { fontSize: 15, fontWeight: "bold", color: colors.text },
});
