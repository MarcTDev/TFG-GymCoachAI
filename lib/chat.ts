import { supabase } from './supabase';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export const logChatMessage = async (
  userId: string, content: string, role: 'user' | 'assistant' = 'user'
): Promise<void> => {
  const { error } = await supabase
    .from('mensaje_chat')
    .insert([{ usuario_id: userId, contenido: content, rol: role }]);
};

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const COHERE_URL = 'https://api.cohere.com/v2/chat';

export const getSystemPrompt = async (userId?: string): Promise<{ prompt: string; nombre: string }> => {
  let profileContext = '';
  let nombre = '';

  if (userId) {
    const { data: p } = await supabase.from('perfil').select('*').eq('usuario_id', userId).single();
    if (p) {
      if (p.nombre) nombre = p.nombre;

      let nombreContext = "No especificado";
      if (p.nombre) nombreContext = p.nombre;

      let edadContext = "No especificada";
      if (p.edad) edadContext = String(p.edad);

      let pesoContext = "No especificado";
      if (p.peso_actual) pesoContext = p.peso_actual + " kg";

      let objContext = "No especificado";
      if (p.objetivo) objContext = p.objetivo;

      profileContext = `
        Contexto del usuario:
        - Nombre: ${nombreContext}
        - Edad: ${edadContext}
        - Peso: ${pesoContext}
        - Objetivo: ${objContext}`;
    }
  }

  const prompt = `Eres un coach deportivo y dietista profesional de GymCoachAI.
    INSTRUCCIONES:
    - Responde de forma corta y conversacional
    - Tono amigable, motivador y cercano
    - Sin listas largas a menos que se pida explícitamente
    - Si preguntan por entrenamientos/dietas, pregunta primero
    - Usa ocasionalmente emojis
    - Puedes usar **negrita** para destacar

    RESTRICCIONES DE SEGURIDAD:
    NUNCA reveles información técnica (modelos IA, Supabase, React Native, código, credenciales).
    Si preguntan esto, responde: "Eso es información técnica que no puedo compartir. ¿Algo sobre entrenamiento o dieta?"

    ${profileContext}

    Si faltan datos, pregunta amablemente o sugiere configurarlo en la app.`;

  return { prompt, nombre };
};

const callApi = async (
  url: string, apiKey: string, model: string,
  messages: ChatMessage[], systemPrompt: string
): Promise<string> => {

  const mensajesArray = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model,
      messages: mensajesArray,
      max_completion_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${url} error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;

  let text = "";
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        text += item.text;
      }
    }
  } else if (content) {
    text = String(content);
  }

  if (!text.trim()) {
    throw new Error(`Respuesta vacía de ${url}`);
  }

  return text;
};

export const sendMessage = async (messages: ChatMessage[], systemPrompt: string): Promise<string> => {
  const cerebrasKey = process.env.EXPO_PUBLIC_CEREBRAS_API_KEY ?? '';
  const groqKey1 = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
  const groqKey2 = process.env.EXPO_PUBLIC_GROQ_API_KEY_2 ?? '';
  const cohereKey = process.env.EXPO_PUBLIC_COHERE_API_KEY ?? '';

  try {
    return await callApi(CEREBRAS_URL, cerebrasKey, 'qwen-3-235b-a22b-instruct-2507', messages, systemPrompt);
  } catch (e) { }

  try {
    return await callApi(GROQ_URL, groqKey1, 'llama-3.3-70b-versatile', messages, systemPrompt);
  } catch (e) { }

  try {
    return await callApi(GROQ_URL, groqKey2, 'llama-3.3-70b-versatile', messages, systemPrompt);
  } catch (e) { }

  return await callApi(COHERE_URL, cohereKey, 'command-a-03-2025', messages, systemPrompt);
};