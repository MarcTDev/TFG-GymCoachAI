import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { cargarRutina, cargarKcalQuemadasHoy, cargarRegistrosHoy, cargarExtrasHoy, completarEjercicio, saltarEjercicio, deshacerEjercicio, eliminarActividadExtra, calcularKcalEsperadas, sumarKcalRegistros } from "../../services/workout";
import { getDayOfWeek } from "../../lib/dates";
import { ModalActividad } from "../../components/ModalActividad";
import { TarjetaEjercicio, TarjetaEjercicioExtra } from "../../components/TarjetaEjercicio";

const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const hoy = getDayOfWeek(); 

  const [diasSemana, setDiasSemana] = useState<any[]>([]);
  const [rutinaDia, setRutinaDia] = useState<any>(null);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);

  const [kcalQuemadas, setKcalQuemadas] = useState(0);
  const [registros, setRegistros] = useState<Record<string, any>>({});
  const [extras, setExtras] = useState<any[]>([]);

  const [modalActVisible, setModalActVisible] = useState(false);
  const [cargando, setCargando] = useState(true);

  const diasScrollRef = useRef<ScrollView>(null);

  const seleccionarDia = (dia: any) => {
    setRutinaDia(dia);
    if (dia.rutina_ejercicio) {
      setEjercicios(dia.rutina_ejercicio);
    } else {
      setEjercicios([]);
    }
    setDiaSeleccionado(dia.dia_semana);
  };

  const cargarDatos = async () => {
    if (!user) return;
    setCargando(true);
    
    try {
      const resRutina = await cargarRutina(user.id);
      const resKcal = await cargarKcalQuemadasHoy(user.id);
      const resRegs = await cargarRegistrosHoy(user.id);
      const resExtras = await cargarExtrasHoy(user.id);
      
      setKcalQuemadas(resKcal);
      setRegistros(resRegs);
      setExtras(resExtras);
      
      if (resRutina.data && resRutina.data.rutina_dia) {
        let dias = [...resRutina.data.rutina_dia];
        dias.sort((a, b) => a.dia_semana - b.dia_semana);
        setDiasSemana(dias);
        
        let diaHoy = dias[0];
        for(let i=0; i<dias.length; i++) {
          if (dias[i].dia_semana === hoy) {
            diaHoy = dias[i];
            break;
          }
        }
        
        if (diaHoy) {
          seleccionarDia(diaHoy);
        }
      } else {
        setDiasSemana([]);
      }
    } catch(err) {
      
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [user])
  );

  const handleCompletarEj = async (ej: any) => {
    if (!user) return;
    const res = await completarEjercicio({ userId: user.id, rutinaEjercicioId: ej.id, series: ej.series, repeticiones: ej.repeticiones });
    if (res.error) return;
    
    const nuevos = { ...registros };
    nuevos[ej.id] = { completado: true, saltado: false, kcal_estimadas: res.kcal };
    setRegistros(nuevos);
    setKcalQuemadas(sumarKcalRegistros(nuevos, extras));
  };

  const handleSaltarEj = async (ej: any) => {
    if (!user) return;
    const res = await saltarEjercicio(user.id, ej.id);
    if (res.error) return;
    
    const nuevos = { ...registros };
    nuevos[ej.id] = { completado: false, saltado: true, kcal_estimadas: 0 };
    setRegistros(nuevos);
    setKcalQuemadas(sumarKcalRegistros(nuevos, extras));
  };

  const handleDeshacerEj = async (ej: any) => {
    if (!user) return;
    const res = await deshacerEjercicio(user.id, ej.id);
    if (res.error) return;
    
    const nuevos = { ...registros };
    delete nuevos[ej.id];
    setRegistros(nuevos);
    setKcalQuemadas(sumarKcalRegistros(nuevos, extras));
  };

  const handleEliminarExtra = async (id: string) => {
    const res = await eliminarActividadExtra(id);
    if (res.error) return;
    
    let nuevosExtras = [];
    for(let i=0; i<extras.length; i++){
      if(extras[i].id !== id){
        nuevosExtras.push(extras[i]);
      }
    }
    
    setExtras(nuevosExtras);
    setKcalQuemadas(sumarKcalRegistros(registros, nuevosExtras));
  };

  const verEjercicio = (ej: any) => {
    let catalogoId = null;
    if (ej.ejercicio_catalogo && ej.ejercicio_catalogo.id) {
      catalogoId = ej.ejercicio_catalogo.id;
    }
    
    if (!catalogoId) return;
    
    router.push({ 
      pathname: "/ejercicio/[id]", 
      params: { 
        id: catalogoId, 
        rutina_ejercicio_id: String(ej.id ?? ""), 
        series: String(ej.series ?? ""), 
        repeticiones: String(ej.repeticiones ?? ""), 
        descanso_seg: String(ej.descanso_seg ?? "") 
      } 
    });
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (diasSemana.length === 0) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="dumbbell" size={40} color={colors.divider} solid />
        <Text style={styles.tituloVacio}>Sin rutina asignada</Text>
        <Text style={styles.textoGris}>Tu plan de entrenamiento aparecerá aquí cuando esté listo.</Text>
      </View>
    );
  }

  let esDescanso = false;
  if (!rutinaDia || rutinaDia.es_descanso) {
    esDescanso = true;
  }
  
  let kcalEsperadas = 0;
  if (!esDescanso) {
    kcalEsperadas = calcularKcalEsperadas(ejercicios);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Entrenamiento</Text>

        <ScrollView
          ref={diasScrollRef} horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
          onContentSizeChange={() => { 
            if (hoy >= 6 && diasScrollRef.current) {
              diasScrollRef.current.scrollToEnd({ animated: false }); 
            }
          }}
        >
          {diasSemana.map((dia) => {
            let activo = false;
            if (dia.dia_semana === diaSeleccionado) {
              activo = true;
            }
            
            return (
              <Pressable key={dia.dia_semana} style={[styles.chipDia, activo && styles.chipDiaActivo, dia.es_descanso && !activo && { opacity: 0.5 }]} onPress={() => seleccionarDia(dia)}>
                <Text style={[styles.chipDiaTexto, activo && { color: Colors.white }]}>{DIAS[dia.dia_semana]}</Text>
                {dia.dia_semana === hoy && <View style={[styles.puntoDia, activo && { backgroundColor: Colors.white }]} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.kcalBar}>
          <View style={styles.kcalItem}>
            <FontAwesome name="bullseye" size={16} color={colors.textSecondary} solid />
            <View>
              <Text style={styles.kcalLabel}>Esperadas</Text>
              <Text style={styles.kcalValor}>{kcalEsperadas} kcal</Text>
            </View>
          </View>
          <View style={styles.kcalDivider} />
          <View style={styles.kcalItem}>
            <FontAwesome name="fire" size={16} color={Colors.primary} solid />
            <View>
              <Text style={styles.kcalLabel}>Quemadas</Text>
              <Text style={[styles.kcalValor, { color: Colors.primary }]}>{kcalQuemadas} kcal</Text>
            </View>
          </View>
        </View>

        {esDescanso ? (
          <View style={styles.tarjetaDescanso}>
            <Text style={styles.tituloDescanso}>Día de descanso</Text>
            <Text style={styles.textoGris}>Los músculos crecen cuando recuperas. ¡Aprovecha el día!</Text>
          </View>
        ) : (
          <View style={styles.tarjetaSesion}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etiquetaSesion}>SESIÓN DE HOY</Text>
              <Text style={styles.nombreSesion}>{rutinaDia.nombre_sesion ?? "Entrenamiento"}</Text>
            </View>
            <View style={styles.contadorEj}>
              <Text style={styles.contadorNum}>{ejercicios.length}</Text>
              <Text style={styles.contadorLabel}>ejercicios</Text>
            </View>
          </View>
        )}

        {!esDescanso && ejercicios.length > 0 && (
          <View>
            <Text style={styles.tituloSeccion}>Ejercicios</Text>
            {ejercicios.map((ej, i) => {
              let key = i;
              if (ej.id) key = ej.id;
              
              return (
                <TarjetaEjercicio key={key} ej={ej} indice={i} registro={registros[ej.id]} onPress={() => verEjercicio(ej)} onCompletar={() => handleCompletarEj(ej)} onSaltar={() => handleSaltarEj(ej)} onDeshacer={() => handleDeshacerEj(ej)} />
              );
            })}
          </View>
        )}

        {extras.length > 0 && (
          <View>
            <Text style={[styles.tituloSeccion, { marginTop: 16 }]}>Actividades extra</Text>
            {extras.map(ex => (
              <TarjetaEjercicioExtra key={ex.id} extra={ex} onEliminar={() => handleEliminarExtra(ex.id)} />
            ))}
          </View>
        )}

        <Pressable style={styles.btnAnadirActividad} onPress={() => setModalActVisible(true)}>
          <FontAwesome name="plus-circle" size={16} color={Colors.primary} solid />
          <Text style={styles.btnAnadirActividadText}>Añadir actividad</Text>
        </Pressable>

        <View style={{ height: 2, backgroundColor: colors.divider, marginTop: 24, marginBottom: 4 }} />

        <Pressable style={styles.btnBiblioteca} onPress={() => router.push("/ejercicio/biblioteca")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View style={styles.iconoBiblioteca}><FontAwesome name="book-open" size={16} color={Colors.primary} solid /></View>
            <View>
              <Text style={styles.btnBibliotecaTitulo}>Biblioteca de ejercicios</Text>
              <Text style={styles.textoGris}>Explora todos los ejercicios con fotos</Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
        </Pressable>
      </ScrollView>

      <ModalActividad visible={modalActVisible} onClose={() => setModalActVisible(false)} onSuccess={() => { setModalActVisible(false); cargarDatos(); }} />
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12, backgroundColor: colors.background },
  titulo: { fontSize: 26, fontWeight: "bold", color: colors.text, marginBottom: 16 },
  tituloVacio: { fontSize: 18, fontWeight: "bold", color: colors.text, textAlign: "center" },
  textoGris: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  chipDia: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, alignItems: "center", minWidth: 52, marginRight: 8 },
  chipDiaActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDiaTexto: { fontSize: 13, fontWeight: "bold", color: colors.textSecondary },
  puntoDia: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 3 },
  tarjetaDescanso: { backgroundColor: colors.surface, borderRadius: 16, padding: 30, alignItems: "center", borderWidth: 1, borderColor: colors.divider, marginBottom: 20 },
  tituloDescanso: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 8 },
  tarjetaSesion: { backgroundColor: Colors.primary, borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 20 },
  etiquetaSesion: { fontSize: 11, fontWeight: "bold", color: "rgba(255,255,255,0.7)", letterSpacing: 1, marginBottom: 6 },
  nombreSesion: { fontSize: 22, fontWeight: "bold", color: Colors.white },
  contadorEj: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  contadorNum: { fontSize: 22, fontWeight: "bold", color: Colors.white },
  contadorLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  tituloSeccion: { fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 },
  btnAnadirActividad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primarySubtle, borderRadius: 12, paddingVertical: 14, marginTop: 12, borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed" },
  btnAnadirActividadText: { color: Colors.primary, fontSize: 14, fontWeight: "bold" },
  btnBiblioteca: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 16, paddingLeft: 16, paddingRight: 20, borderWidth: 1, borderColor: colors.divider, marginTop: 12 },
  iconoBiblioteca: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primarySubtle, justifyContent: "center", alignItems: "center" },
  btnBibliotecaTitulo: { fontSize: 15, fontWeight: "bold", color: colors.text },
  kcalBar: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.divider, alignItems: "center" },
  kcalItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" },
  kcalDivider: { width: 1, height: 36, backgroundColor: colors.divider },
  kcalLabel: { fontSize: 12, color: colors.textSecondary },
  kcalValor: { fontSize: 18, fontWeight: "bold", color: colors.text },
});