import React from "react";
import { BibliotecaLista } from "../../components/BibliotecaLista";
import { supabase } from "../../lib/supabase";

const GRUPOS = ["Todos", "Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Abdomen", "Cardio"];

function iconoPorGrupo(grupo: string) {
  let g = "";
  if (grupo) {
    g = grupo.toLowerCase();
  }
  
  if (g.includes("pecho")) return "hand-rock";
  if (g.includes("espalda")) return "arrow-up";
  if (g.includes("piernas")) return "running";
  if (g.includes("hombros")) return "arrows-alt";
  if (g.includes("brazos")) return "hand-paper";
  if (g.includes("abdomen")) return "circle";
  if (g.includes("cardio")) return "heartbeat";
  
  return "dumbbell";
}

async function cargarEjercicios() {
  const res = await supabase
    .from("ejercicio_catalogo")
    .select("id, nombre, grupo_muscular, descripcion, imagen_url, equipamiento, dificultad")
    .order("nombre", { ascending: true });
    
  if (res.data) {
    return res.data;
  }
  return [];
}

export default function BibliotecaScreen() {
  return (
    <BibliotecaLista
      label="EJERCICIOS"
      titulo="Biblioteca"
      rutaDetalle="/ejercicio/[id]"
      placeholderBuscar="Buscar ejercicio..."
      textoVacio="No se encontraron ejercicios"
      categorias={GRUPOS}
      campoCategoria="grupo_muscular"
      textoCategoriaPorDefecto="General"
      iconoPorCategoria={iconoPorGrupo}
      cargarDatos={cargarEjercicios}
    />
  );
}