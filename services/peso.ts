import { supabase } from "../lib/supabase";
import { localDate } from "../lib/dates";

export async function registrarPesoHoy(userId: string, peso: number) {
  const fecha = localDate(0);
  
  const res1 = await supabase.from("registro_progreso").upsert(
    { usuario_id: userId, fecha: fecha, peso: peso },
    { onConflict: "usuario_id,fecha" },
  );
  
  const res2 = await supabase.from("perfil").update({ peso_actual: peso }).eq("usuario_id", userId);
  
  let errorFinal = null;
  if (res1.error) {
    errorFinal = res1.error;
  } else if (res2.error) {
    errorFinal = res2.error;
  }
  
  return { error: errorFinal };
}