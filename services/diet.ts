import { supabase } from '../lib/supabase';

export async function cargarDieta(userId: string, fechaHoy: string) {
  const resDieta = await supabase
    .from("dieta_semana")
    .select(`id, dieta_dia ( id, dia_semana, calorias_dia, dieta_comida ( id, tipo_comida, receta_catalogo:id_receta ( id, nombre, kcal, proteinas_g, carbos_g, grasas_g ) ) )`)
    .eq("usuario_id", userId)
    .eq("completada", false)
    .order("generada_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  const resReg = await supabase.from("registro_comida").select("*").eq("usuario_id", userId).eq("fecha", fechaHoy);
  const resExtra = await supabase.from("registro_comida_extra").select("*").eq("usuario_id", userId).eq("fecha", fechaHoy);
  const resAgua = await supabase.from("registro_dia").select("vasos_agua").eq("usuario_id", userId).eq("fecha", fechaHoy).maybeSingle();

  let dias = [];
  if (resDieta.data && resDieta.data.dieta_dia) dias = resDieta.data.dieta_dia;

  let registros = [];
  if (resReg.data) registros = resReg.data;

  let extras = [];
  if (resExtra.data) extras = resExtra.data;

  let agua = 0;
  if (resAgua.data && resAgua.data.vasos_agua) agua = resAgua.data.vasos_agua;

  return {
    diasSemana: dias,
    registros: registros,
    extras: extras,
    vasosAgua: agua,
  };
}

export async function cargarAguaDia(userId: string, fecha: string) {
  const { data } = await supabase
    .from("registro_dia")
    .select("vasos_agua")
    .eq("usuario_id", userId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (data && data.vasos_agua) {
    return data.vasos_agua;
  }
  return 0;
}

export async function marcarComida(
  userId: string,
  comida: any,
  accion: "completada" | "saltada",
  fechaHoy: string
) {
  let isComp = false;
  if (accion === "completada") isComp = true;

  let isSalt = false;
  if (accion === "saltada") isSalt = true;

  let kcal = null;
  if (isComp) {
    if (comida.receta_catalogo && comida.receta_catalogo.kcal) {
      kcal = comida.receta_catalogo.kcal;
    } else {
      kcal = 0;
    }
  }

  const { data, error } = await supabase
    .from("registro_comida")
    .upsert(
      {
        usuario_id: userId,
        fecha: fechaHoy,
        id_dieta_comida: comida.id,
        tipo_comida: comida.tipo_comida,
        completada: isComp,
        saltada: isSalt,
        kcal: kcal,
      },
      { onConflict: "usuario_id,id_dieta_comida,fecha" }
    )
    .select();
  return { data, error };
}

export async function deshacerComida(userId: string, comidaId: string, fechaHoy: string) {
  const { error } = await supabase
    .from("registro_comida")
    .delete()
    .eq("usuario_id", userId)
    .eq("id_dieta_comida", comidaId)
    .eq("fecha", fechaHoy);
  return { error };
}

export async function eliminarExtra(id: string) {
  const { error } = await supabase.from("registro_comida_extra").delete().eq("id", id);
  return { error };
}

export async function guardarAgua(userId: string, fechaHoy: string, vasos: number) {
  const { error } = await supabase
    .from("registro_dia")
    .upsert({ usuario_id: userId, fecha: fechaHoy, vasos_agua: vasos }, { onConflict: "usuario_id,fecha" });
  return { error };
}

export function sumarMacros(comidas: any[], registros: Record<string, any>, extras: any[]) {
  let kcal = 0;
  let prot = 0;
  let carb = 0;
  let grasa = 0;

  for (let i = 0; i < comidas.length; i++) {
    const c = comidas[i];
    const reg = registros[c.id];
    const r = c.receta_catalogo;
    if (reg && reg.completada && r) {
      if (r.kcal) kcal = kcal + r.kcal;
      if (r.proteinas_g) prot = prot + Number(r.proteinas_g);
      if (r.carbos_g) carb = carb + Number(r.carbos_g);
      if (r.grasas_g) grasa = grasa + Number(r.grasas_g);
    }
  }

  for (let i = 0; i < extras.length; i++) {
    const e = extras[i];
    if (e.kcal) kcal = kcal + e.kcal;
    if (e.proteinas_g) prot = prot + Number(e.proteinas_g);
    if (e.carbos_g) carb = carb + Number(e.carbos_g);
    if (e.grasas_g) grasa = grasa + Number(e.grasas_g);
  }

  return { kcal, prot, carb, grasa };
}