import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isRegistering: boolean;
  setIsRegistering: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, 
  user: null, 
  loading: true,
  isRegistering: false, 
  setIsRegistering: () => {}, 
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegisteringState] = useState(false);

  const isRegisteringRef = useRef(false);

  const setIsRegistering = (v: boolean) => {
    isRegisteringRef.current = v;
    setIsRegisteringState(v);
    if (v === false) {
      supabase.auth.getSession().then(({ data }) => {
        if (isRegisteringRef.current === false) {
          setSession(data.session);
        }
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session === null) {
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      
      if (isRegisteringRef.current === false) {
        setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  let user = null;
  if (session && session.user) {
    user = session.user;
  }

  const signOut = async () => { 
    await supabase.auth.signOut(); 
  };

  return (
    <AuthContext.Provider value={{
      session: session, 
      user: user, 
      loading: loading,
      isRegistering: isRegistering, 
      setIsRegistering: setIsRegistering,
      signOut: signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);