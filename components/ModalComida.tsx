import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { analyzeFood } from '../lib/scanner';
import { localDate } from '../lib/dates';
import { Colors, ColorScheme } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { buscarRecetas, guardarComidaExtra, sustituirComida } from '../services/food';

interface Props {
  visible: boolean;
  onClose: () => void;
  tipo_comida: string;
  onSuccess: () => void;
  esSustitucion?: boolean;
  idDietaComida?: string;
}

type ManualForm = { nombre: string; kcal: string; prot: string; carb: string; grasa: string };
const MANUAL_EMPTY: ManualForm = { nombre: '', kcal: '', prot: '', carb: '', grasa: '' };

export function ModalComida({ visible, onClose, tipo_comida, onSuccess, esSustitucion, idDietaComida }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = makeStyles(colors);

  const [tab, setTab] = useState('buscar');
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [manual, setManual] = useState<ManualForm>(MANUAL_EMPTY);

  const [permission, requestPermission] = useCameraPermissions();
  const [estadoCam, setEstadoCam] = useState('camara');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [resultadoIA, setResultadoIA] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  const fechaHoy = localDate(0);

  const buscar = async (texto: string) => {
    setBusqueda(texto);
    setBuscando(true);
    try {
      const res = await buscarRecetas(texto);
      setResultados(res);
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => { 
    if (visible) {
      buscar('');
    }
  }, [visible]);

  const marcarSustitucion = async () => {
    if (!esSustitucion || !idDietaComida || !user) return;
    await sustituirComida(user.id, fechaHoy, idDietaComida, tipo_comida);
  };

  const guardarExtra = async (datos: any) => {
    await guardarComidaExtra(user!.id, fechaHoy, tipo_comida, datos);
  };

  const confirmarReceta = async (receta: any) => {
    if (!user) return;
    setGuardando(true);
    try {
      await marcarSustitucion();
      await guardarExtra({
        id_receta: receta.id, 
        nombre: receta.nombre,
        kcal: receta.kcal, 
        proteinas_g: receta.proteinas_g, 
        carbos_g: receta.carbos_g, 
        grasas_g: receta.grasas_g,
        via_escaner: false,
      });
      cerrar(); 
      onSuccess();
    } catch { 
      Alert.alert('Error', 'No se pudo añadir'); 
    } finally { 
      setGuardando(false); 
    }
  };

  const confirmarManual = async () => {
    if (!user || manual.nombre.trim() === '') { 
      Alert.alert('Error', 'Pon el nombre al menos.'); 
      return; 
    }
    setGuardando(true);
    try {
      await guardarExtra({
        nombre: manual.nombre.trim(),
        kcal: Number(manual.kcal) || 0, 
        proteinas_g: Number(manual.prot) || 0,
        carbos_g: Number(manual.carb) || 0, 
        grasas_g: Number(manual.grasa) || 0,
        via_escaner: false,
      });
      cerrar(); 
      onSuccess();
    } catch { 
      Alert.alert('Error', 'No se guardó'); 
    } finally { 
      setGuardando(false); 
    }
  };

  const hacerFoto = async () => {
    if (!cameraRef.current) return;
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto?.uri) return;
      setFotoUri(foto.uri);
      setEstadoCam('analizando');
      const r = await analyzeFood(foto.uri);
      setResultadoIA({ nombre: r.nombre, kcal: r.calorias, proteinas_g: r.proteinas, carbos_g: r.carbohidratos, grasas_g: r.grasas });
      setEstadoCam('resultado');
    } catch {
      setEstadoCam('camara'); 
      setFotoUri(null);
      Alert.alert('Error', 'Falló el escáner.');
    }
  };

  const confirmarEscaner = async () => {
    if (!user || !resultadoIA) return;
    setGuardando(true);
    try {
      await marcarSustitucion();
      await guardarExtra({ ...resultadoIA, via_escaner: true });
      cerrar(); 
      onSuccess();
    } catch { 
      Alert.alert('Error', 'Fallo al guardar escáner'); 
    } finally { 
      setGuardando(false); 
    }
  };

  const cerrar = () => {
    setBusqueda(''); 
    setRecetaSeleccionada(null); 
    setModoManual(false); 
    setManual(MANUAL_EMPTY);
    setFotoUri(null); 
    setResultadoIA(null); 
    setEstadoCam('camara'); 
    setTab('buscar');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={cerrar}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{esSustitucion ? 'Sustituir comida' : 'Añadir comida'}</Text>
          <Pressable onPress={cerrar} style={styles.closeBtn}>
            <FontAwesome name="times" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, tab === 'buscar' && styles.tabActive]} onPress={() => setTab('buscar')}>
            <Text style={[styles.tabText, tab === 'buscar' && styles.tabTextActive]}>Buscar</Text>
          </Pressable>
          <Pressable style={[styles.tab, tab === 'escaner' && styles.tabActive]} onPress={() => setTab('escaner')}>
            <Text style={[styles.tabText, tab === 'escaner' && styles.tabTextActive]}>Escáner AI</Text>
          </Pressable>
        </View>

        {tab === 'buscar' && (
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {!modoManual ? (
              <View>
                <View style={styles.searchBox}>
                  <FontAwesome name="search" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput style={styles.searchInput} placeholder="Buscar plato..." placeholderTextColor={colors.textSecondary} value={busqueda} onChangeText={buscar} />
                </View>
                {buscando && <ActivityIndicator color={Colors.primary} />}

                {recetaSeleccionada ? (
                  <View style={styles.preview}>
                    <Text style={styles.previewNombre}>{recetaSeleccionada.nombre}</Text>
                    <Text style={styles.kcalGrande}>{recetaSeleccionada.kcal} kcal</Text>
                    <View style={styles.previewBtns}>
                      <Pressable style={styles.btnSecondary} onPress={() => setRecetaSeleccionada(null)}>
                        <Text style={styles.btnSecondaryText}>Cancelar</Text>
                      </Pressable>
                      <Pressable style={styles.btnPrimary} onPress={() => confirmarReceta(recetaSeleccionada)}>
                        <Text style={styles.btnPrimaryText}>{guardando ? '...' : 'Guardar'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  resultados.map((r) => (
                    <Pressable key={r.id} style={styles.resultRow} onPress={() => setRecetaSeleccionada(r)}>
                      <Text style={{ fontWeight: 'bold', color: colors.text }}>{r.nombre}</Text>
                      <Text style={{ color: colors.textSecondary }}>{r.kcal} kcal</Text>
                    </Pressable>
                  ))
                )}
                <Pressable style={{ padding: 20, alignItems: 'center' }} onPress={() => setModoManual(true)}>
                  <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>+ Añadir manualmente</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.manualForm}>
                <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.textSecondary} value={manual.nombre} onChangeText={(v) => setManual({ ...manual, nombre: v })} />
                <TextInput style={styles.input} placeholder="Calorías" placeholderTextColor={colors.textSecondary} value={manual.kcal} onChangeText={(v) => setManual({ ...manual, kcal: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Proteínas (g)" placeholderTextColor={colors.textSecondary} value={manual.prot} onChangeText={(v) => setManual({ ...manual, prot: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Carbohidratos (g)" placeholderTextColor={colors.textSecondary} value={manual.carb} onChangeText={(v) => setManual({ ...manual, carb: v })} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Grasas (g)" placeholderTextColor={colors.textSecondary} value={manual.grasa} onChangeText={(v) => setManual({ ...manual, grasa: v })} keyboardType="numeric" />
                
                <View style={styles.previewBtns}>
                  <Pressable style={styles.btnSecondary} onPress={() => setModoManual(false)}>
                    <Text style={styles.btnSecondaryText}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={styles.btnPrimary} onPress={confirmarManual}>
                    <Text style={styles.btnPrimaryText}>{guardando ? '...' : 'Guardar'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {tab === 'escaner' && (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {estadoCam === 'camara' && permission?.granted ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
                <Pressable style={styles.shutterBtn} onPress={hacerFoto}>
                  <View style={styles.shutterInner} />
                </Pressable>
              </CameraView>
            ) : estadoCam === 'camara' && !permission?.granted ? (
              <View style={styles.permisoBox}>
                <FontAwesome name="camera" size={56} color="#8A8F9C" />
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 10 }}>Acceso a la cámara</Text>
                <Text style={styles.permisoText}>Necesitamos acceso para analizar platos e ingredientes.</Text>
                <Pressable style={[styles.btnPrimary, { width: "100%", flex: 0, marginTop: 10 }]} onPress={requestPermission}>
                  <Text style={styles.btnPrimaryText}>Permitir</Text>
                </Pressable>
              </View>
            ) : fotoUri ? (
              <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFill} />
            ) : null}

            {estadoCam === 'analizando' && (
              <View style={styles.overlayAnalizando}>
                <ActivityIndicator size="large" color={Colors.secondary} />
                <Text style={{ color: '#fff', marginTop: 10, fontWeight: "bold" }}>Analizando con IA...</Text>
              </View>
            )}

            {estadoCam === 'resultado' && resultadoIA && (
              <View style={styles.resultCard}>
                <Text style={styles.previewNombre}>{resultadoIA.nombre}</Text>
                <Text style={styles.kcalGrande}>{resultadoIA.kcal} kcal</Text>
                <Text style={styles.macros}>
                  Proteínas: {resultadoIA.proteinas_g}g  |  Carbos: {resultadoIA.carbos_g}g  |  Grasas: {resultadoIA.grasas_g}g
                </Text>
                <View style={styles.previewBtns}>
                  <Pressable style={styles.btnSecondary} onPress={() => { setFotoUri(null); setResultadoIA(null); setEstadoCam('camara'); }}>
                    <Text style={styles.btnSecondaryText}>Reintentar</Text>
                  </Pressable>
                  <Pressable style={styles.btnPrimary} onPress={confirmarEscaner}>
                    <Text style={styles.btnPrimaryText}>{guardando ? '...' : 'Añadir'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: colors.divider },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.inputBackground, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', padding: 15, gap: 10 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.divider },
  tabActive: { backgroundColor: colors.secondarySubtle, borderColor: Colors.secondary },
  tabText: { fontWeight: 'bold', color: colors.textSecondary },
  tabTextActive: { color: Colors.secondary },
  body: { flex: 1, padding: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, borderWidth: 1.5, borderColor: Colors.secondary + '55' },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.divider, color: colors.text },
  resultRow: { backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.divider },
  preview: { backgroundColor: colors.surface, padding: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.divider, alignItems: 'center' },
  previewNombre: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: colors.text },
  kcalGrande: { fontSize: 30, fontWeight: 'bold', color: Colors.secondary, marginBottom: 6 },
  macros: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'center' },
  previewBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 },
  btnPrimary: { flex: 1, backgroundColor: Colors.secondary, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold' },
  btnSecondary: { flex: 1, backgroundColor: colors.inputBackground, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnSecondaryText: { color: colors.text, fontWeight: 'bold' },
  manualForm: { padding: 10 },
  shutterBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.secondary },
  permisoBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 16 },
  permisoText: { color: '#8A8F9C', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  overlayAnalizando: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  resultCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center' },
});