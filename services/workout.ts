import { supabase } from '../lib/supabase';
import { localDate } from './../lib/dates';

export async function cargarRutina(userId: string) {
  const res = await supabase
    .from('rutina_semana')
    .select(`
      id, nivel_actividad,
      rutina_dia (
        id, dia_semana, es_descanso, nombre_sesion,
        rutina_ejercicio (
          id, series, repeticiones, descanso_seg,
          ejercicio_catalogo ( id, nombre, grupo_muscular )
        )
      )
    `)
    .eq('usuario_id', userId)
    .eq('completada', false)
    .order('generada_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data: res.data, error: res.error };
}

export async function cargarKcalQuemadasHoy(userId: string) {
  const hoy = localDate(0);
  const p1 = supabase.from('registro_ejercicio').select('kcal_estimadas').eq('usuario_id', userId).eq('fecha', hoy);
  const p2 = supabase.from('registro_ejercicio_extra').select('kcal_estimadas').eq('usuario_id', userId).eq('fecha', hoy);
  
  const resReg = await p1;
  const resExtra = await p2;
  
  let total = 0;
  if (resReg.data) {
    for (const r of resReg.data) {
      total += r.kcal_estimadas ?? 0;
    }
  }
  if (resExtra.data) {
    for (const r of resExtra.data) {
      total += r.kcal_estimadas ?? 0;
    }
  }
  return total;
}

export function estimarKcalEjercicio(series?: number | null, repeticiones?: number | null): number {
  const s = series ?? 0;
  const r = repeticiones ?? 0;
  return Math.round(s * r * 0.5);
}

export function calcularKcalEsperadas(ejercicios: any[]): number {
  let total = 0;
  for (const ej of ejercicios) {
    total += estimarKcalEjercicio(ej.series, ej.repeticiones);
  }
  return total;
}

export function sumarKcalRegistros(registros: Record<string, any>, extras: any[]): number {
  let total = 0;
  
  let values = Object.values(registros);
  for (let i = 0; i < values.length; i++) {
    if (values[i] && values[i].kcal_estimadas) {
      total = total + values[i].kcal_estimadas;
    }
  }
  
  for (let i = 0; i < extras.length; i++) {
    if (extras[i].kcal_estimadas) {
      total = total + extras[i].kcal_estimadas;
    }
  }
  return total;
}

export async function obtenerCompletadoHoy(userId: string, rutinaEjercicioId: string) {
  const hoy = localDate(0);
  const res = await supabase
    .from('registro_ejercicio')
    .select('id, completado, kcal_estimadas')
    .eq('usuario_id', userId)
    .eq('id_rutina_ejercicio', rutinaEjercicioId)
    .eq('fecha', hoy)
    .maybeSingle();
  return res.data;
}

export async function completarEjercicio(params: {
  userId: string;
  rutinaEjercicioId: string;
  series?: number | null;
  repeticiones?: number | null;
}) {
  const hoy = localDate(0);
  const kcal = estimarKcalEjercicio(params.series, params.repeticiones);
  
  const ser = params.series ?? null;
  const rep = params.repeticiones ?? null;

  const res = await supabase
    .from('registro_ejercicio')
    .upsert({
      usuario_id: params.userId,
      id_rutina_ejercicio: params.rutinaEjercicioId,
      fecha: hoy,
      completado: true,
      saltado: false,
      series_realizadas: ser,
      repeticiones_reales: rep,
      kcal_estimadas: kcal,
      completado_en: new Date().toISOString(),
    }, { onConflict: 'usuario_id,id_rutina_ejercicio,fecha' })
    .select()
    .single();
    
  return { data: res.data, error: res.error, kcal: kcal };
}

export async function saltarEjercicio(userId: string, rutinaEjercicioId: string) {
  const hoy = localDate(0);
  const res = await supabase
    .from('registro_ejercicio')
    .upsert({
      usuario_id: userId,
      id_rutina_ejercicio: rutinaEjercicioId,
      fecha: hoy,
      completado: false,
      saltado: true,
      kcal_estimadas: 0,
    }, { onConflict: 'usuario_id,id_rutina_ejercicio,fecha' });
  return { error: res.error };
}

export async function deshacerEjercicio(userId: string, rutinaEjercicioId: string) {
  const hoy = localDate(0);
  const res = await supabase
    .from('registro_ejercicio')
    .delete()
    .eq('usuario_id', userId)
    .eq('id_rutina_ejercicio', rutinaEjercicioId)
    .eq('fecha', hoy);
  return { error: res.error };
}

export async function cargarRegistrosHoy(userId: string) {
  const hoy = localDate(0);
  const res = await supabase
    .from('registro_ejercicio')
    .select('id, id_rutina_ejercicio, completado, saltado, kcal_estimadas')
    .eq('usuario_id', userId)
    .eq('fecha', hoy);
    
  const mapa: any = {};
  if (res.data) {
    for (const r of res.data) {
      mapa[r.id_rutina_ejercicio] = r;
    }
  }
  return mapa;
}

export async function cargarExtrasHoy(userId: string) {
  const hoy = localDate(0);
  const res = await supabase
    .from('registro_ejercicio_extra')
    .select('id, id_ejercicio, nombre, series, repeticiones, kcal_estimadas')
    .eq('usuario_id', userId)
    .eq('fecha', hoy)
    .order('registrado_en', { ascending: true });
    
  if (res.data) {
    return res.data;
  }
  return [];
}

export async function anadirActividadExtra(params: {
  userId: string;
  ejercicioId?: string | null;
  nombre: string;
  series?: number | null;
  repeticiones?: number | null;
}) {
  const hoy = localDate(0);
  const kcal = estimarKcalEjercicio(params.series, params.repeticiones);
  
  const ejId = params.ejercicioId ?? null;
  const ser = params.series ?? null;
  const rep = params.repeticiones ?? null;

  const res = await supabase
    .from('registro_ejercicio_extra')
    .insert({
      usuario_id: params.userId,
      fecha: hoy,
      id_ejercicio: ejId,
      nombre: params.nombre,
      series: ser,
      repeticiones: rep,
      kcal_estimadas: kcal,
    })
    .select()
    .single();
    
  return { data: res.data, error: res.error };
}

export async function eliminarActividadExtra(id: string) {
  const res = await supabase.from('registro_ejercicio_extra').delete().eq('id', id);
  return { error: res.error };
}

export async function cargarCatalogoEjercicios() {
  const res = await supabase
    .from('ejercicio_catalogo')
    .select('id, nombre, grupo_muscular')
    .order('nombre', { ascending: true });
    
  if (res.data) {
    return res.data;
  }
  return [];
}