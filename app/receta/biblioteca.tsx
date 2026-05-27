import React from "react";
import { BibliotecaLista } from "../../components/BibliotecaLista";
import { supabase } from "../../lib/supabase";

const CATEGORIAS = ["Todas", "Desayuno", "Almuerzo", "Cena", "Snack"];

function iconoPorCategoria(categoria: string) {
  let c = "";
  if (categoria) {
    c = categoria.toLowerCase();
  }
  
  if (c.includes("desayuno")) return "coffee";
  if (c.includes("almuerzo")) return "utensils";
  if (c.includes("cena")) return "moon";
  if (c.includes("snack")) return "cookie";
  
  return "utensils";
}

async function cargarRecetas() {
  const res = await supabase
    .from("receta_catalogo")
    .select("id, nombre, tipo_comida, descripcion, imagen_url, kcal, proteinas_g, carbos_g, grasas_g")
    .order("nombre", { ascending: true });
    
  if (res.data) {
    return res.data;
  }
  return [];
}

export default function BibliotecaRecetasScreen() {
  return (
    <BibliotecaLista
      label="RECETAS"
      titulo="Biblioteca"
      rutaDetalle="/receta/[id]"
      placeholderBuscar="Buscar receta..."
      textoVacio="No se encontraron recetas"
      categorias={CATEGORIAS}
      campoCategoria="tipo_comida"
      textoCategoriaPorDefecto="Desconocido"
      iconoPorCategoria={iconoPorCategoria}
      cargarDatos={cargarRecetas}
    />
  );
}