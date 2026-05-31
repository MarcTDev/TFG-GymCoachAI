import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

type PerfilInput = {
  nombre?: string;
  apellidos?: string;
  nombre_usuario?: string;
  edad?: string;
  peso?: string;
  altura?: string;
  objetivo?: string;
  actividad?: string;
  info_adicional?: string;
};

const buildPerfil = (userId: string, p: PerfilInput) => {
  let edadNum = null;
  if (p.edad) {
    edadNum = parseInt(p.edad, 10);
  }

  let pesoNum = null;
  if (p.peso) {
    pesoNum = parseFloat(p.peso);
  }

  let alturaNum = null;
  if (p.altura) {
    alturaNum = parseFloat(p.altura);
  }

  let obj = null;
  if (p.objetivo) {
    let str = p.objetivo;
    let newStr = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "_") {
        newStr += " ";
      } else {
        newStr += str[i];
      }
    }
    obj = newStr;
  }

  return {
    usuario_id: userId,
    nombre: p.nombre || null,
    apellidos: p.apellidos || null,
    nombre_usuario: p.nombre_usuario || null,
    edad: edadNum,
    peso_actual: pesoNum,
    altura: alturaNum,
    objetivo: obj,
    nivel_actividad: p.actividad || null,
    info_adicional: p.info_adicional || null,
  };
};

const lanzarAiAssign = (userId: string) => {
  supabase.functions.invoke('ai-assign', { body: { usuario_id: userId } }).catch((err: any) => { });
};

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function registrarUsuario(email: string, password: string, perfil: PerfilInput) {
  const resAuth = await supabase.auth.signUp({ email, password });
  if (resAuth.error || !resAuth.data.user) {
    let msg = "No se pudo crear la cuenta.";
    if (resAuth.error) msg = resAuth.error.message;
    throw new Error(msg);
  }

  const pFinal = buildPerfil(resAuth.data.user.id, perfil);
  const resPerfil = await supabase.from('perfil').insert(pFinal);

  if (resPerfil.error) {
    throw new Error('No se pudo guardar el perfil: ' + resPerfil.error.message);
  }

  lanzarAiAssign(resAuth.data.user.id);
  return { userId: resAuth.data.user.id };
}

export async function registrarPerfil(userId: string, perfil: PerfilInput) {
  const pFinal = buildPerfil(userId, perfil);
  const { error } = await supabase.from('perfil').insert(pFinal);
  if (error) {
    throw new Error('No se pudo guardar el perfil: ' + error.message);
  }
  lanzarAiAssign(userId);
}

export async function loginConGoogle() {
  if (Platform.OS === 'web') {
    const redirectUrl = window.location.origin + '/auth/callback';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: false },
    });
    return { error, user: null };
  }

  const redirectUrl = Linking.createURL('/auth/callback');
  const resUrl = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });

  if (resUrl.error || !resUrl.data.url) {
    let err = new Error('Sin URL');
    if (resUrl.error) err = resUrl.error;
    return { error: err };
  }

  const result = await WebBrowser.openAuthSessionAsync(resUrl.data.url, redirectUrl);
  if (result.type !== 'success') {
    return { error: new Error('Cancelado') };
  }

  let code = '';
  if (result.url) {
    const codeParam = result.url.match(/code=([^&#]+)/);
    if (codeParam) {
      code = codeParam[1];
    }
  }

  const resSession = await supabase.auth.exchangeCodeForSession(code || result.url);

  let usr = null;
  if (resSession.data && resSession.data.user) {
    usr = resSession.data.user;
  }

  return { error: resSession.error, user: usr };
}