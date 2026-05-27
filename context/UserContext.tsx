import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Perfil {
  id_perfil: string;
  usuario_id: string;
  nombre: string | null;
  apellidos: string | null;
  nombre_usuario: string | null;
  edad: number | null;
  peso_actual: number | null;
  altura: number | null;
  objetivo: string | null;
  nivel_actividad: string | null;
  info_adicional: string | null;
}

interface UserContextType {
  perfil: Perfil | null;
  updatePerfil: (data: Partial<Perfil>) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  perfil: null,
  updatePerfil: async () => ({ error: null }),
  refetch: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const loadPerfil = async (userId: string) => {
    const { data } = await supabase.from('perfil').select('*').eq('usuario_id', userId).single();
    if (data) {
      setPerfil(data);
    }
  };

  useEffect(() => {
    if (user) {
      loadPerfil(user.id);
    } else {
      setPerfil(null);
    }
  }, [user]);

  const updatePerfil = async (data: Partial<Perfil>) => {
    if (!user) {
      return { error: 'No hay sesión activa' };
    }
    const { error } = await supabase.from('perfil').update(data).eq('usuario_id', user.id);
    
    if (!error) {
      setPerfil((prev) => {
        if (prev) {
          return { ...prev, ...data };
        }
        return null;
      });
    }
    
    let msg = null;
    if (error) {
      msg = error.message;
    }
    return { error: msg };
  };

  const refetch = async () => {
    if (user) {
      await loadPerfil(user.id);
    }
  };

  return (
    <UserContext.Provider value={{ perfil, updatePerfil, refetch }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);