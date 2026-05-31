import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CEREBRAS_URL  = 'https://api.cerebras.ai/v1/chat/completions'
const CEREBRAS_MODEL = 'qwen-3-235b-a22b-instruct-2507'
const GROQ_URL      = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL    = 'llama-3.3-70b-versatile'
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const COHERE_URL    = 'https://api.cohere.com/v2/chat'
const COHERE_MODEL  = 'command-a-03-2025'

interface Perfil {
  usuario_id: string
  nombre: string
  edad: number
  peso_actual: number
  altura: number
  objetivo: string
  nivel_actividad: string
  info_adicional: string
}

// ===== CONEXIÓN A LAS APIS DE INTELIGENCIA ARTIFICIAL =====

// Envía petición a Gemini (Google)
async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const urlCompleta = `${GEMINI_URL}?key=${apiKey}`
  
  const response = await fetch(urlCompleta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
    }),
  })

  if (response.ok === false) {
    const errorTexto = await response.text()
    throw new Error(`Gemini error ${response.status}: ${errorTexto}`)
  }

  const data = await response.json()
  const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  
  if (textoRespuesta.trim() === '') {
    throw new Error('Respuesta vacía de Gemini')
  }

  return textoRespuesta
}

// Envía petición a APIs compatibles con OpenAI (Groq y Cerebras)
async function callOpenAICompatible(url: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 4096,
    }),
  })

  if (response.ok === false) {
    const errorTexto = await response.text()
    throw new Error(`${url} error ${response.status}: ${errorTexto}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  const textoRespuesta = String(content ?? '').trim()

  if (textoRespuesta === '') {
    throw new Error(`Respuesta vacía de ${url}`)
  }

  return textoRespuesta
}

// Envía petición a Cohere
async function callCohere(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(COHERE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: COHERE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (response.ok === false) {
    const errorTexto = await response.text()
    throw new Error(`Cohere error ${response.status}: ${errorTexto}`)
  }

  const data = await response.json()
  const textoRespuesta = data.message?.content?.[0]?.text ?? ''

  if (textoRespuesta.trim() === '') {
    throw new Error('Respuesta vacía de Cohere')
  }

  return textoRespuesta
}

// ===== ORQUESTADOR DE INTELIGENCIA ARTIFICIAL EN CASCADA =====

// Llama en cadena a los proveedores de IA, probando una sola vez cada clave disponible
async function generarConIA(systemPrompt: string, userPrompt: string): Promise<string> {
  // Lista de todos los proveedores e intentos posibles en orden
  const proveedores = [
    { nombre: 'Groq Clave 1', tipo: 'openai', url: GROQ_URL, model: GROQ_MODEL, key: Deno.env.get('GROQ_API_KEY_1') },
    { nombre: 'Groq Clave 2', tipo: 'openai', url: GROQ_URL, model: GROQ_MODEL, key: Deno.env.get('GROQ_API_KEY_2') },
    { nombre: 'Groq Clave 3', tipo: 'openai', url: GROQ_URL, model: GROQ_MODEL, key: Deno.env.get('GROQ_API_KEY_3') },
    { nombre: 'Groq Clave 4', tipo: 'openai', url: GROQ_URL, model: GROQ_MODEL, key: Deno.env.get('GROQ_API_KEY_4') },
    
    { nombre: 'Gemini Clave 1', tipo: 'gemini', key: Deno.env.get('GEMINI_API_KEY_1') },
    { nombre: 'Gemini Clave 2', tipo: 'gemini', key: Deno.env.get('GEMINI_API_KEY_2') },
    { nombre: 'Gemini Clave 3', tipo: 'gemini', key: Deno.env.get('GEMINI_API_KEY_3') },
    
    { nombre: 'Cohere', tipo: 'cohere', key: Deno.env.get('COHERE_API_KEY') },
    
    { nombre: 'Cerebras', tipo: 'openai', url: CEREBRAS_URL, model: CEREBRAS_MODEL, key: Deno.env.get('CEREBRAS_API_KEY') }
  ]

  // Recorremos la lista uno por uno. El primero que responda con éxito devuelve el texto
  for (const prov of proveedores) {
    if (!prov.key) {
      continue // Si no está configurada la clave, saltamos al siguiente
    }

    try {
      console.log(`Probando con ${prov.nombre}...`)
      
      if (prov.tipo === 'openai') {
        const respuesta = await callOpenAICompatible(prov.url!, prov.key, prov.model!, systemPrompt, userPrompt)
        console.log(`${prov.nombre} exitoso`)
        return respuesta
      }
      
      if (prov.tipo === 'gemini') {
        const respuesta = await callGemini(prov.key, systemPrompt, userPrompt)
        console.log(`${prov.nombre} exitoso`)
        return respuesta
      }
      
      if (prov.tipo === 'cohere') {
        const respuesta = await callCohere(prov.key, systemPrompt, userPrompt)
        console.log(`${prov.nombre} exitoso`)
        return respuesta
      }
    } catch (error: any) {
      console.log(`${prov.nombre} falló:`, error.message)
    }
  }

  throw new Error("Todos los proveedores e intentos de IA fallaron al generar el plan")
}

// ===== PARSEO DE RESPUESTAS JSON =====

// Limpia y extrae el objeto JSON de la respuesta de la IA
function parsearJSON(respuesta: string): any {
  const cleaned = respuesta.replace(/```json/g, '').replace(/```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Respuesta de la IA no contiene un JSON válido')
  }

  const jsonRecortado = cleaned.slice(firstBrace, lastBrace + 1)
  return JSON.parse(jsonRecortado)
}

// ===== CONTROL DE FECHAS =====

// Calcula las fechas de inicio (lunes) y fin (domingo) para la semana actual
function getFechasSemana(): { inicio: string; fin: string } {
  const hoy = new Date()
  const diaSemana = hoy.getDay()
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana
  
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + diffLunes)
  
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  
  const inicio = lunes.toISOString().split('T')[0]
  const fin = domingo.toISOString().split('T')[0]
  
  return { inicio, fin }
}

// Convierte dia_semana a número si la IA devolvió una cadena como "Lunes"
function normalizarDiaSemana(dia: any): number {
  if (typeof dia === 'number') {
    return dia
  }
  
  const diasMap: Record<string, number> = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 7,
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7
  }
  
  const normalized = String(dia ?? '').toLowerCase().trim()
  return diasMap[normalized] ?? 1 // Valor predeterminado en caso de no coincidir
}

// Obtiene los días de la semana específicos que el usuario quiere entrenar a partir de info_adicional
function obtenerDiasEntrenamiento(infoAdicional: string): string[] {
  const match = infoAdicional.match(/Días:\s*([^.]+)/i)
  if (!match) return []
  return match[1].split(',').map(d => d.trim()).filter(Boolean)
}

// ===== ARCHIVAR DATOS EN EL HISTORIAL =====

// Mueve los planes de la semana pasada al historial y borra sus registros locales
async function archivarSemanaAnterior(supabase: any, usuarioId: string): Promise<void> {
  const { inicio } = getFechasSemana()

  // 1. Archivar la Rutina antigua
  const { data: rutinaPasada } = await supabase
    .from('rutina_semana')
    .select('*')
    .eq('usuario_id', usuarioId)
    .lt('fecha_fin', inicio)
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rutinaPasada) {
    const { data: existeHistorial } = await supabase
      .from('historial_rutina')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('fecha_inicio', rutinaPasada.fecha_inicio)
      .maybeSingle()

    if (!existeHistorial) {
      const { data: dias } = await supabase
        .from('rutina_dia')
        .select('descripcion')
        .eq('id_rutina_semana', rutinaPasada.id)
        .eq('es_descanso', false)

      const grupos = dias ? dias.map((d: any) => d.descripcion).filter(Boolean).join(', ') : "";

      const { data: statsEj } = await supabase
        .from('registro_ejercicio')
        .select('completado')
        .eq('usuario_id', usuarioId)
        .gte('fecha', rutinaPasada.fecha_inicio)
        .lte('fecha', rutinaPasada.fecha_fin)

      const totalEj = statsEj?.length ?? 0
      const completadosEj = statsEj?.filter((e: any) => e.completado).length ?? 0
      const adherenciaEj = totalEj > 0 ? Math.round((completadosEj / totalEj) * 100) : 0;

      const { data: extrasEj } = await supabase
        .from('registro_ejercicio_extra')
        .select('nombre')
        .eq('usuario_id', usuarioId)
        .gte('fecha', rutinaPasada.fecha_inicio)
        .lte('fecha', rutinaPasada.fecha_fin)

      const { data: diasValoracionEj } = await supabase
        .from('registro_dia')
        .select('valoracion_entreno')
        .eq('usuario_id', usuarioId)
        .gte('fecha', rutinaPasada.fecha_inicio)
        .lte('fecha', rutinaPasada.fecha_fin)
        .not('valoracion_entreno', 'is', null)

      const valoracionMediaEj = (diasValoracionEj && diasValoracionEj.length > 0)
        ? Math.round(diasValoracionEj.reduce((acc: number, d: any) => acc + d.valoracion_entreno, 0) / diasValoracionEj.length)
        : null;

      const feedbackExtrasEj = (extrasEj && extrasEj.length > 0)
        ? `Ejercicios extra: ${extrasEj.map((e: any) => e.nombre).filter(Boolean).join(', ')}`
        : null;

      await supabase.from('historial_rutina').insert({
        usuario_id: usuarioId,
        fecha_inicio: rutinaPasada.fecha_inicio,
        fecha_fin: rutinaPasada.fecha_fin,
        descripcion: rutinaPasada.descripcion,
        nivel_actividad: rutinaPasada.nivel_actividad,
        grupos_trabajados: grupos,
        completada: adherenciaEj >= 80,
        adherencia_pct: adherenciaEj,
        valoracion: valoracionMediaEj ?? rutinaPasada.valoracion ?? null,
        feedback: [rutinaPasada.feedback, feedbackExtrasEj].filter(Boolean).join('. ') || null,
      })

      await supabase.from('rutina_semana').delete().eq('id', rutinaPasada.id)

      await supabase.from('registro_ejercicio')
        .delete().eq('usuario_id', usuarioId)
        .gte('fecha', rutinaPasada.fecha_inicio)
        .lte('fecha', rutinaPasada.fecha_fin)
      await supabase.from('registro_ejercicio_extra')
        .delete().eq('usuario_id', usuarioId)
        .gte('fecha', rutinaPasada.fecha_inicio)
        .lte('fecha', rutinaPasada.fecha_fin)

      console.log(`Rutina archivada. Adherencia: ${adherenciaEj}%`)
    }
  }

  // 2. Archivar la Dieta antigua
  const { data: dietaPasada } = await supabase
    .from('dieta_semana')
    .select('*')
    .eq('usuario_id', usuarioId)
    .lt('fecha_fin', inicio)
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (dietaPasada) {
    const { data: existeHistorialDieta } = await supabase
      .from('historial_dieta')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('fecha_inicio', dietaPasada.fecha_inicio)
      .maybeSingle()

    if (!existeHistorialDieta) {
      const { data: statsComida } = await supabase
        .from('registro_comida')
        .select('completada')
        .eq('usuario_id', usuarioId)
        .gte('fecha', dietaPasada.fecha_inicio)
        .lte('fecha', dietaPasada.fecha_fin)

      const totalComidas = statsComida?.length ?? 0
      const completadasComidas = statsComida?.filter((c: any) => c.completada).length ?? 0
      const adherenciaDieta = totalComidas > 0 ? Math.round((completadasComidas / totalComidas) * 100) : 0;

      const { data: extrasComida } = await supabase
        .from('registro_comida_extra')
        .select('kcal')
        .eq('usuario_id', usuarioId)
        .gte('fecha', dietaPasada.fecha_inicio)
        .lte('fecha', dietaPasada.fecha_fin)

      const kcalExtras = extrasComida?.reduce((acc: number, c: any) => acc + (c.kcal ?? 0), 0) ?? 0;

      const { data: diasValoracionDieta } = await supabase
        .from('registro_dia')
        .select('valoracion_dieta')
        .eq('usuario_id', usuarioId)
        .gte('fecha', dietaPasada.fecha_inicio)
        .lte('fecha', dietaPasada.fecha_fin)
        .not('valoracion_dieta', 'is', null)

      const valoracionMediaDieta = (diasValoracionDieta && diasValoracionDieta.length > 0)
        ? Math.round(diasValoracionDieta.reduce((acc: number, d: any) => acc + d.valoracion_dieta, 0) / diasValoracionDieta.length)
        : null;

      const feedbackExtrasComida = kcalExtras > 0 ? `Kcal extra semana: ${kcalExtras}` : null;

      await supabase.from('historial_dieta').insert({
        usuario_id: usuarioId,
        fecha_inicio: dietaPasada.fecha_inicio,
        fecha_fin: dietaPasada.fecha_fin,
        calorias_objetivo: dietaPasada.calorias_dia,
        descripcion: dietaPasada.descripcion,
        completada: adherenciaDieta >= 80,
        adherencia_pct: adherenciaDieta,
        valoracion: valoracionMediaDieta ?? dietaPasada.valoracion ?? null,
        feedback: [dietaPasada.feedback, feedbackExtrasComida].filter(Boolean).join('. ') || null,
      })

      await supabase.from('dieta_semana').delete().eq('id', dietaPasada.id)

      await supabase.from('registro_comida')
        .delete().eq('usuario_id', usuarioId)
        .gte('fecha', dietaPasada.fecha_inicio)
        .lte('fecha', dietaPasada.fecha_fin)
      await supabase.from('registro_comida_extra')
        .delete().eq('usuario_id', usuarioId)
        .gte('fecha', dietaPasada.fecha_inicio)
        .lte('fecha', dietaPasada.fecha_fin)

      console.log(`Dieta archivada. Adherencia: ${adherenciaDieta}%`)
    }
  }

  // 3. Limpiar registros diarios antiguos
  await supabase.from('registro_dia')
    .delete()
    .eq('usuario_id', usuarioId)
    .lt('fecha', inicio)

  console.log('Registro diario de la semana anterior eliminado')
}

// ===== GENERACIÓN DE LA RUTINA =====

// Genera la rutina de entrenamiento adaptada al perfil e historial
async function generarRutina(
  supabase: any,
  perfil: Perfil,
  historialRutinas: any[],
  ejercicios: any[],
  fechas: { inicio: string; fin: string },
  feedback?: string,
): Promise<string> {

  const ejerciciosTexto = ejercicios
    .map(e => `${e.id}|${e.nombre}|${e.grupo_muscular}|${e.dificultad}`)
    .join('\n')

  const historialTexto = historialRutinas.length > 0
    ? historialRutinas.map(h =>
        `${h.fecha_inicio}: grupos=${h.grupos_trabajados} adherencia=${h.adherencia_pct}% val=${h.valoracion} feedback=${h.feedback || 'ninguno'}`
      ).join('\n')
    : 'Primera semana del usuario'

  const diasSeleccionados = obtenerDiasEntrenamiento(perfil.info_adicional || '')
  let diasInstruccion = ''
  if (diasSeleccionados.length > 0) {
    diasInstruccion = `El usuario ha seleccionado entrenar EXACTAMENTE los siguientes días de la semana: ${diasSeleccionados.join(', ')}.
Por lo tanto, en el JSON que generes:
- Los días que correspondan a estos días (${diasSeleccionados.join(', ')}) DEBEN tener "es_descanso": false y contener una sesión de entrenamiento activa con ejercicios.
- Los demás días de la semana DEBEN tener "es_descanso": true y "ejercicios": [].`
  } else {
    diasInstruccion = `El usuario no ha especificado días concretos de entrenamiento. Genera un plan equilibrado de 4 o 5 días de entrenamiento (por ejemplo Lunes, Martes, Jueves, Viernes) y 2 o 3 días de descanso (Miércoles, Sábado, Domingo) con ejercicios=[].`
  }

  const systemPrompt = `Eres un generador de rutinas de entrenamiento personalizadas y profesionales.
Devuelve ÚNICAMENTE JSON válido sin texto adicional ni markdown.
El campo "dia_semana" DEBE ser obligatoriamente un número entero del 1 al 7 (donde 1 es Lunes, 2 es Martes, ..., 7 es Domingo). NUNCA devuelvas una cadena como "Lunes" o "Martes".
Sé muy conciso en textos de descripción, máximo 6 palabras por campo.`

  const userPrompt = `
PERFIL DEL USUARIO:
- Nombre: ${perfil.nombre}
- Edad: ${perfil.edad} años
- Peso actual: ${perfil.peso_actual} kg
- Objetivo principal: ${perfil.objetivo}
- Nivel de actividad física: ${perfil.nivel_actividad}

INFORMACIÓN ADICIONAL / PREFERENCIAS (Equipamiento, días, duración, limitaciones físicas):
${perfil.info_adicional || 'Ninguna especificada'}

${feedback ? `FEEDBACK PERSONALIZADO DEL USUARIO: ${feedback}` : ''}

HISTORIAL DE ENTRENAMIENTOS ANTERIORES:
${historialTexto}

INSTRUCCIONES DE INTENSIDAD Y OBJETIVO:
- El plan debe ser INTENSO, exigente y efectivo, adaptado para dar el máximo rendimiento según el nivel de actividad del usuario ("${perfil.nivel_actividad}").
- Si el objetivo principal es "ganar masa muscular" (hipertrofia): Prioriza ejercicios con pesos libres (mancuernas, barra), series de 3 a 4 y rangos de repeticiones de 8 a 12 buscando la cercanía al fallo muscular. Descansos de 90s.
- Si el objetivo es "perder peso", "definicion" o "tonificar": Aumenta la intensidad metabólica, incorporando repeticiones más altas (12 a 15), descansos de 60s, circuitos exigentes o ejercicios compuestos de alto gasto calórico.
- Respeta estrictamente cualquier limitación física descrita en la información adicional (por ejemplo, si el usuario tiene dolor de rodilla, evita sentadillas pesadas o impactos directos, proponiendo alternativas seguras).

DÍAS DE ENTRENAMIENTO EXIGIDOS:
${diasInstruccion}

EJERCICIOS DISPONIBLES (Usa SOLO los IDs del listado para "id_ejercicio" en las sesiones):
${ejerciciosTexto}

Genera el plan de 7 días exactos.

JSON exacto:
{
  "descripcion": "texto breve",
  "nivel_actividad": "intermedio",
  "dias": [
    {
      "dia_semana": 1,
      "es_descanso": false,
      "nombre_sesion": "Pecho y Tríceps",
      "descripcion": "Empuje",
      "grupos_trabajados": "pecho, triceps",
      "ejercicios": [
        {
          "id_ejercicio": "uuid",
          "orden": 1,
          "series": 4,
          "repeticiones": 8,
          "duracion_seg": 0,
          "descanso_seg": 90,
          "notas": ""
        }
      ]
    }
  ]
}`

  console.log('Pidiendo rutina a la IA...')
  const respuesta = await generarConIA(systemPrompt, userPrompt)
  const plan = parsearJSON(respuesta)

  // Si ya existía una rutina esta semana, la borramos para no duplicar
  const { data: existente } = await supabase
    .from('rutina_semana')
    .select('id')
    .eq('usuario_id', perfil.usuario_id)
    .eq('fecha_inicio', fechas.inicio)
    .maybeSingle()

  if (existente) {
    await supabase.from('rutina_semana').delete().eq('id', existente.id)
  }

  const { data: rutinaSemana, error: errorRS } = await supabase
    .from('rutina_semana')
    .insert({
      usuario_id: perfil.usuario_id,
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      descripcion: plan.descripcion,
      nivel_actividad: plan.nivel_actividad,
    })
    .select()
    .single()

  if (errorRS) {
    throw new Error(`Error insertando rutina_semana: ${errorRS.message}`)
  }

  // Guardar los días y ejercicios
  for (const dia of plan.dias) {
    const { data: rutinaDia, error: errorRD } = await supabase
      .from('rutina_dia')
      .insert({
        id_rutina_semana: rutinaSemana.id,
        dia_semana: normalizarDiaSemana(dia.dia_semana),
        es_descanso: dia.es_descanso,
        nombre_sesion: dia.nombre_sesion || null,
        descripcion: dia.descripcion || null,
      })
      .select()
      .single()

    if (errorRD) {
      throw new Error(`Error insertando rutina_dia: ${errorRD.message}`)
    }

    if (dia.es_descanso === false && dia.ejercicios?.length > 0) {
      const ejerciciosInsertar = dia.ejercicios.map((e: any) => ({
        id_rutina_dia: rutinaDia.id,
        id_ejercicio: e.id_ejercicio,
        orden: e.orden,
        series: e.series || null,
        repeticiones: e.repeticiones || null,
        duracion_seg: e.duracion_seg || null,
        descanso_seg: e.descanso_seg || null,
        notas: e.notas || null,
      }))

      const { error: errorRE } = await supabase
        .from('rutina_ejercicio')
        .insert(ejerciciosInsertar)

      if (errorRE) {
        throw new Error(`Error insertando rutina_ejercicio: ${errorRE.message}`)
      }
    }
  }

  console.log('Rutina guardada con éxito')
  return rutinaSemana.id
}

// ===== GENERACIÓN DE LA DIETA =====

// Genera el plan de alimentación adaptado al perfil e historial
async function generarDieta(
  supabase: any,
  perfil: Perfil,
  historialDietas: any[],
  recetas: any[],
  fechas: { inicio: string; fin: string },
  feedback?: string,
): Promise<string> {

  const recipesTexto = recetas
    .map(r => `${r.id}|${r.nombre}|${r.kcal}kcal|${r.tipo_comida}|P:${r.proteinas_g}g C:${r.carbos_g}g G:${r.grasas_g}g|alerg:${r.alergenos || 'ninguno'}`)
    .join('\n')

  const historialTexto = historialDietas.length > 0
    ? historialDietas.map(h =>
        `${h.fecha_inicio}: cal=${h.calorias_objetivo} adherencia=${h.adherencia_pct}% val=${h.valoracion} feedback=${h.feedback || 'ninguno'}`
      ).join('\n')
    : 'Primera semana del usuario'

  const systemPrompt = `Eres un generador de planes de nutrición personalizados, intensos y profesionales.
Devuelve ÚNICAMENTE JSON válido sin texto adicional ni markdown.
El campo "dia_semana" DEBE ser obligatoriamente un número entero del 1 al 7 (donde 1 es Lunes, 2 es Martes, ..., 7 es Domingo). NUNCA devuelvas una cadena como "Lunes" o "Martes".
Sé muy conciso en textos de descripción, máximo 6 palabras por campo.`

  const userPrompt = `
PERFIL DEL USUARIO:
- Nombre: ${perfil.nombre}
- Edad: ${perfil.edad} años
- Peso actual: ${perfil.peso_actual} kg
- Objetivo principal: ${perfil.objetivo}

INFORMACIÓN ADICIONAL / PREFERENCIAS / RESTRICCIONES (Alergias, limitaciones, gustos):
${perfil.info_adicional || 'Ninguna especificada'}

${feedback ? `FEEDBACK PERSONALIZADO DEL USUARIO: ${feedback}` : ''}

HISTORIAL DE DIETAS ANTERIORES:
${historialTexto}

INSTRUCCIONES DE NUTRICIÓN Y OBJETIVO:
- El plan debe ser INTENSO y perfectamente adaptado a su objetivo principal ("${perfil.objetivo}").
- Las calorías diarias totales del plan ("calorias_dia") deben ser efectivas y calculadas con precisión:
  - Si el objetivo principal es "ganar masa muscular" (hipertrofia): Genera un superávit calórico controlado (por ejemplo, calcula peso_actual * 35 a 40 kcal). Las comidas deben ser densas en macronutrientes y con alto contenido proteico.
  - Si el objetivo principal es "perder peso", "definicion" o "tonificar": Genera un déficit calórico eficiente e intenso (por ejemplo, calcula peso_actual * 23 a 27 kcal). Prioriza recetas de alto poder saciante, ricas en volumen (verduras/fibra) y proteínas para retener masa muscular.
- Respeta estrictamente cualquier alergia o restricción física o alimentaria descrita en la información adicional.
- Asegura una distribución lógica de macronutrientes (Proteínas, Carbohidratos y Grasas) en cada comida.

RECETAS DISPONIBLES EN CATÁLOGO (Usa SOLO los IDs del listado para "id_receta" en las comidas):
${recipesTexto}

Genera un plan de dieta estructurado para los 7 días. Cada día debe incluir obligatoriamente desayuno, almuerzo, cena y snack.
IMPORTANTE: Cada día debe tener recetas DIFERENTES. No repitas el mismo id_receta en más de 2 días distintos. Varía al máximo las comidas entre días.

JSON exacto:
{
  "descripcion": "texto breve",
  "calorias_dia": 2200,
  "dias": [
    {
      "dia_semana": 1,
      "calorias_dia": 2200,
      "descripcion": "Día normal",
      "comidas": [
        {
          "id_receta": "uuid",
          "tipo_comida": "desayuno",
          "orden": 1,
          "cantidad_g": 300,
          "notas": ""
        }
      ]
    }
  ]
}`

  console.log('Pidiendo dieta a la IA...')
  const respuesta = await generarConIA(systemPrompt, userPrompt)
  const plan = parsearJSON(respuesta)

  // Si ya existía una dieta esta semana, la borramos para no duplicar
  const { data: existente } = await supabase
    .from('dieta_semana')
    .select('id')
    .eq('usuario_id', perfil.usuario_id)
    .eq('fecha_inicio', fechas.inicio)
    .maybeSingle()

  if (existente) {
    await supabase.from('dieta_semana').delete().eq('id', existente.id)
  }

  const { data: dietaSemana, error: errorDS } = await supabase
    .from('dieta_semana')
    .insert({
      usuario_id: perfil.usuario_id,
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      calorias_dia: plan.calorias_dia,
      descripcion: plan.descripcion,
    })
    .select()
    .single()

  if (errorDS) {
    throw new Error(`Error insertando dieta_semana: ${errorDS.message}`)
  }

  // Guardar los días y comidas
  for (const dia of plan.dias) {
    const { data: dietaDia, error: errorDD } = await supabase
      .from('dieta_dia')
      .insert({
        id_dieta_semana: dietaSemana.id,
        dia_semana: normalizarDiaSemana(dia.dia_semana),
        calorias_dia: dia.calorias_dia,
        descripcion: dia.descripcion || null,
      })
      .select()
      .single()

    if (errorDD) {
      throw new Error(`Error insertando dieta_dia: ${errorDD.message}`)
    }

    if (dia.comidas?.length > 0) {
      const comidasInsertar = dia.comidas.map((c: any) => ({
        id_dieta_dia: dietaDia.id,
        id_receta: c.id_receta,
        tipo_comida: c.tipo_comida,
        orden: c.orden,
        cantidad_g: c.cantidad_g || null,
        notas: c.notas || null,
      }))

      const { error: errorDC } = await supabase
        .from('dieta_comida')
        .insert(comidasInsertar)

      if (errorDC) {
        throw new Error(`Error insertando dieta_comida: ${errorDC.message}`)
      }
    }
  }

  console.log('Dieta guardada con éxito')
  return dietaSemana.id
}

// ===== ORQUESTACIÓN COMPLETA Y ROLLBACK =====

// Si falla la generación de la dieta después de la rutina, deshace los cambios (Rollback)
async function generarPlanParaUsuario(supabase: any, usuarioId: string, feedback?: string): Promise<void> {
  console.log(`Generando plan completo para el usuario: ${usuarioId}`)

  // Obtener los datos del perfil
  const { data: perfil, error: errorPerfil } = await supabase
    .from('perfil')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (errorPerfil || !perfil) {
    throw new Error(`Perfil no encontrado para el usuario ${usuarioId}`)
  }

  // Obtener historiales anteriores
  const { data: historialRutinas } = await supabase
    .from('historial_rutina')
    .select('fecha_inicio, grupos_trabajados, completada, adherencia_pct, valoracion, feedback')
    .eq('usuario_id', usuarioId)
    .order('fecha_inicio', { ascending: false })
    .limit(4)

  const { data: historialDietas } = await supabase
    .from('historial_dieta')
    .select('fecha_inicio, calorias_objetivo, completada, adherencia_pct, valoracion, feedback')
    .eq('usuario_id', usuarioId)
    .order('fecha_inicio', { ascending: false })
    .limit(4)

  // Obtener catálogo aleatorio de la base de datos
  const { data: ejercicios, error: errorEj } = await supabase
    .rpc('get_ejercicios_aleatorios', { limite: 30 })

  if (errorEj || !ejercicios?.length) {
    throw new Error('No hay ejercicios en el catálogo')
  }

  const { data: recetas, error: errorRec } = await supabase
    .rpc('get_recetas_aleatorias', { limite: 20 })

  if (errorRec || !recetas?.length) {
    throw new Error('No hay recetas en el catálogo')
  }

  // Archivar la semana anterior si correspondiera
  await archivarSemanaAnterior(supabase, usuarioId)

  const fechas = getFechasSemana()

  let rutinaSemanaId: string | null = null
  let dietaSemanaId: string | null = null

  try {
    // 1. Generar e Insertar Rutina
    rutinaSemanaId = await generarRutina(
      supabase, perfil, historialRutinas ?? [], ejercicios, fechas, feedback
    )

    // 2. Generar e Insertar Dieta
    dietaSemanaId = await generarDieta(
      supabase, perfil, historialDietas ?? [], recetas, fechas, feedback
    )

    console.log(`Plan semanal completo generado con éxito para ${usuarioId}`)

  } catch (error: any) {
    console.error('Fallo en la generación. Ejecutando Rollback...', error.message)

    // Si guardamos la rutina pero falló la dieta, borramos la rutina parcial
    if (rutinaSemanaId !== null) {
      await supabase.from('rutina_semana').delete().eq('id', rutinaSemanaId)
      console.log('Rutina parcial eliminada con éxito')
    }

    if (dietaSemanaId !== null) {
      await supabase.from('dieta_semana').delete().eq('id', dietaSemanaId)
      console.log('Dieta parcial eliminada con éxito')
    }

    throw error
  }
}

// ===== HANDLER PRINCIPAL (SERVIDOR DENO) =====

Deno.serve(async (req: Request) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json().catch(() => ({}))
    const { usuario_id, feedback } = body

    // Si recibimos un usuario_id, generamos solo para él
    if (usuario_id) {
      await generarPlanParaUsuario(supabaseAdmin, usuario_id, feedback)
      return new Response(
        JSON.stringify({ ok: true, usuario_id }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    } else {
      // Si no recibimos id, generamos de forma masiva para todos los perfiles activos
      const { data: perfiles, error } = await supabaseAdmin
        .from('perfil')
        .select('usuario_id')
        .not('objetivo', 'is', null)
        .not('peso_actual', 'is', null)

      if (error) {
        throw error
      }

      const resultados = []
      for (const p of perfiles ?? []) {
        try {
          await generarPlanParaUsuario(supabaseAdmin, p.usuario_id)
          resultados.push({ usuario_id: p.usuario_id, ok: true })
        } catch (e: any) {
          resultados.push({ usuario_id: p.usuario_id, ok: false, error: e.message })
          console.error(`Error en usuario ${p.usuario_id}:`, e)
        }
      }

      return new Response(
        JSON.stringify({ ok: true, resultados }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (e: any) {
    console.error('Error crítico en Edge Function:', e)
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
