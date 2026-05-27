// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    // 1. Conexión a la base de datos (con permisos de administrador)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Leemos qué usuario nos ha llamado
    const { usuario_id } = await req.json();

    if (!usuario_id) {
      throw new Error("No se ha enviado el usuario_id");
    }

    console.log("Iniciando generación de plan para el usuario:", usuario_id);

    // 3. Sacamos los datos del usuario para pasárselos a la IA
    const { data: perfil } = await supabase.from('perfil').select('*').eq('usuario_id', usuario_id).single();
    if (!perfil) {
      throw new Error("No se encontró el perfil del usuario");
    }

    // 4. Sacamos unos cuantos ejercicios y recetas aleatorias del catálogo para que la IA elija
    const { data: ejercicios } = await supabase.rpc('get_ejercicios_aleatorios', { limite: 30 });
    const { data: recetas } = await supabase.rpc('get_recetas_aleatorias', { limite: 20 });

    const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';

    // ==========================================
    // PARTE 1: GENERAR RUTINA DE ENTRENAMIENTO
    // ==========================================
    
    // Le explicamos a la IA cómo queremos el JSON
    const promptRutina = `
      Perfil del usuario: ${perfil.nombre}, Objetivo: ${perfil.objetivo}. 
      Crea 7 días de rutina. Incluye al menos 2 días de descanso.
      Usa SOLO estos IDs de ejercicios que te paso: ${JSON.stringify(ejercicios.map(e => e.id))}. 
      Devuelve SOLO un JSON con este formato exacto: 
      {"descripcion":"...","nivel_actividad":"...","dias":[{"dia_semana":1,"es_descanso":false,"nombre_sesion":"...","descripcion":"...","ejercicios":[{"id_ejercicio":"...","orden":1,"series":3,"repeticiones":10,"descanso_seg":60}]}]}
    `;
    
    console.log("Pidiendo rutina a Groq...");
    const resRutina = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${groqApiKey}` 
      },
      body: JSON.stringify({ 
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: 'user', content: promptRutina }] 
      })
    });
    
    const dataRutina = await resRutina.json();
    
    // Limpiamos el texto por si la IA le pone comillas de código (```json)
    let txtRutina = dataRutina.choices[0].message.content;
    txtRutina = txtRutina.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const planRutina = JSON.parse(txtRutina);

    // Calculamos la fecha de hoy para empezar el plan
    const fechaInicio = new Date().toISOString().split('T')[0];
    
    // Guardamos la rutina semanal
    const { data: rutSemana } = await supabase.from('rutina_semana').insert({ 
      usuario_id: usuario_id, 
      fecha_inicio: fechaInicio, 
      fecha_fin: fechaInicio, 
      descripcion: planRutina.descripcion, 
      nivel_actividad: planRutina.nivel_actividad 
    }).select().single();

    // Guardamos los días y los ejercicios uno por uno
    for (let i = 0; i < planRutina.dias.length; i++) {
      const dia = planRutina.dias[i];
      const { data: rutDia } = await supabase.from('rutina_dia').insert({ 
        id_rutina_semana: rutSemana.id, 
        dia_semana: dia.dia_semana, 
        es_descanso: dia.es_descanso, 
        nombre_sesion: dia.nombre_sesion 
      }).select().single();
      
      if (!dia.es_descanso && dia.ejercicios) {
        for (let j = 0; j < dia.ejercicios.length; j++) {
          const ej = dia.ejercicios[j];
          await supabase.from('rutina_ejercicio').insert({ 
            id_rutina_dia: rutDia.id, 
            id_ejercicio: ej.id_ejercicio, 
            orden: ej.orden, 
            series: ej.series, 
            repeticiones: ej.repeticiones, 
            descanso_seg: ej.descanso_seg 
          });
        }
      }
    }


    // ==========================================
    // PARTE 2: GENERAR DIETA
    // ==========================================
    
    const promptDieta = `
      Perfil del usuario: ${perfil.nombre}, Objetivo: ${perfil.objetivo}. 
      Crea 7 días de dieta.
      Usa SOLO estos IDs de recetas: ${JSON.stringify(recetas.map(r => r.id))}. 
      Devuelve SOLO un JSON con este formato exacto: 
      {"descripcion":"...","calorias_dia":2000,"dias":[{"dia_semana":1,"calorias_dia":2000,"descripcion":"...","comidas":[{"id_receta":"...","tipo_comida":"desayuno","orden":1}]}]}
    `;
    
    console.log("Pidiendo dieta a Groq...");
    const resDieta = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${groqApiKey}` 
      },
      body: JSON.stringify({ 
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: 'user', content: promptDieta }] 
      })
    });

    const dataDieta = await resDieta.json();
    let txtDieta = dataDieta.choices[0].message.content;
    txtDieta = txtDieta.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const planDieta = JSON.parse(txtDieta);

    // Guardamos la dieta semanal
    const { data: dietSemana } = await supabase.from('dieta_semana').insert({ 
      usuario_id: usuario_id, 
      fecha_inicio: fechaInicio, 
      fecha_fin: fechaInicio, 
      calorias_dia: planDieta.calorias_dia, 
      descripcion: planDieta.descripcion 
    }).select().single();

    // Guardamos los días y las comidas
    for (let i = 0; i < planDieta.dias.length; i++) {
      const dia = planDieta.dias[i];
      const { data: dietDia } = await supabase.from('dieta_dia').insert({ 
        id_dieta_semana: dietSemana.id, 
        dia_semana: dia.dia_semana, 
        calorias_dia: dia.calorias_dia 
      }).select().single();
      
      if (dia.comidas) {
        for (let j = 0; j < dia.comidas.length; j++) {
          const com = dia.comidas[j];
          await supabase.from('dieta_comida').insert({ 
            id_dieta_dia: dietDia.id, 
            id_receta: com.id_receta, 
            tipo_comida: com.tipo_comida, 
            orden: com.orden 
          });
        }
      }
    }

    console.log("¡Plan generado y guardado con éxito!");

    // Devolvemos respuesta afirmativa
    return new Response(JSON.stringify({ ok: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("Error al generar el plan:", error.message);
    
    // Devolvemos el error
    return new Response(JSON.stringify({ ok: false, error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});