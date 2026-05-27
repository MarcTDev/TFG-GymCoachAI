export type MacrosResult = {
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
};

export type FridgeResult = {
  ingredients: string[];
  confidence: number[];
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const COHERE_URL = 'https://api.cohere.com/v2/chat';

const PROMPT_FOOD = 'Analiza esta imagen de comida. Devuelve ÚNICAMENTE JSON sin markdown:\n{"nombre":string,"kcal":number,"proteinas_g":number,"carbos_g":number,"grasas_g":number}';
const PROMPT_FRIDGE = 'Analiza esta imagen e identifica todos los ingredientes o alimentos visibles. Devuelve ÚNICAMENTE JSON sin markdown:\n{"ingredients":["ingrediente1","ingrediente2"],"confidence":[0.9,0.8]}';

const uriToBase64 = async (uri: string): Promise<string> => {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultString = reader.result as string;
      const partes = resultString.split(',');
      resolve(partes[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const limpiarJSON = (texto: string) => {
  let limpio = texto;
  limpio = limpio.replace(/```json/g, '');
  limpio = limpio.replace(/```/g, '');
  return limpio.trim();
};

const llamarGemini = async (base64: string, prompt: string): Promise<string> => {
  let key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) key = '';
  
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }] }],
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}`);
  }
  
  const json = await res.json();
  if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) {
    return json.candidates[0].content.parts[0].text ?? '';
  }
  return '';
};

const llamarGroq = async (base64: string, prompt: string): Promise<string> => {
  let key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!key) key = '';

  let contentArray = [];
  contentArray.push({ type: 'text', text: prompt });
  contentArray.push({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + base64 } });

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{ role: 'user', content: contentArray }],
      max_tokens: 512,
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Groq error ${res.status}`);
  }
  
  const json = await res.json();
  if (json.choices && json.choices[0] && json.choices[0].message) {
    return json.choices[0].message.content ?? '';
  }
  return '';
};

const llamarCohere = async (base64: string, prompt: string): Promise<string> => {
  let key = process.env.EXPO_PUBLIC_COHERE_API_KEY;
  if (!key) key = '';

  let contentArray = [];
  contentArray.push({ type: 'text', text: prompt });
  contentArray.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } });

  const res = await fetch(COHERE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'command-a-03-2025',
      messages: [{ role: 'user', content: contentArray }],
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Cohere error ${res.status}`);
  }
  
  const json = await res.json();
  if (json.message && json.message.content && json.message.content[0]) {
    return json.message.content[0].text ?? '';
  }
  return '';
};

const analizarConFallback = async (base64: string, prompt: string): Promise<string> => {
  try { 
    return await llamarGemini(base64, prompt); 
  } catch (e) {}
  
  try { 
    return await llamarGroq(base64, prompt); 
  } catch (e) {}
  
  try { 
    return await llamarCohere(base64, prompt); 
  } catch (e) {}
  
  throw new Error('Todos los proveedores de IA fallaron');
};

export const analyzeFood = async (imageUri: string): Promise<MacrosResult> => {
  const base64 = await uriToBase64(imageUri);
  const texto = await analizarConFallback(base64, PROMPT_FOOD);
  const r = JSON.parse(limpiarJSON(texto));
  
  return {
    nombre: r.nombre ?? 'Plato desconocido',
    calorias: r.kcal ?? 0,
    proteinas: r.proteinas_g ?? 0,
    carbohidratos: r.carbos_g ?? 0,
    grasas: r.grasas_g ?? 0
  };
};

export const analyzeFridge = async (imageUri: string): Promise<FridgeResult> => {
  const base64 = await uriToBase64(imageUri);
  const texto = await analizarConFallback(base64, PROMPT_FRIDGE);
  const r = JSON.parse(limpiarJSON(texto));
  
  let ing = [];
  if (Array.isArray(r.ingredients)) ing = r.ingredients;
  
  let conf = [];
  if (Array.isArray(r.confidence)) conf = r.confidence;

  return { ingredients: ing, confidence: conf };
};

export const generarRecetaIA = async (perfil: any, ingredientes: string[], userId?: string): Promise<any> => {
  const chatLib = await import('./chat');
  const sendMessage = chatLib.sendMessage;
  const getSystemPrompt = chatLib.getSystemPrompt;

  let nombre = "Usuario";
  if (perfil && perfil.nombre) nombre = perfil.nombre;
  
  let objetivo = "mantener peso";
  if (perfil && perfil.objetivo) objetivo = perfil.objetivo;
  
  let datosUsuario = "Soy " + nombre + ", mi objetivo es " + objetivo;
  
  if (perfil?.peso_actual) {
    datosUsuario += `, peso ${perfil.peso_actual}kg`;
  }
  if (perfil?.info_adicional) {
    datosUsuario += `, ${perfil.info_adicional}`;
  }

  const ingredientesStr = ingredientes.join(", ");

  const peticion = datosUsuario + ". Tengo estos ingredientes: " + ingredientesStr + ". Genera una receta saludable. Devuelve ÚNICAMENTE JSON sin markdown: {\"nombre\":\"\",\"tiempo\":\"\",\"kcal\":0,\"proteinas\":0,\"carbos\":0,\"grasas\":0,\"ingredientes\":[\"\"],\"pasos\":[\"\"]}";

  const sys = await getSystemPrompt(userId);
  const promptTxt = sys.prompt + "\n\nDevuelve ÚNICAMENTE JSON válido sin texto adicional ni markdown.";
  
  const respuesta = await sendMessage([{ role: "user", content: peticion }], promptTxt);
  return JSON.parse(limpiarJSON(respuesta));
};