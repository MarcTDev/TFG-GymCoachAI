import { supabase } from "../lib/supabase";
import { localDate } from "../lib/dates";

const DIAS_L = ["L", "M", "X", "J", "V", "S", "D"];
function dayLabel(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  let num = d.getDay();
  if (num === 0) {
    num = 6;
  } else {
    num = num - 1;
  }
  return DIAS_L[num];
}

export async function cargarStats(userId: string) {
  const hoy = localDate(0);
  const hace7 = localDate(-6);
  const hace14 = localDate(-13);
  const hace30 = localDate(-29);
  const hace56 = localDate(-55);

  const p1 = supabase.from("registro_progreso").select("fecha, peso").eq("usuario_id", userId).gte("fecha", hace30).order("fecha", { ascending: true }).limit(30);
  const p2 = supabase.from("registro_dia").select("fecha, entreno_inicio").eq("usuario_id", userId).not("entreno_inicio", "is", null).gte("fecha", hace56).order("fecha", { ascending: true });
  const p3 = supabase.from("registro_ejercicio").select("fecha, kcal_estimadas").eq("usuario_id", userId).gte("fecha", hace14).order("fecha", { ascending: true });
  const p4 = supabase.from("registro_ejercicio_extra").select("fecha, kcal_estimadas").eq("usuario_id", userId).gte("fecha", hace14).order("fecha", { ascending: true });
  const p5 = supabase.from("historial_rutina").select("fecha_inicio, adherencia_pct").eq("usuario_id", userId).order("fecha_inicio", { ascending: false }).limit(10);
  const p6 = supabase.from("registro_comida").select("fecha, kcal").eq("usuario_id", userId).eq("completada", true).gte("fecha", hace7).lte("fecha", hoy);
  const p7 = supabase.from("registro_comida_extra").select("fecha, kcal").eq("usuario_id", userId).gte("fecha", hace7).lte("fecha", hoy);
  const p8 = supabase.from("registro_dia").select("fecha, vasos_agua").eq("usuario_id", userId).gte("fecha", hace7).lte("fecha", hoy);
  const p9 = supabase.from("dieta_semana").select("dieta_dia ( dia_semana, calorias_dia )").eq("usuario_id", userId).eq("completada", false).order("generada_en", { ascending: false }).limit(1).maybeSingle();
  const p10 = supabase.from("registro_comida").select("fecha").eq("usuario_id", userId).eq("completada", true).order("fecha", { ascending: false }).limit(60);

  const resPesos = await p1;
  const resRegDia = await p2;
  const resRegEj = await p3;
  const resRegEjExtra = await p4;
  const resAdherencia = await p5;
  const resRegComida = await p6;
  const resRegComidaExtra = await p7;
  const resRegAgua = await p8;
  const resDieta = await p9;
  const resRacha = await p10;

  let dDias = [];
  if (resDieta.data && resDieta.data.dieta_dia) {
    dDias = resDieta.data.dieta_dia;
  }

  return {
    pesos: resPesos.data ?? [],
    regDia: resRegDia.data ?? [],
    regEj: resRegEj.data ?? [],
    regEjExtra: resRegEjExtra.data ?? [],
    adherencia: resAdherencia.data ?? [],
    regComida: resRegComida.data ?? [],
    regComidaExtra: resRegComidaExtra.data ?? [],
    regAgua: resRegAgua.data ?? [],
    dietaDias: dDias,
    rachaFechas: resRacha.data ?? [],
  };
}

export function calcularDiasEntrenadosSemana(regDia: any[]) {
  const semMap: Record<string, number> = {};
  for (const r of regDia) {
    const d = new Date(r.fecha);
    const offset = (d.getDay() + 6) % 7;
    const lunes = new Date(d); 
    lunes.setDate(d.getDate() - offset);
    const key = lunes.toISOString().split("T")[0];
    
    if (!semMap[key]) {
      semMap[key] = 0;
    }
    semMap[key] = semMap[key] + 1;
  }
  
  let keys = Object.keys(semMap);
  keys.sort();
  
  let start = keys.length - 8;
  if (start < 0) start = 0;
  
  let result = [];
  for (let i = start; i < keys.length; i++) {
    result.push({ label: "S" + (result.length + 1), value: semMap[keys[i]] });
  }
  return result;
}

