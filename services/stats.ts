import { supabase } from "../lib/supabase";
import { localDate } from "../lib/dates";

const DIAS_L = ["L", "M", "X", "J", "V", "S", "D"];
function dayLabel(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  const num = d.getDay();
  return DIAS_L[num === 0 ? 6 : num - 1];
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

  const dDias = resDieta.data?.dieta_dia ?? [];

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
    
    semMap[key] = (semMap[key] ?? 0) + 1;
  }
  
  const keys = Object.keys(semMap).sort();
  const start = Math.max(0, keys.length - 8);
  
  const result = [];
  for (let i = start; i < keys.length; i++) {
    result.push({ label: `S${result.length + 1}`, value: semMap[keys[i]] });
  }
  return result;
}

export function calcularKcalEjercicio14d(regEj: any[], regEjExtra: any[]) {
  const kcalMap: Record<string, number> = {};
  const todos = [...regEj, ...regEjExtra];
  
  for (const r of todos) {
    kcalMap[r.fecha] = (kcalMap[r.fecha] ?? 0) + (r.kcal_estimadas ?? 0);
  }
  
  const result = [];
  for (let i = 0; i < 14; i++) {
    const f = localDate(-13 + i);
    const lbl = i % 3 === 0 ? f.slice(5) : "";
    const v = kcalMap[f] ? Math.round(kcalMap[f]) : 0;
    result.push({ label: lbl, value: v });
  }
  return result;
}

export function calcularAdherencia(adherenciaData: any[]) {
  return [...adherenciaData].reverse().map((r, i) => ({
    label: `S${i + 1}`,
    value: r.adherencia_pct ? Math.round(r.adherencia_pct) : 0,
  }));
}

export function calcularKcalDieta7d(regComida: any[], regComidaExtra: any[], dietaDias: any[]) {
  const objetivoPorDiaSem: Record<number, number> = {};
  for (const d of dietaDias) {
    objetivoPorDiaSem[d.dia_semana] = d.calorias_dia ?? 2000;
  }
  
  const kcalPorFecha: Record<string, number> = {};
  const todos = [...regComida, ...regComidaExtra];
  for (const r of todos) {
    kcalPorFecha[r.fecha] = (kcalPorFecha[r.fecha] ?? 0) + (r.kcal ?? 0);
  }
  
  const result = [];
  for (let i = 0; i < 7; i++) {
    const f = localDate(-6 + i);
    const dObj = new Date(`${f}T12:00:00`);
    const diaSem = dObj.getDay() === 0 ? 7 : dObj.getDay();
    
    const cons = kcalPorFecha[f] ? Math.round(kcalPorFecha[f]) : 0;
    const obj = objetivoPorDiaSem[diaSem] ?? 2000;
    
    result.push({ label: dayLabel(f), consumidas: cons, objetivo: obj });
  }
  return result;
}

export function calcularAgua7d(regAgua: any[]) {
  const aguaPorFecha: Record<string, number> = {};
  for (const r of regAgua) {
    aguaPorFecha[r.fecha] = r.vasos_agua ?? 0;
  }
  
  const result = [];
  for (let i = 0; i < 7; i++) {
    const f = localDate(-6 + i);
    result.push({ label: dayLabel(f), value: aguaPorFecha[f] ?? 0 });
  }
  return result;
}

export function calcularRacha(rachaFechas: any[]) {
  const activas = new Set(rachaFechas.map(r => r.fecha));
  
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