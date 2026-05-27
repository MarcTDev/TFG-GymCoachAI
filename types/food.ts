export type TipoComida = "desayuno" | "almuerzo" | "cena" | "snack";

export type RecetaIA = {
  nombre: string;
  tiempo: string;
  kcal: number;
  proteinas: number;
  carbos: number;
  grasas: number;
  ingredientes: string[];
  pasos: string[];
  tags: string[];
};

