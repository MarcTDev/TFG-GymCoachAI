import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors, ColorScheme } from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { analyzeFood, analyzeFridge, generarRecetaIA } from "../../lib/scanner";
import { guardarComidaExtra, sustituirComida } from "../../services/food";
import { cargarDieta } from "../../services/diet";
import { localDate, getDayOfWeek } from "../../lib/dates";
import { RecetaIA } from "../../types/food";

const TIPOS_COMIDA = ["desayuno", "almuerzo", "cena", "snack"];

const COMIDA_ICON: Record<string, string> = { desayuno: "sun", almuerzo: "cloud-sun", cena: "moon", snack: "cookie-bite" };

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { user } = useAuth();
  const { perfil } = useUser();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [permission, requestPermission] = useCameraPermissions();

  const [modo, setModo] = useState("comida");
  const [estadoComida, setEstadoComida] = useState("camara");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [macros, setMacros] = useState<any>(null);

  const [estadoNevera, setEstadoNevera] = useState("camara");
  const [fotoNeveraUri, setFotoNeveraUri] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState<string[]>([]);
  const [recetaIA, setRecetaIA] = useState<RecetaIA | null>(null);

  const [modalDieta, setModalDieta] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [comidasDia, setComidasDia] = useState<any[]>([]);
  const [cargandoDieta, setCargandoDieta] = useState(false);
  const [modoSustituir, setModoSustituir] = useState(false);
  const [idDietaComidaSust, setIdDietaComidaSust] = useState<string | null>(null);

  const fecha = localDate(0);

  const hacerFotoComida = async () => {
    if (!cameraRef.current) return;
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto || !foto.uri) return;
      setFotoUri(foto.uri);
      setEstadoComida("analizando");
      const res = await analyzeFood(foto.uri);
      setMacros(res);
      setEstadoComida("resultado");
    } catch {
      setEstadoComida("camara");
    }
  };

  const hacerFotoNevera = async () => {
    if (!cameraRef.current) return;
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto || !foto.uri) return;
      setFotoNeveraUri(foto.uri);
      setEstadoNevera("analizando");
      const resultado = await analyzeFridge(foto.uri);
      
      if (resultado.ingredients.length === 0) {
        setFotoNeveraUri(null);
        setEstadoNevera("camara");
        return;
      }
      
      setIngredientes(resultado.ingredients);
      setEstadoNevera("ingredientes");
    } catch {
      setEstadoNevera("camara");
    }
  };

  const generarReceta = async () => {
    if (ingredientes.length === 0) return;
    setEstadoNevera("generando");
    try {
      let uId = "";
      if (user) uId = user.id;
      const receta = await generarRecetaIA(perfil, ingredientes, uId);
      setRecetaIA(receta);
      setEstadoNevera("receta");
    } catch {
      setEstadoNevera("ingredientes");
    }
  };

  const abrirModalDieta = async () => {
    if (!user) return;
    setModoSustituir(false);
    setIdDietaComidaSust(null);
    setTipoSeleccionado(null);
    setModalDieta(true);
    setCargandoDieta(true);
    
    try {
      const result = await cargarDieta(user.id, fecha);
      const diasSemana = result.diasSemana;
      const hoy = getDayOfWeek();
      
      let diaHoy = null;
      if (diasSemana.length > 0) {
        diaHoy = diasSemana[0];
        for (let i = 0; i < diasSemana.length; i++) {
          if (diasSemana[i].dia_semana === hoy) {
            diaHoy = diasSemana[i];
            break;
          }
        }
      }
      
      if (diaHoy && diaHoy.dieta_comida) {
        setComidasDia(diaHoy.dieta_comida);
      } else {
        setComidasDia([]);
      }
    } catch {
      setComidasDia([]);
    } finally {
      setCargandoDieta(false);
    }
  };

  const datosParaGuardar = () => {
    if (modo === "comida") {
      return { 
        nombre: macros.nombre, 
        kcal: macros.calorias, 
        proteinas_g: macros.proteinas, 
        carbos_g: macros.carbohidratos, 
        grasas_g: macros.grasas 
      };
    } else {
      return { 
        nombre: recetaIA!.nombre, 
        kcal: recetaIA!.kcal, 
        proteinas_g: recetaIA!.proteinas, 
        carbos_g: recetaIA!.carbos, 
        grasas_g: recetaIA!.grasas 
      };
    }
  };

  const guardarEnDieta = async () => {
    if (!user || !tipoSeleccionado) return;
    setGuardando(true);
    try {
      if (modoSustituir && idDietaComidaSust) {
        await sustituirComida(user.id, fecha, idDietaComidaSust, tipoSeleccionado);
      }
      await guardarComidaExtra(user.id, fecha, tipoSeleccionado, datosParaGuardar());
      setModalDieta(false);
      router.push("/(tabs)/diet");
    } catch {
      
    } finally {
      setGuardando(false);
    }
  };

  const resetearComida = () => {
    setFotoUri(null);
    setMacros(null);
    setEstadoComida("camara");
  };

  const resetearNevera = () => {
    setFotoNeveraUri(null);
    setIngredientes([]);
    setRecetaIA(null);
    setEstadoNevera("camara");
  };

  if (!permission) {
    return <View style={styles.container} />;
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="camera-alt" size={56} color={colors.textTertiary} />
        <Text style={styles.titulo}>Acceso a la cámara</Text>
        <Text style={styles.subtitulo}>Necesitamos acceso para analizar platos e ingredientes.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Permitir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let viendoCamara = false;
  if ((modo === "comida" && estadoComida === "camara") || (modo === "nevera" && estadoNevera === "camara")) {
    viendoCamara = true;
  }
  
  let analizando = false;
  if (estadoComida === "analizando" || estadoNevera === "analizando" || estadoNevera === "generando") {
    analizando = true;
  }
  
  let uriImagen = null;
  if (modo === "comida") {
    uriImagen = fotoUri;
  } else {
    uriImagen = fotoNeveraUri;
  }

  let btnDisabled = false;
  if (!tipoSeleccionado) {
    btnDisabled = true;
  }

  return (
    <View style={styles.container}>
      {viendoCamara ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
          <View style={styles.botonesTop}>
            <TouchableOpacity style={[styles.modoBtn, modo === "comida" && styles.modoActivo]} onPress={() => { setModo("comida"); setEstadoComida("camara"); }}>
              <Text style={styles.btnText}>Plato</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modoBtn, modo === "nevera" && styles.modoActivoNevera]} onPress={() => { setModo("nevera"); setEstadoNevera("camara"); }}>
              <Text style={styles.btnText}>Nevera</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={[styles.shutterBtn, modo === "nevera" && styles.shutterBtnNevera]} onPress={modo === "comida" ? hacerFotoComida : hacerFotoNevera}>
              <View style={[styles.shutterInner, modo === "nevera" && styles.shutterInnerNevera]} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        uriImagen && <Image source={{ uri: uriImagen }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}

      {analizando && (
        <View style={[styles.overlay, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="large" color={modo === "nevera" ? Colors.success : Colors.primary} />
          <Text style={styles.textoBlanco}>{estadoNevera === "generando" ? "Generando receta con IA..." : "Analizando con IA..."}</Text>
        </View>
      )}

      {modo === "comida" && estadoComida === "resultado" && macros && (
        <View style={[styles.tarjetaResultado, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titulo}>{macros.nombre}</Text>
            <Text style={styles.calorias}>{macros.calorias} kcal</Text>
            <Text style={styles.macros}>Proteínas: {macros.proteinas}g  |  Carbos: {macros.carbohidratos}g  |  Grasas: {macros.grasas}g</Text>
            <TouchableOpacity style={styles.btn} onPress={abrirModalDieta}><Text style={styles.btnText}>Añadir a mi dieta</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnGris} onPress={resetearComida}><Text style={styles.btnTextGris}>Nueva Foto</Text></TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {modo === "nevera" && estadoNevera === "ingredientes" && (
        <View style={[styles.tarjetaResultado, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titulo}>Ingredientes Detectados</Text>
            <View style={styles.ingredientesWrap}>
              {ingredientes.map((ing, i) => (
                <View key={i} style={styles.ingredienteChip}><Text style={styles.ingredienteChipText}>{ing}</Text></View>
              ))}
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success }]} onPress={generarReceta}>
              <Text style={styles.btnText}>Generar Receta con IA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGris} onPress={resetearNevera}>
              <Text style={styles.btnTextGris}>Nueva Foto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {modo === "nevera" && estadoNevera === "receta" && recetaIA && (
        <View style={[styles.tarjetaResultado, { paddingBottom: insets.bottom + 20, maxHeight: "85%" }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titulo}>{recetaIA.nombre}</Text>
            <Text style={styles.calorias}>{recetaIA.kcal} kcal</Text>
            <Text style={styles.macros}>P: {recetaIA.proteinas}g  |  C: {recetaIA.carbos}g  |  G: {recetaIA.grasas}g</Text>

            <Text style={styles.seccion}>Ingredientes</Text>
            {recetaIA.ingredientes.map((ing, i) => <Text key={i} style={styles.ingText}>• {ing}</Text>)}

            <Text style={styles.seccion}>Preparación</Text>
            {recetaIA.pasos.map((paso, i) => (
              <View key={i} style={styles.pasoRow}>
                <View style={styles.pasoNum}><Text style={styles.pasoNumText}>{i + 1}</Text></View>
                <Text style={styles.pasoText}>{paso}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success, marginTop: 20 }]} onPress={() => { setTipoSeleccionado(null); setModoSustituir(false); setModalDieta(true); }}>
              <Text style={styles.btnText}>Añadir a mi dieta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGris} onPress={resetearNevera}>
              <Text style={styles.btnTextGris}>Escanear de nuevo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <Modal visible={modalDieta} transparent animationType="slide" onRequestClose={() => setModalDieta(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.titulo}>Añadir a la dieta de hoy</Text>
              <TouchableOpacity onPress={() => setModalDieta(false)}><FontAwesome name="times" size={18} color={colors.textTertiary} /></TouchableOpacity>
            </View>

            {cargandoDieta ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <View>
                <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
                  {comidasDia.length > 0 && (
                    <View>
                      <Text style={styles.seccion}>COMIDAS DE HOY</Text>
                      {comidasDia.map((c: any) => {
                        let seleccionado = false;
                        if (modoSustituir && idDietaComidaSust === c.id) {
                          seleccionado = true;
                        }
                        
                        let nombreReceta = "—";
                        if (c.receta_catalogo && c.receta_catalogo.nombre) {
                          nombreReceta = c.receta_catalogo.nombre;
                        }
                        
                        let tipoCom = "";
                        if (c.tipo_comida) {
                          tipoCom = c.tipo_comida.toUpperCase();
                        }

                        return (
                          <TouchableOpacity key={c.id} style={[styles.comidaRow, seleccionado && styles.comidaRowSel]}
                            onPress={() => { setModoSustituir(true); setIdDietaComidaSust(c.id); setTipoSeleccionado(c.tipo_comida); }}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.comidaTipo}>{tipoCom}</Text>
                              <Text style={styles.comidaNombre}>{nombreReceta}</Text>
                            </View>
                            <Text style={styles.sustText}>Sustituir</Text>
                            {seleccionado && <FontAwesome name="check-circle" size={18} color={Colors.primary} solid />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={styles.seccion}>O AÑADIR COMO EXTRA</Text>
                  <View style={styles.tiposRow}>
                    {TIPOS_COMIDA.map(tipo => {
                      let activo = false;
                      if (!modoSustituir && tipoSeleccionado === tipo) {
                        activo = true;
                      }
                      
                      let iconName = "utensils";
                      if (COMIDA_ICON[tipo]) {
                        iconName = COMIDA_ICON[tipo];
                      }
                      
                      const nombreMostrado = tipo.charAt(0).toUpperCase() + tipo.slice(1);

                      return (
                        <TouchableOpacity key={tipo} style={[styles.tipoChip, activo && styles.tipoChipActive]}
                          onPress={() => { setTipoSeleccionado(tipo); setModoSustituir(false); setIdDietaComidaSust(null); }}>
                          <FontAwesome name={iconName as any} size={13} color={activo ? Colors.white : Colors.primary} solid />
                          <Text style={[styles.tipoChipText, activo && styles.tipoChipTextActive]}>{nombreMostrado}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <TouchableOpacity style={[styles.btn, btnDisabled && styles.btnDisabled, { marginTop: 12, marginBottom: 0 }]} onPress={guardarEnDieta} disabled={btnDisabled || guardando}>
                  {guardando ? <ActivityIndicator size="small" color={Colors.white} /> : (
                    <Text style={styles.btnText}>{modoSustituir ? "Sustituir y guardar" : `Añadir a ${tipoSeleccionado ?? "..."}`}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 30, gap: 12 },
  botonesTop: { flexDirection: "row", justifyContent: "center", marginTop: 60, gap: 10 },
  modoBtn: { backgroundColor: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 20, width: 100, alignItems: "center" },
  modoActivo: { backgroundColor: Colors.primary },
  modoActivoNevera: { backgroundColor: Colors.success },
  bottomArea: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  shutterBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: Colors.white, justifyContent: "center", alignItems: "center" },
  shutterBtnNevera: { borderColor: Colors.success },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary },
  shutterInnerNevera: { backgroundColor: Colors.success },
  overlay: { justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", gap: 12 },
  textoBlanco: { color: Colors.white, fontSize: 16, fontWeight: "bold" },
  tarjetaResultado: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: colors.text },
  subtitulo: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  calorias: { fontSize: 30, fontWeight: "bold", color: Colors.primary, marginBottom: 5 },
  macros: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  seccion: { fontSize: 13, fontWeight: "bold", color: colors.textTertiary, marginTop: 14, marginBottom: 8, letterSpacing: 0.5 },
  ingText: { fontSize: 14, color: colors.text, marginBottom: 4 },
  ingredientesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  ingredienteChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.successSubtle, borderWidth: 1, borderColor: Colors.success },
  ingredienteChipText: { fontSize: 13, fontWeight: "bold", color: Colors.success },
  pasoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  pasoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.infoSubtle, justifyContent: "center", alignItems: "center" },
  pasoNumText: { fontSize: 12, fontWeight: "bold", color: Colors.primary },
  pasoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
  btn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  btnText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
  btnGris: { backgroundColor: colors.inputBackground, padding: 15, borderRadius: 10, alignItems: "center" },
  btnTextGris: { color: colors.text, fontWeight: "bold", fontSize: 16 },
  btnDisabled: { backgroundColor: colors.divider },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCaja: { backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  comidaRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBackground, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.divider, gap: 10 },
  comidaRowSel: { borderColor: Colors.primary, backgroundColor: colors.infoSubtle },
  comidaTipo: { fontSize: 10, fontWeight: "bold", color: colors.textTertiary, marginBottom: 2 },
  comidaNombre: { fontSize: 14, fontWeight: "bold", color: colors.text },
  sustText: { fontSize: 12, fontWeight: "bold", color: Colors.primary, marginRight: 4 },
  tiposRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tipoChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.divider },
  tipoChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoChipText: { fontSize: 13, fontWeight: "bold", color: colors.textSecondary },
  tipoChipTextActive: { color: Colors.white },
});