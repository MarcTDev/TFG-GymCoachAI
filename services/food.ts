import { supabase } from "../lib/supabase";

export async function buscarRecetas(texto: string) {
  const q = supabase.from("receta_catalogo").select("*");
  if (texto.trim() !== "") {
    const res = await q.ilike("nombre", `%${texto}%`).limit(20);
    if (res.data) return res.data;
  } else {
    const res = await q.order("nombre", { ascending: true }).limit(50);
    if (res.data) return res.data;
  }
  return [];
}

export async function guardarComidaExtra(
  userId: string,
  fecha: string,
  tipoComida: string,
  datos: {
    nombre: string;
    kcal: number;
    proteinas_g: number;
    carbos_g: number;
    grasas_g: number;
    id_receta?: string;
    via_escaner?: boolean;
  }
) {
  let escaner = false;
  if (datos.via_escaner === true) escaner = true;

  let datosExtra = { ...datos };
  delete datosExtra.via_escaner;

  const { error } = await supabase.from("registro_comida_extra").insert({
    usuario_id: userId,
    fecha: fecha,
    tipo_comida: tipoComida,
    via_escaner: escaner,
    ...datosExtra,
  });
  return { error };
}

export async function sustituirComida(
  userId: string,
  fecha: string,
  idDietaComida: string,
  tipoComida: string
) {
  await supabase.from("registro_comida").delete()
    .eq("usuario_id", userId).eq("id_dieta_comida", idDietaComida).eq("fecha", fecha);

  const { error } = await supabase.from("registro_comida").insert({
    usuario_id: userId,
    fecha: fecha,
    id_dieta_comida: idDietaComida,
    tipo_comida: tipoComida,
    completada: false,
    saltada: true,
  });
  return { error };
}