export function calcularKcalEjercicio14d(regEj: any[], regEjExtra: any[]) {
  const kcalMap: any = {};
  
  let todos = [];
  for (let i = 0; i < regEj.length; i++) todos.push(regEj[i]);
  for (let i = 0; i < regEjExtra.length; i++) todos.push(regEjExtra[i]);
  
  for (let i = 0; i < todos.length; i++) {
    const r = todos[i];
    if (!kcalMap[r.fecha]) kcalMap[r.fecha] = 0;
    
    let kcal = 0;
    if (r.kcal_estimadas) kcal = r.kcal_estimadas;
    
    kcalMap[r.fecha] = kcalMap[r.fecha] + kcal;
  }
  
  let result = [];
  for (let i = 0; i < 14; i++) {
    const f = localDate(-13 + i);
    let lbl = "";
    if (i % 3 === 0) {
      lbl = f.slice(5);
    }
    
    let v = 0;
    if (kcalMap[f]) v = Math.round(kcalMap[f]);
    
    result.push({ label: lbl, value: v });
  }
  return result;
}

export function calcularAdherencia(adherenciaData: any[]) {
  const arr = [...adherenciaData].reverse();
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    let val = 0;
    if (r.adherencia_pct) val = Math.round(r.adherencia_pct);
    result.push({ label: "S" + (i + 1), value: val });
  }
  return result;
}

export function calcularKcalDieta7d(regComida: any[], regComidaExtra: any[], dietaDias: any[]) {
  const objetivoPorDiaSem: any = {};
  for (let i = 0; i < dietaDias.length; i++) {
    const d = dietaDias[i];
    let cal = 2000;
    if (d.calorias_dia) cal = d.calorias_dia;
    objetivoPorDiaSem[d.dia_semana] = cal;
  }
  
  const kcalPorFecha: any = {};
  let todos = [];
  for (let i = 0; i < regComida.length; i++) todos.push(regComida[i]);
  for (let i = 0; i < regComidaExtra.length; i++) todos.push(regComidaExtra[i]);
  
  for (let i = 0; i < todos.length; i++) {
    const r = todos[i];
    if (!kcalPorFecha[r.fecha]) kcalPorFecha[r.fecha] = 0;
    
    let k = 0;
    if (r.kcal) k = r.kcal;
    
    kcalPorFecha[r.fecha] = kcalPorFecha[r.fecha] + k;
  }
  
  const result = [];
  for (let i = 0; i < 7; i++) {
    const f = localDate(-6 + i);
    const dObj = new Date(f + "T12:00:00");
    let diaSem = dObj.getDay();
    if (diaSem === 0) diaSem = 7;
    
    let cons = 0;
    if (kcalPorFecha[f]) cons = Math.round(kcalPorFecha[f]);
    
    let obj = 2000;
    if (objetivoPorDiaSem[diaSem]) obj = objetivoPorDiaSem[diaSem];
    
    result.push({ label: dayLabel(f), consumidas: cons, objetivo: obj });
  }
  return result;
}

export function calcularAgua7d(regAgua: any[]) {
  const aguaPorFecha: any = {};
  for (let i = 0; i < regAgua.length; i++) {
    const r = regAgua[i];
    let v = 0;
    if (r.vasos_agua) v = r.vasos_agua;
    aguaPorFecha[r.fecha] = v;
  }
  
  const result = [];
  for (let i = 0; i < 7; i++) {
    const f = localDate(-6 + i);
    let v = 0;
    if (aguaPorFecha[f]) v = aguaPorFecha[f];
    result.push({ label: dayLabel(f), value: v });
  }
  return result;
}

export function calcularRacha(rachaFechas: any[]) {
  const activas = new Set();
  for (let i = 0; i < rachaFechas.length; i++) {
    activas.add(rachaFechas[i].fecha);
  }
  
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const f = localDate(-i);
    if (activas.has(f)) {
      streak++;
    } else {
      if (i > 0) {
        break;
      }
    }
  }
  return streak;
}