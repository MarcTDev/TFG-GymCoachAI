import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

export function useFocusLoader(loader: () => Promise<void>, deps: any[]) {
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    try { 
      await loader(); 
    } finally { 
      setCargando(false); 
    }
  }, deps);

  useFocusEffect(
    useCallback(() => { 
      recargar(); 
    }, [recargar])
  );

  return { cargando, recargar, setCargando };
}